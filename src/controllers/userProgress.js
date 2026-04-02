const {
  UserProgress,
  Learning,
  Level,
  Lesson,
  Section,
  Quiz,
  QuizAttempt,
} = require("../models");
const AppError = require("../utils/AppError");
const sendSuccess = require("../utils/sendSuccess");

const initLevelsProgressForTrack = async (progress) => {
  // Idempotent initializer for older progress docs.
  if (!progress.activePhase) progress.activePhase = "lessons";
  if (progress.levelsProgress && progress.levelsProgress.length > 0)
    return progress;

  const levels = await Level.find({ learning: progress.learning })
    .sort({ levelNumber: 1 })
    .lean();
  const overall = progress.overallLevel || 1;

  const lastLevelNumber = levels.length
    ? Math.max(...levels.map((l) => l.levelNumber))
    : 0;
  const isTrackFinished = overall > lastLevelNumber && lastLevelNumber > 0;

  progress.levelsProgress = levels.map((lvl) => {
    let status = "locked";
    if (isTrackFinished || lvl.levelNumber < overall) status = "review";
    else if (lvl.levelNumber === overall) status = "active";

    return {
      levelId: lvl._id,
      status,
      minScore: lvl.unlockCondition?.minScore ?? 70,
      lessonProgress: [],
    };
  });

  return progress;
};

const getTotalLessonsForLevel = async (levelId) => {
  const levelDoc = await Level.findById(levelId).select("lessons").lean();
  
  // Only count lessons that are actually active and visible to the user
  const activeLessonsCount = await Lesson.countDocuments({ level: levelId, isActive: true });
  
  return { count: activeLessonsCount, levelDoc };
};

// Fetch user's progress for a learning track
const getUserProgress = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { learningId } = req.query;

    const query = { user: userId };
    if (learningId) query.learning = learningId;

    const progress = await UserProgress.find(query)
      .populate("currentLevel")
      .populate("currentLesson")
      .populate("completedLessons.lesson")
      .populate("completedSections")
      .populate({
        path: "learning",
        populate: [
          { path: "sourceLanguage" },
          { path: "targetLanguage" },
          {
            path: "levels.lessons", // for total progress calculation
          },
        ],
      });

    if (!progress || progress.length === 0)
      throw new AppError("Progress not found", 404);

    // Backward compatibility: older UserProgress docs might not have `levelsProgress`.
    // We initialize it lazily on read to avoid breaking dashboards/level navigation.
    for (const p of progress) {
      if (!p.levelsProgress || p.levelsProgress.length === 0) {
        await initLevelsProgressForTrack(p);
        await p.save();
      }
    }

    sendSuccess(res, 200, "User progress fetched", { progress });
  } catch (error) {
    next(error);
  }
};

// Start a new learning track
// controllers/progress.js
const startLearningTrack = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { learning } = req.body;

    const exists = await UserProgress.findOne({ user: userId, learning });
    if (exists)
      return sendSuccess(res, 200, "Already enrolled", { progress: exists });

    // 1. Get the learning track to verify it exists
    const track = await Learning.findById(learning);
    if (!track) throw new AppError("Learning track not found", 404);

    // 2. Find the first standalone Level document
    const firstLevel = await Level.findOne({ learning }).sort({ levelNumber: 1 }).populate("lessons");

    // Sort the lessons within that level
    const sortedLessons =
      firstLevel?.lessons?.sort((a, b) => a.order - b.order) || [];
    const firstLesson = sortedLessons[0] || null;

    // 3. Create the progress
    try {
      const newProgress = await UserProgress.create({
        user: userId,
        learning,
        overallLevel: 1,
        currentLevel: firstLevel?._id,
        currentLesson: firstLesson?._id,
        activePhase: "lessons",
        xp: 0,
        streak: 0,
        lastActivityDate: new Date(),
      });
      await initLevelsProgressForTrack(newProgress);
      await newProgress.save();
      sendSuccess(res, 201, "Learning track started", {
        progress: newProgress,
      });
    } catch (err) {
      if (err.code === 11000) {
        const redo = await UserProgress.findOne({ user: userId, learning });
        return sendSuccess(res, 200, "Already enrolled", { progress: redo });
      }
      throw err;
    }
  } catch (error) {
    next(error);
  }
};

// Mark lesson done or skipped (phase-aware). This does not complete the level quiz.
const markLessonCompleted = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { learningId, levelId, lessonId, status } = req.body;

    const progress = await UserProgress.findOne({
      user: userId,
      learning: learningId,
    });
    if (!progress)
      throw new AppError("Progress not found for this learning track", 404);

    await initLevelsProgressForTrack(progress);

    const levelEntry = progress.levelsProgress.find(
      (lp) => lp.levelId.toString() === levelId.toString(),
    );
    if (!levelEntry) throw new AppError("Level progress not found", 400);

    if (levelEntry.status === "locked") {
      // Locked levels cannot advance lesson completion in this track.
      throw new AppError("This level is locked", 403);
    }

    // Update (or insert) per-lesson completion status inside levelsProgress
    const existingLesson = levelEntry.lessonProgress.find(
      (lp) => lp.lessonId.toString() === lessonId.toString(),
    );

    const now = new Date();
    if (existingLesson) {
      existingLesson.status = status;
      if (status === "done") {
        existingLesson.doneAt = now;
        existingLesson.skippedAt = undefined;
      } else {
        existingLesson.skippedAt = now;
        existingLesson.doneAt = undefined;
      }
    } else {
      levelEntry.lessonProgress.push({
        lessonId,
        status,
        doneAt: status === "done" ? now : undefined,
        skippedAt: status === "skipped" ? now : undefined,
      });
    }

    // If all lessons are done/skipped, move active phase to "quiz" for this level.
    const { count: totalLessonsCount, levelDoc } =
      await getTotalLessonsForLevel(levelId);
    const finishedLessonsSet = new Set(
      levelEntry.lessonProgress
        .filter((lp) => lp.status === "done" || lp.status === "skipped")
        .map((lp) => lp.lessonId.toString()),
    );

    if (totalLessonsCount === 0 || finishedLessonsSet.size >= totalLessonsCount) {
      progress.activePhase = "quiz";
      // Keep currentLevel aligned for quiz start
      progress.currentLevel = levelDoc._id;
      progress.currentLesson = null;
      if (levelEntry.status !== "review" && levelEntry.status !== "passed") {
        // active or failed states
        levelEntry.status =
          levelEntry.status === "failed" ? "failed" : "active";
      }
    } else {
      progress.activePhase = "lessons";
      if (levelEntry.status === "review") {
        // review state doesn't need to flip back
      } else if (levelEntry.status !== "failed") {
        levelEntry.status = "active";
      }
    }

    progress.lastActivityDate = now;
    await progress.save();

    sendSuccess(res, 200, "Lesson completion saved", { progress });
  } catch (error) {
    next(error);
  }
};

// Start a quiz attempt for the current level (server authoritative)
const quizStartAttempt = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { learningId, levelId, questionCount } = req.body;

    const progress = await UserProgress.findOne({
      user: userId,
      learning: learningId,
    });
    if (!progress)
      throw new AppError("Progress not found for this learning track", 404);

    await initLevelsProgressForTrack(progress);

    const levelEntry = progress.levelsProgress.find(
      (lp) => lp.levelId.toString() === levelId.toString(),
    );
    if (!levelEntry) throw new AppError("Level progress not found", 404);
    console.log(levelEntry);
    // Allow quiz start based on lesson completion for this specific level.
    // This avoids false negatives when `activePhase/currentLevel` are stale.
    const { count: totalLessonsCount } = await getTotalLessonsForLevel(levelId);
    const finishedLessonsSet = new Set(
      (levelEntry.lessonProgress || [])
        .filter((lp) => lp.status === "done" || lp.status === "skipped")
        .map((lp) => lp.lessonId.toString()),
    );
    const allLessonsFinished =
      totalLessonsCount === 0 || finishedLessonsSet.size >= totalLessonsCount;
    if (!allLessonsFinished)
      throw new AppError("Quiz is not unlocked yet for this level", 403);

    // If level already passed/reviewed, block quiz retake.
    if (levelEntry.status === "passed" || levelEntry.status === "review") {
      return sendSuccess(res, 200, "Quiz already passed; review mode", {
        mode: "review",
        levelId,
      });
    }

    // Enforce attempt rules: allow new attempt only after failure.
    // - "active": user never passed; allow attempt
    // - "failed": allow retake
    // - other locked statuses are blocked
    if (levelEntry.status === "locked") {
      throw new AppError("This level is locked", 403);
    }

    const quiz = await Quiz.findOne({ level: levelId });
    if (
      !quiz ||
      !Array.isArray(quiz.questionPool) ||
      quiz.questionPool.length === 0
    ) {
      throw new AppError("No quiz pool found for this level", 404);
    }

    const minScore =
      levelEntry.minScore ??
      (await Level.findById(levelId)).unlockCondition?.minScore ??
      70;

    const previousAttemptsCount = await QuizAttempt.countDocuments({
      user: userId,
      learning: learningId,
      levelId,
    });

    const attemptNumber = previousAttemptsCount + 1;
    const questionDocs = quiz.getRandomQuestions(Number(questionCount || 10));
    const questionIds = questionDocs.map((q) => q._id).filter(Boolean);

    // Do not send correct answers to the client.
    const questions = questionDocs.map((q) => ({
      _id: q._id,
      section: q.section,
      lesson: q.lesson,
      questionText: q.questionText,
      questionType: q.questionType,
      options: q.options,
      explanation: q.explanation,
      difficulty: q.difficulty,
      skills: q.skills,
      isAiGenerated: q.isAiGenerated,
    }));

    const attempt = await QuizAttempt.create({
      user: userId,
      learning: learningId,
      levelId,
      attemptNumber,
      status: "in_progress",
      score: undefined,
      quizPassingScore: minScore,
      questionSnapshot: {
        quizId: quiz._id,
        questionIds,
        createdFromPoolAt: new Date(),
      },
      submittedAt: undefined,
      reviewLocked: false,
    });

    // Remember that the learner is now in quiz phase for this level
    levelEntry.lastQuizAttemptId = attempt._id;
    levelEntry.lastQuizScore = undefined;
    if (levelEntry.status !== "failed") levelEntry.status = "active";
    progress.activePhase = "quiz";
    progress.currentLevel = levelId;
    progress.currentLesson = null;
    progress.lastActivityDate = new Date();

    await progress.save();

    sendSuccess(res, 200, "Quiz attempt started", {
      mode: "quiz",
      attemptId: attempt._id,
      levelId,
      quiz: {
        title: quiz.title || "Level Quiz",
        passingScore: minScore,
        questionCount: questionIds.length,
      },
      questions,
    });
  } catch (error) {
    next(error);
  }
};

// Submit a quiz attempt (server computes score + unlocks/retains progress)
const quizSubmitAttempt = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { learningId, levelId, attemptId, answers, durationMs } = req.body;

    const progress = await UserProgress.findOne({
      user: userId,
      learning: learningId,
    });
    if (!progress)
      throw new AppError("Progress not found for this learning track", 404);

    await initLevelsProgressForTrack(progress);

    const attempt = await QuizAttempt.findOne({
      _id: attemptId,
      user: userId,
      learning: learningId,
      levelId,
    });
    if (!attempt) throw new AppError("Quiz attempt not found", 404);

    // If already submitted, return last result (idempotent)
    if (attempt.status === "passed" || attempt.status === "failed") {
      return sendSuccess(res, 200, "Quiz attempt already submitted", {
        attemptId: attempt._id,
        status: attempt.status,
        score: attempt.score ?? null,
      });
    }

    if (
      progress.levelsProgress.find(
        (lp) => lp.levelId.toString() === levelId.toString(),
      )?.status === "review"
    ) {
      throw new AppError(
        "This level is already passed; retakes are blocked",
        403,
      );
    }

    const quiz = await Quiz.findById(attempt.questionSnapshot.quizId);
    if (!quiz) throw new AppError("Quiz not found for attempt", 404);

    const questionIds = attempt.questionSnapshot.questionIds || [];
    const questionMap = new Map();
    quiz.questionPool.forEach((q) => {
      if (!q._id) return;
      questionMap.set(q._id.toString(), q);
    });

    const answersByQuestionId = new Map(
      (answers || []).map((a) => [String(a.questionId), a.answer]),
    );

    let correct = 0;
    const total = questionIds.length || 0;

    questionIds.forEach((qid) => {
      const q = questionMap.get(String(qid));
      if (!q) return;

      const selected = answersByQuestionId.get(String(qid));
      const correctAnswer = q.correctAnswer;
      if (!selected || !correctAnswer) return;

      if (
        String(selected).trim().toLowerCase() ===
        String(correctAnswer).trim().toLowerCase()
      ) {
        correct += 1;
      }
    });

    const score = total > 0 ? Math.round((correct / total) * 100) : 0;
    const levelEntry = progress.levelsProgress.find(
      (lp) => lp.levelId.toString() === levelId.toString(),
    );
    if (!levelEntry) throw new AppError("Level progress not found", 404);

    const passingScore = levelEntry.minScore ?? attempt.quizPassingScore ?? 70;

    const passed = score >= passingScore;

    const results = questionIds.map((qid) => {
      const q = questionMap.get(String(qid));
      if (!q) return null;
      const selected = answersByQuestionId.get(String(qid)) || "";
      const isCorrect =
        selected.trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase();
      return {
        questionId: q._id,
        questionText: q.questionText,
        selectedAnswer: selected,
        correctAnswer: q.correctAnswer,
        isCorrect,
      };
    }).filter(Boolean);

    attempt.score = score;
    attempt.submittedAt = new Date();
    attempt.status = passed ? "passed" : "failed";
    attempt.reviewLocked = passed;
    attempt.durationMs = durationMs;
    await attempt.save();

    // Update per-level progress
    levelEntry.lastQuizAttemptId = attempt._id;
    levelEntry.lastQuizScore = score;
    levelEntry.bestQuizScore = Math.max(levelEntry.bestQuizScore ?? 0, score);
    levelEntry.passedAt = passed ? new Date() : undefined;
    levelEntry.status = passed ? "review" : "failed";

    // Update track-level progress
    let nextLevelDoc = null;
    if (passed) {
      progress.xp += Math.round(score / 2);

      const today = new Date();
      const lastDate = progress.lastActivityDate || today;
      const diff = today - lastDate;
      if (diff < 1000 * 60 * 60 * 24 * 2) progress.streak += 1;
      else progress.streak = 1;

      const currentLevelDoc = await Level.findById(levelId).lean();
      nextLevelDoc = await Level.findOne({
        learning: learningId,
        levelNumber: currentLevelDoc.levelNumber + 1,
      }).sort({ order: 1 });

      if (nextLevelDoc) {
        progress.currentLevel = nextLevelDoc._id;
        progress.currentLesson = nextLevelDoc.lessons?.[0] || null;
        progress.overallLevel = nextLevelDoc.levelNumber;
        progress.activePhase = "lessons";
      } else {
        // Track finished (keep overallLevel bounded to 5 for schema)
        progress.overallLevel = Math.max(
          progress.overallLevel || 1,
          currentLevelDoc.levelNumber,
        );
        progress.activePhase = "review";
      }
    } else {
      // Failed: stay on quiz phase so user can retake.
      progress.activePhase = "quiz";
    }

    // Keep embedded per-level statuses in sync with the track state.
    // This is important because `levelsProgress` is initialized from legacy fields
    // and must be updated when `overallLevel` changes.
    const trackLevels = await Level.find({ learning: learningId })
      .select("_id levelNumber unlockCondition.minScore")
      .lean();

    const levelNumberById = new Map(
      trackLevels.map((l) => [l._id.toString(), l.levelNumber]),
    );

    const isFinishedTrack =
      !nextLevelDoc && passed && progress.activePhase === "review";

    progress.levelsProgress.forEach((lp) => {
      const lvlNum = levelNumberById.get(lp.levelId.toString());
      if (!lvlNum) return;

      if (isFinishedTrack) {
        // Everything becomes review at end of track.
        lp.status = "review";
        lp.minScore = lp.minScore ?? 70;
        return;
      }

      if (lvlNum < progress.overallLevel) lp.status = "review";
      else if (lvlNum === progress.overallLevel)
        lp.status = passed ? "active" : "failed";
      else lp.status = "locked";
    });

    progress.lastActivityDate = new Date();
    await progress.save();

    sendSuccess(res, 200, "Quiz submitted", {
      attemptId: attempt._id,
      passed,
      score,
      passingScore,
      mode: passed ? "passed" : "failed",
      results,
    });
  } catch (error) {
    next(error);
  }
};

// 🔹 Mark Level Completed (after passing level quiz)
const completeLevel = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { levelId, quizScore, xpEarned, lessonIds = [] } = req.body;

    // 1. Get the current level doc to know its context (learning pathway and number)
    const currentLevelDoc = await Level.findById(levelId);
    if (!currentLevelDoc) throw new AppError("Level not found", 404);

    const learningId = currentLevelDoc.learning;

    // 2. Find the correct progress for THIS specific learning track
    const progress = await UserProgress.findOne({
      user: userId,
      learning: learningId,
    });

    if (!progress)
      throw new AppError("Progress not found for this learning track", 404);

    // --- Record lessons from the level ---
    lessonIds.forEach((id) => {
      const alreadyCompleted = progress.completedLessons.some(
        (l) => l.lesson.toString() === id.toString(),
      );
      if (!alreadyCompleted) {
        progress.completedLessons.push({
          lesson: id,
          quizScore: Number(quizScore || 0),
          completedAt: new Date(),
        });
      }
    });

    // --- Determine Next Level & Review Mode ---
    const isReview = currentLevelDoc.levelNumber < progress.overallLevel;

    // Search Level collection for the next level in this track
    const nextLevelDoc = await Level.findOne({
      learning: learningId,
      levelNumber: currentLevelDoc.levelNumber + 1,
    }).sort({ order: 1 });

    if (!isReview) {
      // First time completing this level!

      // Update XP
      progress.xp += Number(xpEarned || 0);

      if (nextLevelDoc) {
        // Advance to next standalone level doc
        progress.currentLevel = nextLevelDoc._id;
        progress.currentLesson = nextLevelDoc.lessons[0] || null;
        progress.overallLevel = nextLevelDoc.levelNumber;
      } else {
        // Already at the last level/completed everything
        progress.overallLevel = currentLevelDoc.levelNumber + 1; // Mark as finished whole track
      }
    }
    // If it's a review, we do nothing to the core progress stats.
    // We've already handled lessonIds above for safety.

    progress.lastActivityDate = new Date();
    await progress.save();

    sendSuccess(res, 200, "Level completed successfully", { progress });
  } catch (error) {
    next(error);
  }
};

// Increment AI chat usage
const incrementAIChat = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { count = 1 } = req.body;

    const progress = await UserProgress.findOne({ user: userId });
    if (!progress) throw new AppError("Progress not found", 404);

    const now = new Date();
    if (!progress.aiChatResetAt || progress.aiChatResetAt < now) {
      progress.aiChatCount = count;
      progress.aiChatResetAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // reset in 24h
    } else {
      progress.aiChatCount += count;
    }

    await progress.save();
    sendSuccess(res, 200, "AI chat count updated", {
      aiChatCount: progress.aiChatCount,
    });
  } catch (error) {
    next(error);
  }
};

// Delete progress (admin only)
const deleteProgress = async (req, res, next) => {
  try {
    const { learningId } = req.params;
    const userId = req.user._id;

    const deleted = await UserProgress.findOneAndDelete({
      user: userId,
      learning: learningId,
    });
    if (!deleted) throw new AppError("Progress not found", 404);

    sendSuccess(res, 200, "Progress deleted");
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserProgress,
  startLearningTrack,
  markLessonCompleted,
  quizStartAttempt,
  quizSubmitAttempt,
  completeLevel,
  incrementAIChat,
  deleteProgress,
};

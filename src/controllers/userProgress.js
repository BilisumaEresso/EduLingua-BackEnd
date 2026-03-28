const { UserProgress, Learning, Level, Lesson, Section } = require("../models");
const AppError = require("../utils/AppError");
const sendSuccess = require("../utils/sendSuccess");

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
      .populate("learning");

    if (!progress) throw new AppError("Progress not found", 404);

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

    // 1. Simply populate levels and lessons without the nested sort option
    const track = await Learning.findById(learning).populate("levels.lessons");
    if (!track) throw new AppError("Learning track not found", 404);

    // 2. Sort the levels and lessons manually to get the true "first" items
    const sortedLevels = track.levels.sort(
      (a, b) => a.levelNumber - b.levelNumber,
    );
    const firstLevel = sortedLevels[0];

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
        xp: 0,
        streak: 0,
        lastActivityDate: new Date(),
      });
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


// Mark lesson completed with auto next lesson/level logic
const markLessonCompleted = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { lessonId, sectionIds = [], quizScore, xpEarned } = req.body;

    const progress = await UserProgress.findOne({ user: userId }).populate({
      path: "learning",
      populate: {
        path: "levels",
        populate: { path: "lessons" },
      },
    });

    if (!progress) throw new AppError("Progress not found", 404);

    // --- Mark lesson completed ---
    const alreadyCompleted = progress.completedLessons.some(
      (l) => l.lesson.toString() === lessonId,
    );
    if (!alreadyCompleted) {
      progress.completedLessons.push({
        lesson: lessonId,
        quizScore,
        completedAt: new Date(),
      });
    }

    // --- Mark sections completed ---
    sectionIds.forEach((secId) => {
      if (!progress.completedSections.includes(secId)) {
        progress.completedSections.push(secId);
      }
    });

    // --- Update XP and streak ---
    progress.xp += xpEarned;
    const lastDate = progress.lastActivityDate || new Date();
    const today = new Date();
    const diff = today - lastDate;
    if (diff < 1000 * 60 * 60 * 24 * 2)
      progress.streak += 1; // within 2 days
    else progress.streak = 1;
    progress.lastActivityDate = new Date();

    // --- Determine next lesson and level ---
    const levels = progress.learning.levels;
    let currentLevelIndex = levels.findIndex(
      (lvl) => lvl._id.toString() === progress.currentLevel?.toString(),
    );
    let currentLevel = levels[currentLevelIndex];
    let currentLessonIndex = currentLevel.lessons.findIndex(
      (l) => l._id.toString() === lessonId,
    );

    let nextLesson = null;
    let nextLevel = currentLevel;

    // Move to next lesson in current level if exists
    if (currentLessonIndex + 1 < currentLevel.lessons.length) {
      nextLesson = currentLevel.lessons[currentLessonIndex + 1]._id;
    } else if (currentLevelIndex + 1 < levels.length) {
      // move to first lesson of next level
      nextLevel = levels[currentLevelIndex + 1];
      nextLesson = nextLevel.lessons[0]?._id || null;
      progress.overallLevel += 1; // increment overallLevel
    }

    progress.currentLevel = nextLevel._id;
    progress.currentLesson = nextLesson;

    await progress.save();
    sendSuccess(res, 200, "Lesson marked completed", { progress });
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
  incrementAIChat,
  deleteProgress,
};

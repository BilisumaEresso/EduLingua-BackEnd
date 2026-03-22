// services/aiService.js
const ModelClient = require("@azure-rest/ai-inference").default;
const { isUnexpected } = require("@azure-rest/ai-inference");
const { AzureKeyCredential } = require("@azure/core-auth");

const token = process.env.GPT_TOKEN;
const endpoint = "https://models.github.ai/inference";
const model = "openai/gpt-4.1";

if (!token) {
  throw new Error("Missing GPT_TOKEN in environment variables");
}

const client = ModelClient(endpoint, new AzureKeyCredential(token));

/* -------------------- UTILITIES -------------------- */

const normalizeLanguage = (name) => {
  return (name || "English").toLowerCase();
};

const extractJSON = (text) => {
  try {
    // Try direct parse first
    return JSON.parse(text);
  } catch (e) {
    // fallback extraction
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("No JSON object found");
    return JSON.parse(match[0]);
  }
};

/* -------------------- CORE AI CALL -------------------- */

const callAI = async (messages, temperature = 0.3, maxTokens = 2000) => {
  try {
    const response = await client.path("/chat/completions").post({
      body: {
        messages,
        temperature,
        top_p: 1,
        max_tokens: maxTokens,
        model,
      },
    });

    if (isUnexpected(response)) {
      throw new Error(`AI error: ${response.body.error?.message || "Unknown"}`);
    }

    return response.body.choices[0].message.content;
  } catch (error) {
    console.error("AI API ERROR:", error);
    throw new Error("Failed to get AI response");
  }
};

/* -------------------- VALIDATION -------------------- */

const isAmharic = (text) => /[\u1200-\u137F]/.test(text);

const validateSections = (sections) => {
  if (!Array.isArray(sections) || sections.length !== 3) {
    throw new Error("Invalid sections count");
  }

  for (const section of sections) {
    if (!section.title || !Array.isArray(section.contentBlocks)) {
      throw new Error("Invalid section structure");
    }

    const hasTranslation = section.contentBlocks.some(
      (b) => b.type === "translation",
    );

    const hasExplanation = section.contentBlocks.some(
      (b) => b.type === "ai_explanation",
    );

    if (!hasTranslation || !hasExplanation) {
      throw new Error("Missing required blocks");
    }
  }
};

/* -------------------- GENERATE SECTIONS -------------------- */

exports.generateSections = async (lesson) => {
  const teachingLanguage = normalizeLanguage(lesson.language?.name);
  const targetLanguage = normalizeLanguage(lesson.preferredLanguage?.name);

  const systemMessage = `
You are a multilingual language teaching AI.

STRICT RULES:
- Teaching language: ${teachingLanguage}
- Target language: ${targetLanguage}

YOU MUST:
1. Use ${teachingLanguage} for ALL explanations, titles, hints
2. Use ${targetLanguage} for ALL vocabulary and translations
3. NEVER mix languages incorrectly
4. NEVER default to English unless it is the teaching language
5. Generate EXACTLY 3 sections
6. Output ONLY valid JSON

Each section must include:
- order (1,2,3)
- title (in ${teachingLanguage})
- contentBlocks
- resource (empty array if none)

Each section MUST include:
- one translation block
- one ai_explanation block

Translation format:
"${targetLanguage}: ..., ${teachingLanguage}: ..."
`;

  const userMessage = `
Lesson:
Level: ${lesson.level}
Title: ${lesson.title}
Description: ${lesson.desc}

If level is 1, keep content very simple.

Generate sections now.
`;

  for (let i = 0; i < 2; i++) {
    try {
      const raw = await callAI(
        [
          { role: "system", content: systemMessage },
          { role: "user", content: userMessage },
        ],
        0.3,
        2000,
      );

      const sections = extractJSON(raw);
      validateSections(sections, teachingLanguage);

      return sections;
    } catch (err) {
      console.log(err,"Retrying section generation...");
    }
  }

  throw new Error("Failed to generate valid sections");
};

/* -------------------- GENERATE QUIZ -------------------- */

exports.generateQuiz = async (lesson) => {
  const teachingLanguage = normalizeLanguage(lesson.language?.name);
  const targetLanguage = normalizeLanguage(lesson.preferredLanguage?.name);

  const systemMessage = `
You are a multilingual quiz generator AI.

STRICT RULES:

1. Generate EXACTLY 5 questions.
2. Output ONLY valid JSON.
3. DO NOT include markdown or explanations.

LANGUAGE RULES:
- Questions MUST be in ${teachingLanguage}
- Options MUST contain ${targetLanguage} words OR their meanings
- Answers MUST be EXACTLY one of the options

CRITICAL:
- The answer MUST match one option EXACTLY (character by character)
- Do NOT mix formats

SCHEMA:
{
  "questions": [
    {
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "answer": "string"
    }
  ]
}

FOR BEGINNER LEVEL:
- Use simple vocabulary
- Focus on translation meaning

GOOD EXAMPLE:
{
  "question": "‘Akkam’ ትርጉሙ ምንድነው?",
  "options": ["ሰላም", "መጽሐፍ", "ቤት", "ውሃ"],
  "answer": "ሰላም"
}
`;

  const userMessage = `
Lesson:
Title: ${lesson.title}
Description: ${lesson.desc}

Generate the quiz now.
`;

  const raw = await callAI(
    [
      { role: "system", content: systemMessage },
      { role: "user", content: userMessage },
    ],
    0.3,
    1500,
  );

  try {
    const quiz = extractJSON(raw);

    if (!quiz || !Array.isArray(quiz.questions)) {
      throw new Error("Invalid quiz structure");
    }

    for (const q of quiz.questions) {
      if (
        !q.question ||
        !Array.isArray(q.options) ||
        q.options.length !== 4 ||
        !q.answer
      ) {
        throw new Error("Invalid question format");
      }

      const options = q.options.map((o) => o.trim().toLowerCase());
      const answer = q.answer.trim().toLowerCase();

      if (!options.includes(answer)) {
        throw new Error("Answer not in options");
      }
    }

    return quiz;
  } catch (err) {
    console.error("error :", err);
    console.error("QUIZ RAW RESPONSE:", raw);
    throw new Error("Invalid quiz format");
  }
};

/* -------------------- CHAT -------------------- */

exports.chat = async (
  messages,
  teachingLanguage,
  targetLanguage,
  userNativeLanguage,
) => {
  const systemPrompt = `
You are a language tutor.

- Teaching language: ${teachingLanguage}
- Target language: ${targetLanguage}
- User native language: ${userNativeLanguage || teachingLanguage}

RULES:
- Explain in ${teachingLanguage}
- Give examples in ${targetLanguage}
- Be simple and beginner-friendly
`;

  const fullMessages = [{ role: "system", content: systemPrompt }, ...messages];

  return await callAI(fullMessages, 0.5, 1000);
};

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
    // 1. Try cleaning markdown blocks
    const cleanText = text
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();
    return JSON.parse(cleanText);
  } catch (e) {
    // 2. Fallback: regex extraction for first { or [ object
    const match = text.match(/[\{\[]\s*[\s\S]*[\}\]]/);
    if (!match) throw new Error("No JSON structure found in AI response");
    try {
      return JSON.parse(match[0]);
    } catch (inner) {
      throw new Error("Extracted JSON is malformed");
    }
  }
};

const callAI = async (messages, temperature = 0.3, maxTokens = 2500) => {
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
    throw new Error("Failed to reach AI service");
  }
};

/* -------------------- VALIDATION -------------------- */

const validateSections = (sections, requestedCount) => {
  if (!Array.isArray(sections) || sections.length === 0) {
    throw new Error("Generated content is not an array");
  }

  // Optional: enforcement of exact count if strictness is required
  // if (sections.length !== requestedCount) throw new Error(`Count mismatch: ${sections.length}/${requestedCount}`);

  for (const [idx, section] of sections.entries()) {
    if (!section.title || !Array.isArray(section.contentBlocks)) {
      throw new Error(`Section ${idx + 1} is missing title or contentBlocks`);
    }

    // Validate blocks internal structure
    section.contentBlocks.forEach((block, bIdx) => {
      if (
        ![
          "translation",
          "explanation",
          "example",
          "exercise",
          "pronunciation",
          "hint",
        ].includes(block.type)
      ) {
        throw new Error(
          `Invalid block type '${block.type}' in section ${idx + 1}`,
        );
      }
      if (!block.payload || typeof block.payload !== "object") {
        throw new Error(
          `Block ${bIdx + 1} in section ${idx + 1} is missing 'payload' object`,
        );
      }
    });
  }
};

/* -------------------- GENERATE SECTIONS -------------------- */

exports.generateSections = async (lesson,learning, maxSection = 3) => {
  const teachingLanguage = normalizeLanguage(
    learning.sourceLanguage.nativeName
  );
  const targetLanguage = normalizeLanguage(
   learning.targetLanguage.nativeName
  );

  const systemMessage = `
You are a multilingual language teaching AI. Generate EXACTLY ${maxSection} sections for a lesson.

STRICT RULES:
1. Use ${teachingLanguage} for ALL explanations, titles, and instructions.
2. Use ${targetLanguage} for vocabulary, phrases, and translations.
3. OUTPUT EXACTLY ${maxSection} SECTIONS.
4. Output ONLY valid raw JSON. No markdown.

JSON SCHEMA:
[
  {
    "order": number,
    "title": "string (in ${teachingLanguage})",
    "objective": "string (in ${teachingLanguage})",
    "skills": ["vocabulary", "grammar", "conversation", "listening"],
    "contentBlocks": [
      {
        "type": "explanation",
        "payload": { "text": "Detailed explanation in ${teachingLanguage}" }
      },
      {
        "type": "translation",
        "payload": {
          "translations": {
            "source": "Text in ${teachingLanguage}",
            "target": "Text in ${targetLanguage}"
          }
        }
      },
      {
        "type": "example",
        "payload": { "text": "Example usage in ${targetLanguage}" }
      },
      {
        "type": "exercise",
        "payload": {
          "question": "Question in ${teachingLanguage}",
          "answer": "Answer in ${targetLanguage}",
          "hint": "Optional hint in ${teachingLanguage}"
        }
      }
    ]
  }
]

CRITICAL: Every section MUST include at least one 'explanation' and one 'translation'.
`;

  const userMessage = `
Lesson Title: ${lesson.title}
Lesson Objective: ${lesson.objective || lesson.desc}
Level: ${lesson.level || 1}

Generate the curriculum sections now.
`;

console.log(systemMessage)

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const raw = await callAI([
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage },
      ]);

      const sections = extractJSON(raw);
      validateSections(sections, maxSection);

      return sections;
    } catch (err) {
      console.warn(`Attempt ${attempt} failed: ${err.message}. Retrying...`);
      if (attempt === 3) throw err;
    }
  }
};

/* -------------------- GENERATE QUIZ -------------------- */

exports.generateQuiz = async (lesson,learning) => {
   const teachingLanguage = normalizeLanguage(
    learning.sourceLanguage.nativeName
  );
  const targetLanguage = normalizeLanguage(
   learning.targetLanguage.nativeName
  );

  const systemMessage = `
You are a multilingual quiz generator AI.
Generate 20 multiple-choice questions.

RULES:
1. Questions MUST be in ${teachingLanguage}.
2. Options MUST contain ${targetLanguage} content.
3. The 'answer' MUST match one 'option' EXACTLY.
4. Output ONLY valid JSON:
{
  "questions": [
    {
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "answer": "string"
    }
  ]
}
`;

  const userMessage = `Lesson Title: ${lesson.title}. Description: ${lesson.desc}. Generate quiz now.`;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const raw = await callAI([
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage },
      ]);

      const quizData = extractJSON(raw);
      if (!quizData?.questions || !Array.isArray(quizData.questions))
        throw new Error("Invalid quiz structure");

      return quizData;
    } catch (err) {
      if (attempt === 3) throw err;
    }
  }
};

/* -------------------- TUTOR CHAT -------------------- */

exports.chat = async (
  messages,
  teachingLanguage,
  targetLanguage,
  userNativeLanguage,
) => {
  const systemPrompt = `
You are a language tutor.
- Explain in ${teachingLanguage}
- Give examples in ${targetLanguage}
- If the user asks in ${userNativeLanguage || teachingLanguage}, respond accordingly but keep target practice in ${targetLanguage}.
`;

  return await callAI(
    [{ role: "system", content: systemPrompt }, ...messages],
    0.5,
    1000,
  );
};

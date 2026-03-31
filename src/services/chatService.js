// services/chatService.js
const ModelClient = require("@azure-rest/ai-inference").default;
const { AzureKeyCredential } = require("@azure/core-auth");
const { isUnexpected } = require("@azure-rest/ai-inference");

const endpoint = "https://models.github.ai/inference";
const token = process.env.GPT_2_TOKEN;

// 🔥 DIFFERENT MODEL (chat optimized)
const model = "openai/gpt-4.1";

const client = ModelClient(endpoint, new AzureKeyCredential(token));

// limit context (important for performance)
const MAX_HISTORY = 10;

// no local message intent checking; let the model decide and provide instructions.

exports.generateReply = async (session, userMessage, user) => {
  try {
    // 🔹 build conversation history (last N messages)
    const history = session.messages.slice(-MAX_HISTORY).map((msg) => ({
      role: msg.sender === "user" ? "user" : "assistant",
      content: msg.text,
    }));

    // 🔹 system prompt (VERY IMPORTANT)
    const systemPrompt = `
You are a friendly AI language tutor and support chatbot.

User native language: ${user.nativeLanguage?.name || "English"}
Learning language: ${session.languageId?.name || "target language"}

RULES:
- Always respond in the user's native language.
- Keep responses short (max 5-6 lines).
- Explain clearly with examples for language topics.
- If user asks something out of language-learning context, respond with "out of context" but in the user's native language.
- Do not reject or ignore the question; answer in a helpful way.
`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...history,
      { role: "user", content: userMessage },
    ];

    const response = await client.path("/chat/completions").post({
      body: {
        model,
        messages,
        temperature: 0.5,
        max_tokens: 500,
      },
    });

    if (isUnexpected(response)) {
      throw new Error(response.body.error?.message || "AI error");
    }

    return response.body.choices[0].message.content;
  } catch (err) {
    console.error("CHAT AI ERROR:", err);
    throw new Error("Failed to generate AI response");
  }
};

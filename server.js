require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const { GoogleGenAI } = require("@google/genai");

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";

const MAX_HISTORY_MESSAGES = 10;
const MAX_MESSAGE_LENGTH = 4000;

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

const conversations = new Map();

const SYSTEM_INSTRUCTION =
"You are StudyBuddy, a friendly and practical AI learning assistant. " +
"Explain concepts clearly and use examples when helpful. " +
"Use conversation history to remember relevant details. " +
"Be honest when you do not know something.";

app.get("/api/health", (req, res) => {
res.json({
ok: true,
service: "AI Memory Chatbot",
model: MODEL
});
});

app.post("/api/chat", async (req, res) => {
const { message, conversationId } = req.body || {};

if (typeof message !== "string" || !message.trim()) {
return res.status(400).json({
error: "Please enter a message."
});
}

if (message.length > MAX_MESSAGE_LENGTH) {
return res.status(400).json({
error: "Message is too long. Maximum 4000 characters."
});
}

if (!process.env.GEMINI_API_KEY) {
return res.status(503).json({
error: "GEMINI_API_KEY is missing from your .env file."
});
}

const id =
typeof conversationId === "string" &&
conversationId.length <= 100
? conversationId
: "default";

const previousMessages = conversations.get(id) || [];

const history = previousMessages.concat({
role: "user",
parts: [{ text: message.trim() }]
});

try {
const ai = new GoogleGenAI({
apiKey: process.env.GEMINI_API_KEY
});

const response = await ai.models.generateContent({
  model: MODEL,
  contents: history,
  config: {
    systemInstruction: SYSTEM_INSTRUCTION,
    temperature: 0.7,
    maxOutputTokens: 800
  }
});

const reply = response.text;

if (typeof reply !== "string" || !reply.trim()) {
  return res.status(502).json({
    error: "The AI returned an empty response. Please try again."
  });
}

const updatedMessages = history.concat({
  role: "model",
  parts: [{ text: reply }]
});

conversations.set(
  id,
  updatedMessages.slice(-MAX_HISTORY_MESSAGES)
);

return res.json({
  reply,
  conversationId: id,
  contextMessagesKept: conversations.get(id).length,
  model: MODEL
});


} catch (error) {
console.error(
"Gemini request failed:",
error?.message || error
);


const errorText = String(error?.message || "");
const status =
  Number(error?.status) ||
  Number(error?.httpStatusCode);

if (status === 429) {
  return res.status(429).json({
    error: "API rate limit reached. Please wait and try again."
  });
}

if (status === 503) {
  return res.status(503).json({
    error: "Gemini is temporarily busy. Please try again later."
  });
}

if (status === 404) {
  return res.status(502).json({
    error: "The configured Gemini model is unavailable. Check supported models for your API key."
  });
}

if (/API_KEY_INVALID|API key not valid/i.test(errorText)) {
  return res.status(502).json({
    error: "The Gemini API key is invalid. Check your .env file."
  });
}

return res.status(502).json({
  error: "The AI request failed. Check the PowerShell terminal for details."
});


}
});

app.post("/api/reset", (req, res) => {
const id =
typeof req.body?.conversationId === "string"
? req.body.conversationId
: "default";

conversations.delete(id);

return res.json({
ok: true,
message: "Conversation memory cleared."
});
});

app.listen(PORT, () => {
console.log("AI Memory Chatbot running at http://localhost:" + PORT);
console.log("Using model: " + MODEL);
});

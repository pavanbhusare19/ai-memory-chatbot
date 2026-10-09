# StudyBuddy — AI Memory Chatbot

A responsive AI chatbot built with Node.js, Express, Google Gemini, and plain HTML/CSS/JavaScript.

## Features

- Real Gemini API integration (no mock replies)
- Multi-turn context maintained separately for each conversation ID
- Context window management: backend keeps the last 10 messages
- System instruction defining the StudyBuddy learning-assistant role
- API validation, rate-limit messaging, timeout handling, and clear UI errors
- Responsive interface, suggested prompts, and new-chat/reset action
- API key loaded from `.env`; `.env` is ignored by Git

## Requirements

- Node.js 20 or newer recommended
- A Google Gemini API key from https://aistudio.google.com/

## Run locally

1. Extract the ZIP and open the `ai-memory-chatbot` folder in VS Code.
2. Open a terminal in that folder and install dependencies:

   ```bash
   npm install
   ```

3. Copy `.env.example` to a file named `.env`.
4. Put your real key in `.env`:

   ```env
   GEMINI_API_KEY=your_real_key_here
   PORT=5000
   ```

5. Start the server:

   ```bash
   npm start
   ```

6. Open http://localhost:5000

Never share your `.env` file or commit API keys to GitHub.

## Test multi-turn memory

Try these messages in the same conversation:

1. `Remember that my favorite language is Python and my project is a student expense tracker.`
2. `What project am I working on?`
3. `Which programming language did I say I like?`
4. `Suggest one feature for my project.`
5. `Summarize what you know about my project and preferred language.`

The server keeps only the latest 10 messages in memory for each conversation. This is in-process memory, so conversations reset when the server restarts and are not persistent across server instances.

## API

- `GET /api/health` — health check
- `POST /api/chat` — body: `{ "message": "...", "conversationId": "..." }`
- `POST /api/reset` — body: `{ "conversationId": "..." }`

## GitHub submission

```bash
git init
git add .
git commit -m "Build AI chatbot with multi-turn memory"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ai-memory-chatbot.git
git push -u origin main
```

Create a public GitHub repository first and replace `YOUR_USERNAME` with your GitHub username. Verify `.env` is not tracked before pushing.

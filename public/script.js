const form = document.getElementById("chat-form");
const input = document.getElementById("message-input");
const sendButton = document.getElementById("send-button");
const messages = document.getElementById("messages");
const welcome = document.getElementById("welcome");
const newChatButton = document.getElementById("new-chat");

let conversationId = createConversationId();
let history = [];
let busy = false;

function createConversationId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }
  return `chat-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function hideWelcome() {
  if (welcome) welcome.remove();
}

function addMessage(role, text, isError = false) {
  hideWelcome();
  const wrapper = document.createElement("div");
  wrapper.className = `message ${role}${isError ? " error" : ""}`;

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = role === "user" ? "Y" : "✦";
  avatar.setAttribute("aria-hidden", "true");

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  // Use textContent so model/user text is not interpreted as HTML.
  bubble.textContent = text;

  wrapper.append(avatar, bubble);
  messages.appendChild(wrapper);
  messages.scrollTop = messages.scrollHeight;
  wrapper.scrollIntoView({ behavior: "smooth", block: "nearest" });
  return wrapper;
}

function setBusy(value) {
  busy = value;
  sendButton.disabled = value;
  input.disabled = value;
  sendButton.innerHTML = value ? "…" : "<span>↑</span>";
}

async function sendMessage(rawText) {
  const message = rawText.trim();
  if (!message || busy) return;

  addMessage("user", message);
  input.value = "";
  resizeInput();
  setBusy(true);

  const typing = document.createElement("div");
  typing.className = "typing";
  typing.textContent = "StudyBuddy is thinking…";
  messages.appendChild(typing);
  typing.scrollIntoView({ behavior: "smooth", block: "nearest" });

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, conversationId })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Something went wrong. Please try again.");

    history.push({ role: "user", text: message });
    history.push({ role: "model", text: data.reply });
    addMessage("assistant", data.reply);
  } catch (error) {
    addMessage("assistant", error.message || "Unable to connect. Check that the server is running.", true);
  } finally {
    typing.remove();
    setBusy(false);
    input.focus();
  }
}

function resizeInput() {
  input.style.height = "auto";
  input.style.height = `${Math.min(input.scrollHeight, 150)}px`;
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  sendMessage(input.value);
});

input.addEventListener("input", resizeInput);
input.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    form.requestSubmit();
  }
});

document.querySelectorAll(".suggestion").forEach((button) => {
  button.addEventListener("click", () => sendMessage(button.textContent));
});

newChatButton.addEventListener("click", async () => {
  if (busy) return;
  try {
    await fetch("/api/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId })
    });
  } catch (_) {
    // A fresh conversation ID still prevents the new chat using old memory.
  }
  conversationId = createConversationId();
  history = [];
  messages.replaceChildren();
  const newWelcome = document.createElement("div");
  newWelcome.id = "welcome";
  newWelcome.className = "welcome";
  newWelcome.innerHTML = `
    <div class="welcome-icon">✦</div>
    <p class="eyebrow">YOUR PERSONAL AI ASSISTANT</p>
    <h2>What would you like<br>to learn today?</h2>
    <p class="welcome-copy">Ask a question, explore an idea, or start a conversation. I’ll use recent messages to keep context.</p>
    <div class="suggestions">
      <button type="button" class="suggestion">Explain machine learning simply</button>
      <button type="button" class="suggestion">Help me prepare for an interview</button>
      <button type="button" class="suggestion">Create a study plan for this week</button>
    </div>`;
  messages.appendChild(newWelcome);
  newWelcome.querySelectorAll(".suggestion").forEach((button) => {
    button.addEventListener("click", () => sendMessage(button.textContent));
  });
  input.value = "";
  resizeInput();
  input.focus();
});

const API_BASE = "https://fieldnote-chat.nanotechnology728.workers.dev";
const STORAGE_KEY = "fieldnote.conversationId";

const els = {
  messages: document.querySelector("#messages"),
  input: document.querySelector("#message-input"),
  composer: document.querySelector("#composer"),
  send: document.querySelector("#send-button"),
  newChat: document.querySelector("#new-chat"),
  documentInput: document.querySelector("#document-input"),
  documentStatus: document.querySelector("#document-status"),
  conversations: document.querySelector("#conversation-list"),
  status: document.querySelector("#app-status"),
  toast: document.querySelector("#toast"),
  documentList: document.querySelector("#document-list"),
  exportChat: document.querySelector("#export-chat"),
  deleteChat: document.querySelector("#delete-chat")
};

let conversationId = localStorage.getItem(STORAGE_KEY);
let busy = false;

const escapeHtml = value => {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
};

const renderMarkdownLite = value => escapeHtml(value)
  .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
  .replace(/\n/g, "<br>");

function setStatus(text, state = "ready") {
  els.status.textContent = text;
  els.status.dataset.state = state;
}

function toast(message) {
  els.toast.textContent = message;
  els.toast.hidden = false;
  setTimeout(() => { els.toast.hidden = true; }, 3200);
}

function scroll() { els.messages.scrollTop = els.messages.scrollHeight; }

function clearEmptyState() { document.querySelector("#empty-state")?.remove(); }

function addUserMessage(text) {
  clearEmptyState();
  const row = document.createElement("div");
  row.className = "message user";
  const bubble = document.createElement("div");
  bubble.className = "user-bubble";
  bubble.textContent = text;
  row.appendChild(bubble);
  els.messages.appendChild(row);
  scroll();
}

function addAssistantMessage() {
  clearEmptyState();
  const row = document.createElement("div");
  row.className = "message assistant";
  const content = document.createElement("div");
  content.className = "assistant-content";
  content.innerHTML = '<span class="typing"><span></span><span></span><span></span></span>';
  row.appendChild(content);
  els.messages.appendChild(row);
  scroll();
  return { row, content };
}

function resetView() {
  els.messages.innerHTML = '<div id="empty-state" class="empty-state"><span class="eyebrow">RESEARCH MODE</span><h2>Ask a question. Bring a document.</h2><p>Fieldnote combines conversation memory with semantic document retrieval.</p><div class="suggestions"><button data-prompt="Explain a difficult concept in simple terms.">Explain a concept</button><button data-prompt="Analyze this problem step by step.">Analyze a problem</button><button data-prompt="Create a concise research plan for this topic.">Build a research plan</button></div></div>';
  bindSuggestions();
}

function bindSuggestions() {
  document.querySelectorAll("[data-prompt]").forEach(button => {
    button.onclick = () => { els.input.value = button.dataset.prompt; els.input.focus(); };
  });
}

async function api(path, options = {}) {
  const response = await fetch(API_BASE + path, options);
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.error?.message || "Request failed.");
  }
  return response;
}

async function createConversation(title = "New conversation") {
  const response = await api("/conversations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: title.slice(0, 80) })
  });
  const data = await response.json();
  conversationId = data.id;
  localStorage.setItem(STORAGE_KEY, conversationId);
  await loadConversations();
}

async function loadConversationDocuments() {
  if (!conversationId) return;
  try {
    const data = await (await api("/conversations/" + encodeURIComponent(conversationId))).json();
    const documents = data.documents || [];
    const count = documents.length;
    els.documentStatus.textContent = count ? count + " document" + (count === 1 ? "" : "s") : "No documents";
    els.documentList.replaceChildren();
    for (const doc of documents) {
      const row = document.createElement("div");
      row.className = "document-item";
      const label = document.createElement("span");
      label.textContent = doc.title || "Untitled document";
      label.title = doc.title || "";
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "document-remove";
      remove.textContent = "×";
      remove.setAttribute("aria-label", "Delete " + (doc.title || "document"));
      remove.onclick = () => deleteDocument(doc.id);
      row.append(label, remove);
      els.documentList.appendChild(row);
    }
  } catch {}
}

async function deleteDocument(id) {
  if (!conversationId || busy) return;
  if (!confirm("Remove this indexed document?")) return;
  try {
    await api("/documents", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversation_id: conversationId, id })
    });
    await loadConversationDocuments();
    toast("Document removed.");
  } catch (error) { toast(error.message); }
}

async function exportCurrentConversation() {
  if (!conversationId || busy) return;
  try {
    const response = await api("/conversations/" + encodeURIComponent(conversationId) + "/export");
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "fieldnote-conversation.md";
    link.click();
    URL.revokeObjectURL(url);
  } catch (error) { toast(error.message); }
}

async function deleteCurrentConversation() {
  if (!conversationId || busy) return;
  if (!confirm("Delete this conversation and its indexed documents?")) return;
  try {
    await api("/conversations/" + encodeURIComponent(conversationId), { method: "DELETE" });
    conversationId = null;
    localStorage.removeItem(STORAGE_KEY);
    resetView();
    await loadConversations();
    setStatus("Ready", "ready");
  } catch (error) { toast(error.message); }
}

async function loadConversations() {
  try {
    const response = await api("/conversations");
    const data = await response.json();
    els.conversations.replaceChildren();
    for (const item of data.conversations || []) {
      const button = document.createElement("button");
      button.className = "conversation-item" + (item.id === conversationId ? " active" : "");
      const title = document.createElement("span");
      title.className = "conversation-title";
      title.textContent = item.title || "Untitled";
      const date = document.createElement("span");
      date.className = "conversation-date";
      date.textContent = new Date(item.updated_at).toLocaleDateString();
      button.append(title, date);
      button.onclick = () => openConversation(item.id);
      els.conversations.appendChild(button);
    }
  } catch {}
}

async function openConversation(id) {
  conversationId = id;
  localStorage.setItem(STORAGE_KEY, id);
  resetView();
  try {
    const data = await (await api("/conversations/" + encodeURIComponent(id))).json();
    for (const message of data.messages || []) {
      if (message.role === "user") addUserMessage(message.content);
      else {
        const { content } = addAssistantMessage();
        content.innerHTML = renderMarkdownLite(message.content);
      }
    }
    await loadConversations();
    await loadConversationDocuments();
  } catch (error) { toast(error.message); }
}

function renderCitations(content, citations = []) {
  if (!citations.length) return;
  const wrap = document.createElement("div");
  wrap.className = "citations";
  const label = document.createElement("span");
  label.className = "citation-label";
  label.textContent = "Sources";
  wrap.appendChild(label);
  citations.forEach(citation => {
    const item = document.createElement("span");
    item.className = "citation";
    item.textContent = citation.title;
    wrap.appendChild(item);
  });
  content.appendChild(wrap);
}

async function streamChat(text) {
  if (!conversationId) await createConversation(text);
  const { row, content } = addAssistantMessage();
  let accumulated = "";

  const response = await api("/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ conversation_id: conversationId, message: text })
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6);
      if (payload === "[DONE]") continue;
      let event;
      try { event = JSON.parse(payload); } catch { continue; }
      if (event.type === "delta") {
        accumulated += event.text;
        content.innerHTML = renderMarkdownLite(accumulated);
        scroll();
      }
      if (event.type === "citations") renderCitations(content, event.citations);
    }
  }

  if (!accumulated) content.textContent = "No response returned.";
  row.dataset.complete = "true";
}

els.composer.onsubmit = async event => {
  event.preventDefault();
  const text = els.input.value.trim();
  if (!text || busy) return;

  busy = true;
  els.send.disabled = true;
  setStatus("Thinking", "busy");
  els.input.value = "";
  els.input.style.height = "auto";
  addUserMessage(text);

  try {
    await streamChat(text);
    await loadConversations();
  } catch (error) {
    const row = document.createElement("div");
    row.className = "message assistant";
    row.innerHTML = '<div class="error"></div>';
    row.querySelector(".error").textContent = error.message;
    els.messages.appendChild(row);
  } finally {
    busy = false;
    els.send.disabled = false;
    setStatus("Ready", "ready");
    els.input.focus();
  }
};

els.input.onkeydown = event => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    els.composer.requestSubmit();
  }
};

els.input.oninput = () => {
  els.input.style.height = "auto";
  els.input.style.height = Math.min(els.input.scrollHeight, 140) + "px";
};

els.exportChat.onclick = exportCurrentConversation;
els.deleteChat.onclick = deleteCurrentConversation;

els.newChat.onclick = async () => {
  conversationId = null;
  localStorage.removeItem(STORAGE_KEY);
  els.documentList.replaceChildren();
  els.documentStatus.textContent = "Ready";
  resetView();
  await loadConversations();
  els.input.focus();
};

document.addEventListener("keydown", event => {
  if ((event.ctrlKey || event.metaKey) && event.key === "k") {
    event.preventDefault();
    els.input.focus();
  }
});

els.documentInput.onchange = async () => {
  const file = els.documentInput.files?.[0];
  if (!file) return;

  els.documentStatus.textContent = "Indexing";
  try {
    if (!conversationId) await createConversation(file.name);
    let text;

    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      const pdfjs = await import("https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs");
      const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
      const pages = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        pages.push(content.items.map(item => item.str).join(" "));
      }
      text = pages.join("\n\n");
    } else {
      text = await file.text();
    }

    if (text.length > 100000) throw new Error("Document is too large. Keep it under 100,000 characters.");

    const response = await api("/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversation_id: conversationId, title: file.name, text })
    });

    const result = await response.json();
    els.documentStatus.textContent = result.chunks + " chunks";
    toast(file.name + " indexed successfully.");
    await loadConversationDocuments();
  } catch (error) {
    els.documentStatus.textContent = "Index failed";
    toast(error.message);
  } finally {
    els.documentInput.value = "";
  }
};

async function checkHealth() {
  try {
    const response = await api("/health");
    const data = await response.json();
    setStatus(data.status === "ok" ? "Connected" : "Degraded", data.status === "ok" ? "ready" : "busy");
  } catch {
    setStatus("Offline", "error");
  }
}

setStatus("Connecting", "busy");
bindSuggestions();
loadConversations();
loadConversationDocuments();
checkHealth();

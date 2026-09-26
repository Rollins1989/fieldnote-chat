import { CONFIG } from "./config.js";

const ID_PATTERN = /^[a-zA-Z0-9_-]{8,80}$/;

export function validateChatMessage(body) {
  if (!body || typeof body !== "object") return "Request body must be an object.";
  if (typeof body.conversation_id !== "string" || !ID_PATTERN.test(body.conversation_id)) return "Invalid conversation_id.";
  if (typeof body.message !== "string") return "message must be a string.";
  const message = body.message.trim();
  if (!message) return "message cannot be empty.";
  if (message.length > CONFIG.maxMessageLength) return "message exceeds " + CONFIG.maxMessageLength + " characters.";
  return null;
}

export function validateDocument(body) {
  if (!body || typeof body !== "object") return "Request body must be an object.";
  if (typeof body.conversation_id !== "string" || !ID_PATTERN.test(body.conversation_id)) return "Invalid conversation_id.";
  if (typeof body.title !== "string" || !body.title.trim()) return "title is required.";
  if (body.title.length > CONFIG.maxTitleLength) return "title is too long.";
  if (typeof body.text !== "string" || !body.text.trim()) return "text is required.";
  if (body.text.length > CONFIG.maxDocumentLength) return "document exceeds " + CONFIG.maxDocumentLength + " characters.";
  return null;
}

export function validateDocumentDelete(body) {
  if (!body || typeof body !== "object") return "Request body must be an object.";
  if (typeof body.conversation_id !== "string" || !ID_PATTERN.test(body.conversation_id)) return "Invalid conversation_id.";
  if (typeof body.id !== "string" || !ID_PATTERN.test(body.id)) return "Invalid document id.";
  return null;
}

export function validateConversation(body) {
  if (!body || typeof body !== "object") return "Request body must be an object.";
  if (body.title !== undefined && (typeof body.title !== "string" || body.title.length > CONFIG.maxTitleLength)) return "Invalid title.";
  return null;
}

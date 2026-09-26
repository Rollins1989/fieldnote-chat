export const LIMITS = Object.freeze({
  maxMessages: 20,
  maxMessageLength: 4000,
  maxDocumentLength: 100000,
  maxTitleLength: 120,
  rateLimitPerMinute: 20
});

export function validateChatMessage(body) {
  if (!body || typeof body !== "object") return "Request body must be an object.";
  if (typeof body.conversation_id !== "string" || !/^[a-zA-Z0-9_-]{8,80}$/.test(body.conversation_id)) return "Invalid conversation_id.";
  if (typeof body.message !== "string") return "message must be a string.";
  const message = body.message.trim();
  if (!message) return "message cannot be empty.";
  if (message.length > LIMITS.maxMessageLength) return "message exceeds " + LIMITS.maxMessageLength + " characters.";
  return null;
}

export function validateDocument(body) {
  if (!body || typeof body !== "object") return "Request body must be an object.";
  if (typeof body.conversation_id !== "string" || !/^[a-zA-Z0-9_-]{8,80}$/.test(body.conversation_id)) return "Invalid conversation_id.";
  if (typeof body.title !== "string" || !body.title.trim()) return "title is required.";
  if (body.title.length > LIMITS.maxTitleLength) return "title is too long.";
  if (typeof body.text !== "string" || !body.text.trim()) return "text is required.";
  if (body.text.length > LIMITS.maxDocumentLength) return "document exceeds " + LIMITS.maxDocumentLength + " characters.";
  return null;
}

export function validateConversation(body) {
  if (!body || typeof body !== "object") return "Request body must be an object.";
  if (body.title !== undefined && (typeof body.title !== "string" || body.title.length > LIMITS.maxTitleLength)) return "Invalid title.";
  return null;
}

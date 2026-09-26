export function hasDb(env) { return Boolean(env?.DB); }

export async function createConversation(env, id, title) {
  if (!hasDb(env)) return;
  await env.DB.prepare("INSERT INTO conversations (id, title, created_at, updated_at) VALUES (?, ?, datetime('now'), datetime('now'))").bind(id, title).run();
}

export async function listConversations(env, limit = 30) {
  if (!hasDb(env)) return [];
  const { results } = await env.DB.prepare("SELECT id, title, created_at, updated_at FROM conversations ORDER BY updated_at DESC LIMIT ?").bind(limit).all();
  return results || [];
}

export async function getConversation(env, id) {
  if (!hasDb(env)) return { conversation: null, messages: [] };
  const conversation = await env.DB.prepare("SELECT id, title, created_at, updated_at FROM conversations WHERE id = ?").bind(id).first();
  const { results } = await env.DB.prepare("SELECT role, content, created_at FROM messages WHERE conversation_id = ? ORDER BY id ASC LIMIT 100").bind(id).all();
  return { conversation, messages: results || [] };
}

export async function addMessage(env, conversationId, role, content) {
  if (!hasDb(env)) return;
  await env.DB.batch([
    env.DB.prepare("INSERT INTO messages (conversation_id, role, content, created_at) VALUES (?, ?, ?, datetime('now'))").bind(conversationId, role, content),
    env.DB.prepare("UPDATE conversations SET updated_at = datetime('now') WHERE id = ?").bind(conversationId)
  ]);
}

export async function saveDocument(env, documentId, conversationId, title) {
  if (!hasDb(env)) return;
  await env.DB.prepare("INSERT INTO documents (id, conversation_id, title, created_at) VALUES (?, ?, ?, datetime('now'))").bind(documentId, conversationId, title).run();
}

export async function saveChunk(env, documentId, chunkIndex, content, embedding) {
  if (!hasDb(env)) return;
  await env.DB.prepare("INSERT INTO document_chunks (document_id, chunk_index, content, embedding) VALUES (?, ?, ?, ?)").bind(documentId, chunkIndex, content, JSON.stringify(embedding)).run();
}

export async function getChunks(env, limit = 500) {
  if (!hasDb(env)) return [];
  const { results } = await env.DB.prepare("SELECT dc.document_id, d.title, dc.content, dc.embedding FROM document_chunks dc JOIN documents d ON d.id = dc.document_id ORDER BY dc.document_id, dc.chunk_index LIMIT ?").bind(limit).all();
  return results || [];
}

export async function checkRateLimit(env, key, maxRequests) {
  if (!hasDb(env)) return { allowed: true, remaining: maxRequests };
  const bucket = Math.floor(Date.now() / 60000);
  const id = key + ":" + bucket;
  await env.DB.prepare("INSERT INTO rate_limits (id, request_count, expires_at) VALUES (?, 1, ?) ON CONFLICT(id) DO UPDATE SET request_count = request_count + 1").bind(id, bucket + 1).run();
  const row = await env.DB.prepare("SELECT request_count FROM rate_limits WHERE id = ?").bind(id).first();
  const count = Number(row?.request_count || 0);
  return { allowed: count <= maxRequests, remaining: Math.max(0, maxRequests - count) };
}

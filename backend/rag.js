import { CONFIG } from "./config.js";

export function chunkText(text, size = 900, overlap = 120) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return [];
  const chunks = [];
  let start = 0;
  while (start < normalized.length) {
    const end = Math.min(normalized.length, start + size);
    chunks.push(normalized.slice(start, end));
    if (end >= normalized.length) break;
    start = Math.max(0, end - overlap);
  }
  return chunks;
}

export async function embed(env, text) {
  if (!env?.AI) return null;
  const result = await env.AI.run("@cf/baai/bge-base-en-v1.5", { text: [text] });
  return result?.data?.[0] || null;
}

export function cosineSimilarity(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length || !a.length) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return na && nb ? dot / (Math.sqrt(na) * Math.sqrt(nb)) : 0;
}

export async function retrieve(env, query, chunks, topK = CONFIG.maxRetrievalChunks) {
  const queryEmbedding = await embed(env, query);
  if (!queryEmbedding) return [];
  return chunks
    .map((chunk) => {
      let embedding;
      try { embedding = JSON.parse(chunk.embedding); } catch { embedding = null; }
      return { ...chunk, score: cosineSimilarity(queryEmbedding, embedding) };
    })
    .filter((chunk) => chunk.score >= CONFIG.retrievalThreshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

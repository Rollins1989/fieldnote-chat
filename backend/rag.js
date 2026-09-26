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
    const av = Number(a[i]) || 0;
    const bv = Number(b[i]) || 0;
    dot += av * bv;
    na += av * av;
    nb += bv * bv;
  }
  return na && nb ? dot / (Math.sqrt(na) * Math.sqrt(nb)) : 0;
}

export function lexicalScore(query, text, title = "") {
  const terms = new Set((query.toLowerCase().match(/[a-z0-9]{3,}/g) || []).slice(0, 32));
  if (!terms.size) return 0;
  const haystack = (text + " " + title).toLowerCase();
  let hits = 0;
  for (const term of terms) if (haystack.includes(term)) hits++;
  return hits / terms.size;
}

export function rankCandidates(query, candidates, topK = CONFIG.maxRetrievalChunks) {
  return candidates
    .map(item => {
      const lexical = lexicalScore(query, item.content, item.title);
      const semantic = Number(item.semanticScore) || 0;
      const titleBoost = lexicalScore(query, item.title, "") * 0.05;
      return {
        ...item,
        lexicalScore: Number(lexical.toFixed(4)),
        semanticScore: Number(semantic.toFixed(4)),
        score: semantic * 0.85 + lexical * 0.10 + titleBoost
      };
    })
    .filter(item => item.semanticScore >= CONFIG.retrievalThreshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

export async function retrieve(env, query, chunks, topK = CONFIG.maxRetrievalChunks) {
  const queryEmbedding = await embed(env, query);
  if (!queryEmbedding) return [];
  const candidates = chunks.map(chunk => {
    let embedding;
    try { embedding = JSON.parse(chunk.embedding); } catch { embedding = null; }
    return { ...chunk, semanticScore: cosineSimilarity(queryEmbedding, embedding) };
  });
  return rankCandidates(query, candidates, topK);
}

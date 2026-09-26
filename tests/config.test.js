import test from "node:test";
import assert from "node:assert/strict";
import { CONFIG, SYSTEM_PROMPT } from "../backend/config.js";

test("production limits are bounded", () => {
  assert.ok(CONFIG.maxMessageLength <= 4000);
  assert.ok(CONFIG.maxDocumentLength <= 100000);
  assert.ok(CONFIG.maxRetrievalChunks <= 8);
});

test("system prompt forbids fabricated citations", () => {
  assert.match(SYSTEM_PROMPT, /Never invent facts, sources, citations/);
});

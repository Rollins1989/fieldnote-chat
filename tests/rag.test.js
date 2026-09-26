import test from "node:test";
import assert from "node:assert/strict";
import {chunkText,cosineSimilarity} from "../backend/rag.js";
test("chunks long text",()=>{const chunks=chunkText("a".repeat(2500),900,100);assert.ok(chunks.length>=3);assert.ok(chunks[0].length<=900)});
test("identical vectors have similarity one",()=>assert.equal(cosineSimilarity([1,2,3],[1,2,3]).toFixed(5),"1.00000"));
test("orthogonal vectors have similarity zero",()=>assert.equal(cosineSimilarity([1,0],[0,1]),0));

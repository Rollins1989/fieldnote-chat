import test from "node:test";
import assert from "node:assert/strict";
import {chunkText,cosineSimilarity,lexicalScore,rankCandidates} from "../backend/rag.js";
test("chunks long text",()=>{const chunks=chunkText("a".repeat(2500),900,100);assert.ok(chunks.length>=3);assert.ok(chunks[0].length<=900)});
test("identical vectors have similarity one",()=>assert.equal(cosineSimilarity([1,2,3],[1,2,3]).toFixed(5),"1.00000"));
test("orthogonal vectors have similarity zero",()=>assert.equal(cosineSimilarity([1,0],[0,1]),0));

test("lexical scoring rewards matching terms",()=>assert.ok(lexicalScore("machine learning","Machine learning improves retrieval")>0));
test("hybrid ranking prefers strong semantic matches",()=>{const ranked=rankCandidates("research",[{content:"unrelated",title:"x",semanticScore:.24},{content:"research methods",title:"paper",semanticScore:.8}],2);assert.equal(ranked[0].title,"paper")});

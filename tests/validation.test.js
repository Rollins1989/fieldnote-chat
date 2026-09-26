import test from "node:test";
import assert from "node:assert/strict";
import {validateChatMessage,validateDocument,validateConversation} from "../backend/validation.js";
test("accepts valid chat",()=>assert.equal(validateChatMessage({conversation_id:"abc12345",message:"Hello"}),null));
test("rejects oversized chat",()=>assert.match(validateChatMessage({conversation_id:"abc12345",message:"x".repeat(4001)}),/exceeds/));
test("rejects invalid conversation id",()=>assert.match(validateChatMessage({conversation_id:"bad!",message:"Hello"}),/conversation_id/));
test("validates documents",()=>{assert.equal(validateDocument({conversation_id:"abc12345",title:"paper.txt",text:"hello"}),null);assert.match(validateDocument({conversation_id:"abc12345",title:"",text:"hello"}),/title/)});
test("validates conversation titles",()=>{assert.equal(validateConversation({title:"Research"}),null);assert.match(validateConversation({title:"x".repeat(121)}),/title/)});

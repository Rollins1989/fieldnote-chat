import test from "node:test";
import assert from "node:assert/strict";
import { corsHeaders, securityHeaders } from "../backend/http.js";

test("security headers are present", () => {
  const headers = securityHeaders();
  assert.equal(headers["X-Content-Type-Options"], "nosniff");
  assert.equal(headers["X-Frame-Options"], "DENY");
  assert.equal(headers["Referrer-Policy"], "strict-origin-when-cross-origin");
});

test("CORS allowlist reflects only trusted origins", () => {
  const allowed = corsHeaders(new Request("https://api.example.test", { headers: { Origin: "https://rollins1989.github.io" } }), new Set(["https://rollins1989.github.io"]));
  assert.equal(allowed["Access-Control-Allow-Origin"], "https://rollins1989.github.io");

  const denied = corsHeaders(new Request("https://api.example.test", { headers: { Origin: "https://evil.example" } }), new Set(["https://rollins1989.github.io"]));
  assert.equal(denied["Access-Control-Allow-Origin"], "null");
});

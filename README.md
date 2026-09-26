# Fieldnote

> **AI research assistant · serverless · retrieval-augmented · source-aware**

Fieldnote is a production-minded AI research application built around a simple idea: **answers should be useful, conversations should persist, and retrieved evidence should be visible.**

It uses a Cloudflare Worker as the API boundary, Groq for generation, Workers AI for embeddings, and D1 for relational persistence.

## Product

### Chat
- Streaming responses over Server-Sent Events
- Conversation memory
- Server-controlled system prompt
- Low-temperature generation for more consistent answers

### Research / RAG
- Upload TXT, Markdown, or PDF files
- Browser-side PDF text extraction
- Semantic chunking
- Workers AI embeddings
- Cosine-similarity retrieval
- Hybrid semantic + lexical reranking
- Top-k evidence selection
- Source labels shown with answers
- Document deduplication and lifecycle controls

### Reliability
- Typed application errors
- Request IDs
- Input validation
- Payload limits
- CORS allowlist with rejected foreign browser origins
- IP-based minute rate limiting with D1 and automatic expired-bucket cleanup
- Provider failures mapped to safe user-facing errors
- Cloudflare observability
- Automated CI

## Architecture

```
┌──────────────────────────────┐
│          Browser             │
│  Chat · Upload · History     │
└──────────────┬───────────────┘
               │ HTTPS / SSE
               ▼
┌──────────────────────────────┐
│      Cloudflare Worker       │
│ validation · routing · auth  │
│ rate limit · orchestration   │
└───────┬───────────┬──────────┘
        │           │
        ▼           ▼
     ┌─────┐     ┌──────────────┐
     │ D1  │     │ Workers AI   │
     │ DB  │     │ embeddings   │
     └─────┘     └──────┬───────┘
                        │
                        ▼
                 ┌──────────────┐
                 │     RAG      │
                 │ top-k cosine │
                 └──────┬───────┘
                        │ context
                        ▼
                 ┌──────────────┐
                 │     Groq     │
                 │ GPT-OSS      │
                 └──────┬───────┘
                        │ SSE
                        ▼
                     Browser
```

## Repository

```
fieldnote-chat/
├── backend/
│   ├── config.js          # limits + system prompt
│   ├── http.js            # errors + HTTP helpers
│   ├── rag.js             # chunking + embeddings + retrieval
│   ├── storage.js         # D1 persistence
│   └── validation.js      # request validation
├── frontend/
│   ├── app.js             # UI state + streaming client
│   └── styles.css         # responsive design
├── migrations/
│   ├── 0001_init.sql
│   └── 0002_harden_indexes.sql
├── tests/
│   ├── config.test.js
│   ├── http.test.js
│   ├── rag.test.js
│   └── validation.test.js
├── .github/
│   ├── ISSUE_TEMPLATE/
│   ├── workflows/ci.yml
│   └── pull_request_template.md
├── index.html
├── worker.js
├── wrangler.toml
├── SECURITY.md
├── LICENSE
├── evals/
│   ├── cases.json
│   └── README.md
├── package.json
├── CHANGELOG.md
```

## API

| Method | Route | Purpose |
|---|---|---|
| GET | /health | Health/version check |
| GET | /conversations | Recent conversations |
| GET | /conversations/:id | Conversation + messages |
| POST | /conversations | Create conversation |
| POST | /documents | Index document text |
| POST | /chat | Stream an AI response |
| DELETE | /conversations/:id | Delete a conversation and dependent data |
| GET | /conversations/:id/export | Export a conversation as Markdown |
| DELETE | /documents | Remove an indexed document |

## Request flow

1. Browser creates or selects a conversation.
2. User message is validated client-side and server-side.
3. Worker checks rate limits.
4. Recent conversation history is loaded.
5. Relevant document chunks are retrieved when RAG is configured.
6. Worker builds a controlled prompt with source context.
7. Groq streams tokens back over SSE.
8. Assistant output is persisted after generation.
9. Retrieved source labels are sent to the UI.

## Local development

Requirements: Node.js 20+ and Wrangler.

```bash
cp .dev.vars.example .dev.vars
# add your GROQ_API_KEY

npm test
npm run check

npx wrangler d1 create fieldnote-db
# copy the returned database ID into wrangler.toml

npx wrangler d1 migrations apply fieldnote-db --local
npx wrangler dev
```

Production:

```bash
npx wrangler d1 migrations apply fieldnote-db --remote
npx wrangler secret put GROQ_API_KEY
npx wrangler deploy
```

Then set the deployed Worker URL in `frontend/app.js`.

## Production boundary

This remains a deliberately small, single-user/demo architecture rather than a multi-tenant enterprise application.

Before handling sensitive customer data, add:
- authentication
- authorization / ownership checks
- tenant isolation
- managed vector indexing for larger corpora
- audit logging
- stronger abuse protection

The current RAG implementation deliberately scans stored embeddings because it is small and understandable. Hybrid reranking improves relevance, but a production-scale corpus should move to a managed vector index and authenticated tenant-aware retrieval.

## Engineering decisions

### Why Cloudflare?
The application can run close to users without maintaining a traditional server.

### Why D1?
Conversations and metadata are relational. D1 keeps the initial deployment simple.

### Why Workers AI embeddings?
It keeps retrieval inside the same serverless environment and avoids exposing embedding credentials to the browser.

### Why Groq?
Generation is isolated behind an OpenAI-compatible API boundary, making the model layer replaceable.

### Why vanilla JavaScript?
The project is intended to demonstrate the AI application architecture rather than framework complexity.

## Testing

```bash
npm test
npm run check
```

The tests cover validation, configuration invariants, HTTP security, hybrid retrieval, chunking, and vector similarity. CI runs them on every push and pull request.

## Security

See [SECURITY.md](./SECURITY.md). Never commit `.dev.vars`, API keys, database credentials, or private documents.

## License

MIT.

## Advanced v2 capabilities

The current branch also includes:

- **Hybrid retrieval** — semantic similarity combined with lightweight lexical/title matching for more resilient ranking.
- **Conversation-scoped RAG** — retrieved chunks are isolated to the active conversation.
- **Document deduplication** — SHA-256 content hashes prevent repeated indexing of the same document in a conversation.
- **Document lifecycle** — document counts, metadata and deletion support.
- **Conversation deletion** — persistent conversations can be removed with their dependent data through database cascades.
- **Prompt-injection resistance** — retrieved documents are explicitly treated as untrusted evidence rather than instructions.
- **Operational hardening** — cache-control, security headers, rate-limit cleanup and richer health metadata.
- **Evaluation coverage** — retrieval ranking and behavioral guardrails are represented in versioned tests/evaluation cases.

These features are designed to demonstrate production-oriented AI engineering decisions while keeping the project intentionally small enough to understand end-to-end.

# Fieldnote

> A serverless AI research assistant with streaming chat, conversational memory, document retrieval, citations, and production-minded API controls.

[![CI](https://github.com/Rollins1989/fieldnote-chat/actions/workflows/ci.yml/badge.svg)](https://github.com/Rollins1989/fieldnote-chat/actions/workflows/ci.yml)

## What it demonstrates

- Streaming LLM responses over Server-Sent Events
- Server-owned system prompt and model configuration
- Conversation persistence with Cloudflare D1
- TXT, Markdown, and PDF document ingestion
- Text chunking and Workers AI embeddings
- Lightweight semantic retrieval with cosine similarity
- Source-aware citations in the chat UI
- Request validation and size limits
- Per-IP minute-based rate limiting when D1 is configured
- Structured API errors and request IDs
- Cloudflare observability
- Automated unit tests and GitHub Actions CI
- Responsive vanilla-JavaScript frontend

## Architecture

Browser -> Cloudflare Worker -> Groq / GPT-OSS for generation

Documents -> PDF/text extraction -> chunking -> Workers AI embeddings -> D1

Chat -> conversation memory + semantic retrieval -> LLM -> SSE stream + citations

## Project structure

    fieldnote-chat/
    ├── backend/
    │   ├── rag.js
    │   ├── storage.js
    │   └── validation.js
    ├── frontend/
    │   ├── app.js
    │   └── styles.css
    ├── migrations/
    │   └── 0001_init.sql
    ├── tests/
    │   ├── rag.test.js
    │   └── validation.test.js
    ├── .github/workflows/ci.yml
    ├── index.html
    ├── worker.js
    ├── wrangler.toml
    └── package.json

## API

### GET /health
Returns service health and a request ID.

### POST /conversations
Creates a conversation with an optional title.

### GET /conversations/:id
Returns conversation metadata and stored messages.

### GET /conversations
Lists recent conversations.

### POST /documents
Accepts extracted document text and indexes it into chunks plus embeddings. The frontend extracts PDF text in the browser before sending it.

### POST /chat
Accepts a conversation ID and user message and streams the assistant response using SSE. When relevant document chunks are found, a citations event is emitted before the stream closes.

## Security and reliability

- Groq credentials remain server-side.
- The system prompt is controlled by the Worker, not the browser.
- IDs, titles, message lengths, and document sizes are validated.
- CORS is restricted to configured origins.
- Requests are rate-limited by IP when D1 is enabled.
- Provider failures are converted to generic internal errors.
- Important factual answers should still be verified against source material.

## Local setup

1. Install Node.js 20+.
2. Copy .dev.vars.example to .dev.vars and add your Groq key.
3. Create a D1 database:

       npx wrangler d1 create fieldnote-db

4. Replace REPLACE_WITH_YOUR_D1_DATABASE_ID in wrangler.toml with the returned ID.
5. Apply migrations locally:

       npx wrangler d1 migrations apply fieldnote-db --local

6. Run checks:

       npm test
       npm run check

7. Start the Worker:

       npx wrangler dev

For production:

       npx wrangler d1 migrations apply fieldnote-db --remote
       npx wrangler secret put GROQ_API_KEY
       npx wrangler deploy

Then update API_BASE in frontend/app.js to the deployed Worker URL.

## Design decisions

### Why vanilla JavaScript?
The UI is deliberately framework-light so the LLM, SSE, retrieval, validation, and API code remain easy to inspect during an interview.

### Why D1?
D1 provides relational persistence for conversations, messages, documents, chunks, and rate-limit buckets.

### Why cosine similarity?
The initial corpus is small, so brute-force similarity keeps retrieval understandable. A larger corpus should use a managed vector index.

### Why separate generation and embeddings?
Generation and retrieval are independent concerns. Groq handles generation while Workers AI provides embeddings for semantic retrieval.

## Testing

The repository contains deterministic tests for input validation, chunking, and cosine similarity. LLM evaluation should be treated separately: maintain a versioned prompt dataset and measure relevance, citation correctness, latency, and hallucination rate before changing prompts or models.

## Production notes

The D1 database ID is intentionally deployment-specific. Do not commit secrets. Configure D1, Workers AI, and the Groq secret in Cloudflare before publishing the Worker.

## Roadmap

- Authenticated users
- Managed vector index for larger corpora
- Versioned LLM evaluation dataset and regression dashboard
- Model fallback strategy
- Request and latency metrics dashboard

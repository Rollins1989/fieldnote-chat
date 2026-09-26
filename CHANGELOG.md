# Changelog

## 2.4.0 — 2026-09-26

### Added
- Hybrid semantic + lexical retrieval reranking.
- Conversation-scoped retrieval.
- SHA-256 document deduplication.
- Document metadata and lifecycle controls.
- Conversation deletion and Markdown export.
- Prompt-injection resistance for retrieved content.
- Request correlation IDs.
- Stronger streaming failure handling.
- Expanded security and retrieval tests.

### Improved
- Explicit document indexing rollback on embedding failure.
- Explicit deletion of dependent D1 records.
- Security/cache headers.
- Health endpoint capability reporting.
- Research workspace controls and document visibility.

### Boundary
Authentication, tenant-aware authorization, managed vector search, and enterprise audit controls remain intentionally outside this single-user portfolio architecture.

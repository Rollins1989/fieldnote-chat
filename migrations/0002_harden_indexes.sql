-- Conversation-scoped retrieval and faster document lookups.
CREATE INDEX IF NOT EXISTS idx_documents_conversation ON documents(conversation_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_document_chunks_unique ON document_chunks(document_id, chunk_index);

-- Metadata supports duplicate detection and document management.
ALTER TABLE documents ADD COLUMN content_hash TEXT;
ALTER TABLE documents ADD COLUMN char_count INTEGER NOT NULL DEFAULT 0;
CREATE UNIQUE INDEX IF NOT EXISTS idx_documents_conversation_hash ON documents(conversation_id, content_hash);

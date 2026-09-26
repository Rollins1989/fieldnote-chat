-- Conversation-scoped retrieval and faster document lookups.
CREATE INDEX IF NOT EXISTS idx_documents_conversation ON documents(conversation_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_document_chunks_unique ON document_chunks(document_id, chunk_index);

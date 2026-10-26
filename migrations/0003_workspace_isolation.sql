-- Every conversation belongs to a browser workspace. Existing rows remain unassigned
-- and are intentionally not exposed to newly initialized public workspaces.
ALTER TABLE conversations ADD COLUMN workspace_id TEXT;
CREATE INDEX IF NOT EXISTS idx_conversations_workspace_updated ON conversations(workspace_id, updated_at DESC);

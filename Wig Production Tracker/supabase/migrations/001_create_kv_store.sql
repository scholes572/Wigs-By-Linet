-- Create the KV Store table for persisting data
-- Run this SQL in your Supabase dashboard at:
-- https://supabase.com/dashboard/project/jdrcupieskahkmpcziwu/database/tables

CREATE TABLE IF NOT EXISTS kv_store_c1f79e64 (
  key TEXT NOT NULL PRIMARY KEY,
  value JSONB NOT NULL
);

-- Enable Row Level Security (optional - for additional security)
ALTER TABLE kv_store_c1f79e64 ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations (service role bypasses RLS)
-- This is needed because the edge function uses the service role key
DROP POLICY IF EXISTS "Allow all operations on kv_store" ON kv_store_c1f79e64;
CREATE POLICY "Allow all operations on kv_store" ON kv_store_c1f79e64
  FOR ALL
  USING (true)
  WITH CHECK (true);

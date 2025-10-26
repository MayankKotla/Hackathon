-- SIMPLE MEDIA ATTACHMENTS TABLE FIX
-- Run this in Supabase SQL Editor

-- Drop and recreate the table
DROP TABLE IF EXISTS media_attachments CASCADE;

CREATE TABLE media_attachments (
  id SERIAL PRIMARY KEY,
  recipe_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  media_type VARCHAR(10) CHECK (media_type IN ('image', 'video')) NOT NULL,
  supabase_path VARCHAR(500) NOT NULL,
  supabase_url VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500),
  file_name VARCHAR(255) NOT NULL,
  file_size INTEGER NOT NULL,
  duration INTEGER,
  width INTEGER,
  height INTEGER,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT fk_media_recipe FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
  CONSTRAINT fk_media_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_media_attachments_recipe_id ON media_attachments(recipe_id);
CREATE INDEX idx_media_attachments_user_id ON media_attachments(user_id);

-- Add trigger
CREATE TRIGGER update_media_attachments_updated_at BEFORE UPDATE ON media_attachments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE media_attachments ENABLE ROW LEVEL SECURITY;

-- Create simple policies
CREATE POLICY "media_attachments_select" ON media_attachments FOR SELECT USING (true);
CREATE POLICY "media_attachments_insert" ON media_attachments FOR INSERT WITH CHECK (true);
CREATE POLICY "media_attachments_update" ON media_attachments FOR UPDATE USING (true);
CREATE POLICY "media_attachments_delete" ON media_attachments FOR DELETE USING (true);

-- Verify table
SELECT * FROM media_attachments LIMIT 1;

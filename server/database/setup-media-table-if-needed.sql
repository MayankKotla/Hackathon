-- SIMPLE MEDIA ATTACHMENTS TABLE (if needed)
-- Run this in your Supabase SQL Editor

-- Check if table exists
SELECT * FROM information_schema.tables WHERE table_name = 'media_attachments';

-- If table doesn't exist, create it
CREATE TABLE IF NOT EXISTS media_attachments (
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
  
  -- Foreign key constraints
  CONSTRAINT fk_media_recipe FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
  CONSTRAINT fk_media_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_media_attachments_recipe_id ON media_attachments(recipe_id);
CREATE INDEX IF NOT EXISTS idx_media_attachments_user_id ON media_attachments(user_id);

-- Add updated_at trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_media_attachments_updated_at') THEN
        CREATE TRIGGER update_media_attachments_updated_at BEFORE UPDATE ON media_attachments
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Enable RLS
ALTER TABLE media_attachments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Media attachments are viewable by everyone" ON media_attachments;
DROP POLICY IF EXISTS "Users can create media attachments" ON media_attachments;
DROP POLICY IF EXISTS "Users can update own media attachments" ON media_attachments;
DROP POLICY IF EXISTS "Users can delete own media attachments" ON media_attachments;

-- Create simple RLS policies
CREATE POLICY "Media attachments are viewable by everyone" ON media_attachments
    FOR SELECT USING (true);

CREATE POLICY "Users can create media attachments" ON media_attachments
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own media attachments" ON media_attachments
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete own media attachments" ON media_attachments
    FOR DELETE USING (true);

-- Verify table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'media_attachments' 
ORDER BY ordinal_position;

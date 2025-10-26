-- Comprehensive Database Schema Fix
-- Run this in your Supabase SQL Editor to fix ALL schema issues

-- 1. Fix Pantries Table - Add missing category column
ALTER TABLE pantries 
ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'produce';

-- Update existing records to have a default category
UPDATE pantries 
SET category = 'produce' 
WHERE category IS NULL;

-- 2. Fix Users Table - Add avatar column (alias for avatar_url)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS avatar VARCHAR(500);

-- Copy avatar_url to avatar for existing records
UPDATE users 
SET avatar = avatar_url 
WHERE avatar IS NULL AND avatar_url IS NOT NULL;

-- 3. Fix Recipes Table - Add missing columns for social features
ALTER TABLE recipes 
ADD COLUMN IF NOT EXISTS author_id INTEGER REFERENCES users(id) ON DELETE CASCADE;

-- Copy user_id to author_id for existing records
UPDATE recipes 
SET author_id = user_id 
WHERE author_id IS NULL AND user_id IS NOT NULL;

-- Add social features columns
ALTER TABLE recipes 
ADD COLUMN IF NOT EXISTS likes INTEGER[] DEFAULT '{}';

ALTER TABLE recipes 
ADD COLUMN IF NOT EXISTS bookmarks INTEGER[] DEFAULT '{}';

ALTER TABLE recipes 
ADD COLUMN IF NOT EXISTS comments JSONB DEFAULT '[]';

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_recipes_author_id ON recipes(author_id);
CREATE INDEX IF NOT EXISTS idx_recipes_likes ON recipes USING GIN(likes);
CREATE INDEX IF NOT EXISTS idx_recipes_bookmarks ON recipes USING GIN(bookmarks);
CREATE INDEX IF NOT EXISTS idx_pantries_category ON pantries(category);

-- 5. Update existing data to have proper defaults
UPDATE recipes 
SET likes = '{}' 
WHERE likes IS NULL;

UPDATE recipes 
SET bookmarks = '{}' 
WHERE bookmarks IS NULL;

UPDATE recipes 
SET comments = '[]' 
WHERE comments IS NULL;

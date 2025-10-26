-- Add category column to existing pantries table
-- Run this in your Supabase SQL editor

ALTER TABLE pantries 
ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'produce';

-- Update existing records to have a default category
UPDATE pantries 
SET category = 'produce' 
WHERE category IS NULL;

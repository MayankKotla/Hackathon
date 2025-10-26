-- Final schema fix for FlavorCraft
-- This will fix all the column name mismatches

-- First, let's check what columns exist
-- Add missing columns to recipes table
ALTER TABLE recipes 
ADD COLUMN IF NOT EXISTS cook_time INTEGER,
ADD COLUMN IF NOT EXISTS prep_time INTEGER;

-- Update existing data if needed
UPDATE recipes 
SET cook_time = cookTime 
WHERE cook_time IS NULL AND cookTime IS NOT NULL;

UPDATE recipes 
SET prep_time = prepTime 
WHERE prep_time IS NULL AND prepTime IS NOT NULL;

-- Drop old columns if they exist
ALTER TABLE recipes DROP COLUMN IF EXISTS cookTime;
ALTER TABLE recipes DROP COLUMN IF EXISTS prepTime;

-- Add other missing columns
ALTER TABLE recipes 
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS cuisine VARCHAR(100),
ADD COLUMN IF NOT EXISTS image VARCHAR(500);

-- Update the difficulty constraint to be more flexible
ALTER TABLE recipes DROP CONSTRAINT IF EXISTS recipes_difficulty_check;
ALTER TABLE recipes ADD CONSTRAINT recipes_difficulty_check 
CHECK (difficulty IN ('easy', 'medium', 'hard', 'Easy', 'Medium', 'Hard'));

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_recipes_cook_time ON recipes(cook_time);
CREATE INDEX IF NOT EXISTS idx_recipes_prep_time ON recipes(prep_time);
CREATE INDEX IF NOT EXISTS idx_recipes_cuisine ON recipes(cuisine);

-- Fix AI-related database schema issues
-- Run this in your Supabase SQL Editor

-- 1. Add missing AI-related columns to recipes table
ALTER TABLE recipes 
ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT FALSE;

ALTER TABLE recipes 
ADD COLUMN IF NOT EXISTS nutrition_info JSONB DEFAULT '{}';

ALTER TABLE recipes 
ADD COLUMN IF NOT EXISTS cooking_tips TEXT[] DEFAULT '{}';

-- 2. Fix column name inconsistencies (cookTime vs cook_time, prepTime vs prep_time)
DO $$
BEGIN
    -- Check if cookTime exists and rename to cook_time
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='recipes' AND column_name='cookTime') THEN
        ALTER TABLE recipes RENAME COLUMN "cookTime" TO cook_time;
    END IF;
    
    -- Check if prepTime exists and rename to prep_time  
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='recipes' AND column_name='prepTime') THEN
        ALTER TABLE recipes RENAME COLUMN "prepTime" TO prep_time;
    END IF;
END $$;

-- 3. Ensure all required columns exist with proper defaults
ALTER TABLE recipes 
ADD COLUMN IF NOT EXISTS prep_time INTEGER DEFAULT 0;

ALTER TABLE recipes 
ADD COLUMN IF NOT EXISTS cook_time INTEGER DEFAULT 0;

ALTER TABLE recipes 
ADD COLUMN IF NOT EXISTS servings INTEGER DEFAULT 1;

ALTER TABLE recipes 
ADD COLUMN IF NOT EXISTS difficulty VARCHAR(20) DEFAULT 'easy';

ALTER TABLE recipes 
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

ALTER TABLE recipes 
ADD COLUMN IF NOT EXISTS cuisine VARCHAR(100);

ALTER TABLE recipes 
ADD COLUMN IF NOT EXISTS image VARCHAR(500);

ALTER TABLE recipes 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE;

-- 4. Update existing records to have proper values
UPDATE recipes 
SET ai_generated = FALSE 
WHERE ai_generated IS NULL;

UPDATE recipes 
SET nutrition_info = '{}' 
WHERE nutrition_info IS NULL;

UPDATE recipes 
SET cooking_tips = '{}' 
WHERE cooking_tips IS NULL;

UPDATE recipes 
SET prep_time = COALESCE(prep_time, 0) 
WHERE prep_time IS NULL;

UPDATE recipes 
SET cook_time = COALESCE(cook_time, 0) 
WHERE cook_time IS NULL;

UPDATE recipes 
SET servings = COALESCE(servings, 1) 
WHERE servings IS NULL;

UPDATE recipes 
SET difficulty = COALESCE(difficulty, 'easy') 
WHERE difficulty IS NULL;

UPDATE recipes 
SET tags = COALESCE(tags, '{}') 
WHERE tags IS NULL;

UPDATE recipes 
SET is_public = COALESCE(is_public, TRUE) 
WHERE is_public IS NULL;

-- 5. Add constraints
ALTER TABLE recipes 
ADD CONSTRAINT recipes_difficulty_check 
CHECK (difficulty IN ('easy', 'medium', 'hard'));

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_recipes_ai_generated ON recipes(ai_generated);
CREATE INDEX IF NOT EXISTS idx_recipes_difficulty ON recipes(difficulty);
CREATE INDEX IF NOT EXISTS idx_recipes_cuisine ON recipes(cuisine);
CREATE INDEX IF NOT EXISTS idx_recipes_cooking_tips ON recipes USING GIN(cooking_tips);

-- 7. Refresh the schema cache
NOTIFY pgrst, 'reload schema';

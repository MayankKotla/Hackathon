-- Create saved_recipes table
CREATE TABLE IF NOT EXISTS saved_recipes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
    saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    source VARCHAR(50) DEFAULT 'recipe_generator',
    UNIQUE(user_id, recipe_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_saved_recipes_user_id ON saved_recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_recipes_recipe_id ON saved_recipes(recipe_id);
CREATE INDEX IF NOT EXISTS idx_saved_recipes_saved_at ON saved_recipes(saved_at);

-- Add comments
COMMENT ON TABLE saved_recipes IS 'Stores user saved recipes from Recipe Generator and Social Feed';
COMMENT ON COLUMN saved_recipes.source IS 'Indicates where the recipe was saved from: recipe_generator or social_feed';

-- Verify the table was created
SELECT 'saved_recipes table created successfully!' as status;
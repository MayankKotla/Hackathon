// Load environment variables first
require('dotenv').config();
const supabase = require('./config/supabase');

async function createSavedRecipesTable() {
  try {
    console.log('Creating saved_recipes table...');
    
    // Create the table using raw SQL
    const { data, error } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS saved_recipes (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          recipe_id INTEGER REFERENCES recipes(id) ON DELETE CASCADE,
          saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          source VARCHAR(50) DEFAULT 'recipe_generator',
          UNIQUE(user_id, recipe_id)
        );
        
        CREATE INDEX IF NOT EXISTS idx_saved_recipes_user_id ON saved_recipes(user_id);
        CREATE INDEX IF NOT EXISTS idx_saved_recipes_recipe_id ON saved_recipes(recipe_id);
        CREATE INDEX IF NOT EXISTS idx_saved_recipes_saved_at ON saved_recipes(saved_at);
      `
    });
    
    if (error) {
      console.error('Error creating table:', error);
      return;
    }
    
    console.log('✅ saved_recipes table created successfully!');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

createSavedRecipesTable();

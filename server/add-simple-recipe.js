// Simple script to add one recipe
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const simpleRecipe = {
  title: "Simple Pasta",
  description: "A basic pasta recipe",
  ingredients: [
    { name: "pasta", quantity: "1", unit: "box", category: "grains" },
    { name: "tomato sauce", quantity: "1", unit: "jar", category: "condiments" }
  ],
  instructions: [
    { step: 1, description: "Boil pasta", duration: 10 },
    { step: 2, description: "Heat sauce", duration: 5 },
    { step: 3, description: "Mix and serve", duration: 2 }
  ],
  prep_time: 5,
  cook_time: 15,
  servings: 4,
  difficulty: "easy",
  user_id: 1,
  is_public: true
};

async function addRecipe() {
  console.log('Adding simple recipe...');
  
  try {
    const { data, error } = await supabase
      .from('recipes')
      .insert([simpleRecipe]);
    
    if (error) {
      console.error('Error adding recipe:', error);
    } else {
      console.log('✅ Recipe added successfully!');
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

addRecipe();

// Script to add sample recipes to the database
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const sampleRecipes = [
  {
    title: "Classic Spaghetti Carbonara",
    description: "A creamy Italian pasta dish with eggs, cheese, and pancetta",
    ingredients: [
      { name: "spaghetti", quantity: "400", unit: "g", category: "grains" },
      { name: "eggs", quantity: "4", unit: "large", category: "dairy" },
      { name: "pancetta", quantity: "200", unit: "g", category: "protein" },
      { name: "parmesan cheese", quantity: "100", unit: "g", category: "dairy" },
      { name: "black pepper", quantity: "1", unit: "tsp", category: "spices" }
    ],
    instructions: [
      { step: 1, description: "Cook spaghetti according to package directions", duration: 10 },
      { step: 2, description: "Fry pancetta until crispy", duration: 5 },
      { step: 3, description: "Beat eggs with parmesan and pepper", duration: 2 },
      { step: 4, description: "Mix hot pasta with pancetta, then with egg mixture", duration: 2 }
    ],
    prep_time: 10,
    cook_time: 15,
    servings: 4,
    difficulty: "medium",
    user_id: 1,
    is_public: true
  },
  {
    title: "Simple Chicken Stir-Fry",
    description: "Quick and healthy chicken stir-fry with vegetables",
    ingredients: [
      { name: "chicken breast", quantity: "2", unit: "pieces", category: "protein" },
      { name: "bell peppers", quantity: "2", unit: "medium", category: "produce" },
      { name: "broccoli", quantity: "1", unit: "head", category: "produce" },
      { name: "soy sauce", quantity: "3", unit: "tbsp", category: "condiments" },
      { name: "garlic", quantity: "3", unit: "cloves", category: "produce" }
    ],
    instructions: [
      { step: 1, description: "Cut chicken into bite-sized pieces", duration: 5 },
      { step: 2, description: "Heat oil in a large pan", duration: 2 },
      { step: 3, description: "Cook chicken until golden", duration: 8 },
      { step: 4, description: "Add vegetables and stir-fry for 5 minutes", duration: 5 },
      { step: 5, description: "Add soy sauce and serve", duration: 2 }
    ],
    prep_time: 10,
    cook_time: 15,
    servings: 4,
    difficulty: "easy",
    user_id: 1,
    is_public: true
  }
];

async function addSampleRecipes() {
  console.log('Adding sample recipes...');
  
  try {
    const { data, error } = await supabase
      .from('recipes')
      .insert(sampleRecipes);
    
    if (error) {
      console.error('Error adding recipes:', error);
    } else {
      console.log('✅ Sample recipes added successfully!');
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

addSampleRecipes();

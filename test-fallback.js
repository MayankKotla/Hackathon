// Simple test for fallback recipe generation
const AIService = require('./server/services/aiService');

async function testFallback() {
  console.log('🧪 Testing Fallback Recipe Generation...');
  
  const pantryItems = [
    { name: 'chicken breast', quantity: '2', unit: 'pieces', category: 'protein' },
    { name: 'rice', quantity: '1', unit: 'cup', category: 'grains' },
    { name: 'onions', quantity: '1', unit: 'medium', category: 'produce' }
  ];
  
  try {
    const recipe = await AIService.generateRecipe(pantryItems);
    console.log('✅ Fallback recipe generated successfully!');
    console.log('Title:', recipe.title);
    console.log('Description:', recipe.description);
    console.log('Ingredients:', recipe.ingredients.length);
    console.log('Instructions:', recipe.instructions.length);
    console.log('Nutrition:', recipe.nutrition);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testFallback();

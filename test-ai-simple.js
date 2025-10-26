// Simple test for AI functionality
const AIService = require('./server/services/aiService');

async function testAI() {
  console.log('🤖 Testing AI Recipe Generation...');
  
  const pantryItems = [
    { name: 'chicken breast', quantity: '2', unit: 'pieces', category: 'protein' },
    { name: 'rice', quantity: '1', unit: 'cup', category: 'grains' },
    { name: 'onions', quantity: '1', unit: 'medium', category: 'produce' }
  ];
  
  try {
    console.log('Generating recipe with pantry items:', pantryItems.map(item => item.name).join(', '));
    const recipe = await AIService.generateRecipe(pantryItems);
    console.log('✅ AI recipe generated successfully!');
    console.log('Title:', recipe.title);
    console.log('Description:', recipe.description);
    console.log('Ingredients count:', recipe.ingredients.length);
    console.log('Instructions count:', recipe.instructions.length);
    console.log('Nutrition info:', recipe.nutrition);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAI();

const OpenAI = require('openai');

class EnhancedAIService {
  constructor() {
    this.openai = null;
    this.spoonacularApiKey = process.env.SPOONACULAR_API_KEY;
    
    // Initialize OpenAI if API key is available
    if (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes('your-openai-api-key')) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      });
    }

    // Spoonacular API base URL
    this.spoonacularBaseUrl = 'https://api.spoonacular.com/recipes';
  }

  async generateRecipe(pantryItems, preferences = {}) {
    try {
      // Check if OpenAI is available
      if (!this.openai) {
        console.log('OpenAI API key not configured, using fallback recipe generation');
        return this.createFallbackRecipe(pantryItems);
      }

      const ingredients = pantryItems.map(item => 
        `${item.name} (${item.quantity} ${item.unit || 'units'})`
      ).join(', ');

      const prompt = `You are a world-class professional chef and culinary expert specializing in creating detailed, restaurant-quality recipes. Create an exceptional, practical recipe using the following ingredients:

Available ingredients: ${ingredients}

User preferences: ${JSON.stringify(preferences)}

IMPORTANT REQUIREMENTS:
- Use SPECIFIC, REAL ingredient names (e.g., "Chicken Breast", "Roma Tomatoes", "Fresh Basil", "Extra Virgin Olive Oil")
- NEVER use generic terms like "Main Ingredient", "Seasoning", or "Oil" - always specify the exact ingredient
- Include precise measurements and cooking techniques
- Create a complete, professional recipe with detailed instructions
- Focus on food quality, flavor profiles, and culinary techniques

Please generate a complete recipe in the following JSON format:
{
  "title": "Specific Recipe Name",
  "description": "Detailed description highlighting key flavors and cooking method",
  "ingredients": [
    {
      "name": "Specific Ingredient Name (e.g., Chicken Breast, Roma Tomatoes)",
      "quantity": "exact amount",
      "unit": "precise unit (cups, oz, lbs, pieces, etc.)",
      "category": "protein|produce|grains|condiments|dairy|spices"
    }
  ],
  "instructions": [
    {
      "step": 1,
      "description": "Detailed, professional cooking instruction with specific techniques",
      "duration": "exact time in minutes"
    }
  ],
  "prep_time": 15,
  "cook_time": 30,
  "servings": 4,
  "difficulty": "easy|medium|hard",
  "tags": ["specific", "culinary", "tags"],
  "cuisine": "specific cuisine type",
  "nutrition_info": {
    "calories": "350kcal",
    "protein": "25g",
    "carbs": "30g",
    "fat": "15g"
  },
  "cooking_tips": ["Professional cooking tip 1", "Culinary technique tip 2"]
}

CRITICAL: Every ingredient must have a SPECIFIC name - no generic terms allowed. Use real food names like "Chicken Breast", "Roma Tomatoes", "Fresh Garlic", "Extra Virgin Olive Oil", "Kosher Salt", etc.

Return only the JSON object, no additional text.`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a professional chef and recipe developer. Always respond with valid JSON format."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });

      const recipeText = response.choices[0].message.content;
      
      // Try to parse the JSON response
      try {
        const recipe = JSON.parse(recipeText);
        return recipe;
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
        // Fallback to a simple recipe if parsing fails
        return this.createFallbackRecipe(pantryItems);
      }

    } catch (error) {
      console.error('AI recipe generation error:', error);
      // Check if it's a quota error and use fallback
      if (error.code === 'insufficient_quota' || error.status === 429) {
        console.log('OpenAI quota exceeded, using fallback recipe generation');
        return this.createFallbackRecipe(pantryItems);
      }
      return this.createFallbackRecipe(pantryItems);
    }
  }

  async searchRecipes(query, pantryItems = []) {
    try {
      // Try Spoonacular API first for global cuisine
      if (this.spoonacularApiKey) {
        console.log('Using Spoonacular API for global cuisine search');
        const spoonacularResults = await this.searchSpoonacular(query);
        if (spoonacularResults.length > 0) {
          return spoonacularResults;
        }
      }

      // Try TheMealDB API (free, no API key needed)
      console.log('Using TheMealDB API for recipe search');
      const mealDBResults = await this.searchMealDB(query);
      if (mealDBResults.length > 0) {
        return mealDBResults;
      }

      // Fallback to OpenAI if available
      if (this.openai) {
        console.log('Using OpenAI for recipe search');
        try {
          const openAIResults = await this.searchWithOpenAI(query, pantryItems);
          if (openAIResults.length > 0) return openAIResults;
        } catch (error) {
          console.log('OpenAI failed, using TheMealDB fallback');
        }
      }

      // Try TheMealDB with pantry-matched recipes before local fallback
      console.log('Using TheMealDB for pantry-matched recipes');
      try {
        const mealDBFallback = await this.searchMealDBWithPantry(query, pantryItems);
        if (mealDBFallback.length > 0) return mealDBFallback;
      } catch (error) {
        console.log('TheMealDB fallback failed, using local fallback');
      }

      // Final fallback to enhanced local search
      console.log('Using enhanced fallback search');
      return this.createEnhancedFallbackSearchResults(query, pantryItems);

    } catch (error) {
      console.error('Recipe search error:', error);
      return this.createEnhancedFallbackSearchResults(query, pantryItems);
    }
  }

  async searchSpoonacular(query) {
    try {
      const params = new URLSearchParams({
        query: query,
        number: 5,
        addRecipeInformation: true,
        fillIngredients: true,
        instructionsRequired: true
      });

      const response = await fetch(`${this.spoonacularBaseUrl}/complexSearch?${params}`, {
        headers: {
          'X-API-Key': this.spoonacularApiKey
        }
      });

      if (!response.ok) {
        throw new Error(`Spoonacular API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.results || data.results.length === 0) {
        return [];
      }

      // Transform Spoonacular results to our format
      return data.results.map(recipe => this.transformSpoonacularRecipe(recipe));

    } catch (error) {
      console.error('Spoonacular API error:', error);
      return [];
    }
  }

  transformSpoonacularRecipe(recipe) {
    // Extract ingredients from extendedIngredients
    const ingredients = recipe.extendedIngredients ? recipe.extendedIngredients.map(ing => ({
      name: ing.name,
      quantity: ing.amount,
      unit: ing.unit,
      category: this.categorizeIngredient(ing.name)
    })) : [];

    // Extract instructions
    const instructions = recipe.analyzedInstructions && recipe.analyzedInstructions[0] 
      ? recipe.analyzedInstructions[0].steps.map(step => ({
          step: step.number,
          description: step.step,
          duration: step.length ? step.length.number : 5
        }))
      : [];

    return {
      id: `spoonacular-${recipe.id}`,
      title: recipe.title,
      description: recipe.summary ? recipe.summary.replace(/<[^>]*>/g, '') : 'A delicious recipe from Spoonacular',
      ingredients: ingredients,
      instructions: instructions,
      prep_time: recipe.preparationMinutes || 15,
      cook_time: recipe.cookingMinutes || 30,
      servings: recipe.servings || 4,
      difficulty: this.mapDifficulty(recipe.readyInMinutes),
      tags: recipe.dishTypes || [],
      cuisine: recipe.cuisines && recipe.cuisines[0] || 'International',
      image: recipe.image,
      nutrition_info: recipe.nutrition ? {
        calories: `${Math.round(recipe.nutrition.nutrients.find(n => n.name === 'Calories')?.amount || 0)}kcal`,
        protein: `${Math.round(recipe.nutrition.nutrients.find(n => n.name === 'Protein')?.amount || 0)}g`,
        carbs: `${Math.round(recipe.nutrition.nutrients.find(n => n.name === 'Carbohydrates')?.amount || 0)}g`,
        fat: `${Math.round(recipe.nutrition.nutrients.find(n => n.name === 'Fat')?.amount || 0)}g`
      } : null,
      cooking_tips: [
        "Follow the instructions carefully for best results",
        "Taste and adjust seasonings as needed",
        "Use fresh ingredients when possible"
      ],
      ai_generated: false,
      source: 'Spoonacular'
    };
  }

  async searchMealDB(query) {
    try {
      const searchUrl = `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`;
      const response = await fetch(searchUrl);
      
      if (!response.ok) {
        throw new Error(`TheMealDB API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.meals || data.meals.length === 0) {
        return [];
      }

      // Transform TheMealDB format to our format
      const recipes = data.meals.slice(0, 5).map(meal => this.transformMealDBRecipe(meal));
      return recipes;

    } catch (error) {
      console.error('TheMealDB API error:', error);
      return [];
    }
  }

  // New method: Search TheMealDB with pantry ingredient matching
  async searchMealDBWithPantry(query, pantryItems = []) {
    try {
      // First, try to search by random cuisine categories
      const popularCuisines = ['British', 'Italian', 'Indian', 'Thai', 'Chinese', 'Japanese', 'Mexican', 'Spanish', 'French', 'Greek'];
      const randomCuisine = popularCuisines[Math.floor(Math.random() * popularCuisines.length)];
      
      // Fetch recipes by cuisine
      const cuisineUrl = `https://www.themealdb.com/api/json/v1/1/filter.php?a=${randomCuisine}`;
      const cuisineResponse = await fetch(cuisineUrl);
      
      if (!cuisineResponse.ok) {
        throw new Error(`TheMealDB cuisine API error: ${cuisineResponse.status}`);
      }

      const cuisineData = await cuisineResponse.json();
      
      if (!cuisineData.meals || cuisineData.meals.length === 0) {
        return [];
      }

      // Get random recipes from this cuisine (5-10 recipes)
      const randomRecipes = cuisineData.meals.sort(() => 0.5 - Math.random()).slice(0, 5);
      
      // Fetch detailed information for each recipe
      const detailedRecipes = await Promise.all(
        randomRecipes.map(async (meal) => {
          const detailUrl = `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${meal.idMeal}`;
          const detailResponse = await fetch(detailUrl);
          const detailData = await detailResponse.json();
          
          if (detailData.meals && detailData.meals[0]) {
            return this.transformMealDBRecipe(detailData.meals[0]);
          }
          return null;
        })
      );

      // Filter out nulls and return recipes that match pantry ingredients
      const validRecipes = detailedRecipes.filter(r => r !== null);
      
      // If we have pantry items, prioritize recipes with matching ingredients
      if (pantryItems.length > 0) {
        return this.prioritizeByPantry(validRecipes, pantryItems);
      }
      
      return validRecipes;

    } catch (error) {
      console.error('TheMealDB pantry search error:', error);
      return [];
    }
  }

  prioritizeByPantry(recipes, pantryItems) {
    const pantryNames = pantryItems.map(item => item.name.toLowerCase());
    
    // Score each recipe based on pantry ingredient matches
    const scoredRecipes = recipes.map(recipe => {
      const ingredients = recipe.ingredients.map(ing => ing.name.toLowerCase());
      const matches = ingredients.filter(ing => 
        pantryNames.some(pantry => pantry.includes(ing) || ing.includes(pantry))
      );
      
      return {
        ...recipe,
        matchScore: matches.length / ingredients.length // Percentage of ingredients in pantry
      };
    });

    // Sort by match score (highest first)
    return scoredRecipes
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 3); // Return top 3 matches
  }

  transformMealDBRecipe(meal) {
    // Extract ingredients (TheMealDB uses strIngredient1, strIngredient2, etc.)
    const ingredients = this.extractMealDBIngredients(meal);
    
    // Extract instructions (split by newlines)
    const instructions = meal.strInstructions 
      ? meal.strInstructions.split(/\r\n|\n/).filter(i => i.trim()).map((instruction, idx) => ({
          step: idx + 1,
          description: instruction.trim(),
          duration: 5
        }))
      : [];

    return {
      id: `mealdb-${meal.idMeal}`,
      title: meal.strMeal,
      description: meal.strInstructions ? meal.strInstructions.substring(0, 200) + '...' : 'A delicious recipe from TheMealDB',
      ingredients: ingredients,
      instructions: instructions,
      prep_time: 15,
      cook_time: 30,
      servings: 4,
      difficulty: 'medium',
      tags: [meal.strCategory, meal.strArea].filter(Boolean),
      cuisine: meal.strArea || 'International',
      image: meal.strMealThumb,
      cooking_tips: [
        "Follow the instructions carefully for best results",
        "Taste and adjust seasonings as needed",
        "Use fresh ingredients when possible"
      ],
      ai_generated: false,
      source: 'TheMealDB'
    };
  }

  extractMealDBIngredients(meal) {
    const ingredients = [];
    for (let i = 1; i <= 20; i++) {
      const ingredient = meal[`strIngredient${i}`];
      const measure = meal[`strMeasure${i}`];
      if (ingredient && ingredient.trim()) {
        ingredients.push({
          name: ingredient.trim(),
          quantity: measure ? measure.trim() : 'to taste',
          unit: '',
          category: this.categorizeIngredient(ingredient)
        });
      }
    }
    return ingredients;
  }

  categorizeIngredient(ingredientName) {
    const name = ingredientName.toLowerCase();
    if (name.includes('chicken') || name.includes('beef') || name.includes('pork') || name.includes('fish') || name.includes('meat')) {
      return 'protein';
    } else if (name.includes('tomato') || name.includes('onion') || name.includes('garlic') || name.includes('vegetable') || name.includes('herb')) {
      return 'produce';
    } else if (name.includes('milk') || name.includes('cheese') || name.includes('cream') || name.includes('butter')) {
      return 'dairy';
    } else if (name.includes('rice') || name.includes('pasta') || name.includes('bread') || name.includes('flour')) {
      return 'grains';
    } else if (name.includes('oil') || name.includes('vinegar') || name.includes('sauce') || name.includes('condiment')) {
      return 'condiments';
    } else {
      return 'spices';
    }
  }

  mapDifficulty(readyInMinutes) {
    if (readyInMinutes <= 30) return 'easy';
    if (readyInMinutes <= 60) return 'medium';
    return 'hard';
  }

  async searchWithOpenAI(query, pantryItems = []) {
    try {
      const pantryContext = pantryItems.length > 0 
        ? `User has these ingredients available: ${pantryItems.map(item => item.name).join(', ')}. `
        : '';

      const prompt = `You are a professional culinary search assistant specializing in food and cooking. ${pantryContext}Find and suggest specific, detailed recipes based on this search query: "${query}"

IMPORTANT REQUIREMENTS:
- Use SPECIFIC, REAL ingredient names (e.g., "Chicken Breast", "Roma Tomatoes", "Fresh Basil", "Extra Virgin Olive Oil")
- NEVER use generic terms like "Main Ingredient", "Seasoning", or "Oil"
- Focus on food quality, specific ingredients, and culinary techniques
- Provide detailed, professional recipe suggestions

Please return 3 recipe suggestions in this JSON format:
{
  "recipes": [
    {
      "title": "Specific Recipe Name",
      "description": "Detailed description highlighting key flavors and cooking method",
      "ingredients": [
        {
          "name": "Specific Ingredient Name (e.g., Chicken Breast, Roma Tomatoes)",
          "quantity": "exact amount",
          "unit": "precise unit (cups, oz, lbs, pieces, etc.)",
          "category": "protein|produce|grains|condiments|dairy|spices"
        }
      ],
      "instructions": [
        {
          "step": 1,
          "description": "Detailed cooking instruction with specific techniques",
          "duration": "exact time in minutes"
        }
      ],
      "prep_time": 15,
      "cook_time": 30,
      "servings": 4,
      "difficulty": "easy|medium|hard",
      "tags": ["specific", "culinary", "tags"],
      "cuisine": "specific cuisine type",
      "matchScore": 85
    }
  ]
}

Consider:
- How well the recipe matches the search query
- Whether the user has the required ingredients (if pantry items provided)
- Recipe difficulty and cooking time
- Popular and well-rated recipes
- Use SPECIFIC food names and detailed cooking instructions

CRITICAL: Every ingredient must have a SPECIFIC name - no generic terms allowed.

Return only the JSON object.`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a recipe search assistant. Always respond with valid JSON format."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.6,
        max_tokens: 1500
      });

      const searchText = response.choices[0].message.content;
      
      try {
        const searchResults = JSON.parse(searchText);
        return searchResults.recipes || [];
      } catch (parseError) {
        console.error('Error parsing AI search response:', parseError);
        return [];
      }

    } catch (error) {
      console.error('OpenAI search error:', error);
      if (error.code === 'insufficient_quota' || error.status === 429) {
        console.log('OpenAI quota exceeded, using fallback search');
        return this.createEnhancedFallbackSearchResults(query, pantryItems);
      }
      return [];
    }
  }

  createFallbackRecipe(pantryItems) {
    // Analyze pantry items to create a specific recipe
    const proteins = pantryItems.filter(item => item.category === 'protein');
    const vegetables = pantryItems.filter(item => item.category === 'produce');
    const grains = pantryItems.filter(item => item.category === 'grains');
    const condiments = pantryItems.filter(item => item.category === 'condiments');
    const dairy = pantryItems.filter(item => item.category === 'dairy');
    const spices = pantryItems.filter(item => item.category === 'spices');

    // Create specific recipe based on available ingredients
    let recipe = this.generateSpecificRecipe(proteins, vegetables, grains, condiments, dairy, spices);
    
    // If no specific recipe matches, create a general one with actual ingredients
    if (!recipe) {
      recipe = this.createGeneralRecipe(pantryItems);
    }

    return recipe;
  }

  generateSpecificRecipe(proteins, vegetables, grains, condiments, dairy, spices) {
    // Chicken-based recipes
    if (proteins.some(p => p.name.toLowerCase().includes('chicken'))) {
      if (vegetables.some(v => v.name.toLowerCase().includes('tomato'))) {
        return {
          title: "Chicken and Tomato Pasta",
          description: "A hearty Italian-inspired pasta dish with tender chicken and fresh tomatoes.",
          ingredients: [
            { name: "Chicken Breast", quantity: "2", unit: "pieces", category: "protein" },
            { name: "Ripe Tomatoes", quantity: "4", unit: "medium", category: "produce" },
            { name: "Pasta", quantity: "8", unit: "oz", category: "grains" },
            { name: "Garlic", quantity: "3", unit: "cloves", category: "produce" },
            { name: "Olive Oil", quantity: "3", unit: "tbsp", category: "condiments" },
            { name: "Fresh Basil", quantity: "1/4", unit: "cup", category: "produce" },
            { name: "Salt", quantity: "1", unit: "tsp", category: "spices" },
            { name: "Black Pepper", quantity: "1/2", unit: "tsp", category: "spices" }
          ],
          instructions: [
            { step: 1, description: "Cut chicken breast into bite-sized pieces and season with salt and pepper", duration: 5 },
            { step: 2, description: "Dice tomatoes and mince garlic", duration: 8 },
            { step: 3, description: "Heat olive oil in a large pan over medium-high heat", duration: 2 },
            { step: 4, description: "Cook chicken pieces until golden brown and cooked through", duration: 8 },
            { step: 5, description: "Add garlic and cook for 1 minute until fragrant", duration: 1 },
            { step: 6, description: "Add diced tomatoes and cook until they break down into a sauce", duration: 10 },
            { step: 7, description: "Meanwhile, cook pasta according to package directions", duration: 12 },
            { step: 8, description: "Toss cooked pasta with the chicken and tomato sauce", duration: 2 },
            { step: 9, description: "Garnish with fresh basil and serve immediately", duration: 1 }
          ],
          prep_time: 15,
          cook_time: 25,
          servings: 4,
          difficulty: "easy",
          tags: ["pasta", "chicken", "italian", "quick"],
          cuisine: "Italian",
          nutrition_info: {
            calories: "420kcal",
            protein: "32g",
            carbs: "45g",
            fat: "12g"
          },
          cooking_tips: [
            "Don't overcook the chicken - it should be golden on the outside and juicy inside",
            "Use fresh, ripe tomatoes for the best flavor",
            "Reserve some pasta water to help the sauce stick to the noodles"
          ]
        };
      }
    }

    // Beef-based recipes
    if (proteins.some(p => p.name.toLowerCase().includes('beef'))) {
      return {
        title: "Beef Stir-Fry with Vegetables",
        description: "A quick and nutritious stir-fry with tender beef and crisp vegetables.",
        ingredients: [
          { name: "Beef Sirloin", quantity: "1", unit: "lb", category: "protein" },
          { name: "Broccoli", quantity: "2", unit: "cups", category: "produce" },
          { name: "Bell Peppers", quantity: "2", unit: "medium", category: "produce" },
          { name: "Onion", quantity: "1", unit: "medium", category: "produce" },
          { name: "Garlic", quantity: "3", unit: "cloves", category: "produce" },
          { name: "Soy Sauce", quantity: "3", unit: "tbsp", category: "condiments" },
          { name: "Sesame Oil", quantity: "1", unit: "tbsp", category: "condiments" },
          { name: "Ginger", quantity: "1", unit: "tsp", category: "spices" }
        ],
        instructions: [
          { step: 1, description: "Slice beef into thin strips against the grain", duration: 8 },
          { step: 2, description: "Cut broccoli into florets and slice bell peppers and onion", duration: 10 },
          { step: 3, description: "Heat sesame oil in a large wok or pan over high heat", duration: 2 },
          { step: 4, description: "Cook beef strips until browned, about 3-4 minutes", duration: 4 },
          { step: 5, description: "Add vegetables and stir-fry for 4-5 minutes until crisp-tender", duration: 5 },
          { step: 6, description: "Add garlic and ginger, cook for 1 minute", duration: 1 },
          { step: 7, description: "Add soy sauce and toss everything together", duration: 1 },
          { step: 8, description: "Serve immediately over rice if available", duration: 0 }
        ],
        prep_time: 20,
        cook_time: 15,
        servings: 4,
        difficulty: "medium",
        tags: ["beef", "stir-fry", "asian", "healthy"],
        cuisine: "Asian",
        nutrition_info: {
          calories: "280kcal",
          protein: "28g",
          carbs: "12g",
          fat: "14g"
        },
        cooking_tips: [
          "Cut beef against the grain for maximum tenderness",
          "Keep the heat high for a proper stir-fry",
          "Don't overcook the vegetables - they should stay crisp"
        ]
      };
    }

    // Vegetarian options
    if (vegetables.length >= 3 && !proteins.length) {
      return {
        title: "Mediterranean Vegetable Medley",
        description: "A colorful and healthy mix of roasted vegetables with herbs and olive oil.",
        ingredients: [
          { name: "Zucchini", quantity: "2", unit: "medium", category: "produce" },
          { name: "Eggplant", quantity: "1", unit: "medium", category: "produce" },
          { name: "Red Bell Pepper", quantity: "2", unit: "large", category: "produce" },
          { name: "Cherry Tomatoes", quantity: "1", unit: "cup", category: "produce" },
          { name: "Red Onion", quantity: "1", unit: "medium", category: "produce" },
          { name: "Olive Oil", quantity: "4", unit: "tbsp", category: "condiments" },
          { name: "Fresh Oregano", quantity: "2", unit: "tbsp", category: "produce" },
          { name: "Salt", quantity: "1", unit: "tsp", category: "spices" },
          { name: "Black Pepper", quantity: "1/2", unit: "tsp", category: "spices" }
        ],
        instructions: [
          { step: 1, description: "Preheat oven to 425°F (220°C)", duration: 5 },
          { step: 2, description: "Cut all vegetables into 1-inch pieces", duration: 15 },
          { step: 3, description: "Toss vegetables with olive oil, salt, and pepper", duration: 5 },
          { step: 4, description: "Spread vegetables on a large baking sheet in a single layer", duration: 3 },
          { step: 5, description: "Roast for 25-30 minutes until vegetables are tender and caramelized", duration: 30 },
          { step: 6, description: "Remove from oven and sprinkle with fresh oregano", duration: 1 },
          { step: 7, description: "Serve warm as a side dish or over quinoa", duration: 0 }
        ],
        prep_time: 25,
        cook_time: 30,
        servings: 6,
        difficulty: "easy",
        tags: ["vegetarian", "roasted", "mediterranean", "healthy"],
        cuisine: "Mediterranean",
        nutrition_info: {
          calories: "120kcal",
          protein: "3g",
          carbs: "18g",
          fat: "5g"
        },
        cooking_tips: [
          "Cut vegetables into similar sizes for even cooking",
          "Don't overcrowd the baking sheet - use two if needed",
          "The vegetables should be golden and slightly charred for best flavor"
        ]
      };
    }

    return null; // No specific recipe found
  }

  createGeneralRecipe(pantryItems) {
    // Create a recipe using actual pantry items
    const mainProtein = pantryItems.find(item => item.category === 'protein');
    const mainVegetable = pantryItems.find(item => item.category === 'produce');
    const mainGrain = pantryItems.find(item => item.category === 'grains');
    
    const recipeName = mainProtein ? 
      `${mainProtein.name} with ${mainVegetable?.name || 'Vegetables'}` :
      `${mainVegetable?.name || 'Vegetable'} Bowl`;

    return {
      title: recipeName,
      description: `A delicious and nutritious meal using your available pantry ingredients.`,
      ingredients: pantryItems.map(item => ({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit || 'units',
        category: item.category
      })),
      instructions: [
        {
          step: 1,
          description: `Prepare all ingredients: wash and chop vegetables, season proteins`,
          duration: 15
        },
        {
          step: 2,
          description: "Heat oil in a large pan over medium-high heat",
          duration: 2
        },
        {
          step: 3,
          description: mainProtein ? 
            `Cook ${mainProtein.name} first until golden brown and cooked through` :
            "Start with the heartiest vegetables",
          duration: 8
        },
        {
          step: 4,
          description: mainVegetable ? 
            `Add ${mainVegetable.name} and other vegetables, cook until tender` :
            "Add all vegetables and cook until tender",
          duration: 10
        },
        {
          step: 5,
          description: "Season with salt, pepper, and your favorite herbs",
          duration: 2
        },
        {
          step: 6,
          description: mainGrain ? 
            `Serve over ${mainGrain.name} or enjoy as is` :
            "Serve hot and enjoy!",
          duration: 0
        }
      ],
      prep_time: 15,
      cook_time: 20,
      servings: 4,
      difficulty: "easy",
      tags: ["pantry", "quick", "healthy"],
      cuisine: "International",
      nutrition_info: {
        calories: "250kcal",
        protein: "20g",
        carbs: "15g",
        fat: "12g"
      },
      cooking_tips: [
        "Taste and adjust seasonings as you cook",
        "Don't overcook vegetables - they should retain some crunch",
        "Add a splash of acid (lemon juice or vinegar) at the end for brightness"
      ]
    };
  }

  createEnhancedFallbackSearchResults(query, pantryItems = []) {
    // Create specific recipe suggestions based on the search query
    const queryLower = query.toLowerCase();
    const suggestions = [];

    // Curry recipes - HIGH PRIORITY MATCHING
    if (queryLower.includes('curry')) {
      if (queryLower.includes('chicken')) {
        suggestions.push({
          id: 'fallback-chicken-curry-1',
          title: 'Chicken Curry',
          description: 'Aromatic and flavorful chicken curry with traditional Indian spices and creamy coconut milk.',
          ingredients: [
            { name: 'Chicken Thighs', quantity: '2', unit: 'lbs', category: 'protein' },
            { name: 'Coconut Milk', quantity: '1', unit: 'can (14oz)', category: 'dairy' },
            { name: 'Onion', quantity: '1', unit: 'large', category: 'produce' },
            { name: 'Garlic', quantity: '4', unit: 'cloves', category: 'produce' },
            { name: 'Ginger', quantity: '1', unit: 'tbsp', category: 'spices' },
            { name: 'Curry Powder', quantity: '2', unit: 'tbsp', category: 'spices' },
            { name: 'Turmeric', quantity: '1', unit: 'tsp', category: 'spices' },
            { name: 'Cumin', quantity: '1', unit: 'tsp', category: 'spices' },
            { name: 'Coriander', quantity: '1', unit: 'tsp', category: 'spices' },
            { name: 'Tomato Paste', quantity: '2', unit: 'tbsp', category: 'condiments' },
            { name: 'Vegetable Oil', quantity: '2', unit: 'tbsp', category: 'condiments' },
            { name: 'Salt', quantity: '1', unit: 'tsp', category: 'spices' }
          ],
          instructions: [
            { step: 1, description: 'Cut chicken into bite-sized pieces and season with salt', duration: 10 },
            { step: 2, description: 'Dice onion and mince garlic and ginger', duration: 8 },
            { step: 3, description: 'Heat oil in a large pot over medium-high heat', duration: 2 },
            { step: 4, description: 'Add onion and cook until golden brown, about 5 minutes', duration: 5 },
            { step: 5, description: 'Add garlic, ginger, and all spices, cook for 1 minute until fragrant', duration: 1 },
            { step: 6, description: 'Add chicken and cook until browned on all sides', duration: 8 },
            { step: 7, description: 'Add tomato paste and coconut milk, bring to a boil', duration: 3 },
            { step: 8, description: 'Reduce heat and simmer for 25-30 minutes until chicken is tender', duration: 30 },
            { step: 9, description: 'Taste and adjust seasoning, serve over rice', duration: 2 }
          ],
          prep_time: 20,
          cook_time: 45,
          servings: 6,
          difficulty: 'medium',
          tags: ['chicken', 'curry', 'indian', 'spicy'],
          cuisine: 'Indian',
          ai_generated: true
        });
      } else if (queryLower.includes('vegetable') || queryLower.includes('veggie')) {
        suggestions.push({
          id: 'fallback-veggie-curry-1',
          title: 'Vegetable Curry',
          description: 'A hearty and nutritious vegetable curry with a rich, spiced coconut sauce.',
          ingredients: [
            { name: 'Mixed Vegetables', quantity: '4', unit: 'cups', category: 'produce' },
            { name: 'Coconut Milk', quantity: '1', unit: 'can (14oz)', category: 'dairy' },
            { name: 'Onion', quantity: '1', unit: 'medium', category: 'produce' },
            { name: 'Garlic', quantity: '3', unit: 'cloves', category: 'produce' },
            { name: 'Ginger', quantity: '1', unit: 'tbsp', category: 'spices' },
            { name: 'Curry Powder', quantity: '2', unit: 'tbsp', category: 'spices' },
            { name: 'Turmeric', quantity: '1', unit: 'tsp', category: 'spices' },
            { name: 'Cumin', quantity: '1', unit: 'tsp', category: 'spices' },
            { name: 'Vegetable Oil', quantity: '2', unit: 'tbsp', category: 'condiments' },
            { name: 'Salt', quantity: '1', unit: 'tsp', category: 'spices' }
          ],
          instructions: [
            { step: 1, description: 'Cut vegetables into bite-sized pieces', duration: 15 },
            { step: 2, description: 'Dice onion and mince garlic and ginger', duration: 8 },
            { step: 3, description: 'Heat oil in a large pot over medium heat', duration: 2 },
            { step: 4, description: 'Add onion and cook until soft, about 5 minutes', duration: 5 },
            { step: 5, description: 'Add garlic, ginger, and spices, cook for 1 minute', duration: 1 },
            { step: 6, description: 'Add vegetables and cook for 5 minutes', duration: 5 },
            { step: 7, description: 'Add coconut milk and bring to a simmer', duration: 3 },
            { step: 8, description: 'Simmer for 20-25 minutes until vegetables are tender', duration: 25 },
            { step: 9, description: 'Season with salt and serve over rice', duration: 2 }
          ],
          prep_time: 25,
          cook_time: 35,
          servings: 4,
          difficulty: 'easy',
          tags: ['vegetable', 'curry', 'vegetarian', 'healthy'],
          cuisine: 'Indian',
          ai_generated: true
        });
      }
    }

    // Pasta recipes - SPECIFIC MATCHING
    if (queryLower.includes('pasta') || queryLower.includes('spaghetti')) {
      if (queryLower.includes('carbonara')) {
        suggestions.push({
          id: 'fallback-carbonara-1',
          title: 'Spaghetti Carbonara',
          description: 'Classic Italian pasta with eggs, cheese, and pancetta in a creamy sauce.',
          ingredients: [
            { name: 'Spaghetti', quantity: '1', unit: 'lb', category: 'grains' },
            { name: 'Pancetta', quantity: '8', unit: 'oz', category: 'protein' },
            { name: 'Eggs', quantity: '4', unit: 'large', category: 'dairy' },
            { name: 'Parmesan Cheese', quantity: '1', unit: 'cup', category: 'dairy' },
            { name: 'Black Pepper', quantity: '1', unit: 'tsp', category: 'spices' },
            { name: 'Salt', quantity: '1', unit: 'tsp', category: 'spices' }
          ],
          instructions: [
            { step: 1, description: 'Cook spaghetti according to package directions', duration: 12 },
            { step: 2, description: 'Dice pancetta and cook until crispy', duration: 8 },
            { step: 3, description: 'Beat eggs with parmesan and black pepper', duration: 3 },
            { step: 4, description: 'Drain pasta and immediately toss with pancetta', duration: 2 },
            { step: 5, description: 'Remove from heat and quickly stir in egg mixture', duration: 1 },
            { step: 6, description: 'Serve immediately with extra parmesan', duration: 1 }
          ],
          prep_time: 10,
          cook_time: 20,
          servings: 4,
          difficulty: 'medium',
          tags: ['pasta', 'carbonara', 'italian', 'creamy'],
          cuisine: 'Italian',
          ai_generated: true
        });
      } else {
        suggestions.push({
          id: 'fallback-pasta-1',
          title: 'Creamy Garlic Pasta',
          description: 'A rich and satisfying pasta dish with garlic, cream, and parmesan cheese.',
          ingredients: [
            { name: 'Spaghetti', quantity: '12', unit: 'oz', category: 'grains' },
            { name: 'Heavy Cream', quantity: '1', unit: 'cup', category: 'dairy' },
            { name: 'Garlic', quantity: '6', unit: 'cloves', category: 'produce' },
            { name: 'Parmesan Cheese', quantity: '1', unit: 'cup', category: 'dairy' },
            { name: 'Butter', quantity: '4', unit: 'tbsp', category: 'dairy' },
            { name: 'Fresh Parsley', quantity: '1/4', unit: 'cup', category: 'produce' },
            { name: 'Salt', quantity: '1', unit: 'tsp', category: 'spices' },
            { name: 'Black Pepper', quantity: '1/2', unit: 'tsp', category: 'spices' }
          ],
          instructions: [
            { step: 1, description: 'Cook spaghetti according to package directions until al dente', duration: 12 },
            { step: 2, description: 'Mince garlic and chop fresh parsley', duration: 5 },
            { step: 3, description: 'Melt butter in a large pan over medium heat', duration: 2 },
            { step: 4, description: 'Add garlic and cook until fragrant, about 1 minute', duration: 1 },
            { step: 5, description: 'Add heavy cream and bring to a gentle simmer', duration: 3 },
            { step: 6, description: 'Stir in parmesan cheese until melted and smooth', duration: 2 },
            { step: 7, description: 'Toss cooked pasta with the cream sauce', duration: 2 },
            { step: 8, description: 'Garnish with fresh parsley and serve immediately', duration: 1 }
          ],
          prep_time: 10,
          cook_time: 20,
          servings: 4,
          difficulty: 'easy',
          tags: ['pasta', 'creamy', 'italian', 'comfort'],
          cuisine: 'Italian',
          ai_generated: true
        });
      }
    }

    // Chicken recipes - SPECIFIC MATCHING
    if (queryLower.includes('chicken')) {
      if (queryLower.includes('fried') || queryLower.includes('crispy')) {
        suggestions.push({
          id: 'fallback-fried-chicken-1',
          title: 'Crispy Fried Chicken',
          description: 'Golden, crispy fried chicken with a perfectly seasoned coating.',
          ingredients: [
            { name: 'Chicken Pieces', quantity: '8', unit: 'pieces', category: 'protein' },
            { name: 'All-Purpose Flour', quantity: '2', unit: 'cups', category: 'grains' },
            { name: 'Eggs', quantity: '2', unit: 'large', category: 'dairy' },
            { name: 'Milk', quantity: '1/2', unit: 'cup', category: 'dairy' },
            { name: 'Paprika', quantity: '2', unit: 'tsp', category: 'spices' },
            { name: 'Garlic Powder', quantity: '1', unit: 'tsp', category: 'spices' },
            { name: 'Salt', quantity: '1', unit: 'tsp', category: 'spices' },
            { name: 'Black Pepper', quantity: '1/2', unit: 'tsp', category: 'spices' },
            { name: 'Vegetable Oil', quantity: '3', unit: 'cups', category: 'condiments' }
          ],
          instructions: [
            { step: 1, description: 'Season chicken pieces with salt and pepper', duration: 5 },
            { step: 2, description: 'Mix flour with paprika, garlic powder, salt, and pepper', duration: 3 },
            { step: 3, description: 'Beat eggs with milk in a separate bowl', duration: 2 },
            { step: 4, description: 'Heat oil in a large pot to 350°F', duration: 10 },
            { step: 5, description: 'Dredge chicken in flour, then egg mixture, then flour again', duration: 8 },
            { step: 6, description: 'Fry chicken in batches for 12-15 minutes until golden', duration: 15 },
            { step: 7, description: 'Drain on paper towels and serve hot', duration: 2 }
          ],
          prep_time: 20,
          cook_time: 30,
          servings: 4,
          difficulty: 'medium',
          tags: ['chicken', 'fried', 'crispy', 'comfort'],
          cuisine: 'American',
          ai_generated: true
        });
      } else if (queryLower.includes('grilled') || queryLower.includes('bbq')) {
        suggestions.push({
          id: 'fallback-grilled-chicken-1',
          title: 'Grilled BBQ Chicken',
          description: 'Tender grilled chicken with a smoky barbecue glaze.',
          ingredients: [
            { name: 'Chicken Thighs', quantity: '6', unit: 'pieces', category: 'protein' },
            { name: 'BBQ Sauce', quantity: '1/2', unit: 'cup', category: 'condiments' },
            { name: 'Olive Oil', quantity: '2', unit: 'tbsp', category: 'condiments' },
            { name: 'Garlic Powder', quantity: '1', unit: 'tsp', category: 'spices' },
            { name: 'Paprika', quantity: '1', unit: 'tsp', category: 'spices' },
            { name: 'Salt', quantity: '1', unit: 'tsp', category: 'spices' },
            { name: 'Black Pepper', quantity: '1/2', unit: 'tsp', category: 'spices' }
          ],
          instructions: [
            { step: 1, description: 'Season chicken with salt, pepper, garlic powder, and paprika', duration: 5 },
            { step: 2, description: 'Brush chicken with olive oil', duration: 2 },
            { step: 3, description: 'Preheat grill to medium-high heat', duration: 10 },
            { step: 4, description: 'Grill chicken for 6-7 minutes per side', duration: 14 },
            { step: 5, description: 'Brush with BBQ sauce in the last 2 minutes', duration: 2 },
            { step: 6, description: 'Let rest for 5 minutes before serving', duration: 5 }
          ],
          prep_time: 15,
          cook_time: 20,
          servings: 4,
          difficulty: 'easy',
          tags: ['chicken', 'grilled', 'bbq', 'summer'],
          cuisine: 'American',
          ai_generated: true
        });
      } else {
        // Multiple chicken recipes for randomization
        const chickenRecipes = [
          {
            id: 'fallback-chicken-1',
            title: 'Honey Garlic Chicken Thighs',
            description: 'Tender chicken thighs glazed with a sweet and savory honey garlic sauce.',
            ingredients: [
              { name: 'Chicken Thighs', quantity: '6', unit: 'pieces', category: 'protein' },
              { name: 'Honey', quantity: '1/3', unit: 'cup', category: 'condiments' },
              { name: 'Soy Sauce', quantity: '3', unit: 'tbsp', category: 'condiments' },
              { name: 'Garlic', quantity: '4', unit: 'cloves', category: 'produce' },
              { name: 'Ginger', quantity: '1', unit: 'tsp', category: 'spices' },
              { name: 'Sesame Oil', quantity: '1', unit: 'tbsp', category: 'condiments' },
              { name: 'Green Onions', quantity: '3', unit: 'stalks', category: 'produce' },
              { name: 'Sesame Seeds', quantity: '1', unit: 'tbsp', category: 'spices' }
            ],
            instructions: [
              { step: 1, description: 'Season chicken thighs with salt and pepper', duration: 5 },
              { step: 2, description: 'Mix honey, soy sauce, minced garlic, and ginger in a bowl', duration: 3 },
              { step: 3, description: 'Heat sesame oil in a large oven-safe pan over medium-high heat', duration: 2 },
              { step: 4, description: 'Sear chicken thighs skin-side down for 4-5 minutes until golden', duration: 5 },
              { step: 5, description: 'Flip chicken and brush with honey garlic sauce', duration: 2 },
              { step: 6, description: 'Transfer pan to oven and bake at 400°F for 15-20 minutes', duration: 20 },
              { step: 7, description: 'Brush with remaining sauce and garnish with green onions and sesame seeds', duration: 2 }
            ],
            prep_time: 15,
            cook_time: 30,
            servings: 4,
            difficulty: 'medium',
            tags: ['chicken', 'honey', 'garlic', 'asian'],
            cuisine: 'Asian',
            ai_generated: true
          },
          {
            id: 'fallback-chicken-2',
            title: 'Lemon Herb Roasted Chicken',
            description: 'Juicy and flavorful roasted chicken with fresh lemon and aromatic herbs.',
            ingredients: [
              { name: 'Whole Chicken', quantity: '1', unit: '4-5 lbs', category: 'protein' },
              { name: 'Lemon', quantity: '2', unit: 'medium', category: 'produce' },
              { name: 'Fresh Rosemary', quantity: '3', unit: 'sprigs', category: 'produce' },
              { name: 'Fresh Thyme', quantity: '4', unit: 'sprigs', category: 'produce' },
              { name: 'Garlic', quantity: '6', unit: 'cloves', category: 'produce' },
              { name: 'Olive Oil', quantity: '3', unit: 'tbsp', category: 'condiments' },
              { name: 'Salt', quantity: '1', unit: 'tbsp', category: 'spices' },
              { name: 'Black Pepper', quantity: '1', unit: 'tsp', category: 'spices' }
            ],
            instructions: [
              { step: 1, description: 'Preheat oven to 425°F', duration: 0 },
              { step: 2, description: 'Mix salt, pepper, olive oil, lemon zest, and minced herbs', duration: 5 },
              { step: 3, description: 'Rub herb mixture under and over chicken skin', duration: 10 },
              { step: 4, description: 'Stuff cavity with lemon halves, garlic, and herb sprigs', duration: 2 },
              { step: 5, description: 'Roast chicken breast-side up for 1 hour 15 minutes', duration: 75 },
              { step: 6, description: 'Baste with pan juices every 20 minutes', duration: 0 },
              { step: 7, description: 'Let rest for 15 minutes before carving', duration: 15 }
            ],
            prep_time: 15,
            cook_time: 90,
            servings: 6,
            difficulty: 'medium',
            tags: ['chicken', 'roasted', 'herbs', 'lemon'],
            cuisine: 'Mediterranean',
            ai_generated: true
          },
          {
            id: 'fallback-chicken-3',
            title: 'Chicken Stir Fry with Vegetables',
            description: 'Quick and healthy stir-fry with crisp vegetables and tender chicken pieces.',
            ingredients: [
              { name: 'Chicken Breast', quantity: '1', unit: 'lb', category: 'protein' },
              { name: 'Broccoli', quantity: '2', unit: 'cups', category: 'produce' },
              { name: 'Bell Peppers', quantity: '2', unit: 'medium', category: 'produce' },
              { name: 'Carrots', quantity: '2', unit: 'medium', category: 'produce' },
              { name: 'Garlic', quantity: '3', unit: 'cloves', category: 'produce' },
              { name: 'Ginger', quantity: '1', unit: 'tbsp', category: 'spices' },
              { name: 'Soy Sauce', quantity: '3', unit: 'tbsp', category: 'condiments' },
              { name: 'Sesame Oil', quantity: '1', unit: 'tbsp', category: 'condiments' },
              { name: 'Vegetable Oil', quantity: '2', unit: 'tbsp', category: 'condiments' }
            ],
            instructions: [
              { step: 1, description: 'Slice chicken into thin strips', duration: 10 },
              { step: 2, description: 'Cut vegetables into bite-sized pieces', duration: 10 },
              { step: 3, description: 'Heat vegetable oil in a wok or large pan over high heat', duration: 2 },
              { step: 4, description: 'Cook chicken until golden, about 5 minutes', duration: 5 },
              { step: 5, description: 'Add garlic and ginger, stir for 30 seconds', duration: 1 },
              { step: 6, description: 'Add vegetables and stir-fry for 4-5 minutes', duration: 5 },
              { step: 7, description: 'Add soy sauce and sesame oil, toss to combine', duration: 2 },
              { step: 8, description: 'Serve over rice or noodles', duration: 1 }
            ],
            prep_time: 20,
            cook_time: 15,
            servings: 4,
            difficulty: 'easy',
            tags: ['chicken', 'stir-fry', 'healthy', 'vegetables'],
            cuisine: 'Asian',
            ai_generated: true
          },
          {
            id: 'fallback-chicken-4',
            title: 'Chicken Tikka Masala',
            description: 'Creamy and aromatic Indian curry with tender spiced chicken.',
            ingredients: [
              { name: 'Chicken Breast', quantity: '1.5', unit: 'lbs', category: 'protein' },
              { name: 'Yogurt', quantity: '1/2', unit: 'cup', category: 'dairy' },
              { name: 'Tomatoes', quantity: '1', unit: 'can (14oz)', category: 'produce' },
              { name: 'Heavy Cream', quantity: '1/2', unit: 'cup', category: 'dairy' },
              { name: 'Onion', quantity: '1', unit: 'large', category: 'produce' },
              { name: 'Garlic', quantity: '4', unit: 'cloves', category: 'produce' },
              { name: 'Ginger', quantity: '1', unit: 'tbsp', category: 'spices' },
              { name: 'Garam Masala', quantity: '2', unit: 'tsp', category: 'spices' },
              { name: 'Cumin', quantity: '1', unit: 'tsp', category: 'spices' },
              { name: 'Paprika', quantity: '1', unit: 'tsp', category: 'spices' },
              { name: 'Butter', quantity: '3', unit: 'tbsp', category: 'dairy' }
            ],
            instructions: [
              { step: 1, description: 'Marinate chicken in yogurt and spices for 1 hour', duration: 0 },
              { step: 2, description: 'Sauté onion until golden, add garlic and ginger', duration: 5 },
              { step: 3, description: 'Add tomatoes, garam masala, cumin, and paprika', duration: 3 },
              { step: 4, description: 'Simmer for 10 minutes, then blend until smooth', duration: 12 },
              { step: 5, description: 'Grill chicken until cooked through', duration: 8 },
              { step: 6, description: 'Add chicken to sauce, stir in cream', duration: 3 },
              { step: 7, description: 'Simmer for 5 minutes, garnish with cilantro', duration: 5 }
            ],
            prep_time: 20,
            cook_time: 45,
            servings: 4,
            difficulty: 'medium',
            tags: ['chicken', 'curry', 'indian', 'spicy'],
            cuisine: 'Indian',
            ai_generated: true
          }
        ];
        
        // Randomly select 2-3 recipes
        const selectedRecipes = chickenRecipes.sort(() => Math.random() - 0.5).slice(0, 2);
        suggestions.push(...selectedRecipes);
      }
    }

    // Vegetarian recipes
    if (queryLower.includes('vegetarian') || queryLower.includes('veggie') || queryLower.includes('salad')) {
      suggestions.push({
        id: 'fallback-veggie-1',
        title: 'Mediterranean Quinoa Bowl',
        description: 'A nutritious and colorful bowl packed with Mediterranean flavors and fresh vegetables.',
        ingredients: [
          { name: 'Quinoa', quantity: '1', unit: 'cup', category: 'grains' },
          { name: 'Cherry Tomatoes', quantity: '1', unit: 'cup', category: 'produce' },
          { name: 'Cucumber', quantity: '1', unit: 'medium', category: 'produce' },
          { name: 'Red Onion', quantity: '1/2', unit: 'medium', category: 'produce' },
          { name: 'Kalamata Olives', quantity: '1/2', unit: 'cup', category: 'produce' },
          { name: 'Feta Cheese', quantity: '4', unit: 'oz', category: 'dairy' },
          { name: 'Fresh Mint', quantity: '1/4', unit: 'cup', category: 'produce' },
          { name: 'Lemon', quantity: '1', unit: 'medium', category: 'produce' },
          { name: 'Olive Oil', quantity: '3', unit: 'tbsp', category: 'condiments' }
        ],
        instructions: [
          { step: 1, description: 'Cook quinoa according to package directions and let cool', duration: 20 },
          { step: 2, description: 'Halve cherry tomatoes and dice cucumber and red onion', duration: 10 },
          { step: 3, description: 'Chop fresh mint and crumble feta cheese', duration: 5 },
          { step: 4, description: 'Make dressing by whisking olive oil, lemon juice, salt, and pepper', duration: 3 },
          { step: 5, description: 'Combine quinoa with all vegetables in a large bowl', duration: 2 },
          { step: 6, description: 'Add olives, feta cheese, and fresh mint', duration: 2 },
          { step: 7, description: 'Drizzle with dressing and toss gently to combine', duration: 1 },
          { step: 8, description: 'Serve chilled or at room temperature', duration: 0 }
        ],
        prep_time: 25,
        cook_time: 20,
        servings: 4,
        difficulty: 'easy',
        tags: ['vegetarian', 'quinoa', 'mediterranean', 'healthy'],
        cuisine: 'Mediterranean',
        ai_generated: true
      });
    }

    // Generic fallback with specific ingredients
    if (suggestions.length === 0) {
      const mainIngredient = pantryItems.find(item => item.category === 'protein') || 
                           pantryItems.find(item => item.category === 'produce') || 
                           pantryItems[0];
      
      suggestions.push({
        id: 'fallback-generic-1',
        title: `${query.charAt(0).toUpperCase() + query.slice(1)} Recipe`,
        description: `A delicious and detailed recipe inspired by your search for "${query}".`,
        ingredients: pantryItems.length > 0 ? pantryItems.map(item => ({
          name: item.name,
          quantity: item.quantity,
          unit: item.unit || 'units',
          category: item.category
        })) : [
          { name: 'Fresh Vegetables', quantity: '2', unit: 'cups', category: 'produce' },
          { name: 'Olive Oil', quantity: '2', unit: 'tbsp', category: 'condiments' },
          { name: 'Garlic', quantity: '3', unit: 'cloves', category: 'produce' },
          { name: 'Salt', quantity: '1', unit: 'tsp', category: 'spices' },
          { name: 'Black Pepper', quantity: '1/2', unit: 'tsp', category: 'spices' },
          { name: 'Fresh Herbs', quantity: '2', unit: 'tbsp', category: 'produce' }
        ],
        instructions: [
          { step: 1, description: 'Wash and prepare all fresh ingredients', duration: 10 },
          { step: 2, description: 'Heat olive oil in a large pan over medium heat', duration: 2 },
          { step: 3, description: 'Add garlic and cook until fragrant', duration: 1 },
          { step: 4, description: 'Add vegetables and cook until tender-crisp', duration: 8 },
          { step: 5, description: 'Season with salt, pepper, and fresh herbs', duration: 2 },
          { step: 6, description: 'Taste and adjust seasonings as needed', duration: 1 },
          { step: 7, description: 'Serve hot and enjoy!', duration: 0 }
        ],
        prep_time: 15,
        cook_time: 15,
        servings: 4,
        difficulty: 'easy',
        tags: ['fresh', 'healthy', 'quick'],
        cuisine: 'International',
        ai_generated: true
      });
    }

    return suggestions;
  }
}

module.exports = new EnhancedAIService();

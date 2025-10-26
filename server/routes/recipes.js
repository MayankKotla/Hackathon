const express = require('express');
const { body, validationResult } = require('express-validator');
const DatabaseService = require('../services/database');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/recipes
// @desc    Get all public recipes (community feed)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, search, cuisine, difficulty } = req.query;
    
    const filters = {
      search,
      cuisine,
      difficulty,
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    };

    const recipes = await DatabaseService.getRecipes(filters);

    res.json({
      recipes,
      totalPages: Math.ceil(recipes.length / limit),
      currentPage: parseInt(page),
      total: recipes.length
    });
  } catch (error) {
    console.error('Get recipes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/recipes/search
// @desc    Search recipes with AI enhancement
// @access  Public
router.get('/search', async (req, res) => {
  try {
    const { q: searchQuery, pantry } = req.query;
    
    if (!searchQuery) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    // Parse pantry items if provided
    let pantryItems = [];
    if (pantry) {
      try {
        pantryItems = JSON.parse(pantry);
      } catch (e) {
        console.log('Error parsing pantry items:', e);
      }
    }

    // Use AI for enhanced search
    const AIService = require('../services/aiService');
    const aiSuggestions = await AIService.searchRecipes(searchQuery, pantryItems);
    
    console.log(`AI returned ${aiSuggestions.length} suggestions:`, aiSuggestions.map(r => r.title));

    // Also search existing recipes in database
    const filters = {
      search: searchQuery,
      limit: 20,
      offset: 0
    };

    const dbRecipes = await DatabaseService.getRecipes(filters);
    console.log(`Database returned ${dbRecipes.length} recipes`);

    // Combine AI suggestions with database results
    const allRecipes = [...aiSuggestions, ...dbRecipes];
    console.log(`Total recipes to return: ${allRecipes.length}`);

    res.json({
      recipes: allRecipes,
      total: allRecipes.length,
      query: searchQuery,
      aiEnhanced: true
    });
  } catch (error) {
    console.error('Search recipes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/recipes/:id
// @desc    Get single recipe
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const { data: recipe, error } = await DatabaseService.getRecipeById(req.params.id);

    if (error || !recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    res.json(recipe);
  } catch (error) {
    console.error('Get recipe error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/recipes
// @desc    Create new recipe
// @access  Private
router.post('/', auth, [
  body('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
  body('description').trim().isLength({ min: 1 }).withMessage('Description is required'),
  body('ingredients').isArray({ min: 1 }).withMessage('At least one ingredient is required'),
  body('instructions').isArray({ min: 1 }).withMessage('At least one instruction is required'),
  body('prep_time').isNumeric().withMessage('Prep time must be a number'),
  body('cook_time').isNumeric().withMessage('Cook time must be a number'),
  body('servings').isNumeric().withMessage('Servings must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const recipeData = {
      ...req.body,
      user_id: req.userId
    };

    const recipe = await DatabaseService.createRecipe(recipeData);

    res.status(201).json(recipe);
  } catch (error) {
    console.error('Create recipe error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/recipes/:id/like
// @desc    Like/unlike recipe
// @access  Private
router.put('/:id/like', auth, async (req, res) => {
  try {
    const recipe = await DatabaseService.likeRecipe(req.params.id, req.userId);
    const isLiked = recipe.likes.includes(req.userId);

    res.json({ liked: isLiked, likeCount: recipe.likes.length });
  } catch (error) {
    console.error('Like recipe error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/recipes/:id/bookmark
// @desc    Bookmark/unbookmark recipe
// @access  Private
router.put('/:id/bookmark', auth, async (req, res) => {
  try {
    const recipe = await DatabaseService.bookmarkRecipe(req.params.id, req.userId);
    const isBookmarked = recipe.bookmarks.includes(req.userId);

    res.json({ bookmarked: isBookmarked });
  } catch (error) {
    console.error('Bookmark recipe error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/recipes/:id/comments
// @desc    Add comment to recipe
// @access  Private
router.post('/:id/comments', auth, [
  body('text').trim().isLength({ min: 1 }).withMessage('Comment text is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const commentData = {
      user: req.userId,
      text: req.body.text,
      created_at: new Date().toISOString()
    };

    const recipe = await DatabaseService.addComment(req.params.id, commentData);
    const newComment = recipe.comments[recipe.comments.length - 1];

    res.json(newComment);
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/recipes/generate
// @desc    Generate recipe based on pantry items using AI
// @access  Private
router.post('/generate', auth, async (req, res) => {
  try {
    const { pantryItems, preferences } = req.body;

    if (!pantryItems || pantryItems.length === 0) {
      return res.status(400).json({ message: 'Pantry items are required' });
    }

    // Use AI to generate recipe
    const AIService = require('../services/aiService');
    const aiGeneratedRecipe = await AIService.generateRecipe(pantryItems, preferences);

    // Convert AI recipe to database format
    const recipeData = {
      title: aiGeneratedRecipe.title,
      description: aiGeneratedRecipe.description,
      ingredients: aiGeneratedRecipe.ingredients,
      instructions: aiGeneratedRecipe.instructions,
      prep_time: aiGeneratedRecipe.prep_time || aiGeneratedRecipe.prepTime,
      cook_time: aiGeneratedRecipe.cook_time || aiGeneratedRecipe.cookTime,
      servings: aiGeneratedRecipe.servings,
      difficulty: aiGeneratedRecipe.difficulty,
      tags: aiGeneratedRecipe.tags,
      cuisine: aiGeneratedRecipe.cuisine,
      user_id: req.userId,
      is_public: false,
      ai_generated: true,
      nutrition_info: aiGeneratedRecipe.nutrition_info || aiGeneratedRecipe.nutrition,
      cooking_tips: aiGeneratedRecipe.cooking_tips || aiGeneratedRecipe.tips
    };

    const recipe = await DatabaseService.createRecipe(recipeData);
    res.json(recipe);
  } catch (error) {
    console.error('Generate recipe error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/recipes/:id
// @desc    Update a recipe (edit post)
// @access  Private (only recipe owner)
router.put('/:id', auth, [
  body('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
  body('description').trim().isLength({ min: 1 }).withMessage('Description is required'),
  body('ingredients').isArray({ min: 1 }).withMessage('At least one ingredient is required'),
  body('instructions').isArray({ min: 1 }).withMessage('At least one instruction is required'),
  body('prep_time').isNumeric().withMessage('Prep time must be a number'),
  body('cook_time').isNumeric().withMessage('Cook time must be a number'),
  body('servings').isNumeric().withMessage('Servings must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const recipeId = req.params.id;
    const userId = req.userId;

    // Check if recipe exists and belongs to user
    const existingRecipe = await DatabaseService.getRecipeById(recipeId);
    if (!existingRecipe || existingRecipe.error) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    console.log(`Found recipe:`, existingRecipe);

    // Check both user_id and author_id fields (some recipes might use different field names)
    const recipeOwnerId = existingRecipe.data.user_id || existingRecipe.data.author_id;
    console.log(`Recipe owner check (edit): user_id=${existingRecipe.data.user_id}, author_id=${existingRecipe.data.author_id}, recipeOwnerId=${recipeOwnerId}, userId=${userId}`);
    
    if (recipeOwnerId !== userId) {
      return res.status(403).json({ message: 'Not authorized to edit this recipe' });
    }

    // Update the recipe
    const updatedRecipe = await DatabaseService.updateRecipe(recipeId, req.body);

    res.json(updatedRecipe);
  } catch (error) {
    console.error('Update recipe error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/recipes/:id
// @desc    Delete a recipe (delete post)
// @access  Private (only recipe owner)
router.delete('/:id', auth, async (req, res) => {
  try {
    const recipeId = req.params.id;
    const userId = req.userId;

    console.log(`Delete request for recipe ${recipeId} by user ${userId}`);

    // Check if recipe exists and belongs to user
    const existingRecipe = await DatabaseService.getRecipeById(recipeId);
    if (!existingRecipe || existingRecipe.error) {
      console.log(`Recipe ${recipeId} not found`);
      return res.status(404).json({ message: 'Recipe not found' });
    }

    console.log(`Found recipe:`, existingRecipe);

    // Check both user_id and author_id fields (some recipes might use different field names)
    const recipeOwnerId = existingRecipe.data.user_id || existingRecipe.data.author_id;
    console.log(`Recipe owner check: user_id=${existingRecipe.data.user_id}, author_id=${existingRecipe.data.author_id}, recipeOwnerId=${recipeOwnerId}, userId=${userId}`);
    
    if (recipeOwnerId !== userId) {
      console.log(`User ${userId} not authorized to delete recipe ${recipeId} (owner: ${recipeOwnerId})`);
      return res.status(403).json({ message: 'Not authorized to delete this recipe' });
    }

    // Delete the recipe
    const result = await DatabaseService.deleteRecipe(recipeId);
    console.log('Delete result:', result);

    res.json({ message: 'Recipe deleted successfully' });
  } catch (error) {
    console.error('Delete recipe error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

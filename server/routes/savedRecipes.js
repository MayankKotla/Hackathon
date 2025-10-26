const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const DatabaseService = require('../services/database');

// Save a recipe
router.post('/save', auth, async (req, res) => {
  try {
    const { recipe_id, source = 'recipe_generator' } = req.body;
    
    if (!recipe_id) {
      return res.status(400).json({ message: 'Recipe ID is required' });
    }

    // Check if recipe exists
    const recipe = await DatabaseService.getRecipeById(recipe_id);
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    // Save the recipe
    const savedRecipe = await DatabaseService.saveRecipe(req.userId, recipe_id, source);
    
    res.status(201).json(savedRecipe);
  } catch (error) {
    console.error('Save recipe error:', error);
    // If table doesn't exist, return a message to create it
    if (error.code === 'PGRST205') {
      return res.status(503).json({ 
        message: 'Saved recipes feature not available yet. Please create the saved_recipes table in your database.' 
      });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Unsave a recipe
router.delete('/unsave/:recipeId', auth, async (req, res) => {
  try {
    const { recipeId } = req.params;
    
    const result = await DatabaseService.unsaveRecipe(req.userId, recipeId);
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Saved recipe not found' });
    }
    
    res.json({ message: 'Recipe unsaved successfully' });
  } catch (error) {
    console.error('Unsave recipe error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user's saved recipes
router.get('/saved', auth, async (req, res) => {
  try {
    const savedRecipes = await DatabaseService.getSavedRecipes(req.userId);
    res.json(savedRecipes);
  } catch (error) {
    console.error('Get saved recipes error:', error);
    // If table doesn't exist, return empty array
    if (error.code === 'PGRST205') {
      return res.json([]);
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Check if a recipe is saved by user
router.get('/is-saved/:recipeId', auth, async (req, res) => {
  try {
    const { recipeId } = req.params;
    const isSaved = await DatabaseService.isRecipeSaved(req.userId, recipeId);
    res.json({ isSaved });
  } catch (error) {
    console.error('Check saved recipe error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

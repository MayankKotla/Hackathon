const express = require('express');
const { body, validationResult } = require('express-validator');
const DatabaseService = require('../services/database');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const { data: user, error } = await DatabaseService.getUserById(req.userId);
    
    if (error) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's recipe count for stats
    let userPosts = [];
    try {
      userPosts = await DatabaseService.getUserPosts(req.userId, 1000, 0);
    } catch (error) {
      console.log('Error getting user posts for stats:', error.message);
      userPosts = [];
    }
    
    // Remove password hash from response and add stats
    const { password_hash, ...userWithoutPassword } = user;
    const userProfile = {
      ...userWithoutPassword,
      stats: {
        posts: userPosts.length || 0,
        recipesMade: userPosts.length || 0,
        totalLikes: 0 // We don't have likes in our current schema
      }
    };
    
    res.json(userProfile);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, [
  body('name').optional().trim().isLength({ min: 2 }),
  body('preferences.dietaryRestrictions').optional().isArray(),
  body('preferences.cuisinePreferences').optional().isArray(),
  body('preferences.skillLevel').optional().isIn(['beginner', 'intermediate', 'advanced'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await DatabaseService.updateUser(req.userId, req.body);
    
    // Remove password hash from response
    const { password_hash, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/posts
// @desc    Get user's recipes
// @access  Private
router.get('/posts', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const recipes = await DatabaseService.getUserPosts(
      req.userId, 
      parseInt(limit), 
      (parseInt(page) - 1) * parseInt(limit)
    );

    res.json({
      recipes,
      totalPages: Math.ceil(recipes.length / limit),
      currentPage: parseInt(page),
      total: recipes.length
    });
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/saved
// @desc    Get user's saved recipes
// @access  Private
router.get('/saved', auth, async (req, res) => {
  try {
    const recipes = await DatabaseService.getSavedRecipes(req.userId);
    res.json(recipes);
  } catch (error) {
    console.error('Get saved recipes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users/saved/:recipeId
// @desc    Save recipe to user's collection
// @access  Private
router.post('/saved/:recipeId', auth, async (req, res) => {
  try {
    const { data: recipe, error } = await DatabaseService.getRecipeById(req.params.recipeId);
    if (error || !recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    // Check if already bookmarked
    if (recipe.bookmarks.includes(req.userId)) {
      return res.status(400).json({ message: 'Recipe already saved' });
    }

    // Add to bookmarks
    await DatabaseService.bookmarkRecipe(req.params.recipeId, req.userId);

    res.json({ message: 'Recipe saved successfully' });
  } catch (error) {
    console.error('Save recipe error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/users/saved/:recipeId
// @desc    Remove recipe from user's collection
// @access  Private
router.delete('/saved/:recipeId', auth, async (req, res) => {
  try {
    // Remove from bookmarks
    await DatabaseService.bookmarkRecipe(req.params.recipeId, req.userId);

    res.json({ message: 'Recipe removed from saved collection' });
  } catch (error) {
    console.error('Remove saved recipe error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/:id
// @desc    Get public user profile
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const { data: user, error } = await DatabaseService.getUserById(req.params.id);
    
    if (error || !user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's public recipes
    const recipes = await DatabaseService.getUserPosts(req.params.id, 6, 0);

    // Remove password hash from response
    const { password_hash, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword, recipes });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

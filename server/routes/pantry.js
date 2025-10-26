const express = require('express');
const { body, validationResult } = require('express-validator');
const DatabaseService = require('../services/database');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/pantry
// @desc    Get user's pantry
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { data: pantryItems, error } = await DatabaseService.getPantry(req.userId);
    
    if (error) {
      return res.status(500).json({ message: 'Server error' });
    }

    // Transform the data to match frontend expectations
    const items = pantryItems.map(item => ({
      id: item.id,
      name: item.ingredient_name,
      quantity: item.quantity,
      unit: item.unit,
      category: item.category || 'produce',
      expiry_date: item.expiry_date
    }));

    res.json({ items });
  } catch (error) {
    console.error('Get pantry error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/pantry/items
// @desc    Add item to pantry
// @access  Private
router.post('/items', auth, [
  body('name').trim().isLength({ min: 1 }).withMessage('Item name is required'),
  body('quantity').trim().isLength({ min: 1 }).withMessage('Quantity is required'),
  body('category').optional().isIn(['protein', 'produce', 'grains', 'condiments', 'dairy', 'spices']).withMessage('Invalid category')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const pantryItem = await DatabaseService.addPantryItem(req.userId, req.body);
    
    // Transform the response to match frontend expectations
    const transformedItem = {
      id: pantryItem.id,
      name: pantryItem.ingredient_name,
      quantity: pantryItem.quantity,
      unit: pantryItem.unit,
      category: pantryItem.category || 'produce',
      expiry_date: pantryItem.expiry_date
    };
    
    res.json(transformedItem);
  } catch (error) {
    console.error('Add pantry item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/pantry/items/:itemId
// @desc    Update pantry item
// @access  Private
router.put('/items/:itemId', auth, [
  body('name').optional().trim().isLength({ min: 1 }),
  body('quantity').optional().trim().isLength({ min: 1 }),
  body('category').optional().isIn(['protein', 'produce', 'grains', 'condiments', 'dairy', 'spices'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Transform frontend data to database format
    const updateData = {
      ingredient_name: req.body.name,
      quantity: req.body.quantity,
      unit: req.body.unit,
      category: req.body.category
    };
    
    // Remove undefined fields
    Object.keys(updateData).forEach(key => 
      updateData[key] === undefined && delete updateData[key]
    );

    const pantryItem = await DatabaseService.updatePantryItem(req.userId, req.params.itemId, updateData);
    
    // Transform the response to match frontend expectations
    const transformedItem = {
      id: pantryItem.id,
      name: pantryItem.ingredient_name,
      quantity: pantryItem.quantity,
      unit: pantryItem.unit,
      category: pantryItem.category || 'produce',
      expiry_date: pantryItem.expiry_date
    };
    
    res.json(transformedItem);
  } catch (error) {
    console.error('Update pantry item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/pantry/items/:itemId
// @desc    Remove item from pantry
// @access  Private
router.delete('/items/:itemId', auth, async (req, res) => {
  try {
    const pantry = await DatabaseService.removePantryItem(req.userId, req.params.itemId);
    res.json(pantry);
  } catch (error) {
    console.error('Delete pantry item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/pantry/categories
// @desc    Get pantry items grouped by category
// @access  Private
router.get('/categories', auth, async (req, res) => {
  try {
    const { data: pantry, error } = await DatabaseService.getPantry(req.userId);
    
    if (error) {
      return res.status(500).json({ message: 'Server error' });
    }

    // Since we don't have categories in our new schema, just return the items
    res.json(pantry || []);
  } catch (error) {
    console.error('Get pantry categories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

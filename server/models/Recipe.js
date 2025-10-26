const mongoose = require('mongoose');

const ingredientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: String, required: true },
  unit: String,
  category: {
    type: String,
    enum: ['protein', 'produce', 'grains', 'condiments', 'dairy', 'spices'],
    required: true
  }
});

const instructionSchema = new mongoose.Schema({
  step: { type: Number, required: true },
  description: { type: String, required: true },
  duration: Number // in minutes
});

const recipeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  ingredients: [ingredientSchema],
  instructions: [instructionSchema],
  prepTime: {
    type: Number,
    required: true
  },
  cookTime: {
    type: Number,
    required: true
  },
  servings: {
    type: Number,
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true
  },
  tags: [String],
  cuisine: String,
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  image: String,
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: String,
    createdAt: { type: Date, default: Date.now }
  }],
  bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isPublic: {
    type: Boolean,
    default: true
  },
  nutrition: {
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number
  }
}, {
  timestamps: true
});

// Virtual for total time
recipeSchema.virtual('totalTime').get(function() {
  return this.prepTime + this.cookTime;
});

// Virtual for like count
recipeSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual for comment count
recipeSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

module.exports = mongoose.model('Recipe', recipeSchema);

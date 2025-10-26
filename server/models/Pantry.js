const mongoose = require('mongoose');

const pantryItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: String,
    required: true
  },
  unit: String,
  category: {
    type: String,
    enum: ['protein', 'produce', 'grains', 'condiments', 'dairy', 'spices'],
    required: true
  },
  expirationDate: Date,
  addedDate: {
    type: Date,
    default: Date.now
  }
});

const pantrySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [pantryItemSchema]
}, {
  timestamps: true
});

// Virtual for item count by category
pantrySchema.virtual('categoryCounts').get(function() {
  const counts = {};
  this.items.forEach(item => {
    counts[item.category] = (counts[item.category] || 0) + 1;
  });
  return counts;
});

module.exports = mongoose.model('Pantry', pantrySchema);

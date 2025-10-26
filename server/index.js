const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables first
dotenv.config();

// Import Supabase after env vars are loaded
const supabase = require('./config/supabase');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const recipeRoutes = require('./routes/recipes');
const pantryRoutes = require('./routes/pantry');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test Supabase connection (optional - won't crash if DB not set up)
supabase.from('users').select('count').then(({ data, error }) => {
  if (error) {
    console.log('Supabase connection error (database may not be set up yet):', error.message);
  } else {
    console.log('Supabase connected successfully');
  }
}).catch(err => {
  console.log('Supabase connection test failed (database may not be set up yet):', err.message);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/pantry', pantryRoutes);

// Serve static files from React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'FlavorCraft API is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

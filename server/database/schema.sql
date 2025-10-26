-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  preferences JSONB DEFAULT '{}',
  stats JSONB DEFAULT '{"posts": 0, "recipesMade": 0, "totalLikes": 0}',
  avatar VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create recipes table
CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  ingredients JSONB NOT NULL DEFAULT '[]',
  instructions JSONB NOT NULL DEFAULT '[]',
  prep_time INTEGER NOT NULL,
  cook_time INTEGER NOT NULL,
  servings INTEGER NOT NULL,
  difficulty VARCHAR(20) CHECK (difficulty IN ('easy', 'medium', 'hard')) NOT NULL,
  tags TEXT[] DEFAULT '{}',
  cuisine VARCHAR(100),
  author_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  image VARCHAR(500),
  likes UUID[] DEFAULT '{}',
  comments JSONB DEFAULT '[]',
  bookmarks UUID[] DEFAULT '{}',
  is_public BOOLEAN DEFAULT true,
  nutrition JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create pantry table
CREATE TABLE pantries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  items JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_follows table for following relationships
CREATE TABLE user_follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- Create indexes for better performance
CREATE INDEX idx_recipes_author_id ON recipes(author_id);
CREATE INDEX idx_recipes_is_public ON recipes(is_public);
CREATE INDEX idx_recipes_created_at ON recipes(created_at DESC);
CREATE INDEX idx_recipes_tags ON recipes USING GIN(tags);
CREATE INDEX idx_pantries_user_id ON pantries(user_id);
CREATE INDEX idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX idx_user_follows_following ON user_follows(following_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recipes_updated_at BEFORE UPDATE ON recipes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pantries_updated_at BEFORE UPDATE ON pantries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE pantries ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can read their own data and public user data
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can view public profiles" ON users
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Recipes are public for reading, users can manage their own
CREATE POLICY "Recipes are viewable by everyone" ON recipes
    FOR SELECT USING (true);

CREATE POLICY "Users can create recipes" ON recipes
    FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own recipes" ON recipes
    FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Users can delete own recipes" ON recipes
    FOR DELETE USING (auth.uid() = author_id);

-- Pantry is private to each user
CREATE POLICY "Users can manage own pantry" ON pantries
    FOR ALL USING (auth.uid() = user_id);

-- User follows policies
CREATE POLICY "Users can view follows" ON user_follows
    FOR SELECT USING (true);

CREATE POLICY "Users can manage own follows" ON user_follows
    FOR ALL USING (auth.uid() = follower_id);

-- Create media_attachments table for photos and videos
CREATE TABLE media_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  media_type VARCHAR(10) CHECK (media_type IN ('image', 'video')) NOT NULL,
  cloudinary_public_id VARCHAR(255) NOT NULL,
  cloudinary_url VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500), -- For videos, we'll generate a thumbnail
  file_name VARCHAR(255) NOT NULL,
  file_size INTEGER NOT NULL, -- Size in bytes
  duration INTEGER, -- For videos, duration in seconds
  width INTEGER,
  height INTEGER,
  order_index INTEGER DEFAULT 0, -- For ordering multiple media items
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_media_attachments_recipe_id ON media_attachments(recipe_id);
CREATE INDEX idx_media_attachments_user_id ON media_attachments(user_id);
CREATE INDEX idx_media_attachments_media_type ON media_attachments(media_type);
CREATE INDEX idx_media_attachments_order ON media_attachments(recipe_id, order_index);

-- Add updated_at trigger
CREATE TRIGGER update_media_attachments_updated_at BEFORE UPDATE ON media_attachments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE media_attachments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Media attachments are viewable by everyone (for public recipes)
CREATE POLICY "Media attachments are viewable by everyone" ON media_attachments
    FOR SELECT USING (true);

-- Users can create media attachments for their own recipes
CREATE POLICY "Users can create media attachments" ON media_attachments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own media attachments
CREATE POLICY "Users can update own media attachments" ON media_attachments
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own media attachments
CREATE POLICY "Users can delete own media attachments" ON media_attachments
    FOR DELETE USING (auth.uid() = user_id);

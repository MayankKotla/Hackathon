const express = require('express');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const DatabaseService = require('../services/database');
const supabase = require('../config/supabase');

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and videos
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed'), false);
    }
  }
});

// @route   POST /api/media/upload
// @desc    Upload media files (images/videos) to Supabase Storage
// @access  Private
router.post('/upload', auth, upload.array('media', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const uploadedMedia = [];
    const errors = [];

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      
      try {
        // Validate file size (50MB for images, 200MB for videos)
        const maxSize = file.mimetype.startsWith('video/') ? 200 * 1024 * 1024 : 50 * 1024 * 1024;
        if (file.size > maxSize) {
          errors.push(`${file.originalname}: File too large`);
          continue;
        }

        // Generate unique filename
        const fileExtension = file.originalname.split('.').pop();
        const fileName = `${req.userId}_${Date.now()}_${i}.${fileExtension}`;
        const filePath = `recipe-media/${fileName}`;

        // Upload to Supabase Storage
        const { data, error: uploadError } = await supabase.storage
          .from('media')
          .upload(filePath, file.buffer, {
            contentType: file.mimetype,
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error(`Supabase upload error for ${file.originalname}:`, uploadError);
          errors.push(`${file.originalname}: Upload failed`);
          continue;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('media')
          .getPublicUrl(filePath);

        // For videos, we'll generate a simple thumbnail URL (you can enhance this later)
        let thumbnailUrl = null;
        if (file.mimetype.startsWith('video/')) {
          // For now, we'll use the same URL as thumbnail
          // In production, you might want to generate actual thumbnails
          thumbnailUrl = urlData.publicUrl;
        }

        uploadedMedia.push({
          media_type: file.mimetype.startsWith('video/') ? 'video' : 'image',
          supabase_path: filePath,
          supabase_url: urlData.publicUrl,
          thumbnail_url: thumbnailUrl,
          file_name: file.originalname,
          file_size: file.size,
          duration: null, // We'll need to extract this from video metadata if needed
          width: null,
          height: null,
          order_index: i
        });

      } catch (error) {
        console.error(`Error uploading ${file.originalname}:`, error);
        errors.push(`${file.originalname}: Upload failed`);
      }
    }

    if (uploadedMedia.length === 0) {
      return res.status(400).json({ 
        message: 'No files were successfully uploaded', 
        errors: errors 
      });
    }

    res.json({
      message: 'Media uploaded successfully',
      media: uploadedMedia,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Media upload error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/media/attach-to-recipe
// @desc    Attach uploaded media to a recipe
// @access  Private
router.post('/attach-to-recipe', auth, [
  body('recipe_id').isInt({ min: 1 }).withMessage('Valid recipe ID is required'),
  body('media').isArray({ min: 1 }).withMessage('At least one media item is required'),
  body('media.*.supabase_path').notEmpty().withMessage('Supabase path is required'),
  body('media.*.supabase_url').isURL().withMessage('Valid Supabase URL is required'),
  body('media.*.media_type').isIn(['image', 'video']).withMessage('Valid media type is required'),
  body('media.*.file_name').notEmpty().withMessage('File name is required'),
  body('media.*.file_size').isInt({ min: 1 }).withMessage('Valid file size is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { recipe_id, media } = req.body;
    const userId = req.userId;

    // Verify recipe exists and belongs to user
    const recipe = await DatabaseService.getRecipeById(recipe_id);
    if (!recipe || recipe.error) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    const recipeOwnerId = recipe.data.user_id || recipe.data.author_id;
    if (recipeOwnerId !== userId) {
      return res.status(403).json({ message: 'Not authorized to attach media to this recipe' });
    }

    // Save media attachments to database
    const savedMedia = [];
    for (const mediaItem of media) {
      const savedItem = await DatabaseService.createMediaAttachment({
        recipe_id,
        user_id: userId,
        ...mediaItem
      });
      savedMedia.push(savedItem);
    }

    res.json({
      message: 'Media attached to recipe successfully',
      media: savedMedia
    });

  } catch (error) {
    console.error('Attach media error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/media/:id
// @desc    Delete a media attachment
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const mediaId = req.params.id;
    const userId = req.userId;

    // Get media attachment
    const mediaAttachment = await DatabaseService.getMediaAttachmentById(mediaId);
    if (!mediaAttachment || mediaAttachment.error) {
      return res.status(404).json({ message: 'Media attachment not found' });
    }

    // Check if user owns this media
    if (mediaAttachment.data.user_id !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this media' });
    }

    // Delete from Supabase Storage
    const { error: deleteError } = await supabase.storage
      .from('media')
      .remove([mediaAttachment.data.supabase_path]);

    if (deleteError) {
      console.error('Supabase delete error:', deleteError);
      // Continue with database deletion even if storage deletion fails
    }

    // Delete from database
    await DatabaseService.deleteMediaAttachment(mediaId);

    res.json({ message: 'Media deleted successfully' });

  } catch (error) {
    console.error('Delete media error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/media/recipe/:recipeId
// @desc    Get all media attachments for a recipe
// @access  Public
router.get('/recipe/:recipeId', async (req, res) => {
  try {
    const recipeId = req.params.recipeId;
    const media = await DatabaseService.getMediaAttachmentsByRecipeId(recipeId);
    
    res.json({ media });
  } catch (error) {
    console.error('Get media error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
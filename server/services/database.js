const supabase = require('../config/supabase');

class DatabaseService {
  // User operations
  static async createUser(userData) {
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async getUserByEmail(email) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    return { data, error };
  }

  static async getUserById(id) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    return { data, error };
  }

  static async updateUser(id, updates) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Recipe operations
  static async createRecipe(recipeData) {
    // Map frontend fields to database schema fields
    const difficultyMap = {
      'easy': 'Easy',
      'medium': 'Medium', 
      'hard': 'Hard'
    };
    
    // Only include fields that exist in the database schema
    const recipeWithDefaults = {
      user_id: recipeData.user_id,
      title: recipeData.title,
      description: recipeData.description,
      ingredients: recipeData.ingredients,
      instructions: recipeData.instructions,
      prep_time: recipeData.prep_time,
      cook_time: recipeData.cook_time,
      servings: recipeData.servings,
      difficulty: difficultyMap[recipeData.difficulty?.toLowerCase()] || 'Easy',
      cuisine_type: recipeData.cuisine || null, // Map cuisine to cuisine_type
      image_url: recipeData.image_url || null,
      is_public: recipeData.is_public !== undefined ? recipeData.is_public : true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('recipes')
      .insert([recipeWithDefaults])
      .select(`
        *,
        author:users!recipes_user_id_fkey(name, avatar, avatar_url)
      `)
      .single();
    
    if (error) throw error;
    return data;
  }

  static async getRecipes(filters = {}) {
    let query = supabase
      .from('recipes')
      .select(`
        *,
        author:users!recipes_user_id_fkey(name, avatar, avatar_url)
      `)
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    if (filters.cuisine) {
      query = query.eq('cuisine', filters.cuisine);
    }

    if (filters.difficulty) {
      query = query.eq('difficulty', filters.difficulty);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    return data;
  }

  static async getRecipeById(id) {
    const { data, error } = await supabase
      .from('recipes')
      .select(`
        *,
        author:users!recipes_user_id_fkey(name, avatar, avatar_url)
      `)
      .eq('id', id)
      .single();
    
    return { data, error };
  }

  static async updateRecipe(id, updates) {
    const { data, error } = await supabase
      .from('recipes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async deleteRecipe(id) {
    const { error } = await supabase
      .from('recipes')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  static async likeRecipe(recipeId, userId) {
    const { data: recipe, error: fetchError } = await this.getRecipeById(recipeId);
    if (fetchError) throw fetchError;

    const isLiked = recipe.likes.includes(userId);
    const newLikes = isLiked 
      ? recipe.likes.filter(id => id !== userId)
      : [...recipe.likes, userId];

    return this.updateRecipe(recipeId, { likes: newLikes });
  }

  static async bookmarkRecipe(recipeId, userId) {
    const { data: recipe, error: fetchError } = await this.getRecipeById(recipeId);
    if (fetchError) throw fetchError;

    const isBookmarked = recipe.bookmarks.includes(userId);
    const newBookmarks = isBookmarked 
      ? recipe.bookmarks.filter(id => id !== userId)
      : [...recipe.bookmarks, userId];

    return this.updateRecipe(recipeId, { bookmarks: newBookmarks });
  }

  static async addComment(recipeId, commentData) {
    const { data: recipe, error: fetchError } = await this.getRecipeById(recipeId);
    if (fetchError) throw fetchError;

    const newComments = [...recipe.comments, commentData];
    return this.updateRecipe(recipeId, { comments: newComments });
  }

  // Pantry operations
  static async getPantry(userId) {
    const { data, error } = await supabase
      .from('pantries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    return { data, error };
  }

  static async addPantryItem(userId, item) {
    const { data, error } = await supabase
      .from('pantries')
      .insert([{
        user_id: userId,
        ingredient_name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        category: item.category || 'produce',
        expiry_date: item.expiry_date
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updatePantryItem(userId, itemId, updates) {
    const { data, error } = await supabase
      .from('pantries')
      .update(updates)
      .eq('id', itemId)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async removePantryItem(userId, itemId) {
    const { error } = await supabase
      .from('pantries')
      .delete()
      .eq('id', itemId)
      .eq('user_id', userId);
    
    if (error) throw error;
    return { success: true };
  }

  // User posts
  static async getUserPosts(userId, limit = 10, offset = 0) {
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    return data;
  }

  static async getSavedRecipes(userId) {
    const { data, error } = await supabase
      .from('recipes')
      .select(`
        *,
        author:users!recipes_user_id_fkey(name, avatar, avatar_url)
      `)
      .contains('bookmarks', [userId]);
    
    if (error) throw error;
    return data;
  }
}

module.exports = DatabaseService;

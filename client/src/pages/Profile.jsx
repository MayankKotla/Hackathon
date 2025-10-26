import React, { useState } from 'react'
import { useQuery, useMutation } from 'react-query'
import { useAuth } from '../contexts/AuthContext'
import { Plus, Clock, Settings, Box, Edit3, Bookmark, X } from 'lucide-react'
import { api } from '../services/api'
import toast from 'react-hot-toast'

const Profile = () => {
  const { user } = useAuth()
  const [showAddItem, setShowAddItem] = useState(false)
  const [showEditProfile, setShowEditProfile] = useState(false)
  const [newItem, setNewItem] = useState({ name: '', quantity: '', unit: '', category: 'protein' })
  const [editProfile, setEditProfile] = useState({ name: '', bio: '', avatar_url: '' })
  const [editingItem, setEditingItem] = useState(null)
  const [editItemData, setEditItemData] = useState({ name: '', quantity: '', unit: '', category: 'protein' })
  const [showSavedRecipes, setShowSavedRecipes] = useState(false)

  const { data: userProfile, refetch: refetchProfile } = useQuery(
    'userProfile',
    () => api.get('/users/profile').then(res => res.data),
    { enabled: !!user }
  )

  const { data: pantry, refetch: refetchPantry } = useQuery(
    'pantry',
    () => api.get('/pantry').then(res => res.data),
    { enabled: !!user }
  )

  const { data: userPosts } = useQuery(
    'userPosts',
    () => api.get('/users/posts').then(res => res.data.recipes),
    { enabled: !!user }
  )

  const { data: savedRecipes, refetch: refetchSavedRecipes } = useQuery(
    'savedRecipes',
    () => api.get('/saved-recipes/saved').then(res => res.data),
    { enabled: !!user }
  )

  const addPantryItemMutation = useMutation(
    (item) => api.post('/pantry/items', item),
    {
      onSuccess: () => {
        toast.success('Item added to pantry!')
        setNewItem({ name: '', quantity: '', unit: '', category: 'protein' })
        setShowAddItem(false)
        refetchPantry()
      },
      onError: (error) => {
        toast.error('Failed to add item')
        console.error('Add pantry item error:', error)
      }
    }
  )

  const removePantryItemMutation = useMutation(
    (itemId) => api.delete(`/pantry/items/${itemId}`),
    {
      onSuccess: () => {
        toast.success('Item removed from pantry!')
        refetchPantry()
      },
      onError: (error) => {
        toast.error('Failed to remove item')
        console.error('Remove pantry item error:', error)
      }
    }
  )

  const unsaveRecipeMutation = useMutation(
    (recipeId) => api.delete(`/saved-recipes/unsave/${recipeId}`),
    {
      onSuccess: () => {
        toast.success('Recipe removed from saved!')
        refetchSavedRecipes()
      },
      onError: (error) => {
        toast.error('Failed to remove saved recipe')
        console.error('Unsave recipe error:', error)
      }
    }
  )

  const updatePantryItemMutation = useMutation(
    ({ itemId, data }) => api.put(`/pantry/items/${itemId}`, data),
    {
      onSuccess: () => {
        toast.success('Item updated successfully!')
        setEditingItem(null)
        setEditItemData({ name: '', quantity: '', unit: '', category: 'protein' })
        refetchPantry()
      },
      onError: (error) => {
        toast.error('Failed to update item')
        console.error('Update pantry item error:', error)
      }
    }
  )

  const updateProfileMutation = useMutation(
    (profileData) => api.put('/users/profile', profileData),
    {
      onSuccess: () => {
        toast.success('Profile updated successfully!')
        setShowEditProfile(false)
        refetchProfile()
      },
      onError: (error) => {
        toast.error('Failed to update profile')
        console.error('Update profile error:', error)
      }
    }
  )

  const handleAddItem = (e) => {
    e.preventDefault()
    if (newItem.name && newItem.quantity) {
      addPantryItemMutation.mutate(newItem)
    }
  }

  const handleEditProfile = (e) => {
    e.preventDefault()
    if (editProfile.name) {
      updateProfileMutation.mutate(editProfile)
    }
  }

  const openEditProfile = () => {
    setEditProfile({
      name: userProfile?.name || '',
      bio: userProfile?.bio || '',
      avatar_url: userProfile?.avatar_url || ''
    })
    setShowEditProfile(true)
  }

  const handleEditItem = (item) => {
    setEditingItem(item.id)
    setEditItemData({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit || '',
      category: item.category || 'protein'
    })
  }

  const handleSaveEdit = (e) => {
    e.preventDefault()
    if (editingItem && editItemData.name && editItemData.quantity) {
      updatePantryItemMutation.mutate({
        itemId: editingItem,
        data: editItemData
      })
    }
  }

  const handleCancelEdit = () => {
    setEditingItem(null)
    setEditItemData({ name: '', quantity: '', unit: '', category: 'protein' })
  }

  const getCategoryColor = (category) => {
    const colors = {
      protein: 'bg-red-100 text-red-800',
      produce: 'bg-green-100 text-green-800',
      grains: 'bg-yellow-100 text-yellow-800',
      condiments: 'bg-orange-100 text-orange-800',
      dairy: 'bg-blue-100 text-blue-800',
      spices: 'bg-purple-100 text-purple-800'
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  const getCategoryCounts = () => {
    if (!pantry?.items) return {}
    const counts = {}
    pantry.items.forEach(item => {
      counts[item.category] = (counts[item.category] || 0) + 1
    })
    return counts
  }

  const categoryCounts = getCategoryCounts()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Profile Section */}
        <div className="lg:col-span-2 space-y-8">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{user?.name}</h2>
                  <p className="text-gray-600">{user?.email}</p>
                </div>
              </div>
              <button 
                onClick={openEditProfile}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <Settings className="w-4 h-4" />
                <span className="text-sm">Edit Profile</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-500">{userProfile?.stats?.posts || 0}</div>
                <div className="text-sm text-gray-600">Posts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">{userProfile?.stats?.recipesMade || 0}</div>
                <div className="text-sm text-gray-600">Recipes Made</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-500">{userProfile?.stats?.totalLikes || 0}</div>
                <div className="text-sm text-gray-600">Total Likes</div>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button 
                onClick={() => setShowSavedRecipes(!showSavedRecipes)}
                className={`flex items-center space-x-2 ${showSavedRecipes ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
              >
                <Bookmark className="w-4 h-4" />
                <span className="text-sm">Saved</span>
              </button>
              <button className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
                <Clock className="w-4 h-4" />
                <span className="text-sm">View History</span>
              </button>
            </div>
          </div>

          {/* Edit Profile Modal */}
          {showEditProfile && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Edit Profile</h3>
                <button
                  onClick={() => setShowEditProfile(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={handleEditProfile} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={editProfile.name}
                    onChange={(e) => setEditProfile({ ...editProfile, name: e.target.value })}
                    className="input w-full"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bio
                  </label>
                  <textarea
                    value={editProfile.bio}
                    onChange={(e) => setEditProfile({ ...editProfile, bio: e.target.value })}
                    className="input w-full h-20 resize-none"
                    placeholder="Tell us about yourself..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Avatar URL
                  </label>
                  <input
                    type="url"
                    value={editProfile.avatar_url}
                    onChange={(e) => setEditProfile({ ...editProfile, avatar_url: e.target.value })}
                    className="input w-full"
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>
                
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={updateProfileMutation.isLoading}
                    className="btn-primary"
                  >
                    {updateProfileMutation.isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEditProfile(false)}
                    className="btn-outline"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* My Posts */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">My Posts</h3>
            <div className="space-y-4">
              {userPosts?.map((recipe) => (
                <div key={recipe._id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex-shrink-0"></div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{recipe.title}</h4>
                    <p className="text-sm text-gray-600 line-clamp-2">{recipe.description}</p>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                      <span>{recipe.likes?.length || 0} likes</span>
                      <span>•</span>
                      <span>{new Date(recipe.createdAt).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pantry Section */}
        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Box className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">My Pantry</h3>
                <span className="text-sm text-gray-500">({pantry?.items?.length || 0} items)</span>
              </div>
              <button
                onClick={() => setShowAddItem(!showAddItem)}
                className="btn-primary text-sm px-3 py-1"
              >
                Manage
              </button>
            </div>

            {showAddItem && (
              <form onSubmit={handleAddItem} className="mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <input
                    type="text"
                    placeholder="Item name"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    className="input text-sm"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Quantity"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                    className="input text-sm"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <input
                    type="text"
                    placeholder="Unit (optional)"
                    value={newItem.unit}
                    onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                    className="input text-sm"
                  />
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    className="input text-sm"
                  >
                    <option value="protein">Protein</option>
                    <option value="produce">Produce</option>
                    <option value="grains">Grains</option>
                    <option value="condiments">Condiments</option>
                    <option value="dairy">Dairy</option>
                    <option value="spices">Spices</option>
                  </select>
                </div>
                <div className="flex space-x-2">
                  <button
                    type="submit"
                    disabled={addPantryItemMutation.isLoading}
                    className="btn-primary text-sm px-4 py-2"
                  >
                    Add Item
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddItem(false)}
                    className="btn-outline text-sm px-4 py-2"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-4">
              {Object.entries(categoryCounts).map(([category, count]) => (
                <div key={category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-1 rounded-full text-sm font-medium ${getCategoryColor(category)}`}>
                      {category.charAt(0).toUpperCase() + category.slice(1)} ({count})
                    </span>
                  </div>
                  <div className="space-y-1">
                    {pantry?.items
                      ?.filter(item => item.category === category)
                      .map((item, index) => (
                        editingItem === item.id ? (
                          <div key={index} className="p-3 bg-gray-50 rounded border-2 border-primary-500">
                            <form onSubmit={handleSaveEdit} className="space-y-2">
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  type="text"
                                  placeholder="Item name"
                                  value={editItemData.name}
                                  onChange={(e) => setEditItemData({ ...editItemData, name: e.target.value })}
                                  className="input text-sm"
                                  required
                                />
                                <input
                                  type="text"
                                  placeholder="Quantity"
                                  value={editItemData.quantity}
                                  onChange={(e) => setEditItemData({ ...editItemData, quantity: e.target.value })}
                                  className="input text-sm"
                                  required
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  type="text"
                                  placeholder="Unit (optional)"
                                  value={editItemData.unit}
                                  onChange={(e) => setEditItemData({ ...editItemData, unit: e.target.value })}
                                  className="input text-sm"
                                />
                                <select
                                  value={editItemData.category}
                                  onChange={(e) => setEditItemData({ ...editItemData, category: e.target.value })}
                                  className="input text-sm"
                                >
                                  <option value="protein">Protein</option>
                                  <option value="produce">Produce</option>
                                  <option value="grains">Grains</option>
                                  <option value="condiments">Condiments</option>
                                  <option value="dairy">Dairy</option>
                                  <option value="spices">Spices</option>
                                </select>
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  type="submit"
                                  disabled={updatePantryItemMutation.isLoading}
                                  className="btn-primary text-sm px-3 py-1 flex-1"
                                >
                                  {updatePantryItemMutation.isLoading ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                  type="button"
                                  onClick={handleCancelEdit}
                                  className="btn-outline text-sm px-3 py-1 flex-1"
                                >
                                  Cancel
                                </button>
                              </div>
                            </form>
                          </div>
                        ) : (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium">{item.name}</span>
                              <span className="text-sm text-gray-500">{item.quantity} {item.unit}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => handleEditItem(item)}
                                className="text-blue-500 hover:text-blue-700 text-sm px-2 py-1 rounded hover:bg-blue-50"
                                title="Edit item"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => removePantryItemMutation.mutate(item.id)}
                                disabled={removePantryItemMutation.isLoading}
                                className="text-red-500 hover:text-red-700 text-sm px-2 py-1 rounded hover:bg-red-50"
                                title="Remove item"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        )
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Saved Recipes Modal */}
          {showSavedRecipes && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <div className="flex items-center space-x-2">
                    <Bookmark className="w-5 h-5 text-gray-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Saved Recipes</h3>
                    <span className="text-sm text-gray-500">({savedRecipes?.length || 0} recipes)</span>
                  </div>
                  <button
                    onClick={() => setShowSavedRecipes(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                  {savedRecipes && savedRecipes.length > 0 ? (
                    <div className="space-y-4">
                      {savedRecipes.map((savedRecipe, index) => {
                        const recipe = savedRecipe.recipe
                        if (!recipe) return null
                        
                        return (
                          <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="text-lg font-semibold text-gray-900 mb-2">{recipe.title}</h4>
                                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{recipe.description}</p>
                                
                                <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                                  {recipe.prep_time && (
                                    <span className="flex items-center space-x-1">
                                      <Clock className="w-4 h-4" />
                                      <span>Prep: {recipe.prep_time}m</span>
                                    </span>
                                  )}
                                  {recipe.cook_time && (
                                    <span className="flex items-center space-x-1">
                                      <Clock className="w-4 h-4" />
                                      <span>Cook: {recipe.cook_time}m</span>
                                    </span>
                                  )}
                                  {recipe.servings && (
                                    <span className="flex items-center space-x-1">
                                      <Box className="w-4 h-4" />
                                      <span>{recipe.servings} servings</span>
                                    </span>
                                  )}
                                  {recipe.difficulty && (
                                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                      {recipe.difficulty}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center justify-between">
                                  <div className="text-xs text-gray-500">
                                    Saved from: {savedRecipe.source === 'recipe_generator' ? 'Recipe Generator' : 'Social Feed'} • Type: {savedRecipe.source === 'recipe_generator' ? 'Recipe' : 'Post'}
                                  </div>
                                  <button
                                    onClick={() => unsaveRecipeMutation.mutate(recipe.id)}
                                    disabled={unsaveRecipeMutation.isLoading}
                                    className="text-red-500 hover:text-red-700 text-sm px-3 py-1 rounded hover:bg-red-50 transition-colors"
                                    title="Remove from saved"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Bookmark className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium mb-2">No saved recipes yet</p>
                      <p className="text-sm">Save recipes from Recipe Generator or Social Feed to see them here</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Profile

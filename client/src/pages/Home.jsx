import React, { useState } from 'react'
import { useQuery } from 'react-query'
import { Plus, Heart, MessageCircle, Bookmark, Search, ChevronDown, ChevronUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import CreateRecipeModal from '../components/CreateRecipeModal'

const Home = () => {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [isSearching, setIsSearching] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [expandedRecipes, setExpandedRecipes] = useState(new Set())

  const { data: recipes, isLoading } = useQuery(
    'recipes',
    () => api.get('/recipes').then(res => res.data.recipes),
    { refetchInterval: 30000 }
  )

  const handleLike = async (recipeId) => {
    try {
      await api.put(`/recipes/${recipeId}/like`)
      // Refetch recipes to update like count
    } catch (error) {
      console.error('Error liking recipe:', error)
    }
  }

  const handleBookmark = async (recipeId) => {
    try {
      await api.put(`/recipes/${recipeId}/bookmark`)
      // Refetch recipes to update bookmark status
    } catch (error) {
      console.error('Error bookmarking recipe:', error)
    }
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) {
      setSearchResults(null)
      return
    }
    
    setIsSearching(true)
    try {
      // Get user's pantry items for AI-enhanced search
      const pantryResponse = await api.get('/pantry')
      const pantryItems = pantryResponse.data.items || []
      
      const response = await api.get(`/recipes/search?q=${encodeURIComponent(searchQuery)}&pantry=${encodeURIComponent(JSON.stringify(pantryItems))}`)
      console.log('Search response:', response.data)
      console.log('Search results:', response.data.recipes)
      setSearchResults(response.data.recipes || [])
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const clearSearch = () => {
    setSearchQuery('')
    setSearchResults(null)
  }

  const handleShareRecipe = () => {
    setShowCreateModal(true)
  }

  const toggleRecipe = (recipeId) => {
    console.log('toggleRecipe called with:', recipeId)
    console.log('Current expanded recipes:', Array.from(expandedRecipes))
    
    setExpandedRecipes(prev => {
      const newExpanded = new Set(prev)
      if (newExpanded.has(recipeId)) {
        newExpanded.delete(recipeId)
      } else {
        newExpanded.add(recipeId)
      }
      console.log('New expanded recipes:', Array.from(newExpanded))
      return newExpanded
    })
  }

  const getFirstThreeSentences = (text) => {
    if (!text) return ''
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
    return sentences.slice(0, 3).join('. ') + (sentences.length > 3 ? '...' : '')
  }

  // Use search results if available, otherwise use all recipes
  const displayRecipes = searchResults !== null ? searchResults : recipes
  
  // Debug logging
  console.log('displayRecipes length:', displayRecipes?.length)
  console.log('displayRecipes array:', displayRecipes)
  console.log('expandedRecipes:', Array.from(expandedRecipes))

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-6">
                <div className="h-48 bg-gray-200 rounded mb-4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Community Feed</h1>
          <p className="text-gray-600">Discover amazing recipes from fellow food lovers.</p>
        </div>
        <button 
          onClick={handleShareRecipe}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Share Experience</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <form onSubmit={handleSearch} className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search recipes by title, ingredients, or cuisine..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="btn-primary"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
          {searchResults !== null && (
            <button
              type="button"
              onClick={clearSearch}
              className="btn-outline"
            >
              Clear
            </button>
          )}
        </form>
        
        {searchResults !== null && (
          <div className="mt-4 text-sm text-gray-600">
            {searchResults.length > 0 ? (
              <span>Found {searchResults.length} recipe{searchResults.length !== 1 ? 's' : ''} for "{searchQuery}"</span>
            ) : (
              <span>No recipes found for "{searchQuery}"</span>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4">
        {(!displayRecipes || displayRecipes.length === 0) && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No recipes found.</p>
          </div>
        )}
        {displayRecipes && displayRecipes.length > 0 && displayRecipes.map((recipe, index) => {
          const recipeId = recipe._id || recipe.id || `recipe-${index}`
          const isExpanded = expandedRecipes.has(recipeId)
          
          console.log(`Recipe ${index}:`, { 
            title: recipe.title, 
            id: recipeId, 
            isExpanded,
            hasChevron: true 
          })
          
          return (
            <div key={recipeId} className="mb-4 bg-white rounded-lg shadow-md border border-gray-300 overflow-hidden transition-all duration-300 hover:shadow-lg">
              {/* Accordion Header / Collapsed View */}
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  console.log('Toggle clicked for recipe:', recipeId)
                  toggleRecipe(recipeId)
                }}
                className="w-full p-5 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="flex-1 pr-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{recipe.title}</h3>
                  <p className="text-gray-500 text-sm mb-2">by {recipe.author?.name || 'Unknown'}</p>
                  {!isExpanded && (
                    <p className="text-gray-600 text-sm line-clamp-2">
                      {getFirstThreeSentences(recipe.description)}
                    </p>
                  )}
                </div>
                <div className="flex-shrink-0">
                  {isExpanded ? (
                    <ChevronUp className="w-6 h-6 text-blue-600" />
                  ) : (
                    <ChevronDown className="w-6 h-6 text-blue-600" />
                  )}
                </div>
              </button>
              
              {/* Accordion Content / Expanded Details */}
              {isExpanded && (
                <div className="border-t border-gray-200 bg-gray-50">
                  <div className="p-6 space-y-6 animate-in slide-in-from-top-2 duration-300">
                    {/* Recipe Image */}
                    {recipe.image && (
                      <div className="w-full h-64 rounded-lg overflow-hidden">
                        <img
                          src={recipe.image || '/api/placeholder/400/300'}
                          alt={recipe.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Recipe Info */}
                    <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                        <span>Prep: {recipe.prep_time || recipe.prepTime || 'N/A'} min</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <span>Cook: {recipe.cook_time || recipe.cookTime || 'N/A'} min</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>{recipe.servings || 'N/A'} servings</span>
                      </div>
                    </div>

                    {/* Tags/Cuisine */}
                    {(recipe.cuisine || recipe.tags) && (
                      <div className="flex flex-wrap gap-2">
                        {recipe.cuisine && (
                          <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
                            {recipe.cuisine}
                          </span>
                        )}
                        {recipe.tags && recipe.tags.map((tag, idx) => (
                          <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Ingredients */}
                    {recipe.ingredients && recipe.ingredients.length > 0 && (
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-3">Ingredients</h4>
                        <ul className="space-y-2">
                          {recipe.ingredients.map((ingredient, idx) => (
                            <li key={idx} className="flex items-center space-x-2">
                              <div className="w-1.5 h-1.5 bg-primary-500 rounded-full"></div>
                              <span className="text-gray-700">
                                {typeof ingredient === 'string' ? ingredient : 
                                 `${ingredient.quantity || ''} ${ingredient.unit || ''} ${ingredient.name || ''}`.trim()}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Instructions */}
                    {recipe.instructions && recipe.instructions.length > 0 && (
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-3">Instructions</h4>
                        <ol className="space-y-3">
                          {recipe.instructions.map((instruction, idx) => (
                            <li key={idx} className="flex space-x-3">
                              <span className="flex-shrink-0 w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                                {typeof instruction === 'object' ? instruction.step || idx + 1 : idx + 1}
                              </span>
                              <span className="flex-1 text-gray-700">
                                {typeof instruction === 'object' ? instruction.description || instruction : instruction}
                              </span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}

                    {/* Nutrition Info */}
                    {recipe.nutrition_info && (
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="text-lg font-semibold text-gray-900 mb-3">Nutrition (per serving)</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Calories:</span>
                            <span className="ml-2 font-semibold">{recipe.nutrition_info.calories || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Protein:</span>
                            <span className="ml-2 font-semibold">{recipe.nutrition_info.protein || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Carbs:</span>
                            <span className="ml-2 font-semibold">{recipe.nutrition_info.carbs || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Fat:</span>
                            <span className="ml-2 font-semibold">{recipe.nutrition_info.fat || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Cooking Tips */}
                    {recipe.cooking_tips && recipe.cooking_tips.length > 0 && (
                      <div className="p-4 bg-yellow-50 rounded-lg">
                        <h4 className="text-lg font-semibold text-gray-900 mb-3">💡 Cooking Tips</h4>
                        <ul className="space-y-1">
                          {recipe.cooking_tips.map((tip, idx) => (
                            <li key={idx} className="text-sm text-gray-700">• {tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => handleLike(recipeId)}
                          className="flex items-center space-x-1 text-gray-500 hover:text-red-500 transition-colors"
                        >
                          <Heart className="w-5 h-5" />
                          <span>{recipe.likes?.length || 0}</span>
                        </button>
                        <button className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 transition-colors">
                          <MessageCircle className="w-5 h-5" />
                          <span>{recipe.comments?.length || 0}</span>
                        </button>
                        <button
                          onClick={() => handleBookmark(recipeId)}
                          className="flex items-center space-x-1 text-gray-500 hover:text-yellow-500 transition-colors"
                        >
                          <Bookmark className="w-5 h-5" />
                        </button>
                      </div>
                      <span className="text-sm text-gray-500">
                        {recipe.createdAt ? new Date(recipe.createdAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        }) : ''}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Create Recipe Modal */}
      <CreateRecipeModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
      />
    </div>
  )
}

export default Home

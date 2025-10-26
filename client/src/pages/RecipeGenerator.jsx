import React, { useState, useEffect } from 'react'
import { useQuery, useMutation } from 'react-query'
import { Search, RefreshCw, Clock, Users, ChefHat, Save, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { api } from '../services/api'
import toast from 'react-hot-toast'

const RecipeGenerator = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [recipes, setRecipes] = useState([])
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(true)
  const [expandedRecipes, setExpandedRecipes] = useState(new Set())

  const { data: pantry, isLoading: isPantryLoading } = useQuery(
    'pantry',
    () => api.get('/pantry').then(res => res.data),
    { enabled: true }
  )

  // Auto-load recipes when pantry is loaded
  useEffect(() => {
    if (pantry && !isPantryLoading) {
      loadRecipesFromPantry()
    }
  }, [pantry, isPantryLoading])

  const loadRecipesFromPantry = async () => {
    if (!pantry?.items || pantry.items.length === 0) {
      setIsLoadingRecipes(false)
      return
    }

    setIsLoadingRecipes(true)
    try {
      const pantryQuery = pantry.items.map(item => item.name).join(' ')
      const response = await api.get(`/recipes/search?q=${encodeURIComponent(pantryQuery)}`)
      
      if (response.data.recipes && response.data.recipes.length > 0) {
        setRecipes(response.data.recipes)
        toast.success(`Found ${response.data.recipes.length} recipe(s)!`)
      } else {
        setRecipes([])
      }
    } catch (error) {
      console.error('Error loading recipes:', error)
      setRecipes([])
    } finally {
      setIsLoadingRecipes(false)
    }
  }

  const handleSearch = async () => {
    if (searchQuery.trim()) {
      setIsLoadingRecipes(true)
      try {
        const response = await api.get(`/recipes/search?q=${encodeURIComponent(searchQuery)}`)
        if (response.data.recipes && response.data.recipes.length > 0) {
          setRecipes(response.data.recipes)
          toast.success(`Found ${response.data.recipes.length} recipe(s)!`)
        } else {
          setRecipes([])
          toast.error('No recipes found for your search')
        }
      } catch (error) {
        toast.error('Search failed')
        console.error('Search error:', error)
      } finally {
        setIsLoadingRecipes(false)
      }
    }
  }

  const handleMoreRecipes = async () => {
    if (!pantry?.items || pantry.items.length === 0) {
      toast.error('Add items to your pantry first!')
      return
    }

    setIsLoadingRecipes(true)
    try {
      // First, try to get more recipes from the API
      const pantryQuery = pantry.items.map(item => item.name).join(' ')
      const response = await api.get(`/recipes/search?q=${encodeURIComponent(pantryQuery)}`)
      
      if (response.data.recipes && response.data.recipes.length > 0) {
        setRecipes(response.data.recipes)
        toast.success('Updated with new recipes!')
      } else {
        // If no recipes found from API, use AI to generate a recipe from pantry
        toast.loading('Generating custom recipe with AI...')
        
        const pantryItemsForAI = pantry.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          unit: item.unit
        }))
        
        const aiResponse = await api.post('/recipes/generate', {
          pantryItems: pantryItemsForAI,
          preferences: {}
        })
        
        if (aiResponse.data) {
          // Wrap the single generated recipe in an array
          setRecipes([aiResponse.data])
          toast.dismiss()
          toast.success('AI generated a custom recipe from your pantry!')
        } else {
          toast.dismiss()
          toast.error('Could not generate recipe')
        }
      }
    } catch (error) {
      // If API fails, try AI generation as fallback
      try {
        toast.loading('Generating custom recipe with AI...')
        
        const pantryItemsForAI = pantry.items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          unit: item.unit
        }))
        
        const aiResponse = await api.post('/recipes/generate', {
          pantryItems: pantryItemsForAI,
          preferences: {}
        })
        
        if (aiResponse.data) {
          setRecipes([aiResponse.data])
          toast.dismiss()
          toast.success('AI generated a custom recipe from your pantry!')
        } else {
          toast.dismiss()
          toast.error('Could not generate recipe')
        }
      } catch (aiError) {
        toast.dismiss()
        toast.error('Failed to fetch or generate recipes')
        console.error('Error:', aiError)
      }
    } finally {
      setIsLoadingRecipes(false)
    }
  }

  const saveRecipeMutation = useMutation(
    async (recipeData) => {
      // Check if this is a TheMealDB recipe (has string ID starting with 'mealdb-')
      const isMealDBRecipe = recipeData.id && typeof recipeData.id === 'string' && recipeData.id.startsWith('mealdb-')
      
      // If the recipe doesn't have a database ID or is a TheMealDB recipe, create it first
      if (!recipeData.id || !recipeData._id || isMealDBRecipe) {
        const createResponse = await api.post('/recipes', {
          title: recipeData.title,
          description: recipeData.description,
          ingredients: recipeData.ingredients,
          instructions: recipeData.instructions?.map(inst => inst.description || inst) || recipeData.instructions,
          prep_time: recipeData.prepTime || recipeData.prep_time || 0,
          cook_time: recipeData.cookTime || recipeData.cook_time || 0,
          servings: recipeData.servings || 4,
          difficulty: recipeData.difficulty || 'Easy',
          cuisine_type: recipeData.cuisine || recipeData.cuisine_type,
          is_public: false // Make it private so it doesn't appear in user posts
        })
        return api.post('/saved-recipes/save', { 
          recipe_id: createResponse.data.id,
          source: 'recipe_generator'
        })
      } else {
        // Recipe already exists in database with integer ID, just save it
        return api.post('/saved-recipes/save', { 
          recipe_id: recipeData.id || recipeData._id,
          source: 'recipe_generator'
        })
      }
    },
    {
      onSuccess: () => {
        toast.success('Recipe saved successfully!')
      },
      onError: (error) => {
        toast.error('Failed to save recipe')
        console.error('Save recipe error:', error)
      }
    }
  )

  const handleSave = (recipe) => {
    saveRecipeMutation.mutate(recipe)
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

  const toggleRecipe = (recipeId) => {
    setExpandedRecipes(prev => {
      const newExpanded = new Set(prev)
      if (newExpanded.has(recipeId)) {
        newExpanded.delete(recipeId)
      } else {
        newExpanded.add(recipeId)
      }
      return newExpanded
    })
  }

  const getFirstThreeSentences = (text) => {
    if (!text) return ''
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
    return sentences.slice(0, 3).join('. ') + (sentences.length > 3 ? '...' : '')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Recipe Generator</h1>
        <p className="text-gray-600">Discover delicious recipes based on your pantry</p>
      </div>

      {/* Search Bar */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="flex space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search for a specific dish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="input pl-10"
            />
          </div>
          <button
            onClick={handleSearch}
            className="btn-secondary px-6"
          >
            Search
          </button>
        </div>
      </div>

      {/* Pantry Items Display */}
      {pantry?.items && pantry.items.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Your Pantry Items</h3>
            <button
              onClick={handleMoreRecipes}
              disabled={isLoadingRecipes}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-6 py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoadingRecipes ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5" />
                  <span>More Recipes</span>
                </>
              )}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {pantry.items.map((item, index) => (
              <span
                key={index}
                className={`px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(item.category)}`}
              >
                {item.name} ({item.quantity})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Loading Spinner */}
      {isLoadingRecipes && (
        <div className="flex justify-center items-center py-20">
          <div className="text-center">
            <Loader2 className="w-16 h-16 animate-spin text-primary-600 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Loading delicious recipes...</p>
          </div>
        </div>
      )}

      {/* No Recipes Message */}
      {!isLoadingRecipes && recipes.length === 0 && (
        <div className="text-center py-20">
          <p className="text-gray-500 text-xl">No recipes found :(</p>
          <p className="text-gray-400 mt-2">Try adding more items to your pantry or search for something specific.</p>
        </div>
      )}

      {/* Recipe List */}
      {!isLoadingRecipes && recipes.length > 0 && (
        <div className="max-w-4xl mx-auto space-y-6">
          {recipes.map((recipe, index) => {
            const recipeId = recipe.id || recipe._id || `recipe-${index}`
            const isExpanded = expandedRecipes.has(recipeId)
            
            return (
              <div key={recipeId} className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 hover:shadow-md transition-shadow">
                {/* Accordion Header */}
                <button
                  onClick={() => toggleRecipe(recipeId)}
                  className="w-full p-5 text-left hover:bg-gray-50 transition-colors"
                  aria-expanded={isExpanded}
                  aria-controls={`recipe-content-${recipeId}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 pr-4">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{recipe.title}</h3>
                      {!isExpanded && (
                        <p className="text-gray-600 text-sm mb-3">
                          {getFirstThreeSentences(recipe.description)}
                        </p>
                      )}
                      {!isExpanded && (
                        <div className="flex flex-wrap gap-2">
                          {recipe.difficulty && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              {recipe.difficulty}
                            </span>
                          )}
                          {recipe.cuisine && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              {recipe.cuisine}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex-shrink-0 flex items-center space-x-2">
                      <button 
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleSave(recipe)
                        }}
                        disabled={saveRecipeMutation.isLoading}
                        className="text-gray-500 hover:text-gray-700 disabled:opacity-50 p-2 hover:bg-gray-100 rounded-full"
                        title="Save Recipe"
                      >
                        <Save className="w-5 h-5" />
                      </button>
                      <div className="p-2 bg-blue-500 text-blue-50 rounded-full flex items-center justify-center">
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </div>
                    </div>
                  </div>
                </button>

                {/* Accordion Content / Expanded Details */}
                {isExpanded && (
                  <div id={`recipe-content-${recipeId}`} className="border-t border-gray-200 bg-gray-50">
                    <div className="p-6 space-y-6 animate-in slide-in-from-top-2 duration-300">
                      {/* Full Description */}
                      <div>
                        <p className="text-gray-700">{recipe.description}</p>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2">
                        {recipe.difficulty && (
                          <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full font-medium">
                            {recipe.difficulty}
                          </span>
                        )}
                        {recipe.tags && recipe.tags.map((tag, idx) => (
                          <span key={idx} className="px-3 py-1 bg-orange-100 text-orange-800 text-sm rounded-full">
                            {tag}
                          </span>
                        ))}
                        {recipe.cuisine && (
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full font-medium">
                            {recipe.cuisine}
                          </span>
                        )}
                      </div>

                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Clock className="w-5 h-5" />
                    <span>Prep: {recipe.prep_time || recipe.prepTime || 'N/A'} min</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <ChefHat className="w-5 h-5" />
                    <span>Cook: {recipe.cook_time || recipe.cookTime || 'N/A'} min</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Users className="w-5 h-5" />
                    <span>{recipe.servings || 'N/A'} servings</span>
                  </div>
                </div>

                {/* Nutrition Info */}
                {recipe.nutrition_info && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
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

                {/* Ingredients */}
                {recipe.ingredients && recipe.ingredients.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Ingredients</h4>
                    <ul className="space-y-2">
                      {recipe.ingredients.map((ingredient, idx) => {
                        const ingredientText = typeof ingredient === 'string' ? ingredient : 
                          `${ingredient.quantity || ''} ${ingredient.unit || ''} ${ingredient.name || ''}`.trim()
                        
                        // Check if ingredient is in pantry
                        const isInPantry = pantry?.items?.some(item => {
                          const pantryName = item.name.toLowerCase()
                          const ingredientLower = typeof ingredient === 'string' 
                            ? ingredient.toLowerCase() 
                            : ingredient.name?.toLowerCase() || ''
                          
                          // Check if ingredient contains pantry item or vice versa
                          return ingredientLower.includes(pantryName) || pantryName.includes(ingredientLower)
                        })
                        
                        return (
                          <li key={idx} className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${isInPantry ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <span className={isInPantry ? 'text-green-700' : 'text-red-700'}>
                              {ingredientText}
                            </span>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )}

                {/* Instructions */}
                {recipe.instructions && recipe.instructions.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Instructions</h4>
                    <ol className="space-y-3">
                      {recipe.instructions.map((instruction, idx) => (
                        <li key={idx} className="flex space-x-3">
                          <span className="flex-shrink-0 w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                            {idx + 1}
                          </span>
                          <div className="flex-1">
                            <span className="text-gray-700">
                              {typeof instruction === 'string' ? instruction : instruction.description}
                            </span>
                            {instruction.duration > 0 && (
                              <span className="ml-2 text-sm text-gray-500">({instruction.duration} min)</span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ol>
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
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default RecipeGenerator

import React, { useState } from 'react'
import { useMutation } from 'react-query'
import { X, Plus, Trash2 } from 'lucide-react'
import { api } from '../services/api'
import toast from 'react-hot-toast'
import MediaUpload from './MediaUpload'

const CreateRecipeModal = ({ isOpen, onClose }) => {
  const [recipe, setRecipe] = useState({
    title: '',
    description: '',
    ingredients: [{ name: '', quantity: '', unit: '' }],
    instructions: [{ step: 1, description: '', duration: 0 }],
    prep_time: 15,
    cook_time: 30,
    servings: 4,
    difficulty: 'easy',
    tags: '',
    cuisine: ''
  })
  const [mediaFiles, setMediaFiles] = useState([])

  const handleMediaChange = (files) => {
    setMediaFiles(files)
  }

  const createRecipeMutation = useMutation(
    (recipeData) => api.post('/recipes', recipeData),
    {
      onSuccess: () => {
        // Success message and form reset are handled in handleSubmit
      },
      onError: (error) => {
        toast.error('Failed to share recipe experience')
        console.error('Create recipe error:', error)
      }
    }
  )

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      // First, create the recipe
      const ingredientsArray = recipe.ingredients
        .filter(ing => ing.name.trim())
        .map(ing => ing.name.trim())
      
      const instructionsArray = recipe.instructions
        .filter(inst => inst.description.trim())
        .map(inst => inst.description.trim())
      
      const recipeData = {
        title: recipe.title,
        description: recipe.description,
        ingredients: ingredientsArray,
        instructions: instructionsArray,
        prep_time: recipe.prep_time,
        cook_time: recipe.cook_time,
        servings: recipe.servings,
        difficulty: recipe.difficulty,
        cuisine: recipe.cuisine,
        is_public: true
      }

      const recipeResponse = await api.post('/recipes', recipeData)
      const createdRecipe = recipeResponse.data

      // If there are media files, upload them
      if (mediaFiles.length > 0) {
        try {
          const formData = new FormData()
          mediaFiles.forEach(file => {
            formData.append('media', file.file)
          })

          const mediaResponse = await api.post('/media/upload', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          })

          const uploadedMedia = mediaResponse.data.media

          // Attach media to the recipe
          await api.post('/media/attach-to-recipe', {
            recipe_id: createdRecipe.id,
            media: uploadedMedia
          })
        } catch (mediaError) {
          console.warn('Media upload failed, but recipe was created:', mediaError)
          toast.error('Recipe created but media upload failed. Please check Supabase Storage setup.')
        }
      }

      toast.success('Recipe experience shared successfully!')
      onClose()
      resetForm()
    } catch (error) {
      toast.error('Failed to share recipe experience')
      console.error('Create recipe error:', error)
    }
  }

  const resetForm = () => {
    setRecipe({
      title: '',
      description: '',
      ingredients: [{ name: '', quantity: '', unit: '' }],
      instructions: [{ step: 1, description: '', duration: 0 }],
      prep_time: 15,
      cook_time: 30,
      servings: 4,
      difficulty: 'easy',
      tags: '',
      cuisine: ''
    })
    setMediaFiles([])
  }

  const addIngredient = () => {
    setRecipe({
      ...recipe,
      ingredients: [...recipe.ingredients, { name: '', quantity: '', unit: '' }]
    })
  }

  const removeIngredient = (index) => {
    setRecipe({
      ...recipe,
      ingredients: recipe.ingredients.filter((_, i) => i !== index)
    })
  }

  const updateIngredient = (index, field, value) => {
    const updated = [...recipe.ingredients]
    updated[index][field] = value
    setRecipe({ ...recipe, ingredients: updated })
  }

  const addInstruction = () => {
    setRecipe({
      ...recipe,
      instructions: [...recipe.instructions, { 
        step: recipe.instructions.length + 1, 
        description: '', 
        duration: 0 
      }]
    })
  }

  const removeInstruction = (index) => {
    const updated = recipe.instructions.filter((_, i) => i !== index)
    // Renumber steps
    const renumbered = updated.map((inst, i) => ({ ...inst, step: i + 1 }))
    setRecipe({ ...recipe, instructions: renumbered })
  }

  const updateInstruction = (index, field, value) => {
    const updated = [...recipe.instructions]
    updated[index][field] = value
    setRecipe({ ...recipe, instructions: updated })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Share Your Recipe Experience</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipe Title *
                </label>
                <input
                  type="text"
                  value={recipe.title}
                  onChange={(e) => setRecipe({ ...recipe, title: e.target.value })}
                  className="input w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cuisine
                </label>
                <input
                  type="text"
                  value={recipe.cuisine}
                  onChange={(e) => setRecipe({ ...recipe, cuisine: e.target.value })}
                  className="input w-full"
                  placeholder="e.g., Italian, Mexican, Asian"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={recipe.description}
                onChange={(e) => setRecipe({ ...recipe, description: e.target.value })}
                className="input w-full h-24"
                required
                placeholder="Describe your recipe..."
              />
            </div>

            {/* Recipe Details */}
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prep Time (min)
                </label>
                <input
                  type="number"
                  value={recipe.prep_time}
                  onChange={(e) => setRecipe({ ...recipe, prep_time: parseInt(e.target.value) || 0 })}
                  className="input w-full"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cook Time (min)
                </label>
                <input
                  type="number"
                  value={recipe.cook_time}
                  onChange={(e) => setRecipe({ ...recipe, cook_time: parseInt(e.target.value) || 0 })}
                  className="input w-full"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Servings
                </label>
                <input
                  type="number"
                  value={recipe.servings}
                  onChange={(e) => setRecipe({ ...recipe, servings: parseInt(e.target.value) || 1 })}
                  className="input w-full"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty
                </label>
                <select
                  value={recipe.difficulty}
                  onChange={(e) => setRecipe({ ...recipe, difficulty: e.target.value })}
                  className="input w-full"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            {/* Media Upload */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Photos & Videos (Optional)</h3>
              <p className="text-sm text-gray-600 mb-4">
                Add photos or videos to make your recipe more engaging. Requires Supabase Storage setup.
              </p>
              <MediaUpload 
                onMediaChange={handleMediaChange}
                maxFiles={5}
                maxVideoDuration={60}
              />
            </div>

            {/* Ingredients */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Ingredients</h3>
                <button
                  type="button"
                  onClick={addIngredient}
                  className="btn-outline text-sm flex items-center space-x-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Ingredient</span>
                </button>
              </div>
              <div className="space-y-3">
                {recipe.ingredients.map((ingredient, index) => (
                  <div key={index} className="flex gap-3">
                    <input
                      type="text"
                      value={ingredient.name}
                      onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                      className="input flex-1"
                      placeholder="Ingredient name"
                    />
                    <input
                      type="text"
                      value={ingredient.quantity}
                      onChange={(e) => updateIngredient(index, 'quantity', e.target.value)}
                      className="input w-24"
                      placeholder="Qty"
                    />
                    <input
                      type="text"
                      value={ingredient.unit}
                      onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                      className="input w-20"
                      placeholder="Unit"
                    />
                    <button
                      type="button"
                      onClick={() => removeIngredient(index)}
                      className="text-red-500 hover:text-red-700 p-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Instructions */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Instructions</h3>
                <button
                  type="button"
                  onClick={addInstruction}
                  className="btn-outline text-sm flex items-center space-x-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Step</span>
                </button>
              </div>
              <div className="space-y-4">
                {recipe.instructions.map((instruction, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                      {instruction.step}
                    </div>
                    <div className="flex-1">
                      <textarea
                        value={instruction.description}
                        onChange={(e) => updateInstruction(index, 'description', e.target.value)}
                        className="input w-full h-20"
                        placeholder="Describe this step..."
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeInstruction(index)}
                      className="text-red-500 hover:text-red-700 p-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="btn-outline"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createRecipeMutation.isLoading}
                className="btn-primary"
              >
                {createRecipeMutation.isLoading ? 'Sharing...' : 'Share Experience'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CreateRecipeModal
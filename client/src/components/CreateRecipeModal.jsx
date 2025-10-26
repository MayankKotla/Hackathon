import React, { useState } from 'react'
import { useMutation } from 'react-query'
import { X, Plus, Trash2 } from 'lucide-react'
import { api } from '../services/api'
import toast from 'react-hot-toast'

const CreateRecipeModal = ({ isOpen, onClose }) => {
  const [recipe, setRecipe] = useState({
    title: '',
    description: '',
    ingredients: [{ name: '', quantity: '', unit: '' }],
    instructions: [{ step: 1, description: '', duration: 0 }],
    prepTime: 15,
    cookTime: 30,
    servings: 4,
    difficulty: 'easy',
    tags: '',
    cuisine: ''
  })

  const createRecipeMutation = useMutation(
    (recipeData) => api.post('/recipes', recipeData),
    {
      onSuccess: () => {
        toast.success('Recipe created successfully!')
        onClose()
        setRecipe({
          title: '',
          description: '',
          ingredients: [{ name: '', quantity: '', unit: '' }],
          instructions: [{ step: 1, description: '', duration: 0 }],
          prepTime: 15,
          cookTime: 30,
          servings: 4,
          difficulty: 'easy',
          tags: '',
          cuisine: ''
        })
      },
      onError: (error) => {
        toast.error('Failed to create recipe')
        console.error('Create recipe error:', error)
      }
    }
  )

  const handleSubmit = (e) => {
    e.preventDefault()
    
    const recipeData = {
      ...recipe,
      tags: recipe.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      ingredients: recipe.ingredients.filter(ing => ing.name.trim()),
      instructions: recipe.instructions.filter(inst => inst.description.trim())
    }

    createRecipeMutation.mutate(recipeData)
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
            <h2 className="text-2xl font-bold text-gray-900">Create New Recipe</h2>
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
                  Cuisine Type
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
                className="input w-full h-20"
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
                  value={recipe.prepTime}
                  onChange={(e) => setRecipe({ ...recipe, prepTime: parseInt(e.target.value) || 0 })}
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
                  value={recipe.cookTime}
                  onChange={(e) => setRecipe({ ...recipe, cookTime: parseInt(e.target.value) || 0 })}
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={recipe.tags}
                onChange={(e) => setRecipe({ ...recipe, tags: e.target.value })}
                className="input w-full"
                placeholder="e.g., quick, healthy, vegetarian"
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
                  <div key={index} className="flex space-x-3">
                    <input
                      type="text"
                      placeholder="Ingredient name"
                      value={ingredient.name}
                      onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                      className="input flex-1"
                    />
                    <input
                      type="text"
                      placeholder="Quantity"
                      value={ingredient.quantity}
                      onChange={(e) => updateIngredient(index, 'quantity', e.target.value)}
                      className="input w-24"
                    />
                    <input
                      type="text"
                      placeholder="Unit"
                      value={ingredient.unit}
                      onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                      className="input w-24"
                    />
                    <button
                      type="button"
                      onClick={() => removeIngredient(index)}
                      className="text-red-500 hover:text-red-700"
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
              <div className="space-y-3">
                {recipe.instructions.map((instruction, index) => (
                  <div key={index} className="flex space-x-3">
                    <span className="flex-shrink-0 w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                      {instruction.step}
                    </span>
                    <textarea
                      placeholder="Describe this step..."
                      value={instruction.description}
                      onChange={(e) => updateInstruction(index, 'description', e.target.value)}
                      className="input flex-1 h-20 resize-none"
                    />
                    <input
                      type="number"
                      placeholder="Min"
                      value={instruction.duration}
                      onChange={(e) => updateInstruction(index, 'duration', parseInt(e.target.value) || 0)}
                      className="input w-20"
                      min="0"
                    />
                    <button
                      type="button"
                      onClick={() => removeInstruction(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
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
                {createRecipeMutation.isLoading ? 'Creating...' : 'Create Recipe'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CreateRecipeModal

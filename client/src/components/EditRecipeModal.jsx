import React, { useState, useEffect } from 'react'
import { useMutation } from 'react-query'
import { X, Plus, Trash2 } from 'lucide-react'
import { api } from '../services/api'
import toast from 'react-hot-toast'

const EditRecipeModal = ({ isOpen, onClose, recipe, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    ingredients: [''],
    instructions: [''],
    prep_time: 15,
    cook_time: 30,
    servings: 4,
    difficulty: 'Easy',
    cuisine_type: ''
  })

  // Initialize form data when recipe changes
  useEffect(() => {
    if (recipe) {
      setFormData({
        title: recipe.title || '',
        description: recipe.description || '',
        ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [recipe.ingredients || ''],
        instructions: Array.isArray(recipe.instructions) ? recipe.instructions : [recipe.instructions || ''],
        prep_time: recipe.prep_time || 15,
        cook_time: recipe.cook_time || 30,
        servings: recipe.servings || 4,
        difficulty: recipe.difficulty || 'Easy',
        cuisine_type: recipe.cuisine_type || ''
      })
    }
  }, [recipe])

  const updateRecipeMutation = useMutation(
    (data) => api.put(`/recipes/${recipe.id}`, data),
    {
      onSuccess: () => {
        toast.success('Recipe updated successfully!')
        onSuccess()
      },
      onError: (error) => {
        toast.error('Failed to update recipe')
        console.error('Update recipe error:', error)
      }
    }
  )

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Convert ingredients and instructions to arrays of strings
    const ingredientsArray = formData.ingredients
      .filter(ing => ing.trim())
      .map(ing => ing.trim())
    
    const instructionsArray = formData.instructions
      .filter(inst => inst.trim())
      .map(inst => inst.trim())
    
    const recipeData = {
      title: formData.title,
      description: formData.description,
      ingredients: ingredientsArray,
      instructions: instructionsArray,
      prep_time: formData.prep_time,
      cook_time: formData.cook_time,
      servings: formData.servings,
      difficulty: formData.difficulty,
      cuisine_type: formData.cuisine_type
    }

    updateRecipeMutation.mutate(recipeData)
  }

  const addIngredient = () => {
    setFormData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, '']
    }))
  }

  const removeIngredient = (index) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }))
  }

  const updateIngredient = (index, value) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.map((ing, i) => i === index ? value : ing)
    }))
  }

  const addInstruction = () => {
    setFormData(prev => ({
      ...prev,
      instructions: [...prev.instructions, '']
    }))
  }

  const removeInstruction = (index) => {
    setFormData(prev => ({
      ...prev,
      instructions: prev.instructions.filter((_, i) => i !== index)
    }))
  }

  const updateInstruction = (index, value) => {
    setFormData(prev => ({
      ...prev,
      instructions: prev.instructions.map((inst, i) => i === index ? value : inst)
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Edit Recipe</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Recipe Title *
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="input w-full"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="input w-full"
                rows="3"
                required
              />
            </div>

            {/* Ingredients */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ingredients *
              </label>
              <div className="space-y-2">
                {formData.ingredients.map((ingredient, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={ingredient}
                      onChange={(e) => updateIngredient(index, e.target.value)}
                      className="input flex-1"
                      placeholder={`Ingredient ${index + 1}`}
                    />
                    {formData.ingredients.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeIngredient(index)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addIngredient}
                  className="btn-outline text-sm flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Ingredient</span>
                </button>
              </div>
            </div>

            {/* Instructions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Instructions *
              </label>
              <div className="space-y-2">
                {formData.instructions.map((instruction, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <span className="text-sm text-gray-500 mt-2 font-medium">{index + 1}.</span>
                    <textarea
                      value={instruction}
                      onChange={(e) => updateInstruction(index, e.target.value)}
                      className="input flex-1"
                      rows="2"
                      placeholder={`Step ${index + 1}`}
                    />
                    {formData.instructions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeInstruction(index)}
                        className="text-red-500 hover:text-red-700 p-1 mt-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addInstruction}
                  className="btn-outline text-sm flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Step</span>
                </button>
              </div>
            </div>

            {/* Time and Servings */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label htmlFor="prep_time" className="block text-sm font-medium text-gray-700 mb-2">
                  Prep Time (minutes)
                </label>
                <input
                  type="number"
                  id="prep_time"
                  value={formData.prep_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, prep_time: parseInt(e.target.value) || 0 }))}
                  className="input w-full"
                  min="0"
                />
              </div>
              <div>
                <label htmlFor="cook_time" className="block text-sm font-medium text-gray-700 mb-2">
                  Cook Time (minutes)
                </label>
                <input
                  type="number"
                  id="cook_time"
                  value={formData.cook_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, cook_time: parseInt(e.target.value) || 0 }))}
                  className="input w-full"
                  min="0"
                />
              </div>
              <div>
                <label htmlFor="servings" className="block text-sm font-medium text-gray-700 mb-2">
                  Servings
                </label>
                <input
                  type="number"
                  id="servings"
                  value={formData.servings}
                  onChange={(e) => setFormData(prev => ({ ...prev, servings: parseInt(e.target.value) || 1 }))}
                  className="input w-full"
                  min="1"
                />
              </div>
            </div>

            {/* Difficulty and Cuisine */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty
                </label>
                <select
                  id="difficulty"
                  value={formData.difficulty}
                  onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value }))}
                  className="input w-full"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
              <div>
                <label htmlFor="cuisine_type" className="block text-sm font-medium text-gray-700 mb-2">
                  Cuisine Type
                </label>
                <input
                  type="text"
                  id="cuisine_type"
                  value={formData.cuisine_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, cuisine_type: e.target.value }))}
                  className="input w-full"
                  placeholder="e.g., Italian, Mexican, Asian"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="btn-outline"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateRecipeMutation.isLoading}
                className="btn-primary"
              >
                {updateRecipeMutation.isLoading ? 'Updating...' : 'Update Recipe'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default EditRecipeModal

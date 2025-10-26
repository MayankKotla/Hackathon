import React from 'react'
import { Search, Egg } from 'lucide-react'

const Header = () => {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-start items-center py-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <Search className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Stir</h1>
              <p className="text-xs text-gray-600">Your Personal Cooking Assistant</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header

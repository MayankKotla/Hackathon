import React from 'react'
import { Search, Egg } from 'lucide-react'

const Header = () => {
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-start items-center py-4">
          <div className="flex items-center space-x-1">
            <div className="w-12 h-12 bg-primary-500 rounded-lg flex items-center justify-center">
              <Search className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Stir</h1>
              <p className="text-sm text-gray-600">Your Personal Cooking Assistant</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header

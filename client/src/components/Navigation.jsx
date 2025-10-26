import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Users, Apple, User } from 'lucide-react'
import clsx from 'clsx'

const Navigation = () => {
  const location = useLocation()

  const navItems = [
    { path: '/', label: 'Social Feed', icon: Users },
    { path: '/generator', label: 'Recipe Generator', icon: Apple },
    { path: '/profile', label: 'Profile', icon: User },
  ]

  return (
    <nav className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center space-x-1 py-4">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={clsx(
                  'flex items-center space-x-2 px-6 py-3 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-secondary-500 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

export default Navigation

import React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Header from './Header'
import Navigation from './Navigation'

const Layout = () => {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50">
      <Header />
      <Navigation />
      <main className="pb-8">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout

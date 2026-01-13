import React from 'react'
import { Outlet } from 'react-router-dom'
import LeftSidebar from './LeftSidebar'
import GlobalPostDetailModal from './GlobalPostDetailModal'

const MainLayout = () => {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <LeftSidebar />

      {/* Main content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Global Modals */}
      <GlobalPostDetailModal />
    </div>
  )
}

export default MainLayout

// src/app/super_admin_dashboard/layout.tsx
import Sidebar from '@/components/layout/admin_sidebar'
import React from 'react'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Top Header - Full width across top */}
      <header className="flex items-center justify-between bg-white px-6 py-4 border-b border-gray-300  z-10 flex-shrink-0">
        <h1 className="text-blue-600 font-bold text-lg">Bristol Tailors</h1>
        <div className="bg-orange-400 text-white w-6 h-6 flex items-center justify-center rounded">
          F
        </div>
      </header>
      

      {/* Content Area with Sidebar and Main */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <div className="flex-shrink-0 h-full">
          <Sidebar />
        </div>
        
        {/* Main Content - Scrollable */}
        <main className="flex-1 p-4 overflow-y-auto bg-white">
          {children}
        </main>
      </div>
    </div>
  )
}
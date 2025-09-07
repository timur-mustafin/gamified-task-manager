import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function AdminDashboard() {
  const navigate = useNavigate()

  const adminTools = [
    { label: 'Manage Users', path: '/admin/users' },
    { label: '🛒 Store Manager', path: '/admin/store' },
    { label: 'System Stats (soon)', path: '#' },
  ]

  return (
    <div className="p-8 mt-[1.5rem] max-w-4xl mx-auto bg-white dark:bg-dark-blue text-main dark:text-main-dark transition-bg transition-text rounded-lg shadow-soft">
      <h1 className="text-3xl font-bold mb-6">👑 Admin Dashboard</h1>
      <p className="mb-6 text-subtle dark:text-subtle-dark">Welcome, mighty overlord. What shall we oversee today?</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {adminTools.map((tool, i) => (
          <button
            key={i}
            onClick={() => navigate(tool.path)}
            className="w-full px-4 py-3 bg-button dark:bg-button-dark text-buttonText dark:text-buttonText-dark rounded shadow hover:bg-buttonHover dark:hover:bg-button-hover-dark transition-bg transition-text"
          >
            {tool.label}
          </button>
        ))}
      </div>
    </div>
  )
}

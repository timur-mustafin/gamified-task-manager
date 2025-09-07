import React, { useContext } from 'react'
import AuthContext from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Settings() {
  const { user } = useContext(AuthContext)
  const navigate = useNavigate()

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold">Settings</h2>

      <div>
        <button
          onClick={() => navigate('/profile')}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Edit My Profile
        </button>
      </div>

      {/* You can expand this section with more personal or system-wide settings later */}
    </div>
  )
}

import React, { useEffect, useState } from 'react'
import axios, { mediaUrl } from '../utils/axios'

export default function AdminUserManager() {
  const [users, setUsers] = useState([])

  useEffect(() => {
    axios.get('/auth/users/').then(res => setUsers(res.data))
  }, [])

  const handleAction = async (userId, action) => {
    try {
      await axios.post('/admin/user-action/', { user_id: userId, action })
      const res = await axios.get('/auth/users/')
      setUsers(res.data)
    } catch (err) {
      console.error('Admin action failed', err)
      alert('Action failed. See console.')
    }
  }

  return (
    <div className="p-8 mt-[1.5rem] max-w-5xl mx-auto bg-white dark:bg-dark-blue text-main dark:text-main-dark transition-bg transition-text rounded-lg shadow-soft">
      <h1 className="text-2xl font-bold mb-6">🧑‍💼 User Manager</h1>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border border-border dark:border-border-dark">
          <thead className="bg-gray-200 dark:bg-gray-800 text-left">
            <tr>
              <th className="p-2">Avatar</th>
              <th className="p-2">Name</th>
              <th className="p-2">Username</th>
              <th className="p-2">Email</th>
              <th className="p-2">Level</th>
              <th className="p-2">Honor</th>
              <th className="p-2">Status</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                <td className="p-2">
                  {user.avatar ? (
                    <img
                      src={user.avatar.startsWith('http') ? user.avatar : `${mediaUrl}${user.avatar}`}
                      alt="avatar"
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-white text-xs">
                      {user.username[0]?.toUpperCase()}
                    </div>
                  )}
                </td>
                <td className="p-2">{user.first_name} {user.last_name}</td>
                <td className="p-2">@{user.username}</td>
                <td className="p-2">{user.email}</td>
                <td className="p-2 text-center">{user.level}</td>
                <td className="p-2 text-center">{user.honor}</td>
                <td className="p-2 text-center">
                  {user.is_online ? (
                    <span className="text-green-600 font-bold">🟢 Online</span>
                  ) : (
                    <span className="text-gray-500 text-xs italic">
                      Last seen {user.last_seen ? new Date(user.last_seen).toLocaleString() : '—'}
                    </span>
                  )}
                </td>
                <td className="p-2 flex flex-col gap-1 text-xs">
                  <button onClick={() => handleAction(user.id, 'reset_exp')} className="text-blue-600 hover:underline">🔄 EXP</button>
                  <button onClick={() => handleAction(user.id, 'reset_honor')} className="text-emerald-600 hover:underline">🎖️ Honor</button>
                  <button onClick={() => handleAction(user.id, 'toggle_role')} className="text-yellow-600 hover:underline">🧑‍⚖️ Role</button>
                  <button onClick={() => handleAction(user.id, 'deactivate')} className="text-red-600 hover:underline">❌ Deactivate</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

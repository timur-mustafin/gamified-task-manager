import React, { useEffect, useState } from 'react'
import axios, { mediaUrl } from '../utils/axios'
import { Link } from 'react-router-dom'

export default function HallOfFame() {
  const [users, setUsers] = useState([])

  useEffect(() => {
    axios.get('/auth/users/').then(res => setUsers(res.data))
  }, [])

  const sortedUsers = [...users].sort((a, b) => b.exp - a.exp)

  const getBadge = (level) => {
    if (level >= 50) return '🥇 Gold'
    if (level >= 30) return '🥈 Silver'
    if (level >= 10) return '🥉 Bronze'
    return '—'
  }

  return (
    <div className="p-8 mt-[1rem] max-w-4xl mx-auto bg-surface dark:bg-dark-blue text-main dark:text-main-dark border border-border dark:border-border-dark rounded-lg shadow-soft transition-bg transition-text">
      <h1 className="text-3xl font-bold mb-6 text-center">🏆 Hall of Fame</h1>

      <div className="space-y-4">
        {sortedUsers.map((user, idx) => (
          <div
            key={user.id}
            className="flex items-center space-x-4 p-4 bg-white dark:bg-gray-800 rounded shadow-sm transition-bg transition-text"
          >
            <span className="text-xl font-bold w-6 text-right">{idx + 1}.</span>

            {user.avatar ? (
              <img
                src={user.avatar.startsWith('http') ? user.avatar : `${mediaUrl}${user.avatar}`}
                alt="avatar"
                className="w-12 h-12 rounded-full object-cover border-2 border-yellow-400"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-700 text-white flex items-center justify-center text-lg font-semibold">
                {user.username[0]?.toUpperCase()}
              </div>
            )}
            
            <div className="flex-1">
              <Link
                to={`/users/${user.id}`}
                className="font-semibold text-accent dark:text-accent-dark hover:underline"
              >
                {user.first_name || user.last_name
                  ? `${user.first_name} ${user.last_name}`.trim()
                  : user.username}
              </Link>
              <p className="text-sm text-subtle dark:text-subtle-dark">
                Level {user.level} • {user.exp} EXP • {user.honor} Honor • Badge: {getBadge(user.level)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

import React, { useEffect, useState } from 'react'
import axios from '../utils/axios'
import { Bell, AlertCircle, Info, XOctagon } from 'lucide-react'

export default function NotificationTray() {
  const [notifications, setNotifications] = useState([])

  const fetchNotifications = () => {
    axios.get('/notifications/').then(res => setNotifications(res.data))
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  const markAllRead = () => {
    axios.post('/notifications/mark_all_read/').then(() => fetchNotifications())
  }

  const grouped = notifications.reduce((acc, n) => {
    const key = n.category
    if (!acc[key]) acc[key] = []
    acc[key].push(n)
    return acc
  }, {})

  const iconByType = {
    info: <Info className="inline w-4 h-4 text-blue-500 mr-1" />,
    warning: <AlertCircle className="inline w-4 h-4 text-yellow-500 mr-1" />,
    critical: <XOctagon className="inline w-4 h-4 text-red-500 mr-1" />
  }

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Bell className="w-6 h-6 text-gray-800" /> Notifications
        </h3>
        <button onClick={markAllRead} className="text-sm text-blue-600 hover:underline">Mark All Read</button>
      </div>
      {Object.entries(grouped).map(([category, notes]) => (
        <div key={category} className="mb-5">
          <h4 className="text-md font-semibold capitalize mb-2 border-b pb-1">{category}</h4>
          <ul className="divide-y divide-gray-200 bg-white rounded shadow">
            {notes.map(note => (
              <li key={note.id} className={`p-3 text-sm flex items-start gap-2 ${note.is_read ? 'text-gray-500' : 'text-gray-900 font-medium'}`}>
                <span>{iconByType[note.type] || null}</span>
                <div>
                  <p>{note.title} — {note.message}</p>
                  {!note.is_read && <span className="text-xs text-white bg-blue-500 rounded px-2 ml-2">New</span>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
import React, { useState, useEffect } from 'react'
import axios from '../utils/axios'
import { useNavigate } from 'react-router-dom'

export default function TaskForm() {
  const [form, setForm] = useState({
    title: '', description: '', assignee: '', priority: 'medium',
    difficulty: 'medium', approx_time: 1, deadline: ''
  })
  const [users, setUsers] = useState([])
  const [file, setFile] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    axios.get('/auth/users/').then(res => setUsers(res.data))
  }, [])

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async e => {
    e.preventDefault()
    const formData = new FormData()
    Object.entries(form).forEach(([key, value]) => formData.append(key, value))
    if (file) formData.append('files', file)
    await axios.post('/tasks/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    navigate('/')
  }

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Create New Task</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input name="title" placeholder="Title" required className="w-full border p-2 rounded" onChange={handleChange} />
        <textarea name="description" placeholder="Description" className="w-full border p-2 rounded" onChange={handleChange}></textarea>
        <select name="assignee" className="w-full border p-2 rounded" onChange={handleChange}>
          <option value="">-- Select Assignee --</option>
          {users.map(user => <option key={user.id} value={user.id}>{user.username}</option>)}
        </select>
        <select name="priority" className="w-full border p-2 rounded" onChange={handleChange}>
          <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
        </select>
        <select name="difficulty" className="w-full border p-2 rounded" onChange={handleChange}>
          <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
        </select>
        <input name="approx_time" type="number" step="0.1" placeholder="Approx Time (hrs)" className="w-full border p-2 rounded" onChange={handleChange} />
        <input name="deadline" type="datetime-local" className="w-full border p-2 rounded" onChange={handleChange} />
        <input type="file" onChange={e => setFile(e.target.files[0])} />
        <button className="bg-green-600 text-white px-4 py-2 rounded">Create Task</button>
      </form>
    </div>
  )
}
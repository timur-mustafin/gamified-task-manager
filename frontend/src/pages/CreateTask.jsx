import React, { useState, useEffect, useContext } from 'react'
import axios from '../utils/axios'
import { useNavigate } from 'react-router-dom'
import AuthContext from '../context/AuthContext'

export default function CreateTask() {
  const { user } = useContext(AuthContext)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('medium')
  const [difficulty, setDifficulty] = useState('medium')
  const [approxTime, setApproxTime] = useState(1)
  const [deadline, setDeadline] = useState('')
  const [assignee, setAssignee] = useState('')
  const [users, setUsers] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    axios.get('/auth/users/').then(res => setUsers(res.data))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        title,
        description,
        priority,
        difficulty,
        approx_time: approxTime,
        deadline,
        assignee_id: assignee
      }
      await axios.post('/tasks/', payload)
      navigate('/dashboard')
    } catch (err) {
      console.error('Failed to create task:', err)
      alert('Failed to create task.')
    }
  }

  return (
    <div className="p-8 mt-[1rem] max-w-2xl mx-auto bg-surface text-main dark:bg-dark-blue dark:text-main-dark transition-bg transition-text rounded shadow-soft">
      <h2 className="text-2xl font-bold mb-6">📝 Create New Task</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Task Title"
          required
          className="w-full p-2 border rounded bg-white dark:bg-gray-900 text-main dark:text-main-dark"
        />
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Task Description"
          required
          className="w-full p-2 border rounded bg-white dark:bg-gray-900 text-main dark:text-main-dark"
        />

        <div className="flex gap-4">
          <select
            value={priority}
            onChange={e => setPriority(e.target.value)}
            className="w-full p-2 border rounded bg-white dark:bg-gray-900 text-main dark:text-main-dark"
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>

          <select
            value={difficulty}
            onChange={e => setDifficulty(e.target.value)}
            className="w-full p-2 border rounded bg-white dark:bg-gray-900 text-main dark:text-main-dark"
          >
            <option value="low">Low Difficulty</option>
            <option value="medium">Medium Difficulty</option>
            <option value="high">High Difficulty</option>
          </select>
        </div>

        <input
          type="number"
          min="1"
          value={approxTime}
          onChange={e => setApproxTime(e.target.value)}
          placeholder="Approx Time (hrs)"
          className="w-full p-2 border rounded bg-white dark:bg-gray-900 text-main dark:text-main-dark"
        />

        <input
          type="datetime-local"
          value={deadline}
          onChange={e => setDeadline(e.target.value)}
          className="w-full p-2 border rounded bg-white dark:bg-gray-900 text-main dark:text-main-dark"
        />

        <select
          value={assignee}
          onChange={e => setAssignee(e.target.value)}
          className="w-full p-2 border rounded bg-white dark:bg-gray-900 text-main dark:text-main-dark"
        >
          <option value="">-- Assign To --</option>
          {users.map(u => (
            <option key={u.id} value={u.id}>{u.username}</option>
          ))}
        </select>

        <button
          type="submit"
          className="bg-button text-buttonText dark:bg-button-dark dark:text-buttonText-dark px-4 py-2 rounded shadow-soft hover:bg-buttonHover dark:hover:bg-button-hover-dark transition-bg transition-text"
        >
          + Create Task
        </button>
      </form>
    </div>
  )
}

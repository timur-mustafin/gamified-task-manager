import React, { useEffect, useState, useContext } from 'react'
import axios from '../utils/axios'
import AuthContext from '../context/AuthContext'
import { Link, useNavigate } from 'react-router-dom'
import { useAlert } from '../context/AlertContext'

export default function TaskDashboard() {
  console.log('🧪 Dashboard loaded')

  const { user } = useContext(AuthContext)
  const { confirm, notify } = useAlert()
  const [tasks, setTasks] = useState([])
  const [activeTab, setActiveTab] = useState('giver')
  const navigate = useNavigate()

  const fetchTasks = () => {
    axios.get('/tasks/').then(res => setTasks(res.data))
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  const handleDelete = async (taskId) => {
    const accepted = await confirm('Are you sure you want to delete this task?')
    if (!accepted) return
    try {
      await axios.delete(`/tasks/${taskId}/`)
      notify('Task deleted.')
      fetchTasks()
    } catch (err) {
      console.error(err)
      notify('Failed to delete task.')
    }
  }

  const filteredTasks = tasks.filter(task =>
    activeTab === 'giver' ? task.giver.id === user.id : task.assignee?.id === user.id
  )

  return (
    <div className="p-8 bg-surface dark:bg-dark-blue text-main dark:text-main-dark border border-border dark:border-border-dark shadow-soft transition-bg transition-text min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-black-600 dark:text-white-400">
          Your Task Dashboard:
        </h2>
        <button
          onClick={() => navigate('/create-task')}
          className="bg-button text-buttonText dark:bg-button-dark dark:text-buttonText-dark px-4 py-2 rounded shadow-soft hover:bg-buttonHover dark:hover:bg-button-hover-dark transition-bg transition-text"
        >
          + Create Task
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 mb-6">
        {['giver', 'assignee'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded ${
              activeTab === tab
                ? 'bg-accent text-white dark:bg-accent-dark'
                : 'bg-subtle text-white dark:bg-subtle-dark'
            }`}
          >
            {tab === 'giver' ? 'Giver Tasks' : 'Assignee Tasks'}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="space-y-4">
        {filteredTasks.map(task => (
          <div
            key={task.id}
            className="bg-white dark:bg-surface-dark text-main dark:text-main-dark p-4 rounded shadow transition-bg transition-text"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">{task.title}</h3>
              {(user.id === task.giver.id || user.role === 'admin') && (
                <button
                  onClick={() => handleDelete(task.id)}
                  title="Delete Task"
                  className="p-2 rounded bg-red-600 text-white hover:bg-red-700"
                >
                  Delete task ❌
                </button>
              )}
            </div>
            <p className="text-sm text-subtle dark:text-subtle-dark">{task.description_preview}</p>
            <div className="mt-2 text-sm space-y-1">
              <p><strong>Status:</strong> {task.status_display}</p>
              <p><strong>Priority:</strong> {task.priority}</p>
              <p><strong>Difficulty:</strong> {task.difficulty}</p>
              <p><strong>Deadline:</strong> {task.deadline || 'N/A'}</p>
              <Link
                to={`/tasks/${task.id}`}
                className="text-accent dark:text-accent-dark underline mt-2 inline-block"
              >
                View Details
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

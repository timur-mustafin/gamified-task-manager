import React, { useEffect, useState, useContext } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import axios from '../utils/axios'
import AuthContext from '../context/AuthContext'
import TaskTimer from '../components/TaskTimer'
import { useAlert } from '../context/AlertContext'
import { format } from 'timeago.js'
import CommentBox from '../components/CommentBox'

export default function TaskDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useContext(AuthContext)
  const { confirm, notify } = useAlert()

  const [task, setTask] = useState(null)
  const [feedback, setFeedback] = useState({ rating: 5, comment: '' })
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [logs, setLogs] = useState([])
  const [sortAsc, setSortAsc] = useState(false)

  const fetchTask = () => axios.get(`/tasks/${id}/`).then(res => setTask(res.data))

  useEffect(() => {
    const fetchLogs = async () => {
      const res = await axios.get(`/tasks/${id}/logs/`)
      const sorted = sortAsc
        ? [...res.data].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
        : [...res.data].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      setLogs(sorted)
    }

    const fetchComments = async () => {
      const res = await axios.get(`/tasks/${id}/comments/`)
      setComments(res.data)
    }

    if (id) {
      fetchTask()
      fetchLogs()
      fetchComments()
    }
  }, [id, sortAsc])

  const postAction = async (endpoint) => {
    try {
      await axios.post(`/tasks/${id}/${endpoint}/`)
      fetchTask()
    } catch (err) {
      notify('Action failed.')
      console.error(err)
    }
  }

  const submitFeedback = async () => {
    try {
      await axios.post(`/tasks/${id}/submit_feedback/`, feedback)
      fetchTask()
      notify('Feedback submitted.')
    } catch (err) {
      console.error(err)
      notify('Failed to submit feedback.')
    }
  }

  const handleDelete = async () => {
    const confirmed = await confirm('Are you sure you want to delete this task?')
    if (!confirmed) return

    try {
      await axios.delete(`/tasks/${id}/`)
      notify('Task deleted.')
      navigate('/dashboard')
    } catch (err) {
      console.error(err)
      notify('Failed to delete task.')
    }
  }

  const submitComment = async () => {
    if (!newComment.trim()) return
    try {
      await axios.post(`/tasks/${id}/comments/`, { text: newComment })
      setNewComment('')
      const res = await axios.get(`/tasks/${id}/comments/`)
      setComments(res.data)
      notify('Comment added!')
    } catch (err) {
      console.error('Submit comment failed:', err.response?.data || err)
      notify('Failed to post comment.')
    }
  }

  const handleDeleteComment = async (commentId) => {
    try {
      await axios.delete(`/tasks/${id}/comments/${commentId}/`)
      setComments(prev => prev.filter(c => c.id !== commentId))
      notify('Comment deleted.')
    } catch (err) {
      console.error(err)
      notify('Failed to delete comment.')
    }
  }

  if (!task) return <div className="p-8">Loading...</div>

  const isAssignee = task.assignee?.id === user.id
  const isGiver = task.giver.id === user.id
  const canFeedback = isGiver && task.status === 'completed' && !task.feedback
  const canDelete = isGiver || user.role === 'admin'

  const statusMap = {
    not_in_work: 'Not in Work',
    in_work: 'In Work',
    not_moderated: 'Awaiting Moderation',
    moderation: 'In Moderation',
    moderation_stopped: 'Moderation Paused',
    completed: 'Completed',
    failed: 'Failed',
    returned: 'Returned to Assignee'
  }

  return (
    <div className="p-8 mt-[2rem] max-w-3xl mx-auto space-y-6 bg-surface dark:bg-dark-blue text-main dark:text-main-dark border border-border dark:border-border-dark rounded-lg shadow-soft transition-bg transition-text">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{task.title}</h2>
        {canDelete && (
          <button onClick={handleDelete} className="p-2 rounded bg-red-600 text-white hover:bg-red-700">Delete Task ❌</button>
        )}
      </div>

      <p className="whitespace-pre-line break-words">{task.description}</p>

      <div className="text-sm text-subtle dark:text-subtle-dark space-y-1">
        <p><strong>Status:</strong><strong className="text-black dark:text-subtle-dark pl-2">{task.status_display}</strong></p>
        <p><strong>Giver:</strong>{' '}<strong><Link to={`/users/${task.giver.id}`} className="text-accent dark:text-accent-dark hover:underline">{(task.giver.first_name || task.giver.last_name) ? `${task.giver.first_name} ${task.giver.last_name}`.trim() : task.giver.username}</Link></strong></p>
        <p><strong>Assignee:</strong>{' '}{task.assignee ? ( <strong><Link to={`/users/${task.assignee.id}`} className="text-accent dark:text-accent-dark hover:underline">{(task.assignee.first_name || task.assignee.last_name) ? `${task.assignee.first_name} ${task.assignee.last_name}`.trim() : task.assignee.username}</Link></strong> ) : 'Unassigned'}</p>
        <p><strong>Priority:</strong> {task.priority}</p>
        <p><strong>Difficulty:</strong> {task.difficulty}</p>
        <p><strong>Estimated Time:</strong> {task.approx_time} hours</p>
        <p><strong>Created At:</strong>{' '}<strong className="text-xs font-mono text-subtle dark:text-subtle-dark pl-4">{new Date(task.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })},{' '}{new Date(task.created_at).toLocaleDateString()} — {format(task.created_at)}</strong></p>
        <p><strong>Updated At:</strong>{' '}<strong className="text-xs font-mono text-subtle dark:text-subtle-dark pl-2">{new Date(task.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })},{' '}{new Date(task.updated_at).toLocaleDateString()} — {format(task.updated_at)}</strong></p>
        <p><strong>Deadline:</strong>{' '}<strong className="text-xs font-mono text-subtle dark:text-subtle-dark pl-7">{task.deadline  ? `${new Date(task.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })},  ${new Date(task.deadline).toLocaleDateString()} — ${format(task.deadline)}` : 'N/A'}</strong></p> 
        <p><strong>EXP Earned:</strong> {task.exp_earned}</p>
        <p><strong>Honor Earned:</strong> {task.honor_earned}</p>
      </div>

      {isAssignee && <TaskTimer taskId={task.id} refresh={fetchTask} />}

      {isAssignee && (
        <button onClick={() => postAction('mark_done')} className="bg-button text-buttonText dark:bg-button-dark dark:text-buttonText-dark hover:bg-buttonHover dark:hover:bg-button-hover-dark px-4 py-2 rounded shadow-soft">
          ✅ Mark Done
        </button>
      )}
      {isGiver && (
        <div className="flex flex-wrap gap-3">
          {task.status === "not_moderated" && (
            <button
              onClick={() => postAction("start_moderation")}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Start Moderation
            </button>
          )}
          {task.status === "moderation" && (
            <button
              onClick={() => postAction("stop_moderation")}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Stop Moderation
            </button>
          )}
          {["moderation_stopped", "ready_for_decision"].includes(task.status) && (
            <>
              <button
                onClick={() => postAction("return_to_assignee")}
                className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
              >
                Return to Assignee
              </button>
              <button
                onClick={() => postAction("mark_failed")}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                ❌ Mark Failed
              </button>
              <button
                onClick={() => postAction("mark_completed")}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                ✅ Mark Completed
              </button>
            </>
          )}
        </div>
      )}

      <div className="mt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">💬 Comments</h3>
        </div>
        <div className="space-y-4 mb-4">
          {comments.map(comment => (
            <CommentBox key={comment.id} comment={comment} canDelete={user.id === task.giver.id} onDelete={handleDeleteComment} />
          ))}
        </div>
        <div className="flex gap-2">
          <input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Write a comment using **markdown**..." className="flex-1 border p-2 rounded" />
          <button onClick={submitComment} className="bg-button text-buttonText dark:bg-button-dark dark:text-buttonText-dark px-4 py-2 rounded hover:bg-buttonHover dark:hover:bg-button-hover-dark">Post</button>
        </div>
      </div>

      {(isGiver || isAssignee) && (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">📖 Task History</h3>
            <button
              onClick={() => setSortAsc(!sortAsc)}
              className="text-sm text-accent dark:text-accent-dark hover:underline"
            >
              <strong>Sort:</strong> {sortAsc ? 'Oldest First' : 'Newest First'}
            </button>
          </div>

          <ul className="space-y-4 text-sm">
            {logs.map(log => (
              <li
                key={log.id}
                className="p-3 rounded border border-border dark:border-border-dark bg-white dark:bg-gray-800 shadow-sm"
              >
                <div>
                  <Link
                    to={`/users/${log.user.id}`}
                    className="text-accent dark:text-accent-dark font-medium hover:underline"
                  >
                    {log.user.first_name || log.user.last_name
                      ? `${log.user.first_name} ${log.user.last_name}`.trim()
                      : log.user.username}
                  </Link>{' '}
                  changed status:
                </div>
                <div className="pl-4">
                  from <strong className="text-xs">{statusMap[log.old_status]}</strong> to <strong className="text-xs">{statusMap[log.new_status]}</strong>
                </div>
                <div className="text-xs font-mono text-subtle dark:text-subtle-dark mt-1 pl-4">
                  at <strong>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>,{' '}
                  {new Date(log.timestamp).toLocaleDateString()} — <strong>{format(log.timestamp)}</strong>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {canFeedback && (
        <div className="mt-6">
          <h3 className="text-xl font-semibold mb-2">Submit Feedback</h3>
          <select className="w-full border p-2 mb-2 rounded" value={feedback.rating} onChange={e => setFeedback({ ...feedback, rating: e.target.value })}>
            {[1, 2, 3, 4, 5].map(r => <option key={r} value={r}>{r} Star</option>)}
          </select>
          <textarea value={feedback.comment} onChange={e => setFeedback({ ...feedback, comment: e.target.value })} placeholder="Leave a comment..." className="w-full border p-2 rounded mb-2" />
          <button onClick={submitFeedback} className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">Submit Feedback</button>
        </div>
      )}

    </div>
  )
}
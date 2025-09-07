import React, { useEffect, useState, useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios, { mediaUrl } from '../utils/axios'
import AuthContext from '../context/AuthContext'
import { useAlert } from '../context/AlertContext'
import { format } from 'timeago.js'

export default function PublicProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useContext(AuthContext)
  const { notify } = useAlert()

  const [profile, setProfile] = useState(null)
  const [comments, setComments] = useState({ results: [], next: null, previous: null })
  const [testimonials, setTestimonials] = useState([])
  const [newComment, setNewComment] = useState('')

  const fetchAll = async () => {
    try {
      const [profileRes, commentsRes, testimonialsRes] = await Promise.all([
        axios.get(`/auth/public-profile/${id}/`),
        axios.get(`/auth/public-profile/${id}/comments/`),
        axios.get(`/auth/public-profile/${id}/testimonials/`)
      ])
      setProfile(profileRes.data)
      setComments(commentsRes.data || { results: [] })
      setTestimonials(testimonialsRes.data.results || testimonialsRes.data || [])
    } catch (err) {
      console.error("❌ Failed to fetch public profile data", err)
      notify('Error loading profile')
    }
  }

  useEffect(() => {
    fetchAll()
  }, [id])

  const fetchComments = async (url) => {
    try {
      const res = await axios.get(url)
      setComments(res.data || { results: [] })
    } catch (err) {
      console.error('❌ Failed to fetch comments:', err)
      notify('Failed to load comments')
    }
  }

  const submitComment = async () => {
    if (!newComment.trim()) return
    try {
      await axios.post(`/auth/public-profile/${id}/comments/`, { text: newComment })
      setNewComment('')
      fetchComments(`/auth/public-profile/${id}/comments/`)
    } catch (err) {
      console.error('❌ Comment failed:', err)
      notify('Failed to submit comment')
    }
  }

  if (!profile) return <div className="p-8">Loading profile...</div>

  return (
    <div className="p-8 mt-[1.5rem] max-w-4xl mx-auto text-main dark:text-main-dark transition-bg transition-text">
      {/* === Avatar + Basic Info === */}
      <div className="flex items-center space-x-4">
        {profile.avatar ? (
          <img
            src={profile.avatar.startsWith('http') ? profile.avatar : `${mediaUrl}${profile.avatar}`}
            alt="avatar"
            className="w-20 h-20 rounded-full border-4 border-yellow-400 object-cover"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center text-white text-xl">?</div>
        )}
        <div>
          <h2 className="text-2xl font-bold">
            {profile.first_name} {profile.last_name}
          </h2>
          <p className="text-sm text-subtle dark:text-subtle-dark italic">({profile.username})</p>
          <p className="text-sm mt-1">
            {profile.is_online ? (
              <span className="text-green-500">🟢 Online</span>
            ) : profile.last_seen ? (
              <span className="text-gray-500">⚪ Last seen {format(profile.last_seen)}</span>
            ) : (
              <span className="text-gray-500">⚪ Offline</span>
            )}
          </p>
          <p>{profile.job_position || '—'}</p>
          <p className="text-sm text-subtle dark:text-subtle-dark">
            Level {profile.level} | EXP: {profile.exp} | Honor: {profile.honor}
          </p>
        </div>
      </div>

      {/* === Edit Button (Only For Owner) === */}
      {user?.id === parseInt(id) && (
        <div className="mt-4">
          <button
            onClick={() => navigate('/profile')}
            className="px-4 py-2 bg-button text-buttonText dark:bg-button-dark dark:text-buttonText-dark hover:bg-buttonHover dark:hover:bg-button-hover-dark rounded"
          >
            Edit My Profile
          </button>
        </div>
      )}

      {/* === About Me === */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold">About Me</h3>
        <p className="text-sm text-main dark:text-main-dark">{profile.about_me || 'No bio yet.'}</p>
      </div>

      {/* === Testimonials === */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">Testimonials</h3>
        {testimonials.length > 0 ? (
          <ul className="space-y-2 text-sm text-main dark:text-main-dark">
            {testimonials.map((t, i) => (
              <li key={i} className="border rounded p-2">
                <strong>{t.giver?.username || 'Anonymous'}:</strong> {t.comment}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-subtle dark:text-subtle-dark">No testimonials yet.</p>
        )}
      </div>

      {/* === Comments Section === */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">Comments</h3>

        {/* Input */}
        <div className="flex space-x-2 mb-4">
          <input
            type="text"
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder="Leave a comment..."
            className="flex-grow p-2 border rounded bg-surface dark:bg-gray-800 text-main dark:text-main-dark"
          />
          <button
            onClick={submitComment}
            className="bg-button text-buttonText dark:bg-button-dark dark:text-buttonText-dark px-4 py-2 rounded hover:bg-buttonHover dark:hover:bg-button-hover-dark"
          >
            Post
          </button>
        </div>

        {/* List */}
        {comments.results.length > 0 ? (
          <ul className="space-y-2 text-sm text-main dark:text-main-dark">
            {comments.results.map((c, i) => (
              <li key={i} className="border rounded p-2">
                <strong>{c.user?.username || 'Guest'}:</strong> {c.text}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-subtle dark:text-subtle-dark">No comments yet.</p>
        )}

        {/* Pagination */}
        <div className="flex justify-between mt-4">
          {comments.previous && (
            <button onClick={() => fetchComments(comments.previous)} className="text-accent dark:text-accent-dark hover:underline">
              ← Previous
            </button>
          )}
          {comments.next && (
            <button onClick={() => fetchComments(comments.next)} className="text-accent dark:text-accent-dark hover:underline ml-auto">
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

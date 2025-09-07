
import React from 'react'
import { Link } from 'react-router-dom'
import { format } from 'timeago.js'

export default function CommentBox({ comment, currentUserId, onDelete }) {
  const isDeletable = comment.user.id === currentUserId || comment.user.role === 'admin'

  return (
    <div className="p-3 rounded border border-border dark:border-border-dark bg-white dark:bg-gray-800 shadow-sm transition-opacity duration-300 fade-in">
      <p className="text-sm text-main dark:text-main-dark">
        <Link to={`/users/${comment.user.id}`} className="text-accent dark:text-accent-dark hover:underline font-medium">
        {(comment.user.first_name || comment.user.last_name)
            ? `${comment.user.first_name} ${comment.user.last_name}`.trim()
            : comment.user.username}
        </Link>{' '}
        <span className="text-xs font-mono text-subtle dark:text-subtle-dark">
          at {new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, {new Date(comment.timestamp).toLocaleDateString()} — {format(comment.timestamp)}
        </span>
      </p>
      <div className="pl-2 text-sm text-main dark:text-main-dark prose dark:prose-invert" dangerouslySetInnerHTML={{ __html: comment.rendered_text }} />
      {isDeletable && (
        <button
          onClick={() => onDelete(comment.id)}
          className="mt-2 text-xs text-red-500 hover:underline"
        >
          ❌ Delete
        </button>
      )}
    </div>
  )
}

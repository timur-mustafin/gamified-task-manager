import React, { useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthContext from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

export default function Login() {
  const { login } = useContext(AuthContext)
  const { isDark } = useTheme()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await login(username, password)
      navigate('/dashboard')
    } catch (err) {
      alert('Login failed')
    }
  }

  return (
    <div className="pt-[5rem] px-4 bg-surface text-main dark:bg-surface-dark dark:text-main-dark transition-bg transition-text">
      <form
        onSubmit={handleSubmit}
        className="max-w-md mx-auto bg-white dark:bg-dark-blue text-main dark:text-main-dark p-6 rounded shadow-soft border border-border dark:border-border-dark"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          className="w-full p-2 border rounded mb-4 bg-white dark:bg-gray-800"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full p-2 border rounded mb-4 bg-white dark:bg-gray-800"
          required
        />

        <button
          type="submit"
          className="w-full bg-button text-buttonText dark:bg-button-dark dark:text-buttonText-dark p-2 rounded hover:bg-buttonHover dark:hover:bg-button-hover-dark"
        >
          Login
        </button>

        <p className="mt-4 text-center text-sm text-subtle dark:text-subtle-dark">
          Don’t have an account?{' '}
          <Link to="/register" className="text-accent dark:text-accent-dark hover:underline">
            Register
          </Link>
        </p>
      </form>
    </div>
  )
}

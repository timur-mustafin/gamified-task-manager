import React, { useState } from 'react'
import axios from '../utils/axios'
import { useNavigate } from 'react-router-dom'

export default function Register() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    username: '',
    password: '',
    password2: '',
    job_position: ''
  })

  const [error, setError] = useState('')

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (form.password !== form.password2) {
      setError('Passwords do not match.')
      return
    }

    try {
      await axios.post('/auth/register/', form)
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed.')
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white dark:bg-dark-blue text-main dark:text-main-dark rounded shadow-soft transition-bg transition-text">
      <h2 className="text-2xl font-bold mb-4">Register</h2>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name Section */}
        <div className="flex space-x-2">
          <input
            name="first_name"
            placeholder="First Name"
            value={form.first_name}
            onChange={handleChange}
            className="w-1/2 p-2 border rounded"
          />
          <input
            name="last_name"
            placeholder="Last Name"
            value={form.last_name}
            onChange={handleChange}
            className="w-1/2 p-2 border rounded"
          />
        </div>

        {/* Account Info */}
        <input
          name="username"
          placeholder="Nickname / Login"
          value={form.username}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
        <input
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />

        {/* Security */}
        <input
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
        <input
          name="password2"
          type="password"
          placeholder="Confirm Password"
          value={form.password2}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />

        {/* Optional Info */}
        <input
          name="job_position"
          placeholder="Job Position (optional)"
          value={form.job_position}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />

        <button
          type="submit"
          className="w-full bg-button text-buttonText dark:bg-button-dark dark:text-buttonText-dark px-4 py-2 rounded shadow-soft hover:bg-buttonHover dark:hover:bg-button-hover-dark"
        >
          Register
        </button>
      </form>

      {/* Already Registered */}
      <p className="mt-4 text-center text-sm text-subtle dark:text-subtle-dark">
        Already have an account?{' '}
        <a href="/login" className="text-accent dark:text-accent-dark hover:underline">
          Log in here
        </a>
      </p>
    </div>
  )
}

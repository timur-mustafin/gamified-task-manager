import React, { useContext, useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthContext from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { usePopup } from '../context/PopupContext'
import { mediaUrl } from '../utils/axios'

export default function Navbar() {
  const { user, logout } = useContext(AuthContext)
  const { isDark, toggleTheme } = useTheme()
  const { showPopup } = usePopup()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef()

  const toggleMenu = () => setMenuOpen(!menuOpen)

  const guardedNavigate = (target) => {
    if (location.pathname === target) {
      showPopup('You are already there')
    } else {
      navigate(target)
    }
  }

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-surface dark:bg-dark-blue text-main dark:text-main-dark transition-bg transition-text shadow p-4 flex justify-between items-center">
      <div className="text-xl font-bold">
        <Link to="/">Gemified&nbsp;Task&nbsp;Manager • ⚡GTM RPG⚡</Link>
      </div>

      {user ? (
        <div className="flex items-center space-x-6">
          <button onClick={() => guardedNavigate('/dashboard')} className="hover:text-accent dark:hover:text-accent-dark">Dashboard</button>
          <button onClick={() => guardedNavigate('/hall-of-fame')} className="hover:text-accent dark:hover:text-accent-dark">Hall of Fame</button>
          <button onClick={() => guardedNavigate('/store')} className="hover:text-accent dark:hover:text-accent-dark">The Honor Store</button>

          <div className="relative" ref={menuRef}>
            <button onClick={toggleMenu} className="flex items-center space-x-2">
              {user.avatar ? (
                <img src={`${mediaUrl}${user.avatar}`} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 bg-gray-300 text-white rounded-full flex items-center justify-center text-sm">
                  {user.username[0]?.toUpperCase()}
                </div>
              )}
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-surface dark:bg-surface-dark shadow-md border rounded z-10 text-main dark:text-main-dark transition-bg transition-text">
                {/* Theme Toggle for Logged-in Users */}
                <div className="flex items-center justify-between px-4 py-2">
                  <span className="text-sm">Dark Mode</span>
                  <label className="inline-flex items-center cursor-pointer relative w-11 h-6">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={isDark}
                      onChange={toggleTheme}
                    />
                    <div className="w-full h-full bg-gray-300 dark:bg-gray-600 peer-checked:bg-blue-600 rounded-full transition-colors duration-300" />
                    <span className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-300 hover:scale-105 active:scale-95 peer-checked:translate-x-5" />
                  </label>
                </div>

                <button onClick={() => guardedNavigate(`/users/${user?.id}`)} className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700">Profile</button>
                <button onClick={() => guardedNavigate('/settings')} className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700">Settings</button>
                {user.role === 'admin' && (
                <button onClick={() => guardedNavigate('/admin')} className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700">Admin Tools</button>
                )}


                <button
                  onClick={() => {
                    logout()
                    navigate('/login')
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-red-500"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        // Theme toggle for unauthorized users
        <div className="flex items-center space-x-4">
          <label className="inline-flex items-center cursor-pointer relative w-11 h-6">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={isDark}
              onChange={toggleTheme}
            />
            <div className="w-full h-full bg-gray-300 dark:bg-gray-600 peer-checked:bg-blue-600 rounded-full transition-colors duration-300" />
            <span className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-300 hover:scale-105 active:scale-95 peer-checked:translate-x-5" />
          </label>
          <span className="text-sm text-subtle dark:text-subtle-dark">Dark Mode</span>
        </div>
      )}
    </nav>
  )
}

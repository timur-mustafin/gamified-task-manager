import React, { useContext } from 'react'
import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import ProtectedRoute from './components/ProtectedRoute'
import TaskDetail from './pages/TaskDetail'
import Store from './pages/Store'
import PublicProfile from './pages/PublicProfile'
import AdminDashboard from './pages/AdminDashboard'
import AdminUserManager from './pages/AdminUserManager'
import NotificationTray from './components/NotificationTray'
import Navbar from './components/Navbar'
import TaskDashboard from './pages/Dashboard'
import CreateTask from './pages/CreateTask'
import Settings from './pages/Settings'
import HallOfFame from './pages/HallOfFame'
import AdminStoreManager from './pages/AdminStoreManager'
import AuthContext from './context/AuthContext'

export default function App() {
  const { user } = useContext(AuthContext)
  return (
    <div className="min-h-screen pt-[4.2rem] bg-surface text-main dark:bg-surface-dark dark:text-main-dark transition-bg transition-text">
      <Navbar />
      <Routes>
      {user?.role === 'admin' && (
        <>
          <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute><AdminUserManager /></ProtectedRoute>} />
          <Route path="/admin/store" element={<ProtectedRoute><AdminStoreManager /></ProtectedRoute>} />
        </>
      )}
        <Route path="/users/:id" element={<ProtectedRoute><PublicProfile /></ProtectedRoute>} />
        <Route path="/store" element={<ProtectedRoute><Store /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationTray /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><TaskDashboard /></ProtectedRoute>} />
        <Route path="/hall-of-fame" element={<ProtectedRoute><HallOfFame /></ProtectedRoute>} />
        <Route path="/tasks/:id" element={<ProtectedRoute><TaskDetail /></ProtectedRoute>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/" element={<ProtectedRoute><div className="p-8 text-center space-y-6 text-subtle dark:text-subtle-dark">
          <h1 className="pt-[5rem] text-3xl font-bold text-accent dark:text-accent-dark">
            Welcome to the Gamified Task Manager
          </h1>

          <p>Development Directed by <strong>BushidoCoder</strong> aka Timur Mustafin</p>
          <p>
            Refactored, Mastered, Polished and BackedUp by <strong>Code Bothers</strong> — Timur Mustafin & ChatGPT4o
          </p>

          <p className="text-sm text-subtle dark:text-subtle-dark italic">
            Thank you OpenAI for making my dream come true.
          </p>
          <p className="text-xs mt-8 opacity-70">
            P.S. If you're reading this and you're a recruiter, please hire me — I build things with my heart. 💙 
          </p>
        </div>
        </ProtectedRoute>} />
        <Route path="/create-task" element={<ProtectedRoute><CreateTask /></ProtectedRoute>} />
      </Routes>
    </div>
  )
}

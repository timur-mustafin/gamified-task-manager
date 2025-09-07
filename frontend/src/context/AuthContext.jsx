import React, { createContext, useState, useEffect } from 'react'
import axios from '../utils/axios'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')))
  const [access, setAccess] = useState(() => localStorage.getItem('access'))
  const [refresh, setRefresh] = useState(() => localStorage.getItem('refresh'))

  useEffect(() => {
    if (refresh) {
      const interval = setInterval(refreshToken, 1000 * 60 * 5)
      return () => clearInterval(interval)
    }
  }, [refresh])

  const login = async (username, password) => {
    const res = await axios.post('/auth/jwt/create/', { username, password })
    setAccess(res.data.access)
    setRefresh(res.data.refresh)
    setUser(res.data.user)
    localStorage.setItem('access', res.data.access)
    localStorage.setItem('refresh', res.data.refresh)
    localStorage.setItem('user', JSON.stringify(res.data.user))
  }

  const updateUser = (updatedUser) => {
    setUser(updatedUser)
    localStorage.setItem('user', JSON.stringify(updatedUser))
  }
  
  const refreshToken = async () => {
    try {
      const res = await axios.post('/auth/jwt/refresh/', { refresh })
      setAccess(res.data.access)
      localStorage.setItem('access', res.data.access)
    } catch (e) {
      logout()
    }
  }

  const logout = () => {
    setUser(null)
    setAccess(null)
    setRefresh(null)
    localStorage.clear()
  }

  return (
    <AuthContext.Provider value={{ user, access, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext
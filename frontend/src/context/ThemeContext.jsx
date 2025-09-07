import { createContext, useContext, useEffect, useState } from 'react'
import axios from '../utils/axios'

const ThemeContext = createContext()

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false)

  // INITIALIZE theme
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"))
    const fallback = localStorage.getItem("guest-theme") === "dark"

    // Priority: logged-in user > guest setting
    const enabled = user?.dark_mode_enabled ?? fallback

    setIsDark(!!enabled)
    document.documentElement.classList.toggle('dark', !!enabled)
  }, [])

  const toggleTheme = async () => {
    const newValue = !isDark
    setIsDark(newValue)
    document.documentElement.classList.toggle('dark', newValue)

    const user = JSON.parse(localStorage.getItem("user"))
    if (!user || !user.id) {
      // Unauthenticated: guest fallback
      localStorage.setItem("guest-theme", newValue ? "dark" : "light")
      return
    }

    try {
      // Persist for authenticated user
      await axios.put('/auth/profile/', { dark_mode_enabled: newValue })
      const updated = await axios.get('/auth/profile/')
      localStorage.setItem("user", JSON.stringify(updated.data))
    } catch (err) {
      console.error("⚠️ Failed to save theme preference:", err)
    }
  }

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)

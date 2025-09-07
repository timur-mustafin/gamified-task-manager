import React, { createContext, useContext, useState, useCallback } from 'react'

const PopupContext = createContext()

export const usePopup = () => useContext(PopupContext)

export const PopupProvider = ({ children }) => {
  const [popup, setPopup] = useState('')
  const [visible, setVisible] = useState(false)

  const showPopup = useCallback((message, duration = 1500) => {
    setPopup(message)
    setVisible(true)

    // Fade out after the duration
    setTimeout(() => setVisible(false), duration)

    // Clear the message just after the fade-out completes
    setTimeout(() => setPopup(''), duration + 300) // allow fade-out transition to finish
  }, [])

  return (
    <PopupContext.Provider value={{ showPopup }}>
      {children}

      {popup && (
        <div
          className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-accent text-white px-4 py-2 rounded shadow z-50 transition-opacity duration-300 ${
            visible ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {popup}
        </div>
      )}
    </PopupContext.Provider>
  )
}

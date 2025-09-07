import React, { createContext, useContext, useState, useCallback } from 'react'

const AlertContext = createContext()

export const AlertProvider = ({ children }) => {
  const [alert, setAlert] = useState({
    visible: false,
    message: '',
    mode: 'confirm', // or 'info'
    onConfirm: null,
    onCancel: null,
  })

  const confirm = useCallback((message) => {
    return new Promise((resolve) => {
      setAlert({
        visible: true,
        message,
        mode: 'confirm',
        onConfirm: () => {
          setAlert((prev) => ({ ...prev, visible: false }))
          resolve(true)
        },
        onCancel: () => {
          setAlert((prev) => ({ ...prev, visible: false }))
          resolve(false)
        },
      })
    })
  }, [])

  const notify = useCallback((message, duration = 3000) => {
    setAlert({
      visible: true,
      message,
      mode: 'info',
      onConfirm: null,
      onCancel: null,
    })

    // Fade out after delay
    setTimeout(() => {
      setAlert((prev) => ({ ...prev, visible: false }))
    }, duration)

    // Cleanup message completely after transition
    setTimeout(() => {
      setAlert((prev) => ({ ...prev, message: '' }))
    }, duration + 300)
  }, [])

  return (
    <AlertContext.Provider value={{ confirm, notify }}>
      {children}

      {/* Confirm Modal (fade-in) */}
      {alert.message && alert.mode === 'confirm' && (
        <div
          className={`fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 transition-opacity duration-300 ${
            alert.visible ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="bg-surface dark:bg-surface-dark text-main dark:text-main-dark p-6 rounded-lg shadow-lg w-full max-w-sm transition-bg transition-text">
            <p className="mb-4">{alert.message}</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={alert.onConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                OK
              </button>
              <button
                onClick={alert.onCancel}
                className="px-4 py-2 bg-subtle dark:bg-subtle-dark text-white rounded hover:bg-gray-400 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Passive Notification */}
      {alert.message && alert.mode === 'info' && (
        <div
          className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded shadow-soft transition-opacity duration-300
          ${alert.visible ? 'opacity-100' : 'opacity-0'}
          bg-surface dark:bg-surface-dark text-main dark:text-main-dark`}
        >
          {alert.message}
        </div>
      )}
    </AlertContext.Provider>
  )
}

export const useAlert = () => useContext(AlertContext)

import React, { useState } from 'react'
import axios from '../utils/axios'

export default function TaskTimer({ taskId, refresh }) {
  const [timerRunning, setTimerRunning] = useState(false)
  const [startTime, setStartTime] = useState(null)

  const toggleTimer = async () => {
    if (timerRunning) {
      await axios.post(`/tasks/${taskId}/update_status/`, { status: 'not_in_work' })
    } else {
      await axios.post(`/tasks/${taskId}/update_status/`, { status: 'in_work' })
    }
    setTimerRunning(!timerRunning)
    setStartTime(timerRunning ? null : Date.now())
    refresh()
  }

  return (
    <div className="mt-4">
      <button
        onClick={toggleTimer}
        className={`${timerRunning ? 'bg-red-600' : 'bg-green-600'} text-white px-4 py-2 rounded`}
      >
        {timerRunning ? 'Stop Timer' : 'Start Timer'}
      </button>
      {startTime && <p className="mt-2 text-sm text-gray-600">Started at: {new Date(startTime).toLocaleTimeString()}</p>}
    </div>
  )
}
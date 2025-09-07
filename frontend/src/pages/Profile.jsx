import React, { useContext, useEffect, useRef, useState } from 'react'
import AuthContext from '../context/AuthContext'
import { useAlert } from '../context/AlertContext'
import axios, { mediaUrl } from '../utils/axios'

export default function Profile() {
  const { user, updateUser } = useContext(AuthContext)
  const { notify } = useAlert()

  const fileInputRef = useRef(null)

  const [profile, setProfile] = useState(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [aboutMe, setAboutMe] = useState('')
  const [jobPosition, setJobPosition] = useState('')
  const [newAvatarFile, setNewAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [deleteAvatar, setDeleteAvatar] = useState(false)
  const [hoveringAvatar, setHoveringAvatar] = useState(false)

  useEffect(() => {
    axios.get('/auth/profile/').then(res => {
      setProfile(res.data)
      setFirstName(res.data.first_name || '')
      setLastName(res.data.last_name || '')
      setEmail(res.data.email || '')
      setAboutMe(res.data.about_me || '')
      setJobPosition(res.data.job_position || '')
      setAvatarPreview(res.data.avatar ? `${mediaUrl}${res.data.avatar}` : null)
    })
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()

    if (deleteAvatar) {
      await axios.post('/auth/profile/delete_avatar/')
    }

    const formData = new FormData()
    formData.append('first_name', firstName)
    formData.append('last_name', lastName)
    formData.append('email', email)
    formData.append('about_me', aboutMe)
    formData.append('job_position', jobPosition)

    if (newAvatarFile) formData.append('avatar', newAvatarFile)

    await axios.put('/auth/profile/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    const updated = await axios.get('/auth/profile/')
    updateUser(updated.data)
    notify('Profile updated successfully!')
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setNewAvatarFile(file)
      setDeleteAvatar(false)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  const handleAvatarClear = () => {
    setDeleteAvatar(true)
    setNewAvatarFile(null)
    setAvatarPreview(null)
  }

  const expPercent = (profile?.exp || 0) % 100
  const badge =
    profile?.level >= 50 ? 'Gold' :
    profile?.level >= 30 ? 'Silver' :
    profile?.level >= 10 ? 'Bronze' : 'None'

  return profile ? (
    <div className="p-8 mt-[1.5rem] max-w-3xl mx-auto bg-surface text-main dark:bg-surface-dark dark:text-main-dark transition-bg transition-text rounded-lg shadow-soft">
      {/* === Profile Header === */}
      <div className="flex items-center space-x-4">
        <div
          className="relative w-20 h-20"
          onMouseEnter={() => setHoveringAvatar(true)}
          onMouseLeave={() => setHoveringAvatar(false)}
        >
          {avatarPreview ? (
            <img
              src={avatarPreview}
              alt="avatar"
              className="w-20 h-20 rounded-full border-4 border-yellow-400 object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center text-white text-xl">?</div>
          )}

          {hoveringAvatar && (
            <div className="absolute inset-0 flex items-center justify-between px-2">
              <button
                onClick={() => fileInputRef.current.click()}
                title="Change avatar"
                className="text-white bg-black/50 p-1 rounded hover:bg-black"
              >
                ✏️
              </button>
              <button
                onClick={handleAvatarClear}
                title="Remove avatar"
                className="text-white bg-black/50 p-1 rounded hover:bg-black"
              >
                ❌
              </button>
            </div>
          )}
        </div>

        <div>
          <h2 className="text-2xl font-bold">{profile.first_name} {profile.last_name}</h2>
          <p className="text-sm text-subtle dark:text-subtle-dark italic">@{profile.username}</p>
          <p>Level {profile.level} — Badge: {badge}</p>
          <div className="w-full bg-gray-300 dark:bg-gray-700 h-4 rounded">
            <div className="bg-blue-600 h-4 rounded" style={{ width: `${expPercent}%` }}></div>
          </div>
          <p className="text-sm text-subtle dark:text-subtle-dark">{profile.exp} EXP — {profile.honor} Honor</p>
        </div>
      </div>

      {/* === Avatar Upload Field Hidden === */}
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        ref={fileInputRef}
      />

      <p className="text-xs text-subtle dark:text-subtle-dark mt-2">Hover avatar to change or remove it</p>

      {/* === Editable Fields === */}
      <form onSubmit={handleSave} className="mt-6 space-y-4">
        <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First Name" className="w-full p-2 border rounded bg-white dark:bg-gray-900 text-main dark:text-main-dark" />
        <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last Name" className="w-full p-2 border rounded bg-white dark:bg-gray-900 text-main dark:text-main-dark" />
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="w-full p-2 border rounded bg-white dark:bg-gray-900 text-main dark:text-main-dark" />
        <input value={jobPosition} onChange={e => setJobPosition(e.target.value)} placeholder="Job Position" className="w-full p-2 border rounded bg-white dark:bg-gray-900 text-main dark:text-main-dark" />
        <textarea value={aboutMe} onChange={e => setAboutMe(e.target.value)} placeholder="About Me" className="w-full p-2 border rounded bg-white dark:bg-gray-900 text-main dark:text-main-dark" />
        <button className="bg-button text-buttonText dark:bg-button-dark dark:text-buttonText-dark hover:bg-buttonHover dark:hover:bg-button-hover-dark px-4 py-2 rounded shadow-soft transition-bg transition-text">
          Save
        </button>
      </form>
    </div>
  ) : (
    <div className="p-8 text-center text-main dark:text-main-dark">Loading profile...</div>
  )
}

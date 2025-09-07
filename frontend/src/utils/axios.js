import axios from 'axios'

const protocol = import.meta.env.VITE_API_PROTOCOL || 'http'
const host = import.meta.env.VITE_API_HOST || 'localhost:8000'

export const mediaUrl = `${protocol}://${host}`

const instance = axios.create({
  baseURL: `${protocol}://${host}`,
})

instance.interceptors.request.use(config => {
  const token = localStorage.getItem('access')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default instance

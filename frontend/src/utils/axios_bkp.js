
import axios from 'axios'

export const mediaUrl = 'http://localhost:8000'

const instance = axios.create({
  baseURL: 'http://localhost:8000',
})

instance.interceptors.request.use(config => {
  const token = localStorage.getItem('access')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default instance

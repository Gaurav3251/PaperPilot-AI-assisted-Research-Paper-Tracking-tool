import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const API_URL = import.meta.env.VITE_API_URL || ''

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

// The backend serves API routes under "/api/..." but serves uploaded files
// (PDFs) as static files under "/uploads/...", i.e. NOT under "/api".
// VITE_API_URL is usually something like "http://localhost:5002/api", so file
// URLs must be built against the server *origin*, not the API base URL, or
// they resolve to a 404 (this was why uploaded PDFs couldn't be viewed).
const FILE_SERVER_ORIGIN = API_URL.replace(/\/+$/, '').replace(/\/api$/i, '')

/**
 * Turns a relative path returned by the backend (e.g. "/uploads/xyz.pdf")
 * into an absolute URL pointing at the backend's static file server.
 * Absolute URLs (http://, https://) are returned unchanged.
 */
export function getFileUrl(path) {
  if (!path) return null
  if (/^https?:\/\//i.test(path)) return path
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${FILE_SERVER_ORIGIN}${normalized}`
}

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(err)
  },
)

export default api

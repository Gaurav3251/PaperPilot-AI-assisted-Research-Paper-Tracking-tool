import { create } from 'zustand'

export const useAuthStore = create((set) => ({
  token: localStorage.getItem('token'),
  email: localStorage.getItem('email'),
  role: localStorage.getItem('role'),
  login: (payload) => {
    localStorage.setItem('token', payload.token)
    localStorage.setItem('email', payload.email)
    localStorage.setItem('role', payload.role || 'User')
    set({ token: payload.token, email: payload.email, role: payload.role || 'User' })
  },
  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('email')
    localStorage.removeItem('role')
    set({ token: null, email: null, role: null })
  },
}))

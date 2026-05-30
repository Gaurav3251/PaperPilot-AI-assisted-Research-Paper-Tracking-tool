import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { AppShell } from './components/layout/AppShell'
import { DashboardPage } from './pages/DashboardPage'
import { PapersPage } from './pages/PapersPage'
import { PaperDetailsPage } from './pages/PaperDetailsPage'
import { PaperFormPage } from './pages/PaperFormPage'
import { CategoriesTagsPage } from './pages/CategoriesTagsPage'
import { CollectionsPage } from './pages/CollectionsPage'
import { NotesWorkspacePage } from './pages/NotesWorkspacePage'
import { SettingsPage } from './pages/SettingsPage'

function PrivateRoute({ children }) {
  const token = useAuthStore((s) => s.token)
  return token ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />

      <Route path="/app" element={<PrivateRoute><AppShell /></PrivateRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="papers" element={<PapersPage />} />
        <Route path="papers/new" element={<PaperFormPage />} />
        <Route path="papers/:id" element={<PaperDetailsPage />} />
        <Route path="categories-tags" element={<CategoriesTagsPage />} />
        <Route path="collections" element={<CollectionsPage />} />
        <Route path="notes" element={<NotesWorkspacePage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  )
}

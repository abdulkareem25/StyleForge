import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import LandingPage from './pages/LandingPage'
import Dashboard from './pages/Dashboard'
import Wardrobe from './pages/Wardrobe'
import GenerateOutfit from './pages/GenerateOutfit'
import History from './pages/History'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Preferences from './pages/Preferences'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/wardrobe" element={<Wardrobe />} />
        <Route path="/generate" element={<GenerateOutfit />} />
        <Route path="/history" element={<History />} />
        <Route path="/preferences" element={<Preferences />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}

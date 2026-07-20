import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import LandingPage from './pages/LandingPage'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import Wardrobe from './pages/Wardrobe'
import GenerateOutfit from './pages/GenerateOutfit'
import History from './pages/History'
import Preferences from './pages/Preferences'
import AccountSecurity from './pages/AccountSecurity'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/signup" element={<AuthPage />} />
        <Route path="/onboarding" element={<div className="min-h-screen bg-canvas flex items-center justify-center"><p className="text-h2 font-display text-ink">Onboarding — coming soon</p></div>} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/wardrobe" element={<Wardrobe />} />
        <Route path="/generate" element={<GenerateOutfit />} />
        <Route path="/history" element={<History />} />
        <Route path="/preferences" element={<Preferences />} />
        <Route path="/account/security" element={<AccountSecurity />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}

import { Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from './pages/LandingPage'

// Placeholder for AUTH-06 — reserves the /auth route that CTAs link to
function AuthPlaceholder() {
  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center">
      <div className="text-center">
        <p className="text-h2 font-display text-ink">Auth page</p>
        <p className="text-body text-ink/60 mt-2">AUTH-06 — coming soon</p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={<AuthPlaceholder />} />
      {/* Catch-all: redirect unknown routes to landing */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

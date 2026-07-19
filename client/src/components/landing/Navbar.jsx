import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-canvas/95 backdrop-blur-sm shadow-nav' : 'bg-transparent'
      }`}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        <div className="flex items-center justify-between h-16 sm:h-18">

          {/* Logo wordmark */}
          <Link
            to="/"
            className="font-display font-semibold text-[22px] text-ink tracking-tight hover:text-indigo transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo focus:ring-offset-2 rounded-sm"
            aria-label="StyleForge home"
          >
            StyleForge
          </Link>

          {/* Desktop CTAs */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              to="/auth"
              id="nav-login"
              className="px-4 py-2 text-body font-medium text-ink border border-ink rounded-card hover:bg-ink/5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo focus:ring-offset-2"
            >
              Log In
            </Link>
            <Link
              to="/auth"
              id="nav-signup"
              className="px-4 py-2 text-body font-medium text-white bg-indigo rounded-card hover:bg-indigo/90 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo focus:ring-offset-2 shadow-sm"
            >
              Sign Up
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="sm:hidden p-2 rounded-card text-ink hover:bg-ink/5 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={20} strokeWidth={1.5} /> : <Menu size={20} strokeWidth={1.5} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      <div
        className={`sm:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          mobileOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="bg-canvas/97 backdrop-blur-sm border-t border-line px-4 py-4 flex flex-col gap-3">
          <Link
            to="/auth"
            id="mobile-login"
            className="w-full text-center px-4 py-2.5 text-body font-medium text-ink border border-ink rounded-card hover:bg-ink/5 transition-colors"
            onClick={() => setMobileOpen(false)}
          >
            Log In
          </Link>
          <Link
            to="/auth"
            id="mobile-signup"
            className="w-full text-center px-4 py-2.5 text-body font-medium text-white bg-indigo rounded-card hover:bg-indigo/90 transition-colors"
            onClick={() => setMobileOpen(false)}
          >
            Sign Up — it's free
          </Link>
        </div>
      </div>
    </nav>
  )
}

import { Link } from 'react-router-dom'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer
      className="bg-canvas border-t border-line py-10 px-6 sm:px-10 lg:px-16 xl:px-24"
      role="contentinfo"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">

        {/* Logo + tagline */}
        <div>
          <Link
            to="/"
            className="font-display font-semibold text-body-lg text-ink hover:text-indigo transition-colors focus:outline-none focus:ring-2 focus:ring-indigo focus:ring-offset-2 rounded-card"
            aria-label="StyleForge home"
          >
            StyleForge
          </Link>
          <p className="text-micro text-ink/40 mt-1">
            Your wardrobe · Smarter
          </p>
        </div>

        {/* Minimal nav links */}
        <nav aria-label="Footer navigation">
          <ul className="flex items-center flex-wrap gap-x-6 gap-y-2">
            <li>
              <Link
                to="/auth"
                id="footer-signup"
                className="text-body text-ink/60 hover:text-indigo transition-colors focus:outline-none focus:ring-2 focus:ring-indigo focus:ring-offset-1 rounded-card"
              >
                Sign Up
              </Link>
            </li>
            <li>
              <Link
                to="/auth"
                id="footer-login"
                className="text-body text-ink/60 hover:text-indigo transition-colors focus:outline-none focus:ring-2 focus:ring-indigo focus:ring-offset-1 rounded-card"
              >
                Log In
              </Link>
            </li>
          </ul>
        </nav>

        {/* Copyright */}
        <p className="text-caption text-ink/35 sm:text-right">
          © {year} StyleForge. All rights reserved.
        </p>
      </div>
    </footer>
  )
}

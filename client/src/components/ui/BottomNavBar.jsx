import { NavLink } from 'react-router-dom'
import { Shirt, Sparkles, Clock, User } from 'lucide-react'

const navItems = [
  { to: '/wardrobe', label: 'Wardrobe', icon: Shirt },
  { to: '/generate', label: 'Generate', icon: Sparkles },
  { to: '/history', label: 'History', icon: Clock },
  { to: '/preferences', label: 'Profile', icon: User },
]

export default function BottomNavBar({ className = '' }) {
  return (
    <nav
      className={`fixed bottom-0 inset-x-0 z-40 bg-canvas/95 backdrop-blur-sm border-t border-line sm:hidden ${className}`}
      aria-label="Main navigation"
    >
      <ul className="flex items-center justify-around h-16 px-2">
        {navItems.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-3 py-1.5 rounded-card transition-colors focus:outline-none focus:ring-2 focus:ring-indigo ${
                  isActive ? 'text-indigo' : 'text-ink/40'
                }`
              }
            >
              <Icon size={20} strokeWidth={1.5} />
              <span className="text-caption">{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

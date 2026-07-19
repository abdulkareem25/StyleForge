import { useEffect, useRef, useCallback } from 'react'
import { X } from 'lucide-react'
import { createPortal } from 'react-dom'

function getFocusableElements(container) {
  return container.querySelectorAll(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )
}

export default function Drawer({
  open,
  onClose,
  title,
  children,
  side = 'bottom',
  className = '',
}) {
  const panelRef = useRef(null)
  const previousFocusRef = useRef(null)

  const sideClasses = {
    bottom: 'inset-x-0 bottom-0 max-sm:rounded-t-modal sm:rounded-t-modal',
    left: 'inset-y-0 left-0 w-80 max-w-[85vw]',
    right: 'inset-y-0 right-0 w-80 max-w-[85vw]',
  }

  const handleEscape = useCallback(
    (e) => {
      if (e.key === 'Escape') onClose?.()
    },
    [onClose]
  )

  const handleFocusTrap = useCallback((e) => {
    if (e.key !== 'Tab' || !panelRef.current) return
    const focusable = getFocusableElements(panelRef.current)
    if (focusable.length === 0) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault()
        last.focus()
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }, [])

  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement
      document.body.style.overflow = 'hidden'
      document.addEventListener('keydown', handleEscape)
      document.addEventListener('keydown', handleFocusTrap)
      requestAnimationFrame(() => {
        panelRef.current?.focus()
      })
    }
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleEscape)
      document.removeEventListener('keydown', handleFocusTrap)
      if (previousFocusRef.current?.focus) {
        previousFocusRef.current.focus()
      }
    }
  }, [open, handleEscape, handleFocusTrap])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'drawer-title' : undefined}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        tabIndex={-1}
        className={`absolute bg-surface shadow-lg outline-none overflow-y-auto transition-transform duration-300 ease-in-out ${sideClasses[side]} ${className}`}
      >
        {/* Handle bar for bottom drawer on mobile */}
        {side === 'bottom' && (
          <div className="flex justify-center pt-3 sm:hidden">
            <div className="w-10 h-1 rounded-full bg-ink/20" />
          </div>
        )}

        {/* Header */}
        {(title || onClose) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-line sticky top-0 bg-surface z-10">
            {title && (
              <h2 id="drawer-title" className="text-h2 font-display text-ink">
                {title}
              </h2>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 text-ink/40 hover:text-ink rounded-full hover:bg-ink/5 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo"
                aria-label="Close drawer"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>,
    document.body
  )
}

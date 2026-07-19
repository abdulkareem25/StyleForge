import { useEffect, useRef, useCallback } from 'react'
import { X } from 'lucide-react'
import { createPortal } from 'react-dom'

function getFocusableElements(container) {
  return container.querySelectorAll(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )
}

export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  className = '',
}) {
  const overlayRef = useRef(null)
  const contentRef = useRef(null)
  const previousFocusRef = useRef(null)

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full',
  }

  const handleEscape = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        onClose?.()
      }
    },
    [onClose]
  )

  const handleFocusTrap = useCallback(
    (e) => {
      if (e.key !== 'Tab' || !contentRef.current) return
      const focusable = getFocusableElements(contentRef.current)
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
    },
    []
  )

  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement
      document.body.style.overflow = 'hidden'
      document.addEventListener('keydown', handleEscape)
      document.addEventListener('keydown', handleFocusTrap)
      // Focus the modal content after render
      requestAnimationFrame(() => {
        contentRef.current?.focus()
      })
    }

    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleEscape)
      document.removeEventListener('keydown', handleFocusTrap)
      // Restore focus
      if (previousFocusRef.current && previousFocusRef.current.focus) {
        previousFocusRef.current.focus()
      }
    }
  }, [open, handleEscape, handleFocusTrap])

  if (!open) return null

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {/* Backdrop — dimmed, marks background inert */}
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal panel — full-screen on mobile, centered card on desktop */}
      <div
        ref={contentRef}
        tabIndex={-1}
        className={`relative w-full bg-surface rounded-modal shadow-lg outline-none
          sm:max-h-[85vh] sm:overflow-y-auto
          max-sm:inset-0 max-sm:rounded-none max-sm:h-full
          ${sizeClasses[size]} ${className}`}
      >
        {/* Header */}
        {(title || onClose) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-line">
            {title && (
              <h2 id="modal-title" className="text-h2 font-display text-ink">
                {title}
              </h2>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 text-ink/40 hover:text-ink rounded-full hover:bg-ink/5 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo"
                aria-label="Close modal"
              >
                <X size={18} strokeWidth={1.5} />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="px-6 py-5">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-line flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

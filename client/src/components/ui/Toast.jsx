import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react'

const ToastContext = createContext(null)

const toastIcons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
}

const toastStyles = {
  success: 'bg-ink text-white',
  error: 'bg-brick text-white',
  info: 'bg-ink text-white',
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const addToast = useCallback((message, { type = 'info', duration = 4000 } = {}) => {
    const id = ++idRef.current
    setToasts((prev) => [...prev, { id, message, type }])
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, duration)
    }
    return id
  }, [])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const success = useCallback((msg, opts) => addToast(msg, { ...opts, type: 'success' }), [addToast])
  const error = useCallback((msg, opts) => addToast(msg, { ...opts, type: 'error' }), [addToast])
  const info = useCallback((msg, opts) => addToast(msg, { ...opts, type: 'info' }), [addToast])

  return (
    <ToastContext.Provider value={{ addToast, removeToast, success, error, info }}>
      {children}
      {createPortal(
        <div
          className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-50 flex flex-col gap-2 pointer-events-none"
          aria-live="polite"
          aria-label="Notifications"
        >
          {toasts.map((toast) => {
            const Icon = toastIcons[toast.type]
            return (
              <div
                key={toast.id}
                className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-card shadow-lg animate-in slide-in-from-bottom-2 ${
                  toastStyles[toast.type]
                }`}
                role="status"
              >
                <Icon size={16} strokeWidth={1.5} className="flex-shrink-0" />
                <p className="text-body flex-1">{toast.message}</p>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="p-1 hover:opacity-70 transition-opacity focus:outline-none focus:ring-2 focus:ring-white/50 rounded-full"
                  aria-label="Dismiss notification"
                >
                  <X size={14} strokeWidth={2} />
                </button>
              </div>
            )
          })}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within a ToastProvider')
  return context
}

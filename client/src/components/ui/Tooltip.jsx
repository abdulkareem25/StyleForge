import { useState, useRef, useEffect } from 'react'

export default function Tooltip({
  children,
  content,
  position = 'top',
  delay = 400,
  className = '',
}) {
  const [visible, setVisible] = useState(false)
  const timeoutRef = useRef(null)
  const tooltipRef = useRef(null)
  const triggerRef = useRef(null)

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  const show = () => {
    timeoutRef.current = setTimeout(() => setVisible(true), delay)
  }

  const hide = () => {
    clearTimeout(timeoutRef.current)
    setVisible(false)
  }

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current)
  }, [])

  // Desktop-only: mobile needs visible labels instead of hover tooltips (Frontend Spec §4)
  return (
    <div className={`relative inline-flex ${className}`}>
      <div
        ref={triggerRef}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        {children}
      </div>
      {visible && content && (
        <div
          ref={tooltipRef}
          role="tooltip"
          className={`absolute z-50 px-2.5 py-1.5 bg-ink text-white text-caption rounded-tag whitespace-nowrap pointer-events-none ${positionClasses[position]}`}
        >
          {content}
        </div>
      )}
    </div>
  )
}

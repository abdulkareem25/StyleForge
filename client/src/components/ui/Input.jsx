import { forwardRef } from 'react'

const Input = forwardRef(function Input(
  {
    label,
    error,
    helperText,
    disabled = false,
    className = '',
    id,
    type = 'text',
    ...props
  },
  ref
) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-caption text-ink"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        type={type}
        disabled={disabled}
        className={`w-full px-3 py-2.5 text-body bg-surface border rounded-card transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed ${
          error
            ? 'border-brick focus:ring-brick'
            : 'border-line hover:border-ink/30'
        }`}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={
          error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
        }
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} className="text-caption text-brick">
          {error}
        </p>
      )}
      {!error && helperText && (
        <p id={`${inputId}-helper`} className="text-caption text-ink/50">
          {helperText}
        </p>
      )}
    </div>
  )
})

export default Input

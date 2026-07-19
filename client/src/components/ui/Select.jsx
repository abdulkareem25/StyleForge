import { forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'

const Select = forwardRef(function Select(
  {
    label,
    error,
    helperText,
    disabled = false,
    placeholder = 'Select an option',
    options = [],
    className = '',
    id,
    ...props
  },
  ref
) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={selectId}
          className="text-caption text-ink"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          disabled={disabled}
          className={`w-full appearance-none px-3 py-2.5 pr-10 text-body bg-surface border rounded-card transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed ${
            error
              ? 'border-brick focus:ring-brick'
              : 'border-line hover:border-ink/30'
          }`}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={
            error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined
          }
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          strokeWidth={1.5}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 pointer-events-none"
        />
      </div>
      {error && (
        <p id={`${selectId}-error`} className="text-caption text-brick">
          {error}
        </p>
      )}
      {!error && helperText && (
        <p id={`${selectId}-helper`} className="text-caption text-ink/50">
          {helperText}
        </p>
      )}
    </div>
  )
})

export default Select

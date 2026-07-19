import { forwardRef } from 'react'

const Chip = forwardRef(function Chip(
  {
    selected = false,
    interactive = false,
    icon: Icon,
    onRemove,
    children,
    className = '',
    ...props
  },
  ref
) {
  const base =
    'text-tag inline-flex items-center gap-1 px-2 py-0.5 rounded-tag border font-mono transition-colors duration-200'

  const variantClasses = selected
    ? 'bg-indigo text-white border-indigo'
    : 'bg-surface/90 text-ink border-line'

  const interactiveClasses = interactive
    ? 'cursor-pointer hover:border-indigo/50 focus:outline-none focus:ring-2 focus:ring-indigo focus:ring-offset-1'
    : ''

  const classes = [
    base,
    !selected && variantClasses,
    selected && variantClasses,
    interactive && interactiveClasses,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <span
      ref={ref}
      className={classes}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      {...props}
    >
      {Icon && <Icon size={11} strokeWidth={1.5} />}
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="ml-0.5 hover:opacity-70 focus:outline-none"
          aria-label={`Remove ${children}`}
        >
          ×
        </button>
      )}
    </span>
  )
})

export default Chip

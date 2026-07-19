import { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'

const variants = {
  primary:
    'bg-indigo text-white hover:bg-indigo/90 active:bg-indigo/95 shadow-sm',
  secondary:
    'bg-transparent text-ink border border-ink hover:bg-ink/5 active:bg-ink/10',
  tertiary:
    'bg-transparent text-indigo hover:underline active:text-indigo/80',
  danger:
    'bg-brick text-white hover:bg-brick/90 active:bg-brick/95 shadow-sm',
}

const sizes = {
  sm: 'px-3 py-1.5 text-body',
  md: 'px-4 py-2 text-body',
  lg: 'px-6 py-3.5 text-body font-medium',
  full: 'w-full px-4 py-3 text-body font-medium',
}

const iconSizes = {
  sm: 'p-1.5',
  md: 'p-2',
  lg: 'p-2.5',
}

const Button = forwardRef(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    icon: Icon,
    iconPosition = 'left',
    children,
    className = '',
    type = 'button',
    ...props
  },
  ref
) {
  const isIconOnly = Icon && !children
  const baseClasses =
    'inline-flex items-center justify-center gap-2 rounded-card font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo focus:ring-offset-2 disabled:opacity-40 disabled:pointer-events-none'

  const classes = [
    baseClasses,
    isIconOnly ? `rounded-full ${iconSizes[size] || iconSizes.md}` : sizes[size] || sizes.md,
    variants[variant] || variants.primary,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={classes}
      {...props}
    >
      {loading ? (
        <Loader2 size={size === 'lg' ? 18 : 16} strokeWidth={1.5} className="animate-spin" />
      ) : (
        Icon && iconPosition === 'left' && (
          <Icon size={size === 'lg' ? 18 : 16} strokeWidth={1.5} />
        )
      )}
      {children && <span>{children}</span>}
      {!loading && Icon && iconPosition === 'right' && (
        <Icon size={size === 'lg' ? 18 : 16} strokeWidth={1.5} />
      )}
    </button>
  )
})

export default Button

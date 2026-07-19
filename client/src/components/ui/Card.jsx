import { forwardRef } from 'react'

const Card = forwardRef(function Card(
  {
    children,
    hover = false,
    selected = false,
    padding = true,
    className = '',
    ...props
  },
  ref
) {
  const classes = [
    'bg-surface border rounded-card',
    selected ? 'border-indigo ring-2 ring-indigo/20' : 'border-line',
    hover && !selected && 'hover:shadow-lift transition-shadow duration-200 cursor-pointer',
    padding && 'p-4',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div ref={ref} className={classes} {...props}>
      {children}
    </div>
  )
})

export default Card

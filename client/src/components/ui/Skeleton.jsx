export function SkeletonBlock({ className = '', width, height }) {
  return (
    <div
      className={`bg-ink/8 rounded-tag animate-pulse ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  )
}

export function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={`flex flex-col gap-2 ${className}`} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3 bg-ink/8 rounded-tag animate-pulse"
          style={{ width: i === lines - 1 ? '60%' : '100%' }}
        />
      ))}
    </div>
  )
}

export function SkeletonAvatar({ size = 40, className = '' }) {
  return (
    <div
      className={`rounded-full bg-ink/8 animate-pulse flex-shrink-0 ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  )
}

export function SkeletonCard({ className = '' }) {
  return (
    <div
      className={`bg-surface border border-line rounded-card p-4 flex flex-col gap-3 ${className}`}
      aria-hidden="true"
    >
      <SkeletonBlock className="w-full aspect-[4/5] rounded-card" />
      <SkeletonText lines={2} />
      <div className="flex gap-2">
        <SkeletonBlock className="w-16 h-5 rounded-tag" />
        <SkeletonBlock className="w-12 h-5 rounded-tag" />
      </div>
    </div>
  )
}

export function SkeletonGrid({ count = 6, columns = 3, className = '' }) {
  const responsiveClass = className.includes('grid-cols-') ? className : `grid-cols-${columns}`;

  return (
    <div
      className={`grid gap-4 ${responsiveClass} ${className}`}
      aria-label="Loading"
      role="status"
    >
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

// Simple skeleton wrapper that respects prefers-reduced-motion
// The base animation in index.css already handles this, but we
// provide a static variant for explicit use
export default function Skeleton({ children, className = '' }) {
  return (
    <div className={`skeleton-reduced-motion ${className}`} aria-busy="true" aria-label="Loading">
      {children}
    </div>
  )
}

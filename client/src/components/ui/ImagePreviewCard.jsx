import { useState } from 'react'
import { Image as ImageIcon, X, RefreshCw } from 'lucide-react'

const states = {
  loading: (
    <div className="w-full h-full flex items-center justify-center bg-canvas animate-pulse">
      <ImageIcon size={24} strokeWidth={1.5} className="text-ink/20" />
    </div>
  ),
  error: (onRetry) => (
    <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-canvas text-ink/40">
      <ImageIcon size={24} strokeWidth={1.5} />
      <p className="text-caption">Failed to load</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-caption text-indigo hover:underline flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-indigo rounded-tag"
        >
          <RefreshCw size={12} strokeWidth={1.5} />
          Retry
        </button>
      )}
    </div>
  ),
}

export default function ImagePreviewCard({
  src,
  alt,
  size = 'md',
  removable = false,
  onRemove,
  onRetry,
  onClick,
  className = '',
}) {
  const [imgState, setImgState] = useState(src ? 'loaded' : 'loading')

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-full aspect-[4/5]',
    lg: 'w-full aspect-square',
  }

  const radiusClasses = {
    sm: 'rounded-tag',
    md: 'rounded-card',
    lg: 'rounded-modal',
  }

  const handleLoad = () => setImgState('loaded')
  const handleError = () => setImgState('error')

  return (
    <div
      className={`relative overflow-hidden ${sizeClasses[size]} ${radiusClasses[size]} ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(e) } } : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {imgState === 'error' && states.error(onRetry)}
      {imgState === 'loading' && states.loading}
      {src && (
        <img
          src={src}
          alt={alt || ''}
          onLoad={handleLoad}
          onError={handleError}
          className={`w-full h-full object-cover ${
            imgState === 'loaded' ? 'opacity-100' : 'opacity-0 absolute'
          }`}
        />
      )}
      {removable && onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="absolute top-1.5 right-1.5 p-1 bg-ink/60 text-white rounded-full hover:bg-ink/80 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo"
          aria-label="Remove image"
        >
          <X size={12} strokeWidth={2} />
        </button>
      )}
    </div>
  )
}

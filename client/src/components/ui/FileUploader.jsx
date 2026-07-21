import { useState, useRef, useCallback } from 'react'
import { Upload, X, AlertCircle, CheckCircle } from 'lucide-react'
import Button from './Button'

const statusConfig = {
  idle: {
    border: 'border-dashed border-line',
    bg: 'bg-canvas',
    icon: Upload,
    text: 'Drag and drop photos here, or',
  },
  'drag-over': {
    border: 'border-dashed border-indigo',
    bg: 'bg-indigo/5',
    icon: Upload,
    text: 'Drop your photos here',
  },
  uploading: {
    border: 'border-solid border-indigo/40',
    bg: 'bg-indigo/5',
    icon: Upload,
    text: 'Uploading…',
  },
  error: {
    border: 'border-dashed border-brick',
    bg: 'bg-brick/5',
    icon: AlertCircle,
    text: 'Upload failed',
  },
  success: {
    border: 'border-dashed border-brass',
    bg: 'bg-brass/5',
    icon: CheckCircle,
    text: 'Upload complete',
  },
}

export default function FileUploader({
  accept = 'image/jpeg,image/png,image/webp',
  multiple = true,
  maxFiles = 20,
  onFilesSelected,
  onFileRemove,
  onRetry,
  files = [],
  uploading = false,
  error = null,
  className = '',
}) {
  const [dragState, setDragState] = useState('idle')
  const inputRef = useRef(null)

  const handleDragEnter = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragState('drag-over')
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragState('idle')
    }
  }, [])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault()
      e.stopPropagation()
      setDragState('idle')
      const dropped = Array.from(e.dataTransfer.files)
      if (dropped.length > 0 && onFilesSelected) {
        onFilesSelected(dropped.slice(0, maxFiles))
      }
    },
    [onFilesSelected, maxFiles]
  )

  const handleInputChange = useCallback(
    (e) => {
      const selected = Array.from(e.target.files)
      if (selected.length > 0 && onFilesSelected) {
        onFilesSelected(selected.slice(0, maxFiles))
      }
      e.target.value = ''
    },
    [onFilesSelected, maxFiles]
  )

  const currentStatus = error ? 'error' : uploading ? 'uploading' : dragState
  const config = statusConfig[currentStatus]
  const StatusIcon = config.icon

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="Upload photos"
        className={`relative flex flex-col items-center justify-center gap-3 px-6 py-12 rounded-card border-2 transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo focus:ring-offset-2 ${config.border} ${config.bg}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          className="sr-only"
          tabIndex={-1}
        />
        <StatusIcon
          size={32}
          strokeWidth={1.5}
          className={currentStatus === 'error' ? 'text-brick' : 'text-ink/30'}
        />
        <p className="text-body text-ink/60 text-center">
          {config.text}
        </p>
        {currentStatus === 'idle' && (
          <Button variant="tertiary" size="sm" type="button">
            browse files
          </Button>
        )}
        <p className="text-caption text-ink/40">
          JPG, PNG, or WebP · up to {maxFiles} files
        </p>
      </div>

      {error && (
        <p className="text-caption text-brick flex items-center gap-1">
          <AlertCircle size={12} strokeWidth={1.5} />
          {error}
        </p>
      )}

      {files.length > 0 && (
        <ul className="flex flex-col gap-2">
          {files.map((file, i) => (
            <li
              key={`${file.name}-${i}`}
              className="flex items-center gap-3 px-3 py-2 bg-surface border border-line rounded-card"
            >
              <div className="w-10 h-10 rounded-tag overflow-hidden bg-canvas flex-shrink-0">
                {file.preview ? (
                  <img
                    src={file.preview}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-ink/30">
                    <Upload size={14} strokeWidth={1.5} />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-body text-ink truncate">{file.name}</p>
                {file.status === 'uploading' && (
                  <div className="mt-1 h-1 bg-canvas rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo rounded-full transition-all duration-300"
                      style={{ width: `${file.progress || 0}%` }}
                    />
                  </div>
                )}
                {file.status === 'error' && (
                  <div className="mt-1 flex flex-col gap-1">
                    <p className="text-caption text-brick">{file.error || 'Upload failed'}</p>
                    {onRetry && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onRetry(i)
                        }}
                        className="text-caption text-indigo hover:underline self-start"
                      >
                        Retry upload
                      </button>
                    )}
                  </div>
                )}
                {file.status === 'done' && (
                  <p className="text-caption text-brass">Uploaded</p>
                )}
              </div>
              {onFileRemove && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onFileRemove(i)
                  }}
                  className="p-1 text-ink/40 hover:text-brick rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo"
                  aria-label={`Remove ${file.name}`}
                >
                  <X size={14} strokeWidth={1.5} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

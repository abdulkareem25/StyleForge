import { Calendar, Clock, Cloud, Sparkles } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, Chip, SkeletonBlock } from '../components/ui'
import { useToast } from '../components/ui/Toast'
import { occasions, getOccasionDisplayLabel } from '../constants/occasions'
import { getOutfitHistory } from '../services/outfitService'

function HistorySkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-label="Loading history" role="status">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="bg-surface border border-line rounded-card p-4 flex flex-col gap-3"
          aria-hidden="true"
        >
          <div className="flex items-center gap-3">
            <SkeletonBlock className="w-20 h-5 rounded-tag" />
            <SkeletonBlock className="w-16 h-5 rounded-tag" />
            <SkeletonBlock className="w-24 h-5 rounded-tag" />
          </div>
          <div className="flex gap-3">
            {Array.from({ length: 4 }).map((_, j) => (
              <SkeletonBlock key={j} className="w-20 h-28 sm:w-24 sm:h-32 rounded-card flex-shrink-0" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <div className="w-16 h-16 rounded-full bg-canvas flex items-center justify-center">
        <Clock size={32} strokeWidth={1.5} className="text-ink/20" />
      </div>
      <div className="max-w-md">
        <h2 className="text-h2 font-display text-ink">
          No outfits logged yet — generate one to get started.
        </h2>
        <p className="text-body text-ink/60 mt-2">
          Once you confirm an outfit, it will appear here so you can track what you have worn.
        </p>
      </div>
      <Link to="/generate">
        <Button icon={Sparkles}>Generate an outfit</Button>
      </Link>
    </div>
  )
}

function ErrorState({ onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 rounded-card border border-line bg-surface px-6">
      <h2 className="text-h2 font-display text-ink">We couldn't load your history</h2>
      <p className="text-body text-ink/60 text-center">Please try again to see your outfit log.</p>
      <Button onClick={onRetry}>Retry</Button>
    </div>
  )
}

function WeatherBadge({ weatherContext }) {
  if (!weatherContext || weatherContext === 'any') return null
  return (
    <span className="inline-flex items-center gap-1 text-caption text-ink/50 capitalize">
      <Cloud size={12} strokeWidth={1.5} />
      {weatherContext}
    </span>
  )
}

function HistoryEntry({ entry }) {
  const date = new Date(entry.wornDate)
  const formattedDate = date.toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  const items = entry.outfit?.items || []

  return (
    <Card padding={false} className="overflow-hidden">
      <div className="p-3 sm:p-4">
        <div className="flex items-center gap-2 sm:gap-3 mb-3">
          <span className="inline-flex items-center gap-1 text-tag font-mono text-indigo bg-indigo/8 px-2 py-0.5 rounded-tag">
            <Calendar size={11} strokeWidth={1.5} />
            {formattedDate}
          </span>
          <span className="text-tag font-mono text-ink/70 bg-ink/5 px-2 py-0.5 rounded-tag capitalize">
            {getOccasionDisplayLabel(entry.occasionTag) || entry.occasionTag}
          </span>
          <WeatherBadge weatherContext={entry.weatherContext} />
        </div>

        {items.length > 0 ? (
          <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-1 -mx-1 px-1">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex-shrink-0 w-20 sm:w-24"
              >
                <div className="aspect-[4/5] bg-canvas rounded-card overflow-hidden">
                  <img
                    src={item.thumbnailUrl || item.imageUrl}
                    alt={item.subCategory?.replace(/-/g, ' ') || 'Item'}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <p className="text-micro text-ink/50 mt-1 truncate capitalize">
                  {item.subCategory?.replace(/-/g, ' ')}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-caption text-ink/40 italic">Item details unavailable</p>
        )}
      </div>
    </Card>
  )
}

export default function History() {
  const [entries, setEntries] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadingError, setLoadingError] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [occasionFilter, setOccasionFilter] = useState(undefined)
  const toast = useToast()

  const fetchHistory = useCallback(async ({ nextPage = 1, append = false } = {}) => {
    if (append) {
      setLoadingMore(true)
    } else {
      setLoading(true)
      setLoadingError(false)
    }

    try {
      const params = { page: nextPage, limit: 20 }
      if (occasionFilter) params.occasion = occasionFilter

      const { data } = await getOutfitHistory(params)
      if (data.success) {
        setEntries((prev) => (append ? [...prev, ...data.data.history] : data.data.history))
        setTotal(data.data.total)
        setPages(data.data.pages)
        setPage(nextPage)
      } else {
        setLoadingError(true)
      }
    } catch {
      setLoadingError(true)
      toast.error('Failed to load outfit history')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [occasionFilter, toast])

  useEffect(() => {
    fetchHistory({ nextPage: 1, append: false })
  }, [fetchHistory])

  const handleOccasionToggle = useCallback((value) => {
    setOccasionFilter((prev) => (prev === value ? undefined : value))
  }, [])

  const handleLoadMore = useCallback(() => {
    if (page < pages && !loadingMore) {
      fetchHistory({ nextPage: page + 1, append: true })
    }
  }, [fetchHistory, loadingMore, page, pages])

  const handleRetry = useCallback(() => {
    fetchHistory({ nextPage: 1, append: false })
  }, [fetchHistory])

  return (
    <div className="min-h-screen bg-canvas">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:py-8 pb-24 sm:pb-8">
        <h1 className="text-h1 font-display text-ink mb-1">History</h1>
        <p className="text-body text-ink/60 mb-6">Outfits you have confirmed wearing, most recent first.</p>

        {/* Occasion filter chips */}
        <div className="flex items-center gap-2 flex-wrap mb-6">
          {occasions.map((value) => (
            <Chip
              key={value}
              interactive
              selected={occasionFilter === value}
              onClick={() => handleOccasionToggle(value)}
            >
              {getOccasionDisplayLabel(value)}
            </Chip>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <HistorySkeleton />
        ) : loadingError ? (
          <ErrorState onRetry={handleRetry} />
        ) : entries.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className="flex flex-col gap-4">
              {entries.map((entry) => (
                <HistoryEntry key={entry.id} entry={entry} />
              ))}
            </div>

            {pages > 1 && (
              <div className="mt-8 flex flex-col items-center gap-3">
                <Button
                  variant="secondary"
                  size="sm"
                  loading={loadingMore}
                  disabled={page >= pages || loadingMore}
                  onClick={handleLoadMore}
                >
                  {page >= pages ? 'No more entries' : 'Load more'}
                </Button>
                <p className="text-caption text-ink/50">
                  Showing {entries.length} of {total} {total === 1 ? 'entry' : 'entries'}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

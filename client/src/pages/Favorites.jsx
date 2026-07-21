import { Heart, Loader2, Shirt, Sparkles } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Button, Card, SkeletonGrid } from '../components/ui'
import { useToast } from '../components/ui/Toast'
import { favoriteOutfit, getFavorites, wearOutfit } from '../services/outfitService'

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <div className="w-16 h-16 rounded-full bg-canvas flex items-center justify-center">
        <Heart size={32} strokeWidth={1.5} className="text-ink/20" />
      </div>
      <div className="max-w-md">
        <h2 className="text-h2 font-display text-ink">
          Favorite an outfit you love to find it here fast.
        </h2>
        <p className="text-body text-ink/60 mt-2">
          Tap the heart on any outfit to save it for quick access later.
        </p>
      </div>
    </div>
  )
}

function ErrorState({ onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 rounded-card border border-line bg-surface px-6">
      <h2 className="text-h2 font-display text-ink">We couldn't load your saved outfits</h2>
      <p className="text-body text-ink/60 text-center">Please try again to see your favorites.</p>
      <Button onClick={onRetry}>Retry</Button>
    </div>
  )
}

function FavoriteCard({ outfit, onWear, onUnfavorite, wearing }) {
  const items = outfit.items || []
  const topItem = items.find((i) => ['top', 'ethnic'].includes(i.category)) || items[0] || null
  const bottomItem = items.find((i) => i.category === 'bottom') || null
  const footwearItem = items.find((i) => i.category === 'footwear') || null

  return (
    <Card hover padding={false} className="overflow-hidden">
      <div className="grid grid-cols-[1fr_1fr] grid-rows-[auto_auto] gap-px bg-line">
        <div className="row-span-2 aspect-square bg-canvas">
          {topItem ? (
            <img
              src={topItem.thumbnailUrl || topItem.imageUrl}
              alt={topItem.subCategory || 'Top'}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Shirt size={20} strokeWidth={1.5} className="text-ink/15" />
            </div>
          )}
        </div>
        <div className="aspect-square bg-canvas">
          {bottomItem ? (
            <img
              src={bottomItem.thumbnailUrl || bottomItem.imageUrl}
              alt={bottomItem.subCategory || 'Bottom'}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Shirt size={20} strokeWidth={1.5} className="text-ink/15" />
            </div>
          )}
        </div>
        <div className="aspect-square bg-canvas">
          {footwearItem ? (
            <img
              src={footwearItem.thumbnailUrl || footwearItem.imageUrl}
              alt={footwearItem.subCategory || 'Footwear'}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Shirt size={20} strokeWidth={1.5} className="text-ink/15" />
            </div>
          )}
        </div>
      </div>

      <div className="p-3 flex flex-col gap-2">
        <div className="flex flex-wrap gap-1.5">
          {items.map((item) => (
            <span
              key={item.id}
              className="text-tag font-mono text-ink/60 bg-ink/5 px-1.5 py-0.5 rounded-tag capitalize"
            >
              {item.subCategory?.replace(/-/g, ' ')}
            </span>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onWear(outfit)}
            disabled={wearing}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-card bg-indigo px-3 py-2.5 text-body font-medium text-white shadow-sm transition-colors hover:bg-indigo/90 active:bg-indigo/95 focus:outline-none focus:ring-2 focus:ring-indigo focus:ring-offset-2 disabled:opacity-40 disabled:pointer-events-none"
          >
            {wearing ? (
              <Loader2 size={14} strokeWidth={1.5} className="animate-spin" />
            ) : (
              <Shirt size={14} strokeWidth={1.5} />
            )}
            {wearing ? 'Wearing...' : 'Wear this'}
          </button>
          <button
            type="button"
            onClick={() => onUnfavorite(outfit)}
            className="inline-flex items-center justify-center gap-1.5 rounded-card border border-line bg-transparent px-3 py-2.5 text-body text-ink transition-colors hover:bg-ink/5 active:bg-ink/10 focus:outline-none focus:ring-2 focus:ring-indigo focus:ring-offset-2"
            title="Remove from favorites"
          >
            <Heart size={14} strokeWidth={1.5} className="fill-current" />
          </button>
        </div>
      </div>
    </Card>
  )
}

export default function Favorites() {
  const [favorites, setFavorites] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadingError, setLoadingError] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [wearingHash, setWearingHash] = useState(null)
  const toast = useToast()

  const fetchFavorites = useCallback(async ({ nextPage = 1, append = false } = {}) => {
    if (append) {
      setLoadingMore(true)
    } else {
      setLoading(true)
      setLoadingError(false)
    }

    try {
      const { data } = await getFavorites({ page: nextPage, limit: 20 })
      if (data.success) {
        setFavorites((prev) => (append ? [...prev, ...data.data.favorites] : data.data.favorites))
        setTotal(data.data.total)
        setPages(data.data.pages)
        setPage(nextPage)
      } else {
        setLoadingError(true)
      }
    } catch {
      setLoadingError(true)
      toast.error('Failed to load saved outfits')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [toast])

  useEffect(() => {
    fetchFavorites({ nextPage: 1, append: false })
  }, [fetchFavorites])

  const handleLoadMore = useCallback(() => {
    if (page < pages && !loadingMore) {
      fetchFavorites({ nextPage: page + 1, append: true })
    }
  }, [fetchFavorites, loadingMore, page, pages])

  const handleRetry = useCallback(() => {
    fetchFavorites({ nextPage: 1, append: false })
  }, [fetchFavorites])

  const handleWear = useCallback(async (outfit) => {
    if (wearingHash) return
    setWearingHash(outfit.combinationHash)
    try {
      await wearOutfit(outfit.combinationHash, {
        itemIds: outfit.items.map((i) => i.id),
      })
      toast.success('Outfit confirmed!')
    } catch {
      toast.error('Failed to confirm outfit')
    } finally {
      setWearingHash(null)
    }
  }, [wearingHash, toast])

  const handleUnfavorite = useCallback(async (outfit) => {
    try {
      const { data } = await favoriteOutfit(outfit.id)
      if (data.success && data.data.isFavorite === false) {
        setFavorites((prev) => prev.filter((f) => f.id !== outfit.id))
        setTotal((prev) => prev - 1)
        toast.success('Removed from favorites')
      }
    } catch {
      toast.error('Failed to update favorite')
    }
  }, [toast])

  return (
    <div className="min-h-screen bg-canvas sm:flex">
      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen sm:min-h-0 sm:h-screen sm:overflow-y-auto pb-20 sm:pb-0">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-canvas/95 backdrop-blur-sm border-b border-line">
          <div className="px-4 py-3 flex items-center gap-3">
            <h1 className="text-h1 font-display text-ink flex-1">Saved Outfits</h1>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 px-4 py-6">
          {loading ? (
            <SkeletonGrid count={8} className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6" />
          ) : loadingError ? (
            <ErrorState onRetry={handleRetry} />
          ) : favorites.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
                {favorites.map((outfit) => (
                  <FavoriteCard
                    key={outfit.id}
                    outfit={outfit}
                    onWear={handleWear}
                    onUnfavorite={handleUnfavorite}
                    wearing={wearingHash === outfit.combinationHash}
                  />
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
                    {page >= pages ? 'No more outfits' : 'Load more'}
                  </Button>
                  <p className="text-caption text-ink/50">Showing {favorites.length} of {total} saved outfits</p>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}

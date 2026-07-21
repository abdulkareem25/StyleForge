import { useState, useEffect, useCallback, useMemo } from 'react'
import { Filter, Shirt, Upload } from 'lucide-react'
import { Button, Card, Chip, Drawer, SkeletonGrid } from '../components/ui'
import { useToast } from '../components/ui/Toast'
import { getWardrobe, getWardrobeColors } from '../services/wardrobeService'
import WardrobeFilterPanel from '../components/wardrobe/WardrobeFilterPanel'
import BatchUploadWidget from '../components/wardrobe/BatchUploadWidget'

const INITIAL_FILTERS = { category: undefined, color: undefined, formalityTag: undefined, isActive: 'true', search: undefined }

function ActiveFiltersBar({ filters, onRemove, onClearAll }) {
  const chips = []
  if (filters.category) chips.push({ key: 'category', label: filters.category.charAt(0).toUpperCase() + filters.category.slice(1) })
  if (filters.color) chips.push({ key: 'color', label: filters.color.charAt(0).toUpperCase() + filters.color.slice(1) })
  if (filters.formalityTag) chips.push({ key: 'formalityTag', label: filters.formalityTag.charAt(0).toUpperCase() + filters.formalityTag.slice(1) })
  if (filters.isActive === 'true') chips.push({ key: 'isActive', label: 'Active' })
  if (filters.isActive === 'false') chips.push({ key: 'isActive', label: 'Archived' })
  if (filters.search) chips.push({ key: 'search', label: `"${filters.search}"` })

  if (chips.length === 0) return null

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {chips.map((chip) => (
        <Chip key={chip.key} onRemove={() => onRemove(chip.key)}>
          {chip.label}
        </Chip>
      ))}
      <button
        type="button"
        onClick={onClearAll}
        className="text-caption text-indigo hover:underline focus:outline-none focus:ring-2 focus:ring-indigo focus:ring-offset-2 rounded"
      >
        Clear all
      </button>
    </div>
  )
}

function EmptyState({ hasFilters, onUploadStart }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-16 h-16 rounded-full bg-canvas flex items-center justify-center">
        <Shirt size={32} strokeWidth={1.5} className="text-ink/20" />
      </div>
      <div className="text-center">
        <h2 className="text-h2 font-display text-ink">
          {hasFilters ? 'No matching items' : 'Your wardrobe is empty'}
        </h2>
        <p className="text-body text-ink/60 mt-1">
          {hasFilters
            ? 'Try adjusting your filters or search terms.'
            : 'Upload some clothes to get started.'}
        </p>
      </div>
      {!hasFilters && (
        <Button icon={Upload} onClick={onUploadStart}>
          Upload your first item
        </Button>
      )}
    </div>
  )
}

function ItemCard({ item }) {
  return (
    <Card hover padding={false} className="overflow-hidden">
      <div className="aspect-[4/5] bg-canvas">
        <img
          src={item.thumbnailUrl || item.imageUrl}
          alt={item.subCategory}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="p-3">
        <p className="text-body font-medium text-ink truncate capitalize">
          {item.subCategory?.replace(/-/g, ' ')}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-caption text-ink/50 capitalize">{item.primaryColor}</span>
          {item.formalityTags?.length > 0 && (
            <>
              <span className="text-ink/20">·</span>
              <span className="text-caption text-ink/50 capitalize">
                {item.formalityTags[0]}
              </span>
            </>
          )}
        </div>
      </div>
    </Card>
  )
}

export default function Wardrobe() {
  const [filters, setFilters] = useState(INITIAL_FILTERS)
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [availableColors, setAvailableColors] = useState([])
  const [showUploadWidget, setShowUploadWidget] = useState(false)
  const [uploadSummary, setUploadSummary] = useState(null)
  const toast = useToast()

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.category) count++
    if (filters.color) count++
    if (filters.formalityTag) count++
    if (filters.isActive !== undefined) count++
    if (filters.search) count++
    return count
  }, [filters])

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, limit: 20 }
      if (filters.category) params.category = filters.category
      if (filters.color) params.color = filters.color
      if (filters.formalityTag) params.formalityTag = filters.formalityTag
      if (filters.isActive !== undefined) params.isActive = filters.isActive
      if (filters.search) params.search = filters.search

      const { data } = await getWardrobe(params)
      if (data.success) {
        setItems(data.data.items)
        setTotal(data.data.total)
        setPages(data.data.pages)
      }
    } catch {
      toast.error('Failed to load wardrobe')
    } finally {
      setLoading(false)
    }
  }, [filters, page, toast])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  useEffect(() => {
    getWardrobeColors()
      .then(({ data }) => {
        if (data.success) setAvailableColors(data.data)
      })
      .catch(() => {})
  }, [])

  const handleFilterChange = useCallback((patch) => {
    setFilters((prev) => ({ ...prev, ...patch }))
    setPage(1)
  }, [])

  const handleClearAll = useCallback(() => {
    setFilters(INITIAL_FILTERS)
    setPage(1)
  }, [])

  const handleRemoveFilter = useCallback((key) => {
    setFilters((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
    setPage(1)
  }, [])

  const handleUploadReady = useCallback((items) => {
    setShowUploadWidget(false)
    if (items.length > 0) {
      setUploadSummary(`${items.length} photo${items.length === 1 ? '' : 's'} ready to review.`)
      toast.success(`${items.length} photo${items.length === 1 ? '' : 's'} uploaded.`)
    }
  }, [toast])

  const filterTrigger = (
    <button
      type="button"
      onClick={() => setDrawerOpen(true)}
      className="relative p-2 text-ink/60 hover:text-ink rounded-card hover:bg-ink/5 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo sm:hidden"
      aria-label="Open filters"
    >
      <Filter size={20} strokeWidth={1.5} />
      {activeFilterCount > 0 && (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo text-white text-[10px] font-medium rounded-full flex items-center justify-center">
          {activeFilterCount}
        </span>
      )}
    </button>
  )

  return (
    <div className="min-h-screen bg-canvas sm:flex">
      {/* Desktop sidebar */}
      <aside className="hidden sm:block w-64 flex-shrink-0 border-r border-line bg-surface p-5 sticky top-0 h-screen overflow-y-auto">
        <h2 className="text-h2 font-display text-ink mb-4">Filters</h2>
        <WardrobeFilterPanel
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearAll={handleClearAll}
          availableColors={availableColors}
        />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen sm:min-h-0 sm:h-screen sm:overflow-y-auto pb-20 sm:pb-0">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-canvas/95 backdrop-blur-sm border-b border-line">
          <div className="px-4 py-3 flex items-center gap-3">
            {filterTrigger}
            <h1 className="text-h1 font-display text-ink flex-1">Wardrobe</h1>
            <Button variant="secondary" size="sm" icon={Upload} onClick={() => setShowUploadWidget(true)}>
              Upload
            </Button>
          </div>
          <ActiveFiltersBar
            filters={filters}
            onRemove={handleRemoveFilter}
            onClearAll={handleClearAll}
          />
        </header>

        {/* Content */}
        <main className="flex-1 px-4 py-6">
          {uploadSummary && (
            <div className="mb-4 rounded-card border border-brass/30 bg-brass/5 px-4 py-3 text-caption text-ink/70">
              {uploadSummary}
            </div>
          )}
          {showUploadWidget && (
            <div className="mb-6 rounded-card border border-line bg-surface p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <h2 className="text-h2 font-display text-ink">Upload wardrobe photos</h2>
                  <p className="text-body text-ink/60">Drag files in or tap to browse. Each file uploads independently, and failures stay isolated to that row.</p>
                </div>
                <Button variant="tertiary" size="sm" onClick={() => setShowUploadWidget(false)}>
                  Close
                </Button>
              </div>
              <BatchUploadWidget onItemsReady={handleUploadReady} onProgressChange={() => {}} />
            </div>
          )}
          {loading ? (
            <SkeletonGrid count={8} />
          ) : items.length === 0 ? (
            <EmptyState hasFilters={activeFilterCount > 0} onUploadStart={() => setShowUploadWidget(true)} />
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {items.map((item) => (
                  <ItemCard key={item._id} item={item} />
                ))}
              </div>

              {pages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  <span className="text-caption text-ink/50">
                    Page {page} of {pages}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={page >= pages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Mobile filter drawer */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Filters"
        side="bottom"
      >
        <WardrobeFilterPanel
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearAll={() => {
            handleClearAll()
            setDrawerOpen(false)
          }}
          availableColors={availableColors}
        />
        <div className="mt-4 pt-4 border-t border-line">
          <Button size="full" onClick={() => setDrawerOpen(false)}>
            Show results
          </Button>
        </div>
      </Drawer>
    </div>
  )
}

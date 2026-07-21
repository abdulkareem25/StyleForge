import { X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { categories } from '../../constants/categories'
import { occasions } from '../../constants/occasions'
import { Chip, Input } from '../ui'

const STATUS_OPTIONS = [
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Archived' },
]

const CATEGORY_LABELS = {
  top: 'Top',
  bottom: 'Bottom',
  ethnic: 'Ethnic',
  outerwear: 'Outerwear',
  footwear: 'Footwear',
  accessory: 'Accessory',
}

const OCCASION_LABELS = Object.fromEntries(
  occasions.map((value) => [value, value.split('-').map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1)).join(' ')]),
)

export default function WardrobeFilterPanel({
  filters,
  onFilterChange,
  onClearAll,
  availableColors = [],
}) {
  const [searchInput, setSearchInput] = useState(filters.search || '')

  useEffect(() => {
    setSearchInput(filters.search || '')
  }, [filters.search])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== (filters.search || '')) {
        onFilterChange({ search: searchInput || undefined })
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput, filters.search, onFilterChange])

  const toggleFilter = useCallback(
    (key, value) => {
      const current = filters[key]
      const next = current === value ? undefined : value
      onFilterChange({ [key]: next })
    },
    [filters, onFilterChange],
  )

  const activeCount =
    (filters.category ? 1 : 0) +
    (filters.color ? 1 : 0) +
    (filters.formalityTag ? 1 : 0) +
    (filters.isActive !== undefined ? 1 : 0) +
    (filters.search ? 1 : 0)

  return (
    <div className="flex flex-col gap-6">
      {/* Search */}
      <div className="relative">
        <Input
          placeholder="Search wardrobe..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-full"
        />
        {searchInput && (
          <button
            type="button"
            onClick={() => setSearchInput('')}
            className="absolute right-3 top-[38px] text-ink/40 hover:text-ink transition-colors focus:outline-none focus:ring-2 focus:ring-indigo rounded"
            aria-label="Clear search"
          >
            <X size={14} strokeWidth={1.5} />
          </button>
        )}
      </div>

      {/* Status */}
      <fieldset>
        <legend className="text-caption text-ink mb-2">Status</legend>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_OPTIONS.map((opt) => (
            <Chip
              key={opt.value}
              interactive
              selected={filters.isActive === opt.value}
              onClick={() => toggleFilter('isActive', opt.value)}
            >
              {opt.label}
            </Chip>
          ))}
        </div>
      </fieldset>

      {/* Category */}
      <fieldset>
        <legend className="text-caption text-ink mb-2">Category</legend>
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <Chip
              key={cat}
              interactive
              selected={filters.category === cat}
              onClick={() => toggleFilter('category', cat)}
            >
              {CATEGORY_LABELS[cat] || cat}
            </Chip>
          ))}
        </div>
      </fieldset>

      {/* Color */}
      {availableColors.length > 0 && (
        <fieldset>
          <legend className="text-caption text-ink mb-2">Color</legend>
          <div className="flex flex-wrap gap-1.5">
            {availableColors.map((color) => (
              <Chip
                key={color}
                interactive
                selected={filters.color === color}
                onClick={() => toggleFilter('color', color)}
              >
                {color.charAt(0).toUpperCase() + color.slice(1)}
              </Chip>
            ))}
          </div>
        </fieldset>
      )}

      {/* Occasion */}
      <fieldset>
        <legend className="text-caption text-ink mb-2">Occasion</legend>
        <div className="flex flex-wrap gap-1.5">
          {occasions.map((tag) => (
            <Chip
              key={tag}
              interactive
              selected={filters.formalityTag === tag}
              onClick={() => toggleFilter('formalityTag', tag)}
            >
              {OCCASION_LABELS[tag] || tag}
            </Chip>
          ))}
        </div>
      </fieldset>

      {/* Clear all */}
      {activeCount > 0 && (
        <button
          type="button"
          onClick={onClearAll}
          className="text-caption text-indigo hover:underline focus:outline-none focus:ring-2 focus:ring-indigo focus:ring-offset-2 rounded self-start"
        >
          Clear all filters ({activeCount})
        </button>
      )}
    </div>
  )
}

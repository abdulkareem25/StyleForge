import { AlertTriangle, Check } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import {
  categories,
  fits,
  patterns,
  sleeveLengths,
  subCategories,
} from '../../constants/categories'
import { occasions } from '../../constants/occasions'
import { Button, Chip, Select } from '../ui'

const FIT_OPTIONS = fits.map((v) => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) }))

const SLEEVE_OPTIONS = sleeveLengths.map((v) => ({
  value: v,
  label: v === 'n/a' ? 'N/A' : v.charAt(0).toUpperCase() + v.slice(1),
}))

const PATTERN_OPTIONS = patterns.map((v) => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) }))

const COLOR_PRESETS = [
  'Black', 'White', 'Navy', 'Grey', 'Brown', 'Beige',
  'Red', 'Blue', 'Green', 'Orange', 'Pink', 'Purple', 'Yellow',
]

const SEASON_OPTIONS = [
  { value: 'summer', label: 'Summer' },
  { value: 'winter', label: 'Winter' },
  { value: 'monsoon', label: 'Monsoon' },
  { value: 'all-season', label: 'All-season' },
]

function getInitialTags(item) {
  return {
    category: item.category || '',
    subCategory: item.subCategory || '',
    primaryColor: item.primaryColor || '',
    secondaryColor: item.secondaryColor || '',
    pattern: item.pattern || 'solid',
    fit: item.fit || 'regular',
    sleeveLength: item.sleeveLength || 'n/a',
    formalityTags: item.formalityTags || [],
    seasonTags: item.seasonTags || [],
  }
}

function ItemCard({ item, index, tags, onChange, onConfirm, saving, confirmed }) {
  const lowConfidence = item.aiTagConfidence != null && item.aiTagConfidence < 0.6
  const subCategoryOptions = tags.category
    ? (subCategories[tags.category] || []).map((s) => ({ value: s, label: s.replace(/-/g, ' ') }))
    : []

  const update = useCallback(
    (field, value) => {
      const next = { ...tags, [field]: value }
      if (field === 'category') {
        next.subCategory = ''
      }
      onChange(index, next)
    },
    [index, tags, onChange],
  )

  const toggleFormality = useCallback(
    (tag) => {
      const next = tags.formalityTags.includes(tag)
        ? tags.formalityTags.filter((t) => t !== tag)
        : [...tags.formalityTags, tag]
      onChange(index, { ...tags, formalityTags: next })
    },
    [index, tags, onChange],
  )

  const toggleSeason = useCallback(
    (tag) => {
      const next = tags.seasonTags.includes(tag)
        ? tags.seasonTags.filter((t) => t !== tag)
        : [...tags.seasonTags, tag]
      onChange(index, { ...tags, seasonTags: next })
    },
    [index, tags, onChange],
  )

  return (
    <div className={`bg-surface border rounded-card overflow-hidden transition-all ${lowConfidence ? 'border-brass/60 bg-brass/5' : 'border-line'}`}>
      <div className="flex flex-col sm:flex-row">
        {/* Image */}
        <div className="sm:w-40 h-48 sm:h-auto flex-shrink-0 bg-canvas">
          <img
            src={item.thumbnailUrl || item.imageUrl}
            alt={item.fileName || 'Uploaded item'}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Fields */}
        <div className="flex-1 p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-body font-medium text-ink truncate">
              {item.fileName || `Item ${index + 1}`}
            </h3>
            <div className="flex items-center gap-2">
              {lowConfidence && (
                <span className="flex items-center gap-1 rounded-full border border-brass/30 bg-brass/10 px-2 py-1 text-caption font-medium text-brass">
                  <AlertTriangle size={12} strokeWidth={1.5} />
                  Low confidence
                </span>
              )}
              {confirmed && (
                <span className="rounded-full border border-indigo/20 bg-indigo/10 px-2 py-1 text-caption font-medium text-indigo">
                  Saved
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Category"
              options={categories.map((c) => ({ value: c, label: c.charAt(0).toUpperCase() + c.slice(1) }))}
              placeholder="Select"
              value={tags.category}
              onChange={(e) => update('category', e.target.value)}
            />
            <Select
              label="Subcategory"
              options={subCategoryOptions}
              placeholder={tags.category ? 'Select' : 'Select category first'}
              disabled={!tags.category}
              value={tags.subCategory}
              onChange={(e) => update('subCategory', e.target.value)}
            />
            <Select
              label="Fit"
              options={FIT_OPTIONS}
              placeholder="Select"
              value={tags.fit}
              onChange={(e) => update('fit', e.target.value)}
            />
            <Select
              label="Sleeve length"
              options={SLEEVE_OPTIONS}
              placeholder="Select"
              value={tags.sleeveLength}
              onChange={(e) => update('sleeveLength', e.target.value)}
            />
            <Select
              label="Pattern"
              options={PATTERN_OPTIONS}
              placeholder="Select"
              value={tags.pattern}
              onChange={(e) => update('pattern', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-caption text-ink">Primary color</label>
              <input
                className="rounded-input border border-line bg-white px-3 py-2 text-body text-ink outline-none focus:border-indigo"
                value={tags.primaryColor}
                onChange={(e) => update('primaryColor', e.target.value)}
                placeholder="e.g. navy"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-caption text-ink">Secondary color</label>
              <input
                className="rounded-input border border-line bg-white px-3 py-2 text-body text-ink outline-none focus:border-indigo"
                value={tags.secondaryColor}
                onChange={(e) => update('secondaryColor', e.target.value)}
                placeholder="e.g. white"
              />
            </div>
          </div>

          {/* Formality Tags */}
          <div className="flex flex-col gap-1.5">
            <label className="text-caption text-ink">Occasion tags</label>
            <div className="flex flex-wrap gap-1.5">
              {occasions.map((o) => (
                <Chip
                  key={o}
                  interactive
                  selected={tags.formalityTags.includes(o)}
                  onClick={() => toggleFormality(o)}
                >
                  {o
                    .split('-')
                    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
                    .join(' ')}
                </Chip>
              ))}
            </div>
          </div>

          {/* Season Tags */}
          <div className="flex flex-col gap-1.5">
            <label className="text-caption text-ink">Season tags</label>
            <div className="flex flex-wrap gap-1.5">
              {SEASON_OPTIONS.map((s) => (
                <Chip
                  key={s.value}
                  interactive
                  selected={tags.seasonTags.includes(s.value)}
                  onClick={() => toggleSeason(s.value)}
                >
                  {s.label}
                </Chip>
              ))}
            </div>
          </div>

          <Button
            size="sm"
            variant="secondary"
            icon={Check}
            onClick={() => onConfirm(index)}
            className="self-start mt-1"
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save corrections'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function TagReviewPanel({ items, onItemsConfirmed, onSkip }) {
  const [tagsMap, setTagsMap] = useState(() =>
    items.map((item) => getInitialTags(item)),
  )
  const [confirmed, setConfirmed] = useState(() => new Set())
  const [savingIndex, setSavingIndex] = useState(null)

  const handleChange = useCallback((index, tags) => {
    setTagsMap((prev) => {
      const next = [...prev]
      next[index] = tags
      return next
    })
  }, [])

  useEffect(() => {
    setTagsMap(items.map((item) => getInitialTags(item)))
    setConfirmed(new Set())
    setSavingIndex(null)
  }, [items])

  const handleConfirm = useCallback(
    async (index) => {
      const result = {
        ...items[index],
        ...tagsMap[index],
        userCorrected: true,
      }

      setSavingIndex(index)
      try {
        if (onItemsConfirmed) {
          await onItemsConfirmed([result])
        }
        setConfirmed((prev) => {
          const next = new Set(prev)
          next.add(index)
          return next
        })
      } finally {
        setSavingIndex(null)
      }
    },
    [items, tagsMap, onItemsConfirmed],
  )

  const handleConfirmAll = useCallback(async () => {
    const results = items.map((item, i) => ({
      ...item,
      ...tagsMap[i],
      userCorrected: true,
    }))
    if (onItemsConfirmed) {
      await onItemsConfirmed(results)
      setConfirmed(new Set(items.map((_, i) => i)))
    }
  }, [items, tagsMap, onItemsConfirmed])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-h2 font-display text-ink">Review your items</h2>
          <p className="text-body text-ink/60 mt-1">
            {confirmed.size} of {items.length} confirmed
          </p>
        </div>
        <div className="flex gap-2">
          {onSkip && (
            <Button variant="tertiary" size="sm" onClick={onSkip}>
              Skip review
            </Button>
          )}
          <Button
            size="sm"
            disabled={items.length === 0 || savingIndex !== null}
            onClick={handleConfirmAll}
          >
            Save all
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {items.map((item, i) => (
          <ItemCard
            key={item.imageUrl || i}
            item={item}
            index={i}
            tags={tagsMap[i]}
            onChange={handleChange}
            onConfirm={handleConfirm}
            saving={savingIndex === i}
            confirmed={confirmed.has(i)}
          />
        ))}
      </div>
    </div>
  )
}

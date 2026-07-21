import { AlertTriangle, Archive, ArrowLeft } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, Card, Chip, Input, Select } from '../components/ui'
import { useToast } from '../components/ui/Toast'
import { categories, fits, patterns, sleeveLengths, subCategories } from '../constants/categories'
import { occasions } from '../constants/occasions'
import { deleteWardrobeItem, getWardrobeItem, updateWardrobeItem } from '../services/wardrobeService'

const FIT_OPTIONS = fits.map((value) => ({ value, label: value.charAt(0).toUpperCase() + value.slice(1) }))
const SLEEVE_OPTIONS = sleeveLengths.map((value) => ({ value, label: value === 'n/a' ? 'N/A' : value.charAt(0).toUpperCase() + value.slice(1) }))
const PATTERN_OPTIONS = patterns.map((value) => ({ value, label: value.charAt(0).toUpperCase() + value.slice(1) }))
const SEASON_OPTIONS = [
  { value: 'summer', label: 'Summer' },
  { value: 'winter', label: 'Winter' },
  { value: 'monsoon', label: 'Monsoon' },
  { value: 'all-season', label: 'All-season' },
]

function getInitialForm(item) {
  return {
    category: item?.category || '',
    subCategory: item?.subCategory || '',
    sleeveLength: item?.sleeveLength || 'n/a',
    fit: item?.fit || 'regular',
    primaryColor: item?.primaryColor || '',
    secondaryColor: item?.secondaryColor || '',
    pattern: item?.pattern || 'solid',
    formalityTags: item?.formalityTags || [],
    seasonTags: item?.seasonTags || [],
    isActive: item?.isActive ?? true,
  }
}

function buildAltText(item) {
  const colorParts = []
  if (item?.primaryColor) colorParts.push(item.primaryColor)
  if (item?.secondaryColor) colorParts.push(item.secondaryColor)

  const sleeveLabel = item?.sleeveLength === 'full'
    ? 'full-sleeve'
    : item?.sleeveLength === 'half'
      ? 'half-sleeve'
      : item?.sleeveLength === 'sleeveless'
        ? 'sleeveless'
        : ''

  const formalityTag = item?.formalityTags?.[0] || ''
  const subCategory = item?.subCategory || ''

  const parts = []
  if (colorParts.length > 0) parts.push(colorParts.join(' '))
  if (sleeveLabel) parts.push(sleeveLabel)
  if (formalityTag) parts.push(formalityTag)
  if (subCategory) parts.push(subCategory)

  return parts.join(' ').trim() || 'Wardrobe item'
}

export default function WardrobeItemPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const toast = useToast()

  const [item, setItem] = useState(null)
  const [outfits, setOutfits] = useState([])
  const [form, setForm] = useState(getInitialForm(null))
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [error, setError] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [archiveNotice, setArchiveNotice] = useState('')

  useEffect(() => {
    let ignore = false
    const loadItem = async () => {
      setLoading(true)
      setError(null)
      setNotFound(false)
      setArchiveNotice('')

      try {
        const { data } = await getWardrobeItem(id)
        if (!ignore && data.success) {
          setItem(data.data.item)
          setOutfits(data.data.outfits || [])
          setForm(getInitialForm(data.data.item))
        }
      } catch (err) {
        if (!ignore) {
          if (err?.response?.status === 404) {
            setNotFound(true)
          } else {
            setError('We could not load this item right now.')
          }
        }
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    loadItem()
    return () => {
      ignore = true
    }
  }, [id])

  const subCategoryOptions = useMemo(() => {
    if (!form.category) return []
    return (subCategories[form.category] || []).map((value) => ({ value, label: value.replace(/-/g, ' ') }))
  }, [form.category])

  const isLowConfidence = item?.aiTagConfidence != null && item.aiTagConfidence < 0.6
  const altText = useMemo(() => buildAltText(item), [item])

  const handleFieldChange = useCallback((field, value) => {
    setForm((prev) => {
      if (field === 'category') {
        return { ...prev, category: value, subCategory: '' }
      }
      return { ...prev, [field]: value }
    })
  }, [])

  const toggleTag = useCallback((field, tag) => {
    setForm((prev) => {
      const current = prev[field] || []
      const next = current.includes(tag) ? current.filter((value) => value !== tag) : [...current, tag]
      return { ...prev, [field]: next }
    })
  }, [])

  const handleSave = useCallback(async (event) => {
    event.preventDefault()
    if (!id) return

    setSaving(true)
    try {
      const payload = {
        category: form.category,
        subCategory: form.subCategory,
        sleeveLength: form.sleeveLength,
        fit: form.fit,
        primaryColor: form.primaryColor,
        secondaryColor: form.secondaryColor,
        pattern: form.pattern,
        formalityTags: form.formalityTags,
        seasonTags: form.seasonTags,
        userCorrected: true,
      }

      const { data } = await updateWardrobeItem(id, payload)
      if (data.success) {
        setItem((prev) => prev ? { ...prev, ...data.data.item, id: data.data.item.id } : prev)
        setForm((prev) => ({ ...prev, isActive: true }))
        toast.success('Item updated')
      }
    } catch (err) {
      if (err?.response?.status === 404) {
        setNotFound(true)
      } else {
        toast.error('Could not save your changes')
      }
    } finally {
      setSaving(false)
    }
  }, [form, id, toast])

  const handleArchive = useCallback(async () => {
    if (!id) return

    setArchiving(true)
    try {
      const { data } = await deleteWardrobeItem(id)
      if (data.success) {
        setItem((prev) => prev ? { ...prev, isActive: false } : prev)
        setForm((prev) => ({ ...prev, isActive: false }))
        setArchiveNotice('This history stays intact. Past outfit entries remain visible even after archiving this item.')
        toast.success('Item archived')
      }
    } catch (err) {
      if (err?.response?.status === 404) {
        setNotFound(true)
      } else {
        toast.error('Could not archive this item')
      }
    } finally {
      setArchiving(false)
    }
  }, [id, toast])

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl rounded-card border border-line bg-surface p-4 shadow-sm sm:p-6">
          <div className="h-8 w-32 animate-pulse rounded bg-ink/10" />
          <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="h-96 animate-pulse rounded-card bg-canvas" />
            <div className="space-y-3">
              <div className="h-8 w-40 animate-pulse rounded bg-ink/10" />
              <div className="h-24 animate-pulse rounded-card bg-canvas" />
              <div className="h-24 animate-pulse rounded-card bg-canvas" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-canvas px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-card border border-line bg-surface p-6 shadow-sm text-center">
          <h1 className="text-h1 font-display text-ink">This item may have been removed</h1>
          <p className="mt-3 text-body text-ink/60">
            The item you were editing is no longer available in your wardrobe.
          </p>
          <Button className="mt-6" onClick={() => navigate('/wardrobe')}>
            Back to wardrobe
          </Button>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-canvas px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-card border border-line bg-surface p-6 shadow-sm text-center">
          <h1 className="text-h1 font-display text-ink">We couldn’t load this item</h1>
          <p className="mt-3 text-body text-ink/60">Please try again in a moment.</p>
          <Button className="mt-6" onClick={() => navigate('/wardrobe')}>
            Back to wardrobe
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-canvas px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl rounded-card border border-line bg-surface p-4 shadow-sm sm:p-6">
        <button
          type="button"
          onClick={() => navigate('/wardrobe')}
          className="inline-flex items-center gap-2 text-body font-medium text-ink/70 hover:text-ink"
        >
          <ArrowLeft size={18} />
          Back to wardrobe
        </button>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="overflow-hidden p-0">
            <div className="aspect-[4/5] bg-canvas">
              <img
                src={item?.imageUrl || item?.thumbnailUrl}
                alt={altText}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-h1 font-display text-ink capitalize">
                  {item?.subCategory?.replace(/-/g, ' ') || 'Wardrobe item'}
                </h1>
                {isLowConfidence && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-brass/30 bg-brass/10 px-2.5 py-1 text-caption font-medium text-brass">
                    <AlertTriangle size={12} strokeWidth={1.5} />
                    Low confidence
                  </span>
                )}
                {!item?.isActive && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-ink/20 bg-ink/5 px-2.5 py-1 text-caption font-medium text-ink/70">
                    <Archive size={12} strokeWidth={1.5} />
                    Archived
                  </span>
                )}
              </div>

              <p className="mt-3 text-body text-ink/60">
                Review and refine the tags for this item. Your changes are saved directly to your wardrobe profile.
              </p>

              {archiveNotice && (
                <div className="mt-4 rounded-card border border-indigo/20 bg-indigo/5 px-3 py-2 text-caption text-ink/70">
                  {archiveNotice}
                </div>
              )}
            </div>
          </Card>

          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <Card className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-h2 font-display text-ink">Edit tags</h2>
                  <p className="text-body text-ink/60">These fields update the item through the wardrobe patch endpoint.</p>
                </div>
                <Button type="submit" loading={saving}>
                  Save changes
                </Button>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <Select
                  label="Category"
                  options={categories.map((value) => ({ value, label: value.charAt(0).toUpperCase() + value.slice(1) }))}
                  value={form.category}
                  onChange={(event) => handleFieldChange('category', event.target.value)}
                />
                <Select
                  label="Subcategory"
                  options={subCategoryOptions}
                  value={form.subCategory}
                  disabled={!form.category}
                  onChange={(event) => handleFieldChange('subCategory', event.target.value)}
                />
                <Select
                  label="Fit"
                  options={FIT_OPTIONS}
                  value={form.fit}
                  onChange={(event) => handleFieldChange('fit', event.target.value)}
                />
                <Select
                  label="Sleeve length"
                  options={SLEEVE_OPTIONS}
                  value={form.sleeveLength}
                  onChange={(event) => handleFieldChange('sleeveLength', event.target.value)}
                />
                <Select
                  label="Pattern"
                  options={PATTERN_OPTIONS}
                  value={form.pattern}
                  onChange={(event) => handleFieldChange('pattern', event.target.value)}
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <Input
                  label="Primary color"
                  value={form.primaryColor}
                  onChange={(event) => handleFieldChange('primaryColor', event.target.value)}
                  placeholder="e.g. navy"
                />
                <Input
                  label="Secondary color"
                  value={form.secondaryColor}
                  onChange={(event) => handleFieldChange('secondaryColor', event.target.value)}
                  placeholder="e.g. white"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-caption text-ink">Occasion tags</label>
                <div className="flex flex-wrap gap-2">
                  {occasions.map((tag) => (
                    <Chip
                      key={tag}
                      interactive
                      selected={form.formalityTags.includes(tag)}
                      onClick={() => toggleTag('formalityTags', tag)}
                    >
                      {tag.charAt(0).toUpperCase() + tag.slice(1)}
                    </Chip>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-caption text-ink">Season tags</label>
                <div className="flex flex-wrap gap-2">
                  {SEASON_OPTIONS.map((option) => (
                    <Chip
                      key={option.value}
                      interactive
                      selected={form.seasonTags.includes(option.value)}
                      onClick={() => toggleTag('seasonTags', option.value)}
                    >
                      {option.label}
                    </Chip>
                  ))}
                </div>
              </div>
            </Card>

            <Card className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-h2 font-display text-ink">Outfits using this item</h2>
                  <p className="text-body text-ink/60">
                    {outfits.length} outfit{outfits.length === 1 ? '' : 's'} currently reference this item.
                  </p>
                </div>
                <Button variant="danger" loading={archiving} icon={Archive} onClick={handleArchive}>
                  Archive item
                </Button>
              </div>

              {outfits.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {outfits.map((outfit) => (
                    <div key={outfit.id} className="rounded-card border border-line bg-canvas px-3 py-2 text-caption text-ink/70">
                      Outfit {outfit.id.slice(-6)} · {outfit.itemIds?.length || 0} items
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-body text-ink/60">No outfits are currently using this item.</p>
              )}
            </Card>
          </form>
        </div>
      </div>
    </div>
  )
}

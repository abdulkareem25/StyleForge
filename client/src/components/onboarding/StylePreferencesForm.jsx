import { useState, useCallback } from 'react'
import { Palette, Shirt, Sparkles } from 'lucide-react'
import { Button, Select, Chip } from '../ui'
import { fitPreferences, printTolerances } from '../../constants/categories'

const COLOR_OPTIONS = [
  { value: 'black', label: 'Black' },
  { value: 'white', label: 'White' },
  { value: 'navy', label: 'Navy' },
  { value: 'grey', label: 'Grey' },
  { value: 'brown', label: 'Brown' },
  { value: 'beige', label: 'Beige' },
  { value: 'red', label: 'Red' },
  { value: 'blue', label: 'Blue' },
  { value: 'green', label: 'Green' },
  { value: 'orange', label: 'Orange' },
  { value: 'pink', label: 'Pink' },
  { value: 'purple', label: 'Purple' },
  { value: 'yellow', label: 'Yellow' },
]

const FIT_OPTIONS = fitPreferences.map((v) => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) }))

const PRINT_LABELS = { low: 'Mostly solid', medium: 'Mix of both', high: 'Love prints' }
const PRINT_OPTIONS = printTolerances.map((v) => ({ value: v, label: PRINT_LABELS[v] || v }))

export default function StylePreferencesForm({ onSubmit, onSkip, loading, initialValues }) {
  const [preferredColors, setPreferredColors] = useState(initialValues?.preferredColors || [])
  const [fitPreference, setFitPreference] = useState(initialValues?.fitPreference || '')
  const [printTolerance, setPrintTolerance] = useState(initialValues?.printTolerance || '')

  const toggleColor = useCallback((color) => {
    setPreferredColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color],
    )
  }, [])

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault()
      const preferences = {}
      if (preferredColors.length > 0) preferences.preferredColors = preferredColors
      if (fitPreference) preferences.fitPreference = fitPreference
      if (printTolerance) preferences.printTolerance = printTolerance
      onSubmit(preferences)
    },
    [preferredColors, fitPreference, printTolerance, onSubmit],
  )

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      {/* Preferred Colors */}
      <fieldset>
        <legend className="flex items-center gap-2 text-caption text-ink mb-3">
          <Palette size={14} strokeWidth={1.5} className="text-indigo" />
          Preferred colors
        </legend>
        <div className="flex flex-wrap gap-2">
          {COLOR_OPTIONS.map((color) => (
            <Chip
              key={color.value}
              interactive
              selected={preferredColors.includes(color.value)}
              onClick={() => toggleColor(color.value)}
            >
              {color.label}
            </Chip>
          ))}
        </div>
      </fieldset>

      {/* Fit Preference */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="fit-preference" className="flex items-center gap-2 text-caption text-ink">
          <Shirt size={14} strokeWidth={1.5} className="text-indigo" />
          Fit preference
        </label>
        <Select
          id="fit-preference"
          options={FIT_OPTIONS}
          placeholder="No preference"
          value={fitPreference}
          onChange={(e) => setFitPreference(e.target.value)}
        />
      </div>

      {/* Print Tolerance */}
      <fieldset>
        <legend className="flex items-center gap-2 text-caption text-ink mb-3">
          <Sparkles size={14} strokeWidth={1.5} className="text-indigo" />
          Print tolerance
        </legend>
        <div className="flex gap-2">
          {PRINT_OPTIONS.map((opt) => (
            <Chip
              key={opt.value}
              interactive
              selected={printTolerance === opt.value}
              onClick={() => setPrintTolerance((prev) => (prev === opt.value ? '' : opt.value))}
            >
              {opt.label}
            </Chip>
          ))}
        </div>
      </fieldset>

      {/* Actions */}
      <div className="flex flex-col gap-3 pt-2">
        <Button type="submit" size="full" loading={loading}>
          Save preferences
        </Button>
        <Button type="button" variant="tertiary" size="full" onClick={onSkip}>
          Skip for now
        </Button>
      </div>
    </form>
  )
}

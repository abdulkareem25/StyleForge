import { Loader2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button, Card, Chip, Input } from '../components/ui';
import { CUSTOM_OCCASION_MAX_LENGTH, occasionGroups, validateCustomOccasion } from '../constants/occasions';

const WEATHER_OPTIONS = [
  { value: 'summer', label: 'Summer' },
  { value: 'winter', label: 'Winter' },
  { value: 'monsoon', label: 'Monsoon' },
  { value: 'any', label: 'Any' },
];

function findSelectedOccasionLabel(selectedOccasion, customOccasion) {
  if (!selectedOccasion) return 'No occasion selected';
  if (selectedOccasion === 'custom') {
    const validation = validateCustomOccasion(customOccasion);
    return validation.isValid ? validation.value : 'Custom occasion';
  }

  const match = occasionGroups
    .flatMap((group) => group.occurrences)
    .find((occurrence) => occurrence.value === selectedOccasion);

  return match?.label || selectedOccasion;
}

export default function GenerateOutfit() {
  const [selectedOccasion, setSelectedOccasion] = useState('');
  const [customOccasion, setCustomOccasion] = useState('');
  const [weather, setWeather] = useState('any');
  const [showCustomField, setShowCustomField] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const customValidation = useMemo(() => validateCustomOccasion(customOccasion), [customOccasion]);
  const displayValue = useMemo(() => findSelectedOccasionLabel(selectedOccasion, customOccasion), [customOccasion, selectedOccasion]);
  const canGenerate = Boolean(selectedOccasion && (selectedOccasion !== 'custom' || customValidation.isValid));

  const handleSelectOccasion = (value) => {
    setSelectedOccasion(value);
    if (value !== 'custom') {
      setShowCustomField(false);
      setCustomOccasion('');
    }
  };

  const handleOpenCustom = () => {
    setSelectedOccasion('custom');
    setShowCustomField(true);
  };

  const handleSubmitCustom = () => {
    if (!customValidation.isValid) return;
    setSelectedOccasion('custom');
    setCustomOccasion(customValidation.value);
    setShowCustomField(false);
  };

  const handleGenerate = () => {
    if (!canGenerate) return;
    setIsGenerating(true);
    window.setTimeout(() => setIsGenerating(false), 1200);
  };

  if (isGenerating) {
    return (
      <div className="min-h-screen bg-canvas px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-center">
          <Card className="flex w-full max-w-xl flex-col items-center gap-4 p-8 text-center">
            <div className="rounded-full bg-indigo/10 p-4 text-indigo">
              <Loader2 size={24} strokeWidth={1.5} className="animate-spin" />
            </div>
            <h1 className="text-h1 font-display text-ink">Generating your outfit</h1>
            <p className="text-body text-ink/60">We’re preparing options for your selected occasion and weather.</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <Card className="flex flex-col gap-4 p-6">
          <div className="space-y-2">
            <p className="text-caption uppercase tracking-[0.24em] text-indigo">Occasion selector</p>
            <h1 className="text-h1 font-display text-ink">Choose the vibe for your outfit</h1>
            <p className="text-body text-ink/60">
              Pick from the 18 fixed occasions grouped by context, or type a custom one that will be shown back as plain text.
            </p>
          </div>

          <div className="rounded-card border border-line bg-canvas/70 p-4">
            <p className="text-caption text-ink/70">Selected occasion</p>
            <p className="mt-1 text-body font-medium text-ink">{displayValue}</p>
          </div>

          {occasionGroups.map((group) => (
            <div key={group.name} className="space-y-2">
              <p className="text-caption font-medium uppercase tracking-[0.2em] text-ink/60">{group.name}</p>
              <div className="flex flex-wrap gap-2">
                {group.occurrences.map((occurrence) => (
                  <Chip
                    key={occurrence.value}
                    interactive
                    selected={selectedOccasion === occurrence.value}
                    onClick={() => handleSelectOccasion(occurrence.value)}
                  >
                    {occurrence.label}
                  </Chip>
                ))}
              </div>
            </div>
          ))}

          <div className="space-y-2">
            <Chip
              interactive
              selected={selectedOccasion === 'custom'}
              onClick={handleOpenCustom}
            >
              + Custom
            </Chip>
            {showCustomField && (
              <div className="rounded-card border border-line bg-surface p-4">
                <Input
                  label="Custom occasion"
                  value={customOccasion}
                  onChange={(event) => setCustomOccasion(event.target.value)}
                  placeholder="Describe your event"
                  maxLength={CUSTOM_OCCASION_MAX_LENGTH}
                />
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setShowCustomField(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSubmitCustom} disabled={!customValidation.isValid}>
                    Use this occasion
                  </Button>
                </div>
                <p className="mt-2 text-caption text-ink/60">
                  {customValidation.isValid
                    ? `${customOccasion.trim().length} / ${CUSTOM_OCCASION_MAX_LENGTH} characters`
                    : customValidation.error}
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-caption font-medium uppercase tracking-[0.2em] text-ink/60">Weather</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
              {WEATHER_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`w-full rounded-card border px-3 py-2 text-body font-medium transition-colors ${weather === option.value ? 'border-indigo bg-indigo text-white' : 'border-line bg-surface text-ink hover:border-indigo/40'}`}
                  onClick={() => setWeather(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <Button size="lg" className="w-full sm:w-auto" disabled={!canGenerate} onClick={handleGenerate}>
            Generate
          </Button>
        </Card>
      </div>
    </div>
  );
}

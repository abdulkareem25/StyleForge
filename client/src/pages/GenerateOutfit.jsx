import { useMemo, useState } from 'react';
import { Card, Chip, Input } from '../components/ui';
import { CUSTOM_OCCASION_MAX_LENGTH, occasionGroups, validateCustomOccasion } from '../constants/occasions';

function buildDisplayValue(selectedOccasion, customOccasion) {
  if (!selectedOccasion) return 'No occasion selected';
  if (selectedOccasion === 'custom') {
    const validation = validateCustomOccasion(customOccasion);
    return validation.isValid ? validation.value : 'Custom occasion';
  }

  return selectedOccasion;
}

export default function GenerateOutfit() {
  const [selectedOccasion, setSelectedOccasion] = useState('');
  const [customOccasion, setCustomOccasion] = useState('');

  const customValidation = useMemo(() => validateCustomOccasion(customOccasion), [customOccasion]);
  const displayValue = useMemo(() => buildDisplayValue(selectedOccasion, customOccasion), [customOccasion, selectedOccasion]);

  const handleSelectOccasion = (value) => {
    setSelectedOccasion(value);
    if (value !== 'custom') {
      setCustomOccasion('');
    }
  };

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
              onClick={() => handleSelectOccasion('custom')}
            >
              Custom
            </Chip>
            {selectedOccasion === 'custom' && (
              <div className="rounded-card border border-line bg-surface p-4">
                <Input
                  label="Custom occasion"
                  value={customOccasion}
                  onChange={(event) => setCustomOccasion(event.target.value)}
                  placeholder="Describe your event"
                  maxLength={CUSTOM_OCCASION_MAX_LENGTH}
                />
                <p className="mt-2 text-caption text-ink/60">
                  {customValidation.isValid
                    ? `${customOccasion.trim().length} / ${CUSTOM_OCCASION_MAX_LENGTH} characters`
                    : customValidation.error}
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

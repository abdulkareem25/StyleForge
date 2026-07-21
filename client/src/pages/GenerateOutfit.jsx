import { ArrowLeft, MapPin } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Card, Chip, Input, SkeletonCard } from '../components/ui';
import { useToast } from '../components/ui/Toast';
import EmptyOutfitState from '../components/outfits/EmptyOutfitState';
import OutfitResults from '../components/outfits/OutfitResults';
import {
  CUSTOM_OCCASION_MAX_LENGTH,
  occasionGroups,
  validateCustomOccasion,
  getOccasionDisplayLabel,
} from '../constants/occasions';
import { generateOutfits, wearOutfit, favoriteOutfit } from '../services/outfitService';
import { getWardrobe } from '../services/wardrobeService';

const WEATHER_OPTIONS = [
  { value: 'summer', label: 'Summer' },
  { value: 'winter', label: 'Winter' },
  { value: 'monsoon', label: 'Monsoon' },
  { value: 'any', label: 'Any' },
];

const VIEW_MODES = { SELECTOR: 'selector', LOADING: 'loading', RESULTS: 'results', EMPTY: 'empty' };

function getSlotLabel(item) {
  const labels = { top: 'Top', bottom: 'Bottom', footwear: 'Footwear', ethnic: 'Top', outerwear: 'Outerwear', accessory: 'Accessory' };
  return labels[item?.category] || 'Item';
}

function OutfitSkeletonCard() {
  return (
    <div className="flex flex-col gap-4 rounded-card border border-line bg-surface p-4">
      <div className="grid grid-cols-[1fr_1fr] grid-rows-[auto_auto] gap-2">
        <div className="row-span-2">
          <SkeletonCard className="!p-0">
            <div className="aspect-square w-full rounded-card bg-ink/8 animate-pulse" />
          </SkeletonCard>
        </div>
        <div className="aspect-square w-full rounded-card bg-ink/8 animate-pulse" />
        <div className="aspect-square w-full rounded-card bg-ink/8 animate-pulse" />
      </div>
      <div className="flex gap-2">
        <div className="h-5 w-16 rounded-tag bg-ink/8 animate-pulse" />
        <div className="h-5 w-12 rounded-tag bg-ink/8 animate-pulse" />
      </div>
      <div className="h-10 w-full rounded-card bg-ink/8 animate-pulse" />
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-canvas px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <div className="hidden gap-6 sm:grid sm:grid-cols-2 lg:grid-cols-3">
          <OutfitSkeletonCard />
          <OutfitSkeletonCard />
          <OutfitSkeletonCard />
        </div>
        <div className="sm:hidden">
          <OutfitSkeletonCard />
        </div>
        <p className="text-center text-body text-ink/50">Finding your outfit&hellip;</p>
      </div>
    </div>
  );
}

export default function GenerateOutfit() {
  const { success: toastSuccess, error: toastError } = useToast();

  const [selectedOccasion, setSelectedOccasion] = useState('');
  const [customOccasion, setCustomOccasion] = useState('');
  const [weather, setWeather] = useState('any');
  const [weatherStatus, setWeatherStatus] = useState('detecting');
  const [showCustomField, setShowCustomField] = useState(false);
  const [viewMode, setViewMode] = useState(VIEW_MODES.SELECTOR);
  const [outfitResults, setOutfitResults] = useState([]);
  const [outfitItems, setOutfitItems] = useState([]);
  const [usedFallback, setUsedFallback] = useState(false);
  const [resultState, setResultState] = useState(null);
  const [wornOutfitHashes, setWornOutfitHashes] = useState(new Set());
  const [apiError, setApiError] = useState(null);
  const [occasion, setOccasion] = useState('');
  const [currentWeather, setCurrentWeather] = useState('any');

  const manualWeatherSelectionRef = useRef(false);
  const wardrobeCacheRef = useRef(null);

  const customValidation = useMemo(() => validateCustomOccasion(customOccasion), [customOccasion]);
  const displayValue = useMemo(() => findSelectedOccasionLabel(selectedOccasion, customOccasion), [customOccasion, selectedOccasion]);
  const canGenerate = Boolean(selectedOccasion && (selectedOccasion !== 'custom' || customValidation.isValid));

  const handleSelectOccasion = useCallback((value) => {
    setSelectedOccasion(value);
    if (value !== 'custom') {
      setShowCustomField(false);
      setCustomOccasion('');
    }
  }, []);

  const handleOpenCustom = useCallback(() => {
    setSelectedOccasion('custom');
    setShowCustomField(true);
  }, []);

  const handleSubmitCustom = useCallback(() => {
    if (!customValidation.isValid) return;
    setSelectedOccasion('custom');
    setCustomOccasion(customValidation.value);
    setShowCustomField(false);
  }, [customValidation]);

  useEffect(() => {
    let isCancelled = false;
    const weatherApiBaseUrl = import.meta.env.VITE_WEATHER_API_BASE_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

    if (!('geolocation' in navigator)) {
      if (!isCancelled) setWeatherStatus('fallback');
      return () => { isCancelled = true; };
    }

    setWeatherStatus('detecting');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const response = await fetch(`${weatherApiBaseUrl.replace(/\/$/, '')}/weather?lat=${position.coords.latitude}&lon=${position.coords.longitude}`, {
            credentials: 'include',
          });
          const result = await response.json();

          if (!isCancelled && result?.success && result.data?.weather && !manualWeatherSelectionRef.current) {
            setWeather(result.data.weather);
            setWeatherStatus('detected');
          } else if (!isCancelled) {
            setWeatherStatus(manualWeatherSelectionRef.current ? 'manual' : 'fallback');
          }
        } catch {
          if (!isCancelled) setWeatherStatus('fallback');
        }
      },
      (error) => {
        if (!isCancelled) {
          setWeatherStatus(error.code === 1 ? 'permission-denied' : 'fallback');
        }
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 },
    );

    return () => { isCancelled = true; };
  }, []);

  const handleWeatherSelect = useCallback((value) => {
    setWeather(value);
    manualWeatherSelectionRef.current = true;
    setWeatherStatus('manual');
  }, []);

  const fetchWardrobeItems = useCallback(async (itemIds) => {
    if (wardrobeCacheRef.current) return wardrobeCacheRef.current;

    try {
      const response = await getWardrobe({ isActive: 'true' });
      const items = response?.data?.data || response?.data || [];
      wardrobeCacheRef.current = items;
      return items;
    } catch {
      return [];
    }
  }, []);

  const handleGenerate = useCallback(async (overrideRepeat = false) => {
    if (!canGenerate && !overrideRepeat) return;

    const occasionValue = overrideRepeat ? occasion : (selectedOccasion === 'custom' ? customValidation.value : selectedOccasion);
    const weatherValue = overrideRepeat ? currentWeather : weather;

    setViewMode(VIEW_MODES.LOADING);
    setApiError(null);
    setOccasion(occasionValue);
    setCurrentWeather(weatherValue);

    try {
      const payload = { occasion: occasionValue, weather: weatherValue };
      if (overrideRepeat) payload.overrideRepeat = true;

      const response = await generateOutfits(payload);
      const result = response?.data?.data || response?.data;

      if (!result) {
        setApiError('Something went wrong. Please try again.');
        setViewMode(VIEW_MODES.SELECTOR);
        return;
      }

      const { outfits = [], usedFallback: fb = false, resultState: rs = 'success' } = result;

      if (rs === 'no-eligible-items' || rs === 'all-fresh-exhausted') {
        setResultState(rs);
        setUsedFallback(false);
        setOutfitResults([]);
        setOutfitItems([]);
        setViewMode(VIEW_MODES.EMPTY);
        return;
      }

      const allItemIds = [...new Set(outfits.flatMap((o) => o.itemIds || []))];
      let items = [];
      if (allItemIds.length > 0) {
        const wardrobeItems = await fetchWardrobeItems(allItemIds);
        const itemById = new Map(wardrobeItems.map((item) => [item._id || item.id, item]));
        items = allItemIds.map((id) => itemById.get(id)).filter(Boolean);
      }

      setOutfitResults(outfits);
      setOutfitItems(items);
      setUsedFallback(fb);
      setResultState(rs);
      setViewMode(VIEW_MODES.RESULTS);
    } catch (err) {
      const message = err?.response?.data?.error || err?.message || 'Something went wrong. Please try again.';
      setApiError(message);
      setViewMode(VIEW_MODES.SELECTOR);
    }
  }, [canGenerate, selectedOccasion, customValidation, weather, occasion, currentWeather, fetchWardrobeItems]);

  const handleWear = useCallback(async (outfit) => {
    try {
      await wearOutfit(outfit.combinationHash, {
        itemIds: outfit.itemIds,
        occasion,
        weather: currentWeather,
      });
      setWornOutfitHashes((prev) => new Set([...prev, outfit.combinationHash]));
      toastSuccess('Outfit confirmed!');
    } catch {
      toastError('Could not confirm wear. Please try again.');
    }
  }, [occasion, currentWeather, toastSuccess, toastError]);

  const handleFavorite = useCallback(async (outfit) => {
    try {
      await favoriteOutfit(outfit.combinationHash);
      toastSuccess('Added to favorites!');
    } catch {
      toastError('Could not favorite this outfit. Please try again.');
    }
  }, [toastSuccess, toastError]);

  const handleBackToSelector = useCallback(() => {
    setViewMode(VIEW_MODES.SELECTOR);
    setOutfitResults([]);
    setOutfitItems([]);
    setResultState(null);
    setApiError(null);
  }, []);

  if (viewMode === VIEW_MODES.LOADING) {
    return <LoadingSkeleton />;
  }

  if (viewMode === VIEW_MODES.RESULTS || viewMode === VIEW_MODES.EMPTY) {
    return (
      <div className="min-h-screen bg-canvas px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-5xl flex-col gap-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBackToSelector}
              className="inline-flex items-center gap-1.5 rounded-card p-2 text-ink transition-colors hover:bg-ink/5 focus:outline-none focus:ring-2 focus:ring-indigo focus:ring-offset-2"
              aria-label="Back to occasion selector"
            >
              <ArrowLeft size={18} strokeWidth={1.5} />
            </button>
            <div>
              <p className="text-caption uppercase tracking-[0.24em] text-indigo">Your outfits</p>
              <h1 className="text-h1 font-display text-ink">
                {getOccasionDisplayLabel(occasion) || occasion}
              </h1>
            </div>
          </div>

          {apiError && (
            <Card className="border-brick/20 bg-brick/5 p-4 text-center">
              <p className="text-body text-brick">{apiError}</p>
              <Button variant="secondary" size="sm" className="mt-3" onClick={handleBackToSelector}>
                Try again
              </Button>
            </Card>
          )}

          {viewMode === VIEW_MODES.EMPTY && !apiError && (
            <Card className="p-0">
              <EmptyOutfitState
                resultState={resultState}
                onShowRepeat={() => handleGenerate(true)}
              />
            </Card>
          )}

          {viewMode === VIEW_MODES.RESULTS && outfitResults.length > 0 && (
            <OutfitResults
              outfits={outfitResults}
              items={outfitItems}
              occasion={occasion}
              weather={currentWeather}
              usedFallback={usedFallback}
              wornOutfitHashes={wornOutfitHashes}
              onWear={handleWear}
              onRegenerate={() => handleGenerate(false)}
              onSwap={() => {}}
              onFavorite={handleFavorite}
              onShowRepeat={() => handleGenerate(true)}
            />
          )}
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
            <div className="flex w-full flex-col gap-2 sm:flex-row">
              {WEATHER_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`flex-1 rounded-card border px-3 py-2 text-body font-medium transition-colors ${weather === option.value ? 'border-indigo bg-indigo text-white' : 'border-line bg-surface text-ink hover:border-indigo/40'}`}
                  onClick={() => handleWeatherSelect(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <p className="flex items-center gap-1 text-caption text-ink/60">
              {weatherStatus === 'detecting' && (
                <>
                  <MapPin size={12} strokeWidth={1.5} className="animate-pulse" />
                  Detecting your local weather&hellip;
                </>
              )}
              {weatherStatus === 'detected' && (
                <>
                  <MapPin size={12} strokeWidth={1.5} className="text-indigo" />
                  Weather auto-detected for your location.
                </>
              )}
              {weatherStatus === 'manual' && 'Using your manual weather selection.'}
              {weatherStatus === 'permission-denied' && 'Location access was denied, so weather stays on manual selection.'}
              {weatherStatus === 'fallback' && 'Weather detection is unavailable right now. You can still choose manually.'}
            </p>
          </div>

          <Button size="lg" className="w-full sm:w-auto" disabled={!canGenerate} onClick={() => handleGenerate(false)}>
            Generate
          </Button>
        </Card>
      </div>
    </div>
  );
}

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

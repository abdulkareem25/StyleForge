import { useCallback, useRef, useState } from 'react';
import OutfitCard from './OutfitCard';

export default function OutfitResults({
  outfits = [],
  items = [],
  occasion,
  weather,
  usedFallback = false,
  wornOutfitHashes = new Set(),
  swappingIndex = null,
  swappingCategory = null,
  onWear,
  onRegenerate,
  onSwap,
  onFavorite,
  onShowRepeat,
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isSwiping = useRef(false);

  const handleTouchStart = useCallback((e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isSwiping.current = false;
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!isSwiping.current) {
      const deltaX = Math.abs(e.touches[0].clientX - touchStartX.current);
      const deltaY = Math.abs(e.touches[0].clientY - touchStartY.current);
      if (deltaX > deltaY && deltaX > 10) {
        isSwiping.current = true;
      }
    }
    if (isSwiping.current) {
      e.preventDefault();
    }
  }, []);

  const handleTouchEnd = useCallback(
    (e) => {
      if (!isSwiping.current) return;
      const deltaX = e.changedTouches[0].clientX - touchStartX.current;
      const threshold = 50;

      if (deltaX < -threshold && currentIndex < outfits.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else if (deltaX > threshold && currentIndex > 0) {
        setCurrentIndex((prev) => prev - 1);
      }
    },
    [currentIndex, outfits.length],
  );

  if (outfits.length === 0) return null;

  return (
    <div className="flex flex-col gap-6">
      <div className="hidden gap-6 sm:grid sm:grid-cols-2 lg:grid-cols-3">
        {outfits.map((outfit, index) => (
          <OutfitCard
            key={outfit.combinationHash || index}
            outfit={outfit}
            items={items}
            occasion={occasion}
            weather={weather}
            usedFallback={usedFallback}
            wornOutfitHashes={wornOutfitHashes}
            swappingCategory={swappingIndex === index ? swappingCategory : null}
            onWear={onWear}
            onRegenerate={() => onRegenerate?.()}
            onSwap={onSwap}
            onFavorite={onFavorite}
            onShowRepeat={onShowRepeat}
          />
        ))}
      </div>

      <div
        className="sm:hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="flex snap-x snap-mandatory overflow-x-auto"
          style={{ scrollBehavior: 'smooth' }}
        >
          {outfits.map((outfit, index) => (
            <div
              key={outfit.combinationHash || index}
              className="w-full flex-shrink-0 snap-center px-1 first:pl-0 last:pr-0"
            >
              <OutfitCard
                outfit={outfit}
                items={items}
                occasion={occasion}
                weather={weather}
                usedFallback={usedFallback}
                wornOutfitHashes={wornOutfitHashes}
                swappingCategory={swappingIndex === index ? swappingCategory : null}
                onWear={onWear}
                onRegenerate={() => onRegenerate?.()}
                onSwap={onSwap}
                onFavorite={onFavorite}
                onShowRepeat={onShowRepeat}
              />
            </div>
          ))}
        </div>

        {outfits.length > 1 && (
          <div className="mt-4 flex items-center justify-center gap-2">
            {outfits.map((outfit, index) => (
              <button
                key={outfit.combinationHash || index}
                type="button"
                onClick={() => setCurrentIndex(index)}
                className={`h-2 w-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo focus:ring-offset-2 ${
                  index === currentIndex ? 'bg-indigo' : 'bg-ink/15'
                }`}
                aria-label={`View outfit ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { Check, Heart, RefreshCw, RefreshCwOff, Shirt, Shuffle, Sparkles } from 'lucide-react';
import { Chip } from '../ui';
import { getOccasionDisplayLabel } from '../../constants/occasions';

const CATEGORY_LABELS = {
  top: 'Top',
  bottom: 'Bottom',
  footwear: 'Footwear',
  ethnic: 'Top',
  outerwear: 'Outerwear',
  accessory: 'Accessory',
};

function getSlotLabel(item) {
  return CATEGORY_LABELS[item?.category] || 'Item';
}

function ItemThumbnail({ item, slotLabel }) {
  if (!item) {
    return (
      <div className="flex aspect-square w-full flex-col items-center justify-center rounded-card border border-dashed border-line bg-canvas/50 gap-1">
        <Shirt size={20} strokeWidth={1.5} className="text-ink/15" />
        <span className="text-micro text-ink/30">{slotLabel}</span>
      </div>
    );
  }

  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-card">
      <img
        src={item.thumbnailUrl || item.imageUrl}
        alt={item.subCategory || item.category || 'Clothing item'}
        className="h-full w-full object-cover"
        loading="lazy"
      />
      <span className="absolute bottom-1 left-1 rounded bg-ink/60 px-1 py-px text-micro text-white">
        {slotLabel}
      </span>
    </div>
  );
}

export default function OutfitCard({
  outfit,
  items = [],
  occasion,
  weather,
  usedFallback = false,
  wornOutfitHashes = new Set(),
  onWear,
  onRegenerate,
  onSwap,
  onFavorite,
  onShowRepeat,
  className = '',
}) {
  const itemMap = new Map(items.map((item) => [item._id || item.id, item]));
  const resolvedItems = (outfit.itemIds || [])
    .map((id) => itemMap.get(id) || null)
    .filter(Boolean);

  const topItem = resolvedItems.find((i) => ['top', 'ethnic'].includes(i.category)) || resolvedItems[0] || null;
  const bottomItem = resolvedItems.find((i) => i.category === 'bottom') || null;
  const footwearItem = resolvedItems.find((i) => i.category === 'footwear') || null;

  const occasionLabel = getOccasionDisplayLabel(occasion) || occasion;
  const weatherLabel = weather ? weather.charAt(0).toUpperCase() + weather.slice(1) : '';

  const alreadyWorn = wornOutfitHashes.has(outfit.combinationHash);

  const handleWear = () => onWear?.(outfit);
  const handleRegenerate = () => onRegenerate?.();
  const handleSwap = () => onSwap?.(outfit);
  const handleFavorite = () => onFavorite?.(outfit);
  const handleShowRepeat = () => onShowRepeat?.();

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {usedFallback && (
        <div className="inline-flex items-center gap-1.5 self-start rounded-tag border border-brass/30 bg-brass/10 px-2 py-0.5">
          <Sparkles size={11} strokeWidth={1.5} className="text-brass" />
          <span className="text-tag font-mono text-brass">Freshest available</span>
        </div>
      )}

      <div className="grid grid-cols-[1fr_1fr] grid-rows-[auto_auto] gap-2">
        <div className="row-span-2">
          <ItemThumbnail item={topItem} slotLabel="Top" />
        </div>
        <div>
          <ItemThumbnail item={bottomItem} slotLabel="Bottom" />
        </div>
        <div>
          <ItemThumbnail item={footwearItem} slotLabel="Footwear" />
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {occasionLabel && <Chip>{occasionLabel}</Chip>}
        {weatherLabel && weatherLabel !== 'Any' && <Chip>{weatherLabel}</Chip>}
      </div>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={handleWear}
          className="inline-flex w-full items-center justify-center gap-2 rounded-card bg-indigo px-4 py-3 text-body font-medium text-white shadow-sm transition-colors hover:bg-indigo/90 active:bg-indigo/95 focus:outline-none focus:ring-2 focus:ring-indigo focus:ring-offset-2"
        >
          {alreadyWorn ? <Check size={16} strokeWidth={1.5} /> : <Shirt size={16} strokeWidth={1.5} />}
          {alreadyWorn ? 'Wear again' : 'Wear this'}
        </button>

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={handleRegenerate}
            className="inline-flex items-center justify-center gap-1.5 rounded-card border border-line bg-transparent px-2 py-2 text-body text-ink transition-colors hover:bg-ink/5 active:bg-ink/10 focus:outline-none focus:ring-2 focus:ring-indigo focus:ring-offset-2"
            title="Regenerate"
          >
            <RefreshCw size={14} strokeWidth={1.5} />
            <span className="hidden sm:inline">Regenerate</span>
          </button>
          <button
            type="button"
            onClick={handleSwap}
            className="inline-flex items-center justify-center gap-1.5 rounded-card border border-line bg-transparent px-2 py-2 text-body text-ink transition-colors hover:bg-ink/5 active:bg-ink/10 focus:outline-none focus:ring-2 focus:ring-indigo focus:ring-offset-2"
            title="Swap a piece"
          >
            <Shuffle size={14} strokeWidth={1.5} />
            <span className="hidden sm:inline">Swap</span>
          </button>
          <button
            type="button"
            onClick={handleFavorite}
            className="inline-flex items-center justify-center gap-1.5 rounded-card border border-line bg-transparent px-2 py-2 text-body text-ink transition-colors hover:bg-ink/5 active:bg-ink/10 focus:outline-none focus:ring-2 focus:ring-indigo focus:ring-offset-2"
            title="Favorite"
          >
            <Heart size={14} strokeWidth={1.5} />
            <span className="hidden sm:inline">Favorite</span>
          </button>
        </div>
      </div>

      {usedFallback && (
        <button
          type="button"
          onClick={handleShowRepeat}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-card border border-brass/30 bg-transparent px-3 py-2 text-body text-brass transition-colors hover:bg-brass/5 active:bg-brass/10 focus:outline-none focus:ring-2 focus:ring-indigo focus:ring-offset-2"
        >
          <RefreshCwOff size={14} strokeWidth={1.5} />
          Show me a repeat anyway
        </button>
      )}
    </div>
  );
}

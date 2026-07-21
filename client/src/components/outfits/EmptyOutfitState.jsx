import { useNavigate } from 'react-router-dom';
import { RefreshCwOff, Shirt } from 'lucide-react';
import { Button } from '../ui';

export default function EmptyOutfitState({ resultState, onShowRepeat }) {
  const navigate = useNavigate();

  if (resultState === 'all-fresh-exhausted') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-canvas">
          <RefreshCwOff size={32} strokeWidth={1.5} className="text-ink/20" />
        </div>
        <div className="max-w-md">
          <h2 className="text-h2 font-display text-ink">
            You&apos;ve worn everything fresh recently
          </h2>
          <p className="mt-2 text-body text-ink/60">
            All your outfit combinations have been worn in the last 30 days.
            You can see a repeat or add new pieces to your wardrobe.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button onClick={onShowRepeat}>Show me a repeat anyway</Button>
          <Button variant="secondary" onClick={() => navigate('/wardrobe')}>
            Add more items
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-canvas">
        <Shirt size={32} strokeWidth={1.5} className="text-ink/20" />
      </div>
      <div className="max-w-md">
        <h2 className="text-h2 font-display text-ink">
          You don&apos;t own anything tagged for this occasion yet
        </h2>
        <p className="mt-2 text-body text-ink/60">
          Upload some pieces and tag them with the right occasions
          to get outfit suggestions for this context.
        </p>
      </div>
      <Button onClick={() => navigate('/wardrobe')}>Add more items</Button>
    </div>
  );
}

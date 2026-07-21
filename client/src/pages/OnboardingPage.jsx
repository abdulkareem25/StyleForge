import { ArrowLeft, Shirt, Sparkles } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StylePreferencesForm from '../components/onboarding/StylePreferencesForm'
import { Button } from '../components/ui'
import { useToast } from '../components/ui/Toast'
import BatchUploadWidget from '../components/wardrobe/BatchUploadWidget'
import TagReviewPanel from '../components/wardrobe/TagReviewPanel'
import { useAuth } from '../context/AuthContext'
import { updatePreferences } from '../services/userService'
import { createWardrobeItem, updateWardrobeItem } from '../services/wardrobeService'

const TOTAL_STEPS = 2

function StepIndicator({ current, total }) {
  return (
    <div className="flex items-center gap-3">
      {Array.from({ length: total }, (_, i) => {
        const stepNum = i + 1
        const isActive = stepNum === current
        const isDone = stepNum < current
        return (
          <div key={stepNum} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-caption font-medium transition-colors duration-200 ${isDone
                  ? 'bg-indigo text-white'
                  : isActive
                    ? 'bg-indigo/10 text-indigo ring-2 ring-indigo'
                    : 'bg-canvas text-ink/40 border border-line'
                }`}
            >
              {isDone ? '✓' : stepNum}
            </div>
            {i < total - 1 && (
              <div
                className={`w-8 h-0.5 rounded-full transition-colors duration-200 ${isDone ? 'bg-indigo' : 'bg-line'
                  }`}
              />
            )}
          </div>
        )
      })}
      <span className="text-caption text-ink/50 ml-1">
        Step {current} of {total}
      </span>
    </div>
  )
}

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [prefLoading, setPrefLoading] = useState(false)
  const [uploadedItems, setUploadedItems] = useState([])
  const [uploadCount, setUploadCount] = useState(0)
  const [reviewedCount, setReviewedCount] = useState(0)
  const navigate = useNavigate()
  const { setUser } = useAuth()
  const toast = useToast()

  const goToDashboard = useCallback(() => {
    navigate('/dashboard', { replace: true })
  }, [navigate])

  // ── Step 1: Preferences ──────────────────────────────────────────

  const handlePrefSubmit = useCallback(
    async (preferences) => {
      setPrefLoading(true)
      try {
        const { data } = await updatePreferences(preferences)
        if (data.success) {
          setUser(data.data)
          toast.success('Preferences saved!')
        }
        setStep(2)
      } catch {
        toast.error('Could not save preferences. Continuing anyway.')
        setStep(2)
      } finally {
        setPrefLoading(false)
      }
    },
    [setUser, toast],
  )

  const handlePrefSkip = useCallback(() => {
    setStep(2)
  }, [])

  // ── Step 2: Upload ───────────────────────────────────────────────

  const handleItemsReady = useCallback((items) => {
    setUploadedItems((prev) => [...prev, ...items])
    setUploadCount((prev) => prev + items.length)
  }, [])

  const handleItemsConfirmed = useCallback(
    async (confirmedItems) => {
      for (const item of confirmedItems) {
        const created = await createWardrobeItem({
          imageUrl: item.imageUrl,
          thumbnailUrl: item.thumbnailUrl,
          category: item.category,
          subCategory: item.subCategory,
          sleeveLength: item.sleeveLength,
          fit: item.fit,
          primaryColor: item.primaryColor,
          secondaryColor: item.secondaryColor,
          pattern: item.pattern,
          formalityTags: item.formalityTags,
          seasonTags: item.seasonTags,
        })

        await updateWardrobeItem(created.data.data.item.id, {
          category: item.category,
          subCategory: item.subCategory,
          sleeveLength: item.sleeveLength,
          fit: item.fit,
          primaryColor: item.primaryColor,
          secondaryColor: item.secondaryColor,
          pattern: item.pattern,
          formalityTags: item.formalityTags,
          seasonTags: item.seasonTags,
          userCorrected: true,
        })
      }

      setReviewedCount((prev) => {
        const next = prev + confirmedItems.length
        if (next >= uploadedItems.length) {
          toast.success(`${confirmedItems.length} item${confirmedItems.length !== 1 ? 's' : ''} added to wardrobe!`)
          goToDashboard()
        }
        return next
      })
    },
    [toast, goToDashboard, uploadedItems.length],
  )

  const handleUploadSkip = useCallback(() => {
    goToDashboard()
  }, [goToDashboard])

  const handleBack = useCallback(() => {
    setStep(1)
  }, [])

  return (
    <div className="min-h-screen bg-canvas">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-surface/80 backdrop-blur-sm border-b border-line">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          {step === 2 ? (
            <Button variant="tertiary" size="sm" icon={ArrowLeft} onClick={handleBack}>
              Back
            </Button>
          ) : (
            <div />
          )}
          <StepIndicator current={step} total={TOTAL_STEPS} />
          <div className="w-20" />
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        {step === 1 && (
          <div className="flex flex-col items-center gap-6">
            <div className="flex flex-col items-center text-center gap-2">
              <div className="w-10 h-10 rounded-full bg-indigo/10 flex items-center justify-center">
                <Sparkles size={20} strokeWidth={1.5} className="text-indigo" />
              </div>
              <h1 className="text-h1 font-display text-ink">Style preferences</h1>
              <p className="text-body text-ink/60">
                Help us tailor outfit suggestions. All optional — skip anytime.
              </p>
            </div>
            <div className="w-full max-w-md">
              <StylePreferencesForm
                onSubmit={handlePrefSubmit}
                onSkip={handlePrefSkip}
                loading={prefLoading}
              />
            </div>
          </div>
        )}

        {step === 2 && uploadedItems.length === 0 && (
          <div className="flex flex-col items-center gap-6">
            <div className="flex flex-col items-center text-center gap-2">
              <div className="w-10 h-10 rounded-full bg-indigo/10 flex items-center justify-center">
                <Shirt size={20} strokeWidth={1.5} className="text-indigo" />
              </div>
              <h1 className="text-h1 font-display text-ink">Upload your wardrobe</h1>
              <p className="text-body text-ink/60">
                Add a few pieces to get started. You can always add more later.
              </p>
            </div>
            <div className="w-full">
              <BatchUploadWidget
                onItemsReady={handleItemsReady}
                onProgressChange={() => { }}
              />
            </div>
            <Button variant="tertiary" size="full" onClick={handleUploadSkip}>
              Skip for now
            </Button>
          </div>
        )}

        {step === 2 && uploadedItems.length > 0 && (
          <TagReviewPanel
            items={uploadedItems}
            onItemsConfirmed={handleItemsConfirmed}
            onSkip={handleUploadSkip}
          />
        )}
      </main>
    </div>
  )
}

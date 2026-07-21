import { Settings } from 'lucide-react'
import { useCallback, useState } from 'react'
import StylePreferencesForm from '../components/onboarding/StylePreferencesForm'
import { Button } from '../components/ui'
import { useToast } from '../components/ui/Toast'
import { useAuth } from '../context/AuthContext'
import { updatePreferences } from '../services/userService'

export default function Preferences() {
  const { user, setUser } = useAuth()
  const toast = useToast()
  const [loading, setLoading] = useState(false)

  const handleSubmit = useCallback(
    async (preferences) => {
      setLoading(true)
      try {
        const { data } = await updatePreferences(preferences)
        if (data.success) {
          setUser(data.data)
          toast.success('Preferences saved!')
        }
      } catch {
        toast.error('Could not save preferences. Please try again.')
      } finally {
        setLoading(false)
      }
    },
    [setUser, toast],
  )

  const handleSkip = useCallback(() => {
    window.history.back()
  }, [])

  return (
    <div className="min-h-screen bg-canvas">
      <div className="mx-auto max-w-lg px-4 py-6 sm:py-8">
        <div className="flex flex-col items-center text-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-full bg-indigo/10 flex items-center justify-center">
            <Settings size={20} strokeWidth={1.5} className="text-indigo" />
          </div>
          <h1 className="text-h1 font-display text-ink">Style preferences</h1>
          <p className="text-body text-ink/60">
            Control how outfits are suggested. Changes take effect on your next generation.
          </p>
        </div>

        <StylePreferencesForm
          onSubmit={handleSubmit}
          onSkip={handleSkip}
          loading={loading}
          initialValues={user?.stylePreferences}
        />

        <div className="mt-6 text-center">
          <Button variant="tertiary" size="sm" onClick={handleSkip}>
            Back
          </Button>
        </div>
      </div>
    </div>
  )
}

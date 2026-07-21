import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { Card } from '../components/ui'
import { useToast } from '../components/ui/Toast'
import { useAuth } from '../context/AuthContext'
import { updatePreferences } from '../services/userService'
import StylePreferencesForm from '../components/onboarding/StylePreferencesForm'

export default function OnboardingPage() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { setUser } = useAuth()
  const toast = useToast()

  const proceed = useCallback(() => {
    navigate('/wardrobe', { replace: true })
  }, [navigate])

  const handleSubmit = useCallback(
    async (preferences) => {
      setLoading(true)
      try {
        const { data } = await updatePreferences(preferences)
        if (data.success) {
          setUser(data.data)
          toast.success('Preferences saved!')
        }
        proceed()
      } catch {
        toast.error('Could not save preferences. Skipping for now.')
        proceed()
      } finally {
        setLoading(false)
      }
    },
    [setUser, toast, proceed],
  )

  const handleSkip = useCallback(() => {
    proceed()
  }, [proceed])

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md">
        <div className="flex flex-col items-center text-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-full bg-indigo/10 flex items-center justify-center">
            <Sparkles size={20} strokeWidth={1.5} className="text-indigo" />
          </div>
          <h1 className="text-h1 font-display text-ink">Style preferences</h1>
          <p className="text-body text-ink/60">
            Help us tailor outfit suggestions. All optional — skip anytime.
          </p>
        </div>
        <StylePreferencesForm
          onSubmit={handleSubmit}
          onSkip={handleSkip}
          loading={loading}
        />
      </Card>
    </div>
  )
}

import { Bell, Settings } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import StylePreferencesForm from '../components/onboarding/StylePreferencesForm'
import { Button } from '../components/ui'
import { useToast } from '../components/ui/Toast'
import { useAuth } from '../context/AuthContext'
import { updatePreferences } from '../services/userService'

function ReminderSection({ remindersEnabled, reminderTime, onChange }) {
  return (
    <fieldset className="rounded-card border border-line bg-surface p-4">
      <legend className="flex items-center gap-2 text-caption text-ink px-1">
        <Bell size={14} strokeWidth={1.5} className="text-indigo" />
        Daily reminder
      </legend>

      <div className="flex items-center justify-between gap-4 mt-3">
        <div>
          <p className="text-body text-ink">Get a daily email to generate an outfit</p>
          <p className="text-caption text-ink/50 mt-0.5">Defaults to off. Unsubscribe anytime.</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={remindersEnabled}
          onClick={() => onChange({ remindersEnabled: !remindersEnabled })}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo focus:ring-offset-2 ${
            remindersEnabled ? 'bg-indigo' : 'bg-ink/20'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
              remindersEnabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {remindersEnabled && (
        <div className="mt-4 pt-4 border-t border-line">
          <label htmlFor="reminder-time" className="text-caption text-ink mb-1.5 block">
            Remind me at
          </label>
          <input
            id="reminder-time"
            type="time"
            value={reminderTime || '07:00'}
            onChange={(e) => onChange({ reminderTime: e.target.value })}
            className="rounded-card border border-line bg-canvas px-3 py-2 text-body text-ink focus:outline-none focus:ring-2 focus:ring-indigo focus:ring-offset-1"
          />
        </div>
      )}
    </fieldset>
  )
}

export default function Preferences() {
  const { user, setUser } = useAuth()
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    if (searchParams.get('unsubscribed') === 'true') {
      toast.success('Daily reminder disabled.')
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams, toast])

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

  const handleReminderChange = useCallback(
    async (patch) => {
      try {
        const { data } = await updatePreferences(patch)
        if (data.success) {
          setUser(data.data)
          if (patch.remindersEnabled !== undefined) {
            toast.success(patch.remindersEnabled ? 'Daily reminder enabled' : 'Daily reminder disabled')
          }
        }
      } catch {
        toast.error('Could not update reminder settings.')
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

        <div className="flex flex-col gap-6">
          <StylePreferencesForm
            onSubmit={handleSubmit}
            onSkip={handleSkip}
            loading={loading}
            initialValues={user?.stylePreferences}
          />

          <ReminderSection
            remindersEnabled={user?.stylePreferences?.remindersEnabled ?? false}
            reminderTime={user?.stylePreferences?.reminderTime}
            onChange={handleReminderChange}
          />
        </div>

        <div className="mt-6 text-center">
          <Button variant="tertiary" size="sm" onClick={handleSkip}>
            Back
          </Button>
        </div>
      </div>
    </div>
  )
}

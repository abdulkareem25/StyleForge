import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, LogOut, AlertTriangle, Eye, EyeOff } from 'lucide-react'
import { Button, Input, Card, ConfirmationDialog } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/ui/Toast'
import {
  changePassword,
  logoutEverywhere,
  deleteAccount,
} from '../services/authService'

function validateCurrentPassword(password) {
  if (!password) return 'Current password is required'
  return null
}

function validateNewPassword(password) {
  if (!password) return 'New password is required'
  if (password.length < 8) return 'New password must be at least 8 characters'
  return null
}

function validateConfirmPassword(newPassword, confirmPassword) {
  if (!confirmPassword) return 'Please confirm your new password'
  if (newPassword !== confirmPassword) return 'Passwords do not match'
  return null
}

export default function AccountSecurity() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [logoutLoading, setLogoutLoading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const currentPasswordRef = useRef(null)
  const navigate = useNavigate()
  const { setUser } = useAuth()
  const toast = useToast()

  const handlePasswordFieldChange = useCallback((field, value) => {
    if (field === 'currentPassword') setCurrentPassword(value)
    else if (field === 'newPassword') setNewPassword(value)
    else if (field === 'confirmPassword') setConfirmPassword(value)

    setErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      return next
    })
  }, [])

  const handleChangePassword = useCallback(
    async (e) => {
      e.preventDefault()

      const newErrors = {}
      const currentErr = validateCurrentPassword(currentPassword)
      const newErr = validateNewPassword(newPassword)
      const confirmErr = validateConfirmPassword(newPassword, confirmPassword)
      if (currentErr) newErrors.currentPassword = currentErr
      if (newErr) newErrors.newPassword = newErr
      if (confirmErr) newErrors.confirmPassword = confirmErr

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors)
        return
      }

      setPasswordLoading(true)
      try {
        const { data } = await changePassword({
          currentPassword,
          newPassword,
        })
        if (data.success) {
          toast.success(data.data.message || 'Password changed successfully.')
          localStorage.removeItem('accessToken')
          setUser(null)
          navigate('/auth')
        }
      } catch (err) {
        const errorMsg =
          err.response?.data?.error || 'Failed to change password. Please try again.'
        if (err.response?.status === 401) {
          setErrors({ currentPassword: errorMsg })
          if (currentPasswordRef.current) currentPasswordRef.current.focus()
        } else {
          toast.error(errorMsg)
        }
      } finally {
        setPasswordLoading(false)
      }
    },
    [currentPassword, newPassword, confirmPassword, navigate, setUser, toast],
  )

  const handleLogoutEverywhere = useCallback(async () => {
    setLogoutLoading(true)
    try {
      await logoutEverywhere()
    } catch {
      // Proceed with local logout even if the request fails
    } finally {
      localStorage.removeItem('accessToken')
      setUser(null)
      navigate('/auth')
    }
  }, [navigate, setUser])

  const handleDeleteAccount = useCallback(async () => {
    setDeleteLoading(true)
    try {
      const { data } = await deleteAccount()
      if (data.success) {
        toast.success(data.data.message || 'Account deleted.')
      }
    } catch {
      toast.error('Failed to delete account. Please try again.')
    } finally {
      setDeleteLoading(false)
      setDeleteDialogOpen(false)
      localStorage.removeItem('accessToken')
      setUser(null)
      navigate('/auth')
    }
  }, [navigate, setUser, toast])

  return (
    <div className="min-h-screen bg-canvas">
      <div className="max-w-2xl mx-auto px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-8">
          <h1 className="text-h1 font-display text-ink">Account & Security</h1>
          <p className="text-body text-ink/60 mt-1">
            Manage your password and account settings.
          </p>
        </div>

        {/* ── Change Password ─────────────────────────────────── */}
        <Card className="mb-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-full bg-indigo/10 flex items-center justify-center flex-shrink-0">
              <Shield size={18} strokeWidth={1.5} className="text-indigo" />
            </div>
            <div>
              <h2 className="text-h2 font-display text-ink">Change Password</h2>
              <p className="text-caption text-ink/50">
                Update your password to keep your account secure.
              </p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="flex flex-col gap-4" noValidate>
            <div className="relative">
              <Input
                ref={currentPasswordRef}
                label="Current password"
                type={showCurrentPassword ? 'text' : 'password'}
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => handlePasswordFieldChange('currentPassword', e.target.value)}
                error={errors.currentPassword}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword((p) => !p)}
                className="absolute right-3 top-[38px] text-ink/30 hover:text-ink/60 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo rounded"
                aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
              >
                {showCurrentPassword ? (
                  <EyeOff size={16} strokeWidth={1.5} />
                ) : (
                  <Eye size={16} strokeWidth={1.5} />
                )}
              </button>
            </div>

            <div className="relative">
              <Input
                label="New password"
                type={showNewPassword ? 'text' : 'password'}
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={(e) => handlePasswordFieldChange('newPassword', e.target.value)}
                error={errors.newPassword}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((p) => !p)}
                className="absolute right-3 top-[38px] text-ink/30 hover:text-ink/60 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo rounded"
                aria-label={showNewPassword ? 'Hide password' : 'Show password'}
              >
                {showNewPassword ? (
                  <EyeOff size={16} strokeWidth={1.5} />
                ) : (
                  <Eye size={16} strokeWidth={1.5} />
                )}
              </button>
            </div>

            <Input
              label="Confirm new password"
              type="password"
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => handlePasswordFieldChange('confirmPassword', e.target.value)}
              error={errors.confirmPassword}
              autoComplete="new-password"
            />

            <div className="flex justify-end">
              <Button type="submit" loading={passwordLoading}>
                Update password
              </Button>
            </div>
          </form>
        </Card>

        {/* ── Sessions ────────────────────────────────────────── */}
        <Card className="mb-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-full bg-indigo/10 flex items-center justify-center flex-shrink-0">
              <LogOut size={18} strokeWidth={1.5} className="text-indigo" />
            </div>
            <div>
              <h2 className="text-h2 font-display text-ink">Sessions</h2>
              <p className="text-caption text-ink/50">
                Manage your active sessions across devices.
              </p>
            </div>
          </div>

          <p className="text-body text-ink/60 mb-4">
            Device and session listing is coming soon. In the meantime, you can
            log out of all devices to end every active session.
          </p>

          <Button
            variant="secondary"
            loading={logoutLoading}
            onClick={handleLogoutEverywhere}
          >
            Log out of all devices
          </Button>
        </Card>

        {/* ── Danger Zone ─────────────────────────────────────── */}
        <div className="border border-brick/30 rounded-card bg-brick/5 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-brick/10 flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={18} strokeWidth={1.5} className="text-brick" />
            </div>
            <div>
              <h2 className="text-h2 font-display text-brick">Danger Zone</h2>
              <p className="text-caption text-ink/50">
                Irreversible actions — proceed with caution.
              </p>
            </div>
          </div>

          <p className="text-body text-ink/60 mb-4">
            Deleting your account will remove access to your wardrobe, outfits,
            and history. You have a 30-day grace period to restore your account
            by contacting support.
          </p>

          <Button
            variant="danger"
            onClick={() => setDeleteDialogOpen(true)}
          >
            Delete account
          </Button>
        </div>

        <ConfirmationDialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          onConfirm={handleDeleteAccount}
          title="Delete your account?"
          description="Your account will be deleted in 30 days. Log back in before then to restore it. After 30 days, your account and all data — wardrobe, outfits, and history — will be permanently removed."
          confirmLabel="Yes, delete my account"
          cancelLabel="Keep my account"
          loading={deleteLoading}
        />
      </div>
    </div>
  )
}

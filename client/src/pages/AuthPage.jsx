import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { Mail, User, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { Button, Input, Card } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { signup, login, forgotPassword } from '../services/authService'
import { useToast } from '../components/ui/Toast'

function validateName(name) {
  if (!name.trim()) return 'Name is required'
  if (name.trim().length > 100) return 'Name must be 100 characters or fewer'
  return null
}

function validateEmail(email) {
  if (!email.trim()) return 'Email is required'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Invalid email address'
  return null
}

function validatePassword(password) {
  if (!password) return 'Password is required'
  if (password.length < 8) return 'Password must be at least 8 characters'
  return null
}

function validateSignupForm(name, email, password) {
  const errors = {}
  const nameErr = validateName(name)
  const emailErr = validateEmail(email)
  const passwordErr = validatePassword(password)
  if (nameErr) errors.name = nameErr
  if (emailErr) errors.email = emailErr
  if (passwordErr) errors.password = passwordErr
  return errors
}

function validateLoginForm(email, password) {
  const errors = {}
  const emailErr = validateEmail(email)
  if (emailErr) errors.email = emailErr
  if (!password) errors.password = 'Password is required'
  return errors
}

export default function AuthPage() {
  const [searchParams] = useSearchParams()
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'login'
  const [mode, setMode] = useState(initialMode)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false)
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('')
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false)
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false)

  const emailRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()
  const { setUser } = useAuth()
  const toast = useToast()

  const from = location.state?.from?.pathname || '/dashboard'
  const redirectMessage = location.state?.message

  useEffect(() => {
    if (mode === 'login' && emailRef.current) {
      emailRef.current.focus()
    }
  }, [mode])

  const switchMode = useCallback(() => {
    setMode((prev) => (prev === 'login' ? 'signup' : 'login'))
    setErrors({})
    setServerError(null)
    setPassword('')
    setShowPassword(false)
  }, [])

  const clearPasswordField = useCallback(() => {
    setPassword('')
  }, [])

  const handleFieldChange = useCallback((field, value) => {
    if (field === 'name') setName(value)
    else if (field === 'email') setEmail(value)
    else if (field === 'password') setPassword(value)
    else if (field === 'forgotPasswordEmail') setForgotPasswordEmail(value)

    setErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      return next
    })
    setServerError(null)
  }, [])

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault()
      setServerError(null)

      let validationErrors
      if (mode === 'signup') {
        validationErrors = validateSignupForm(name, email, password)
      } else {
        validationErrors = validateLoginForm(email, password)
      }

      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors)
        const firstErrorField = Object.keys(validationErrors)[0]
        if (firstErrorField === 'email' && emailRef.current) {
          emailRef.current.focus()
        }
        return
      }

      setLoading(true)
      try {
        if (mode === 'signup') {
          const { data } = await signup({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            password,
          })
          if (data.success) {
            toast.success(data.data.message || 'Account created! Check your email for the verification link.')
            navigate('/auth')
          }
        } else {
          const { data } = await login({
            email: email.trim().toLowerCase(),
            password,
            rememberMe,
          })
          if (data.success) {
            localStorage.setItem('accessToken', data.data.accessToken)
            setUser(data.data.user)
            toast.success('Welcome back!')
            const hasPrefs = data.data.user.stylePreferences?.preferredColors?.length > 0
              || data.data.user.stylePreferences?.fitPreference
              || data.data.user.stylePreferences?.printTolerance
            navigate(hasPrefs ? from : '/onboarding', { replace: true })
          }
        }
      } catch (err) {
        const status = err.response?.status
        const errorMsg = err.response?.data?.error || 'Something went wrong. Please try again.'

        if (mode === 'signup' && status === 409) {
          setServerError({
            type: 'email-exists',
            message: errorMsg,
          })
        } else if (mode === 'login' && (status === 401 || status === 403)) {
          setServerError({
            type: 'login-failed',
            message: errorMsg,
          })
          clearPasswordField()
          if (emailRef.current) emailRef.current.focus()
        } else {
          setServerError({
            type: 'generic',
            message: errorMsg,
          })
        }
      } finally {
        setLoading(false)
      }
    },
    [mode, name, email, password, rememberMe, navigate, setUser, toast, clearPasswordField],
  )

  const handleForgotPasswordSubmit = useCallback(
    async (e) => {
      e.preventDefault()
      const emailErr = validateEmail(forgotPasswordEmail)
      if (emailErr) {
        setErrors({ forgotPasswordEmail: emailErr })
        return
      }

      setForgotPasswordLoading(true)
      try {
        const { data } = await forgotPassword(forgotPasswordEmail.trim().toLowerCase())
        if (data.success) {
          setForgotPasswordSent(true)
        }
      } catch {
        setForgotPasswordSent(true)
      } finally {
        setForgotPasswordLoading(false)
      }
    },
    [forgotPasswordEmail],
  )

  if (forgotPasswordMode) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center px-4 py-8">
        <Card className="w-full max-w-sm">
          {forgotPasswordSent ? (
            <div className="flex flex-col items-center text-center gap-4 py-2">
              <div className="w-12 h-12 rounded-full bg-indigo/10 flex items-center justify-center">
                <Mail size={24} strokeWidth={1.5} className="text-indigo" />
              </div>
              <div>
                <h2 className="text-h2 font-display text-ink">Check your email</h2>
                <p className="text-body text-ink/60 mt-1">
                  If an account exists with {forgotPasswordEmail}, we&apos;ve sent a reset link.
                </p>
              </div>
              <Button
                variant="tertiary"
                onClick={() => {
                  setForgotPasswordMode(false)
                  setForgotPasswordSent(false)
                  setForgotPasswordEmail('')
                }}
              >
                <ArrowLeft size={16} strokeWidth={1.5} />
                Back to login
              </Button>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-1 mb-6">
                <h1 className="text-h1 font-display text-ink">Reset your password</h1>
                <p className="text-body text-ink/60">
                  Enter your email and we&apos;ll send you a reset link.
                </p>
              </div>
              <form onSubmit={handleForgotPasswordSubmit} className="flex flex-col gap-4">
                <Input
                  ref={emailRef}
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  value={forgotPasswordEmail}
                  onChange={(e) => handleFieldChange('forgotPasswordEmail', e.target.value)}
                  error={errors.forgotPasswordEmail}
                  autoComplete="email"
                />
                <Button type="submit" size="full" loading={forgotPasswordLoading}>
                  Send reset link
                </Button>
              </form>
              <div className="mt-4 text-center">
                <Button variant="tertiary" onClick={() => setForgotPasswordMode(false)}>
                  <ArrowLeft size={16} strokeWidth={1.5} />
                  Back to login
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>
    )
  }

  const isSignup = mode === 'signup'

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-sm">
        <div className="flex flex-col gap-1 mb-6">
          <h1 className="text-h1 font-display text-ink">
            {isSignup ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="text-body text-ink/60">
            {isSignup
              ? 'Start building your digital wardrobe'
              : 'Log in to your wardrobe'}
          </p>
        </div>

        {serverError && (
          <div
            className="mb-4 px-3 py-2.5 rounded-card bg-brick/10 border border-brick/20"
            role="alert"
          >
            <p className="text-body text-brick">{serverError.message}</p>
            {serverError.type === 'email-exists' && (
              <button
                type="button"
                onClick={switchMode}
                className="mt-1 text-body font-medium text-indigo hover:underline focus:outline-none focus:ring-2 focus:ring-indigo focus:ring-offset-2 rounded"
              >
                Log in instead?
              </button>
            )}
          </div>
        )}

        {redirectMessage && (
          <div
            className="mb-4 px-3 py-2.5 rounded-card bg-indigo/10 border border-indigo/20"
            role="status"
          >
            <p className="text-body text-indigo">{redirectMessage}</p>
          </div>
        )}

        <Button
          variant="secondary"
          size="full"
          disabled
          className="mb-3 opacity-60 cursor-not-allowed"
          aria-label="Google Sign-In (coming soon)"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Google Sign-In
        </Button>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-line" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-surface px-3 text-caption text-ink/40">or</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          {isSignup && (
            <div className="relative">
              <Input
                label="Name"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                error={errors.name}
                autoComplete="name"
              />
              <User
                size={16}
                strokeWidth={1.5}
                className="absolute right-3 top-[38px] text-ink/30 pointer-events-none"
              />
            </div>
          )}

          <div className="relative">
            <Input
              ref={emailRef}
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => handleFieldChange('email', e.target.value)}
              error={errors.email}
              autoComplete="email"
            />
            <Mail
              size={16}
              strokeWidth={1.5}
              className="absolute right-3 top-[38px] text-ink/30 pointer-events-none"
            />
          </div>

          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder={isSignup ? 'At least 8 characters' : 'Enter your password'}
              value={password}
              onChange={(e) => handleFieldChange('password', e.target.value)}
              error={errors.password}
              autoComplete={isSignup ? 'new-password' : 'current-password'}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-[38px] text-ink/30 hover:text-ink/60 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo rounded"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff size={16} strokeWidth={1.5} />
              ) : (
                <Eye size={16} strokeWidth={1.5} />
              )}
            </button>
          </div>

          {!isSignup && (
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-line text-indigo focus:ring-indigo focus:ring-offset-0 accent-indigo"
                />
                <span className="text-caption text-ink/60">Remember me</span>
              </label>
              <button
                type="button"
                onClick={() => setForgotPasswordMode(true)}
                className="text-caption text-indigo hover:underline focus:outline-none focus:ring-2 focus:ring-indigo focus:ring-offset-2 rounded"
              >
                Forgot password?
              </button>
            </div>
          )}

          <Button type="submit" size="full" loading={loading}>
            {isSignup ? 'Create account' : 'Log in'}
          </Button>
        </form>

        <p className="mt-5 text-center text-body text-ink/60">
          {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            onClick={switchMode}
            className="font-medium text-indigo hover:underline focus:outline-none focus:ring-2 focus:ring-indigo focus:ring-offset-2 rounded"
          >
            {isSignup ? 'Log in' : 'Sign up'}
          </button>
        </p>
      </Card>
    </div>
  )
}

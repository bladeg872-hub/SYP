import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AUTH_ENDPOINTS } from '../../config/api'
import FormInput from '../../components/FormInput'
import PrimaryButton from '../../components/PrimaryButton'
import { useLanguage } from '../../context/LanguageContext'
import { getDefaultRoute, getUserRole, saveTokens } from '../../utils/auth'

function LoginPage() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')
    setLoading(true)

    try {
      const response = await fetch(AUTH_ENDPOINTS.login, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: identifier,
          password,
        }),
      })

      let data = {}
      try {
        const text = await response.text()
        if (text) {
          data = JSON.parse(text)
        }
      } catch (parseError) {
        console.error('Response parse error:', parseError)
        data = { detail: 'Invalid server response' }
      }

      if (!response.ok) {
        const message =
          data?.detail ||
          data?.username?.[0] ||
          data?.non_field_errors?.[0] ||
          t('authErrSignIn')
        throw new Error(message)
      }

      saveTokens(data)
      const role = getUserRole()
      navigate(getDefaultRoute(role), {
        replace: true,
        state: { successMessage: t('authSuccessLogin') },
      })
    } catch (error) {
      const message =
        error?.name === 'TypeError'
          ? t('authErrServerUnreachable')
          : error.message
      setErrorMessage(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="space-y-1 text-center">
        <h2 className="text-xl font-semibold text-gray-900">{t('authWelcomeBack')}</h2>
        <p className="text-sm text-gray-500">
          {t('authSignInSubtitle')}
        </p>
      </div>

      {location.state?.successMessage ? (
        <div className="rounded-lg border border-green-100 bg-green-50 px-3 py-2 text-xs text-green-700">
          {location.state.successMessage}
        </div>
      ) : null}

      <div className="space-y-4">
        <FormInput
          label={t('authIdentifier')}
          name="identifier"
          type="text"
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          placeholder={t('authIdentifierPlaceholder')}
          required
        />
        <FormInput
          label={t('authPassword')}
          name="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder={t('authPasswordPlaceholder')}
          required
        />
      </div>

      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center gap-2 text-gray-600">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          {t('authKeepSignedIn')}
        </label>
        <button type="button" className="font-medium text-blue-600 hover:text-blue-700">
          {t('authForgotPassword')}
        </button>
      </div>

      {errorMessage && (
        <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
          {errorMessage}
        </div>
      )}

      <div className="block">
        <PrimaryButton type="submit" className="w-full py-2.5" disabled={loading}>
          {t('authSignIn')}
        </PrimaryButton>
      </div>

      <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700">
        {t('authSessionSecure')}
      </div>

      <p className="text-center text-sm text-gray-500">
        {t('authNoAccount')}{' '}
        <Link to="/register" className="font-medium text-blue-600 hover:text-blue-700">
          {t('authRegister')}
        </Link>
      </p>
    </form>
  )
}

export default LoginPage

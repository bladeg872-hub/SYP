import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AUTH_ENDPOINTS } from '../../config/api'
import FormInput from '../../components/FormInput'
import PrimaryButton from '../../components/PrimaryButton'
import { saveTokens } from '../../utils/auth'

function LoginPage() {
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

      const data = await response.json()

      if (!response.ok) {
        const message =
          data?.detail ||
          data?.username?.[0] ||
          data?.non_field_errors?.[0] ||
          'Unable to sign in. Please check your credentials.'
        throw new Error(message)
      }

      saveTokens(data)
      navigate('/dashboard', { replace: true })
    } catch (error) {
      const message =
        error?.name === 'TypeError'
          ? 'Unable to reach the server. Please ensure backend is running on http://127.0.0.1:8000.'
          : error.message
      setErrorMessage(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="space-y-1 text-center">
        <h2 className="text-xl font-semibold text-gray-900">Welcome back</h2>
        <p className="text-sm text-gray-500">
          Sign in to continue to your institutional dashboard
        </p>
      </div>

      {location.state?.successMessage ? (
        <div className="rounded-lg border border-green-100 bg-green-50 px-3 py-2 text-xs text-green-700">
          {location.state.successMessage}
        </div>
      ) : null}

      <div className="space-y-4">
        <FormInput
          label="Email, Username, or PAN"
          name="identifier"
          type="text"
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          placeholder="institution@example.com, username, or PAN"
          required
        />
        <FormInput
          label="Password"
          name="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Enter password"
          required
        />
      </div>

      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center gap-2 text-gray-600">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Keep me signed in
        </label>
        <button type="button" className="font-medium text-blue-600 hover:text-blue-700">
          Forgot password?
        </button>
      </div>

      {errorMessage && (
        <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
          {errorMessage}
        </div>
      )}

      <div className="block">
        <PrimaryButton type="submit" className="w-full py-2.5" disabled={loading}>
          Sign In
        </PrimaryButton>
      </div>

      <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700">
        Your session is protected with secure sign-in controls.
      </div>

      <p className="text-center text-sm text-gray-500">
        No account?{' '}
        <Link to="/register" className="font-medium text-blue-600 hover:text-blue-700">
          Register
        </Link>
      </p>
    </form>
  )
}

export default LoginPage

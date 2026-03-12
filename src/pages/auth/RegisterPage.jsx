import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AUTH_ENDPOINTS } from '../../config/api'
import FormInput from '../../components/FormInput'
import PrimaryButton from '../../components/PrimaryButton'
import SelectInput from '../../components/SelectInput'

function RegisterPage() {
  const navigate = useNavigate()
  const [institutionName, setInstitutionName] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [pan, setPan] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState('accountant')
  const [errorMessage, setErrorMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')

    if (!/^\d{9,10}$/.test(pan.trim())) {
      setErrorMessage('PAN must be 9 to 10 digits.')
      return
    }

    if (password !== confirmPassword) {
      setErrorMessage('Password and confirm password do not match.')
      return
    }

    setLoading(true)

    try {
      const username = email

      const response = await fetch(AUTH_ENDPOINTS.register, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          email,
          pan,
          institution_name: institutionName,
          full_name: fullName,
          password,
          role,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        const message =
          data?.username?.[0] ||
          data?.email?.[0] ||
          data?.pan?.[0] ||
          data?.password?.[0] ||
          data?.detail ||
          'Unable to create account. Please try again.'
        throw new Error(message)
      }

      navigate('/login', {
        replace: true,
        state: { successMessage: 'Account created successfully. Please sign in.' },
      })
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <FormInput
        label="Institution Name"
        name="institutionName"
        value={institutionName}
        onChange={(event) => setInstitutionName(event.target.value)}
        placeholder="ABC School"
        required
      />
      <FormInput
        label="Admin Full Name"
        name="fullName"
        value={fullName}
        onChange={(event) => setFullName(event.target.value)}
        placeholder="Ram Sharma"
        required
      />
      <FormInput
        label="Email"
        name="email"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="admin@institution.com"
        required
      />
      <FormInput
        label="PAN Number"
        name="pan"
        value={pan}
        onChange={(event) => setPan(event.target.value)}
        placeholder="9-10 digit PAN"
        required
      />
      <SelectInput
        label="Role"
        name="role"
        value={role}
        onChange={(event) => setRole(event.target.value)}
        options={[
          { value: 'admin', label: 'Admin' },
          { value: 'accountant', label: 'Accountant' },
          { value: 'auditor', label: 'Auditor' },
        ]}
      />
      <FormInput
        label="Password"
        name="password"
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="Create password"
        required
      />
      <FormInput
        label="Confirm Password"
        name="confirmPassword"
        type="password"
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
        placeholder="Re-enter password"
        required
      />

      {errorMessage && (
        <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
          {errorMessage}
        </div>
      )}

      <PrimaryButton type="submit" className="w-full" disabled={loading}>
        Create Account
      </PrimaryButton>
      <p className="text-center text-sm text-gray-500">
        Already registered?{' '}
        <Link to="/login" className="font-medium text-blue-600">
          Sign In
        </Link>
      </p>
    </form>
  )
}

export default RegisterPage

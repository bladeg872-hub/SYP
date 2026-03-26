import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AUTH_ENDPOINTS } from '../../config/api'
import FormInput from '../../components/FormInput'
import PrimaryButton from '../../components/PrimaryButton'
import SelectInput from '../../components/SelectInput'
import { useLanguage } from '../../context/LanguageContext'

function RegisterPage() {
  const { t } = useLanguage()
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
      setErrorMessage(t('authErrPanDigits'))
      return
    }

    if (password !== confirmPassword) {
      setErrorMessage(t('authErrPasswordMismatch'))
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
          t('authErrCreateAccount')
        throw new Error(message)
      }

      navigate('/login', {
        replace: true,
        state: { successMessage: t('authSuccessAccountRequested') },
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
        label={t('authInstitutionName')}
        name="institutionName"
        value={institutionName}
        onChange={(event) => setInstitutionName(event.target.value)}
        placeholder={t('placeholderInstitutionName')}
        required
      />
      <FormInput
        label={t('authFullName')}
        name="fullName"
        value={fullName}
        onChange={(event) => setFullName(event.target.value)}
        placeholder={t('placeholderFullName')}
        required
      />
      <FormInput
        label={t('commonEmail')}
        name="email"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder={t('placeholderInstitutionEmail')}
        required
      />
      <FormInput
        label={t('authPanNumber')}
        name="pan"
        value={pan}
        onChange={(event) => setPan(event.target.value)}
        placeholder={t('placeholderPanDigits')}
        required
      />
      <SelectInput
        label={t('authRole')}
        name="role"
        value={role}
        onChange={(event) => setRole(event.target.value)}
        options={[
          { value: 'manager', label: t('roleBusinessOwner') },
          { value: 'accountant', label: t('roleAccountant') },
          { value: 'auditor', label: t('roleAuditor') },
        ]}
      />
      <p className="text-xs text-gray-500">
        {t('authRoleHint')}
      </p>
      <FormInput
        label={t('authPassword')}
        name="password"
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder={t('authCreatePasswordPlaceholder')}
        required
      />
      <FormInput
        label={t('authConfirmPassword')}
        name="confirmPassword"
        type="password"
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
        placeholder={t('authReenterPasswordPlaceholder')}
        required
      />

      {errorMessage && (
        <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
          {errorMessage}
        </div>
      )}

      <PrimaryButton type="submit" className="w-full" disabled={loading}>
        {t('authCreateAccount')}
      </PrimaryButton>
      <p className="text-center text-sm text-gray-500">
        {t('authAlreadyRegistered')}{' '}
        <Link to="/login" className="font-medium text-blue-600">
          {t('authSignIn')}
        </Link>
      </p>
    </form>
  )
}

export default RegisterPage

import { useCallback, useEffect, useState } from 'react'
import DataTable from '../../components/DataTable'
import PageHeader from '../../components/PageHeader'
import PrimaryButton from '../../components/PrimaryButton'
import FormInput from '../../components/FormInput'
import SelectInput from '../../components/SelectInput'
import { AUTH_ENDPOINTS } from '../../config/api'
import { useLanguage } from '../../context/LanguageContext'
import { getAccessToken, getUserRole } from '../../utils/auth'

const basePendingColumns = [
  { key: 'full_name', labelKey: 'commonFullName' },
  { key: 'email', labelKey: 'commonEmail' },
  { key: 'institution_name', labelKey: 'commonInstitution' },
  { key: 'pan', labelKey: 'commonPan' },
  { key: 'role', labelKey: 'settingsRequestedRole', render: (row) => row.role?.toUpperCase() },
]

function SettingsPage() {
  const { t } = useLanguage()
  const userRole = getUserRole()
  const token = getAccessToken()
  const isAdmin = userRole === 'admin'
  const isManager = userRole === 'manager'
  const canManageUsers = isAdmin || isManager

  const [pendingUsers, setPendingUsers] = useState([])
  const [accounts, setAccounts] = useState([])
  const [loadingPending, setLoadingPending] = useState(false)
  const [loadingAccounts, setLoadingAccounts] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  const [institutionName, setInstitutionName] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [pan, setPan] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('accountant')
  const [managerProfile, setManagerProfile] = useState(null)
  const [teamMembers, setTeamMembers] = useState([])
  const [loadingTeam, setLoadingTeam] = useState(false)

  const roleOptions = [
    { value: 'manager', label: t('roleBusinessOwner') },
    { value: 'accountant', label: t('roleAccountant') },
    { value: 'auditor', label: t('roleAuditor') },
  ]

  const parseApiResponse = async (response, fallbackMessage) => {
    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      throw new Error(t('settingsErrNonJson'))
    }

    const data = await response.json()
    if (!response.ok) {
      throw new Error(data?.detail || fallbackMessage)
    }

    return data
  }

  const fetchPendingUsers = useCallback(async () => {
    if (!isAdmin || !token) return

    setLoadingPending(true)
    setError('')
    try {
      const response = await fetch(AUTH_ENDPOINTS.adminPendingUsers, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await parseApiResponse(response, t('settingsErrLoadPending'))
      setPendingUsers(data?.results || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoadingPending(false)
    }
  }, [isAdmin, token, t]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchAccounts = useCallback(async () => {
    if (!isAdmin || !token) return

    setLoadingAccounts(true)
    setError('')
    try {
      const response = await fetch(AUTH_ENDPOINTS.adminAccounts, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await parseApiResponse(response, t('settingsErrLoadAccounts'))
      setAccounts(data?.results || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoadingAccounts(false)
    }
  }, [isAdmin, token, t]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchTeamMembers = useCallback(async () => {
    if (!isManager || !token) return

    setLoadingTeam(true)
    setError('')
    try {
      const response = await fetch(AUTH_ENDPOINTS.adminTeamMembers, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await parseApiResponse(response, t('settingsErrLoadAccounts'))
      setTeamMembers(data?.results || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoadingTeam(false)
    }
  }, [isManager, token, t]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleDeleteUser = async (userId) => {
    if (window.confirm(t('settingsConfirmDelete') || 'Are you sure you want to delete this user?')) {
      setSubmitting(true)
      setError('')
      setNotice('')
      try {
        const response = await fetch(AUTH_ENDPOINTS.adminDeleteUser, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ user_id: userId }),
        })
        await parseApiResponse(response, t('settingsErrDeleteUser'))
        setNotice(t('settingsSuccessDeleteUser'))
        if (isAdmin) {
          fetchAccounts()
        } else if (isManager) {
          fetchTeamMembers()
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setSubmitting(false)
      }
    }
  }

  const fetchManagerProfile = useCallback(async () => {
    if (!isManager || !token) return

    try {
      const response = await fetch(AUTH_ENDPOINTS.me, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await parseApiResponse(response, t('settingsErrLoadProfile'))
      setManagerProfile(data)
      // Auto-fill institution_name and pan with manager's details
      setInstitutionName(data.institution_name || '')
      setPan(data.pan || '')
    } catch (err) {
      setError(err.message)
    }
  }, [isManager, token, t]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isAdmin) {
      fetchPendingUsers()
      fetchAccounts()
    } else if (isManager) {
      fetchManagerProfile()
      fetchTeamMembers()
    }
  }, [isAdmin, isManager, fetchPendingUsers, fetchAccounts, fetchManagerProfile, fetchTeamMembers])

  const handleCreateUser = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setNotice('')

    try {
      const response = await fetch(AUTH_ENDPOINTS.adminCreateUser, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: email,
          email,
          pan,
          institution_name: institutionName,
          full_name: fullName,
          password,
          role,
        }),
      })

      const data = await parseApiResponse(response, t('settingsErrCreateUser'))
      if (data?.email?.[0] || data?.pan?.[0] || data?.password?.[0]) {
        throw new Error(data?.email?.[0] || data?.pan?.[0] || data?.password?.[0])
      }

      setNotice(t('settingsSuccessCreateUser'))
      setInstitutionName('')
      setFullName('')
      setEmail('')
      setPan('')
      setPassword('')
      setRole('accountant')
      if (isAdmin) {
        fetchPendingUsers()
        fetchAccounts()
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleVerify = async (userId, requestedRole) => {
    setSubmitting(true)
    setError('')
    setNotice('')
    try {
      const response = await fetch(AUTH_ENDPOINTS.adminVerifyUser, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ user_id: userId, role: requestedRole }),
      })
      await parseApiResponse(response, t('settingsErrVerifyUser'))
      setNotice(t('settingsSuccessVerifyUser'))
      fetchPendingUsers()
      fetchAccounts()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDecline = async (userId) => {
    setSubmitting(true)
    setError('')
    setNotice('')
    try {
      const response = await fetch(AUTH_ENDPOINTS.adminDeclineUser, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ user_id: userId }),
      })
      await parseApiResponse(response, t('settingsErrDecline'))
      setNotice(t('settingsSuccessDecline'))
      fetchPendingUsers()
      fetchAccounts()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const localizeRole = (roleValue) => {
    if (roleValue === 'admin') return t('roleAdmin')
    if (roleValue === 'manager') return t('roleBusinessOwner')
    if (roleValue === 'accountant') return t('roleAccountant')
    if (roleValue === 'auditor') return t('roleAuditor')
    return roleValue
  }

  const columns = [
    ...basePendingColumns.map((column) => ({
      ...column,
      label: t(column.labelKey),
      render: column.key === 'role' ? (row) => localizeRole(row.role) : column.render,
    })),
    {
      key: 'actions',
      label: t('settingsActions'),
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          <PrimaryButton
            variant="secondary"
            className="py-1.5"
            disabled={submitting}
            onClick={() => handleVerify(row.user_id, row.role)}
          >
            {t('settingsAccept')}
          </PrimaryButton>
          <PrimaryButton
            variant="outline"
            className="py-1.5"
            disabled={submitting}
            onClick={() => handleDecline(row.user_id)}
          >
            {t('settingsDecline')}
          </PrimaryButton>
        </div>
      ),
    },
  ]

  const accountColumns = [
    { key: 'full_name', label: t('commonFullName') },
    { key: 'email', label: t('commonEmail') },
    { key: 'institution_name', label: t('commonInstitution') },
    { key: 'pan', label: t('commonPan') },
    { key: 'role', label: t('commonRole'), render: (row) => localizeRole(row.role) },
    {
      key: 'is_verified',
      label: t('commonStatus'),
      render: (row) => (row.is_verified ? t('settingsVerified') : t('settingsPending')),
    },
    {
      key: 'actions',
      label: t('settingsActions'),
      render: (row) => (
        <PrimaryButton
          variant="outline"
          className="py-1.5 text-red-600 hover:bg-red-50"
          disabled={submitting}
          onClick={() => handleDeleteUser(row.user_id)}
        >
          {t('settingsDelete') || 'Delete'}
        </PrimaryButton>
      ),
    },
  ]

  const availableRoleOptions = isAdmin
    ? roleOptions
    : roleOptions.filter((option) => option.value === 'accountant' || option.value === 'auditor')

  if (!canManageUsers) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={t('settingsTitle')}
          subtitle={t('settingsSubtitle')}
        />
        <section className="rounded-lg bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900">{t('settingsAccessRequired')}</h3>
          <p className="mt-2 text-sm text-gray-600">
            {t('settingsAccessRequiredMsg')}
          </p>
        </section>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('settingsTitle')}
        subtitle={isAdmin ? t('settingsAdminSubtitle') : t('settingsManagerSubtitle')}
        actions={
          isAdmin ? (
            <PrimaryButton
              variant="outline"
              onClick={() => {
                fetchPendingUsers()
                fetchAccounts()
              }}
            >
              {t('settingsRefreshData')}
            </PrimaryButton>
          ) : null
        }
      />

      {notice ? (
        <div className="rounded-lg border border-green-100 bg-green-50 px-3 py-2 text-sm text-green-700">
          {notice}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="rounded-lg bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-gray-900">
          {isAdmin ? t('settingsCreateUserAdmin') : t('settingsCreateTeam')}
        </h3>
        {!isAdmin ? (
          <p className="mt-2 text-sm text-gray-600">
            {t('settingsOwnerCreateHint')}
          </p>
        ) : null}
        <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={handleCreateUser}>
          <FormInput
            label={t('settingsInstitutionName')}
            name="institutionName"
            value={institutionName}
            onChange={(event) => setInstitutionName(event.target.value)}
            placeholder={t('placeholderInstitutionName')}
            required
            disabled={isManager}
          />
          <FormInput
            label={t('commonFullName')}
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
            placeholder={t('placeholderUserEmail')}
            required
          />
          <FormInput
            label={t('settingsPanNumber')}
            name="pan"
            value={pan}
            onChange={(event) => setPan(event.target.value)}
            placeholder={t('placeholderPanDigits')}
            required
            disabled={isManager}
          />
          <SelectInput
            label={t('commonRole')}
            name="role"
            value={role}
            onChange={(event) => setRole(event.target.value)}
            options={availableRoleOptions}
          />
          <FormInput
            label={t('settingsTemporaryPassword')}
            name="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={t('placeholderMin8Chars')}
            required
          />
          <div className="md:col-span-2">
            <PrimaryButton type="submit" disabled={submitting}>{t('settingsCreateUser')}</PrimaryButton>
          </div>
        </form>
      </section>

      {isManager ? (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900">{t('settingsTeamMembers') || 'Team Members'}</h3>
          </div>
          {loadingTeam ? (
            <p className="text-sm text-gray-500">{t('settingsLoading') || 'Loading...'}</p>
          ) : teamMembers.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 bg-white p-5 text-sm text-gray-500">
              {t('settingsNoTeamMembers') || 'No team members yet'}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">{t('commonFullName')}</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">{t('commonEmail')}</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">{t('commonRole')}</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">{t('commonPan')}</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">{t('settingsActions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {teamMembers.map((member) => (
                    <tr key={member.user_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">{member.full_name}</td>
                      <td className="px-4 py-3">{member.email}</td>
                      <td className="px-4 py-3">{localizeRole(member.role)}</td>
                      <td className="px-4 py-3">{member.pan}</td>
                      <td className="px-4 py-3">
                        <PrimaryButton
                          variant="outline"
                          className="py-1.5 text-red-600 hover:bg-red-50"
                          disabled={submitting}
                          onClick={() => handleDeleteUser(member.user_id)}
                        >
                          {t('settingsDelete') || 'Delete'}
                        </PrimaryButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}

      {isAdmin ? (
        <>
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">{t('settingsPendingRequests')}</h3>
            </div>
            {loadingPending ? (
              <p className="text-sm text-gray-500">{t('settingsLoadingPending')}</p>
            ) : pendingUsers.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 bg-white p-5 text-sm text-gray-500">
                {t('settingsNoPending')}
              </div>
            ) : (
              <DataTable columns={columns} data={pendingUsers} />
            )}
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">{t('settingsAllAccounts')}</h3>
            </div>
            {loadingAccounts ? (
              <p className="text-sm text-gray-500">{t('settingsLoadingAccounts')}</p>
            ) : accounts.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 bg-white p-5 text-sm text-gray-500">
                {t('settingsNoAccounts')}
              </div>
            ) : (
              <DataTable columns={accountColumns} data={accounts} />
            )}
          </section>
        </>
      ) : null}
    </div>
  )
}

export default SettingsPage

import DataTable from '../../components/DataTable'
import PageHeader from '../../components/PageHeader'
import PrimaryButton from '../../components/PrimaryButton'

const userColumns = [
  { key: 'name', label: 'Name' },
  { key: 'role', label: 'Role' },
  { key: 'email', label: 'Email' },
  { key: 'status', label: 'Status' },
]

const users = [
  { id: 1, name: 'Ram Sharma', role: 'Admin', email: 'ram@financio.demo', status: 'Active' },
  { id: 2, name: 'Sita Karki', role: 'Accountant', email: 'sita@financio.demo', status: 'Active' },
  { id: 3, name: 'Hari KC', role: 'Auditor', email: 'hari@financio.demo', status: 'Pending' },
]

function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        subtitle="Manage profile, backup and user access"
        actions={<PrimaryButton variant="outline">Backup Data</PrimaryButton>}
      />

      <section className="rounded-lg bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-gray-900">Profile</h3>
        <div className="mt-3 grid gap-3 text-sm text-gray-700 sm:grid-cols-2">
          <p>
            <span className="font-medium">Institution:</span> FinAncio Demo Institution
          </p>
          <p>
            <span className="font-medium">Primary Contact:</span> Ram Sharma
          </p>
          <p>
            <span className="font-medium">Email:</span> admin@financio.demo
          </p>
          <p>
            <span className="font-medium">Location:</span> Kathmandu, Nepal
          </p>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">Multi-user Access</h3>
          <PrimaryButton variant="secondary">Add User</PrimaryButton>
        </div>
        <DataTable columns={userColumns} data={users} />
      </section>
    </div>
  )
}

export default SettingsPage

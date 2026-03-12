import { useEffect, useState } from 'react'
import DataTable from '../../components/DataTable'
import PageHeader from '../../components/PageHeader'
import PrimaryButton from '../../components/PrimaryButton'
import { AUDIT_ENDPOINTS } from '../../config/api'
import { formatNpr } from '../../config/irdTaxRules'
import { getAccessToken } from '../../utils/auth'

const auditColumns = [
  { key: 'section', label: 'Section' },
  { key: 'detail', label: 'Detail', render: (row) => formatNpr(row.detail) },
]

function AuditPage() {
  const [institutionName, setInstitutionName] = useState('')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAudit = async () => {
      const token = getAccessToken()
      if (!token) return

      try {
        const response = await fetch(AUDIT_ENDPOINTS.summary, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!response.ok) return

        const data = await response.json()
        setInstitutionName(data.institution_name || 'Institution')
        setRows(
          (data.rows || []).map((r, i) => ({ id: i + 1, section: r.section, detail: r.detail }))
        )
      } catch {
        // keep defaults
      } finally {
        setLoading(false)
      }
    }

    fetchAudit()
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Report"
        subtitle="Print-friendly institutional financial summary"
        actions={<PrimaryButton variant="outline">Print Report</PrimaryButton>}
      />

      <div className="rounded-lg bg-white p-6 shadow-sm">
        <div className="border-b border-gray-200 pb-4">
          <h2 className="text-lg font-semibold text-gray-900">{institutionName || 'Institution'}</h2>
          <p className="mt-1 text-sm text-gray-500">Kathmandu, Nepal</p>
        </div>

        <div className="mt-4">
          <h3 className="mb-3 text-base font-semibold text-gray-900">Structured Financial Summary</h3>
          {loading ? (
            <p className="text-sm text-gray-500">Loading audit data...</p>
          ) : (
            <DataTable columns={auditColumns} data={rows} />
          )}
        </div>

        <div className="mt-5 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h3 className="text-base font-semibold text-gray-900">Compliance Notes</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
            <li>VAT is calculated at 13% in transaction previews.</li>
            <li>TDS is configured for Salary and Other Expenses only.</li>
            <li>PAN/VAT number field validation is enabled on transaction forms.</li>
            <li>Fiscal Year (BS) and return bucket tagging is available for records.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default AuditPage

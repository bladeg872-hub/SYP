import { useEffect, useState } from 'react'
import { IRD_RULES, formatNpr } from '../../config/irdTaxRules'
import DataTable from '../../components/DataTable'
import PageHeader from '../../components/PageHeader'
import PrimaryButton from '../../components/PrimaryButton'
import SelectInput from '../../components/SelectInput'
import { REPORTS_ENDPOINTS } from '../../config/api'
import { getAccessToken } from '../../utils/auth'

const periodOptions = [
  { label: 'All', value: '' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Quarterly', value: 'quarterly' },
  { label: 'Annual', value: 'annual' },
]

const columns = [
  { key: 'item', label: 'Particular' },
  { key: 'amount', label: 'Amount', render: (row) => formatNpr(row.amount) },
]

function ReportsPage() {
  const [period, setPeriod] = useState('')
  const [fiscalYear, setFiscalYear] = useState(IRD_RULES.fiscalYears[1])
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchReport = async () => {
    const token = getAccessToken()
    if (!token) return

    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (fiscalYear) params.set('fiscal_year', fiscalYear)
      if (period) params.set('period', period)

      const response = await fetch(`${REPORTS_ENDPOINTS.summary}?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) return

      const data = await response.json()
      setRows(
        (data.rows || []).map((r, i) => ({ id: i + 1, item: r.item, amount: r.amount }))
      )
    } catch {
      // keep defaults
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReport()
  }, [fiscalYear, period])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        subtitle="Generate financial summaries for your institution"
        actions={
          <div className="flex gap-2">
            <PrimaryButton variant="outline">Export PDF</PrimaryButton>
            <PrimaryButton variant="outline">Export Word</PrimaryButton>
          </div>
        }
      />

      <div className="grid gap-4 rounded-lg bg-white p-5 shadow-sm md:grid-cols-3">
        <SelectInput
          label="Fiscal Year (BS)"
          name="fiscalYear"
          value={fiscalYear}
          onChange={(event) => setFiscalYear(event.target.value)}
          options={IRD_RULES.fiscalYears.map((item) => ({ label: item, value: item }))}
        />
        <SelectInput
          label="Report Period"
          name="reportPeriod"
          value={period}
          onChange={(event) => setPeriod(event.target.value)}
          options={periodOptions}
        />
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading report...</p>
      ) : (
        <DataTable columns={columns} data={rows} />
      )}

      <div className="rounded-lg bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-gray-900">Withholding Certificate / Challan</h3>
        <p className="mt-1 text-sm text-gray-500">
          UI placeholders for IRD-aligned print/export workflow.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <PrimaryButton variant="outline">Generate TDS Certificate</PrimaryButton>
          <PrimaryButton variant="outline">Generate Challan Slip</PrimaryButton>
        </div>
      </div>
    </div>
  )
}

export default ReportsPage

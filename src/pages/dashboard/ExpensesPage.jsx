import { useEffect, useState } from 'react'
import DataTable from '../../components/DataTable'
import DatePickerInput from '../../components/DatePickerInput'
import FileUpload from '../../components/FileUpload'
import FormInput from '../../components/FormInput'
import PageHeader from '../../components/PageHeader'
import PrimaryButton from '../../components/PrimaryButton'
import SelectInput from '../../components/SelectInput'
import { EXPENSES_ENDPOINTS } from '../../config/api'
import {
  IRD_RULES,
  calculateTds,
  calculateVat,
  formatNpr,
  isTdsApplicableExpenseType,
  validatePanVatNumber,
} from '../../config/irdTaxRules'
import { getAccessToken } from '../../utils/auth'

function ExpensesPage() {
  const [amount, setAmount] = useState('')
  const [tdsRate, setTdsRate] = useState('0')
  const [expenseType, setExpenseType] = useState('salary')
  const [date, setDate] = useState('')
  const [vendorPanVat, setVendorPanVat] = useState('')
  const [fiscalYear, setFiscalYear] = useState(IRD_RULES.fiscalYears[1])
  const [periodBucket, setPeriodBucket] = useState(IRD_RULES.periodBuckets[0].value)
  const [billFile, setBillFile] = useState('')
  const [preview, setPreview] = useState({ vat: 0, tds: 0, net: 0 })
  const [error, setError] = useState('')
  const [submittedMessage, setSubmittedMessage] = useState('')
  const [expenseRows, setExpenseRows] = useState([])
  const [showDetails, setShowDetails] = useState(false)
  const [saving, setSaving] = useState(false)

  const tdsApplicable = isTdsApplicableExpenseType(expenseType)
  const nepaliDatePattern = /^\d{4}-\d{2}-\d{2}$/

  const columns = [
    { key: 'nepali_date', label: 'Date (BS)' },
    { key: 'expense_type', label: 'Type' },
    { key: 'vendor_pan_vat', label: 'Vendor PAN/VAT' },
    { key: 'amount', label: 'Amount', render: (row) => formatNpr(row.amount) },
    { key: 'vat_amount', label: 'VAT', render: (row) => formatNpr(row.vat_amount) },
    { key: 'tds_amount', label: 'TDS', render: (row) => formatNpr(row.tds_amount) },
    { key: 'total_amount', label: 'Total', render: (row) => formatNpr(row.total_amount) },
  ]

  const fetchExpenses = async () => {
    const token = getAccessToken()
    if (!token) return

    const response = await fetch(EXPENSES_ENDPOINTS.listCreate, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!response.ok) throw new Error('Unable to fetch expense details.')

    const data = await response.json()
    setExpenseRows(Array.isArray(data) ? data : [])
  }

  useEffect(() => {
    const numericAmount = Number(amount) || 0
    const vat = calculateVat(numericAmount)
    const tds = tdsApplicable ? calculateTds(numericAmount, tdsRate) : 0
    const net = numericAmount + vat - tds
    setPreview({ vat, tds, net })
  }, [amount, tdsRate, tdsApplicable])

  useEffect(() => {
    if (!tdsApplicable) {
      setTdsRate('0')
    }
  }, [tdsApplicable])

  useEffect(() => {
    fetchExpenses().catch(() => {
      setError('Unable to load expense details.')
    })
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!validatePanVatNumber(vendorPanVat)) {
      setError('Vendor PAN/VAT must be 9 to 10 digits.')
      return
    }

    if (!nepaliDatePattern.test(date)) {
      setError('Date must be in Nepali format YYYY-MM-DD.')
      return
    }

    const token = getAccessToken()
    if (!token) {
      setError('Your session has expired. Please sign in again.')
      return
    }

    setError('')
    setSubmittedMessage('')
    setSaving(true)

    try {
      const response = await fetch(EXPENSES_ENDPOINTS.listCreate, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount,
          expense_type: expenseType,
          vendor_pan_vat: vendorPanVat,
          tds_rate: tdsRate,
          nepali_date: date,
          fiscal_year: fiscalYear,
          period_bucket: periodBucket,
          bill_file_name: billFile,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        const message =
          data?.vendor_pan_vat?.[0] ||
          data?.nepali_date?.[0] ||
          data?.amount?.[0] ||
          data?.detail ||
          'Unable to submit expense entry.'
        throw new Error(message)
      }

      setSubmittedMessage('Expense entry submitted successfully.')
      setAmount('')
      setDate('')
      setVendorPanVat('')
      setTdsRate('0')
      setBillFile('')
      setShowDetails(true)
      await fetchExpenses()
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Add Expense" subtitle="Capture expense records with IRD-oriented tax preview" />
      <form className="rounded-lg bg-white p-5 shadow-sm" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <FormInput
            label="Amount"
            name="amount"
            type="number"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="Enter expense amount"
            required
          />
          <SelectInput
            label="Expense Type"
            name="expenseType"
            value={expenseType}
            onChange={(event) => setExpenseType(event.target.value)}
            options={IRD_RULES.expenseTypeOptions}
          />
          <FormInput
            label="Vendor PAN/VAT Number"
            name="vendorPanVat"
            value={vendorPanVat}
            onChange={(event) => setVendorPanVat(event.target.value)}
            placeholder="9-10 digit PAN/VAT"
            required
          />
          <SelectInput
            label="TDS Rate"
            name="tdsRate"
            value={tdsRate}
            onChange={(event) => setTdsRate(event.target.value)}
            options={IRD_RULES.tdsOptions}
          />
          <DatePickerInput
            label="Date (BS)"
            name="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
          <SelectInput
            label="Fiscal Year (BS)"
            name="fiscalYear"
            value={fiscalYear}
            onChange={(event) => setFiscalYear(event.target.value)}
            options={IRD_RULES.fiscalYears.map((item) => ({ label: item, value: item }))}
          />
          <SelectInput
            label="Tax Return Bucket"
            name="periodBucket"
            value={periodBucket}
            onChange={(event) => setPeriodBucket(event.target.value)}
            options={IRD_RULES.periodBuckets}
          />
          <FileUpload
            label="Bill Upload"
            name="billUpload"
            onChange={(event) => setBillFile(event.target.files?.[0]?.name ?? '')}
          />
        </div>
        <div className="mt-5 rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-gray-700">
          <p>VAT (13%): {formatNpr(preview.vat)}</p>
          <p>
            TDS ({tdsApplicable ? `${tdsRate}%` : 'N/A'}): {formatNpr(preview.tds)}
          </p>
          <p className="font-semibold">Net After Tax: {formatNpr(preview.net)}</p>
          <p className="mt-1 text-xs text-gray-500">
            TDS is applied only for Salary and Other Expenses in this IRD mode.
          </p>
          {billFile ? <p className="mt-2 text-xs text-gray-500">Selected file: {billFile}</p> : null}
        </div>
        <div className="mt-5">
          <PrimaryButton type="submit" disabled={saving}>
            Submit Expense Entry
          </PrimaryButton>
          <button
            type="button"
            onClick={() => setShowDetails((prev) => !prev)}
            className="ml-3 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            {showDetails ? 'Hide Expense History' : 'View Expense History'}
          </button>
        </div>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        {submittedMessage ? <p className="mt-3 text-sm text-green-600">{submittedMessage}</p> : null}
      </form>

      {showDetails ? (
        <div className="rounded-lg bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900">Expense Entry History</h3>
          <p className="mt-1 text-sm text-gray-500">Latest submitted expense entries.</p>
          <div className="mt-4">
            <DataTable columns={columns} data={expenseRows} />
            {expenseRows.length === 0 ? (
              <p className="mt-3 text-sm text-gray-500">No expense entries found yet.</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default ExpensesPage

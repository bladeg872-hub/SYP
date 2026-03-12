import { useEffect, useState } from 'react'
import DataTable from '../../components/DataTable'
import DatePickerInput from '../../components/DatePickerInput'
import FileUpload from '../../components/FileUpload'
import FormInput from '../../components/FormInput'
import PageHeader from '../../components/PageHeader'
import PrimaryButton from '../../components/PrimaryButton'
import SelectInput from '../../components/SelectInput'
import { SALES_ENDPOINTS } from '../../config/api'
import {
  IRD_RULES,
  calculateVat,
  formatNpr,
  validatePanVatNumber,
} from '../../config/irdTaxRules'
import { getAccessToken } from '../../utils/auth'

function SalesPage() {
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState('')
  const [buyerPanVat, setBuyerPanVat] = useState('')
  const [fiscalYear, setFiscalYear] = useState(IRD_RULES.fiscalYears[1])
  const [periodBucket, setPeriodBucket] = useState(IRD_RULES.periodBuckets[0].value)
  const [billFile, setBillFile] = useState('')
  const [preview, setPreview] = useState({ vat: 0, net: 0 })
  const [submittedMessage, setSubmittedMessage] = useState('')
  const [error, setError] = useState('')
  const [salesRows, setSalesRows] = useState([])
  const [showDetails, setShowDetails] = useState(false)
  const [saving, setSaving] = useState(false)

  const nepaliDatePattern = /^\d{4}-\d{2}-\d{2}$/

  const columns = [
    { key: 'nepali_date', label: 'Date (BS)' },
    { key: 'buyer_pan_vat', label: 'Buyer PAN/VAT' },
    { key: 'amount', label: 'Amount', render: (row) => formatNpr(row.amount) },
    { key: 'vat_amount', label: 'VAT', render: (row) => formatNpr(row.vat_amount) },
    { key: 'total_amount', label: 'Total', render: (row) => formatNpr(row.total_amount) },
    { key: 'fiscal_year', label: 'Fiscal Year' },
    { key: 'period_bucket', label: 'Bucket' },
  ]

  const fetchSales = async () => {
    const token = getAccessToken()
    if (!token) {
      return
    }

    const response = await fetch(SALES_ENDPOINTS.listCreate, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error('Unable to fetch sales details.')
    }

    const data = await response.json()
    setSalesRows(Array.isArray(data) ? data : [])
  }

  useEffect(() => {
    const numericAmount = Number(amount) || 0
    const vat = calculateVat(numericAmount)
    const net = numericAmount + vat
    setPreview({ vat, net })
  }, [amount])

  useEffect(() => {
    fetchSales().catch(() => {
      setError('Unable to load sales details.')
    })
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!validatePanVatNumber(buyerPanVat)) {
      setError('Buyer PAN/VAT must be 9 to 10 digits.')
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
      const response = await fetch(SALES_ENDPOINTS.listCreate, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount,
          buyer_pan_vat: buyerPanVat,
          nepali_date: date,
          fiscal_year: fiscalYear,
          period_bucket: periodBucket,
          bill_file_name: billFile,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        const message =
          data?.buyer_pan_vat?.[0] ||
          data?.nepali_date?.[0] ||
          data?.amount?.[0] ||
          data?.detail ||
          'Unable to submit sales entry.'
        throw new Error(message)
      }

      setSubmittedMessage('Sales entry submitted successfully.')
      setAmount('')
      setDate('')
      setBuyerPanVat('')
      setBillFile('')
      setShowDetails(true)
      await fetchSales()
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Add Sales" subtitle="Record sales transaction with tax preview" />

      <form onSubmit={handleSubmit} className="rounded-lg bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <FormInput
            label="Amount"
            name="amount"
            type="number"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="Enter amount in NPR"
            required
          />

          <FormInput
            label="Buyer PAN/VAT Number"
            name="buyerPanVat"
            value={buyerPanVat}
            onChange={(event) => setBuyerPanVat(event.target.value)}
            placeholder="9-10 digit PAN/VAT"
            required
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

        <div className="mt-5 rounded-lg border border-blue-100 bg-blue-50 p-4">
          <h3 className="text-sm font-semibold text-gray-800">Tax Preview</h3>
          <div className="mt-2 grid gap-2 text-sm text-gray-700 sm:grid-cols-2">
            <p>Output VAT (13%): {formatNpr(preview.vat)}</p>
            <p className="font-semibold">Total With VAT: {formatNpr(preview.net)}</p>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            IRD mode: VAT enabled for sales, TDS not applied on sales entries.
          </p>
          {billFile ? <p className="mt-2 text-xs text-gray-500">Selected file: {billFile}</p> : null}
        </div>

        <div className="mt-5">
          <PrimaryButton type="submit" disabled={saving}>
            Submit Sales Entry
          </PrimaryButton>
          <button
            type="button"
            onClick={() => setShowDetails((prev) => !prev)}
            className="ml-3 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            {showDetails ? 'Hide Sales Entry History' : 'View Sales Entry History'}
          </button>
        </div>

        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        {submittedMessage ? <p className="mt-3 text-sm text-green-600">{submittedMessage}</p> : null}
      </form>

      {showDetails ? (
        <div className="rounded-lg bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900">Sales Entry History</h3>
          <p className="mt-1 text-sm text-gray-500">Latest submitted sales entries.</p>
          <div className="mt-4">
            <DataTable columns={columns} data={salesRows} />
            {salesRows.length === 0 ? (
              <p className="mt-3 text-sm text-gray-500">No sales entries found yet.</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default SalesPage

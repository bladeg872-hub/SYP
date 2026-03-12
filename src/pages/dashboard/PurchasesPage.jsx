import { useEffect, useState } from 'react'
import DataTable from '../../components/DataTable'
import DatePickerInput from '../../components/DatePickerInput'
import FileUpload from '../../components/FileUpload'
import FormInput from '../../components/FormInput'
import PageHeader from '../../components/PageHeader'
import PrimaryButton from '../../components/PrimaryButton'
import SelectInput from '../../components/SelectInput'
import { PURCHASES_ENDPOINTS } from '../../config/api'
import {
  IRD_RULES,
  calculateVat,
  formatNpr,
  validatePanVatNumber,
} from '../../config/irdTaxRules'
import { getAccessToken } from '../../utils/auth'

function PurchasesPage() {
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState('')
  const [supplierPanVat, setSupplierPanVat] = useState('')
  const [fiscalYear, setFiscalYear] = useState(IRD_RULES.fiscalYears[1])
  const [periodBucket, setPeriodBucket] = useState(IRD_RULES.periodBuckets[0].value)
  const [billFile, setBillFile] = useState('')
  const [preview, setPreview] = useState({ vat: 0, net: 0 })
  const [error, setError] = useState('')
  const [submittedMessage, setSubmittedMessage] = useState('')
  const [purchaseRows, setPurchaseRows] = useState([])
  const [showDetails, setShowDetails] = useState(false)
  const [saving, setSaving] = useState(false)

  const nepaliDatePattern = /^\d{4}-\d{2}-\d{2}$/

  const columns = [
    { key: 'nepali_date', label: 'Date (BS)' },
    { key: 'supplier_pan_vat', label: 'Supplier PAN/VAT' },
    { key: 'amount', label: 'Amount', render: (row) => formatNpr(row.amount) },
    { key: 'vat_amount', label: 'VAT', render: (row) => formatNpr(row.vat_amount) },
    { key: 'total_amount', label: 'Total', render: (row) => formatNpr(row.total_amount) },
    { key: 'fiscal_year', label: 'Fiscal Year' },
    { key: 'period_bucket', label: 'Bucket' },
  ]

  const fetchPurchases = async () => {
    const token = getAccessToken()
    if (!token) return

    const response = await fetch(PURCHASES_ENDPOINTS.listCreate, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!response.ok) throw new Error('Unable to fetch purchase details.')

    const data = await response.json()
    setPurchaseRows(Array.isArray(data) ? data : [])
  }

  useEffect(() => {
    const numericAmount = Number(amount) || 0
    const vat = calculateVat(numericAmount)
    const net = numericAmount + vat
    setPreview({ vat, net })
  }, [amount])

  useEffect(() => {
    fetchPurchases().catch(() => {
      setError('Unable to load purchase details.')
    })
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!validatePanVatNumber(supplierPanVat)) {
      setError('Supplier PAN/VAT must be 9 to 10 digits.')
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
      const response = await fetch(PURCHASES_ENDPOINTS.listCreate, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount,
          supplier_pan_vat: supplierPanVat,
          nepali_date: date,
          fiscal_year: fiscalYear,
          period_bucket: periodBucket,
          bill_file_name: billFile,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        const message =
          data?.supplier_pan_vat?.[0] ||
          data?.nepali_date?.[0] ||
          data?.amount?.[0] ||
          data?.detail ||
          'Unable to submit purchase entry.'
        throw new Error(message)
      }

      setSubmittedMessage('Purchase entry submitted successfully.')
      setAmount('')
      setDate('')
      setSupplierPanVat('')
      setBillFile('')
      setShowDetails(true)
      await fetchPurchases()
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Add Purchase" subtitle="Capture purchase records with tax preview" />
      <form className="rounded-lg bg-white p-5 shadow-sm" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <FormInput
            label="Amount"
            name="amount"
            type="number"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="Enter purchase amount"
            required
          />
          <FormInput
            label="Supplier PAN/VAT Number"
            name="supplierPanVat"
            value={supplierPanVat}
            onChange={(event) => setSupplierPanVat(event.target.value)}
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
        <div className="mt-5 rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-gray-700">
          <p>Input VAT (13%): {formatNpr(preview.vat)}</p>
          <p className="font-semibold">Total With VAT: {formatNpr(preview.net)}</p>
          <p className="mt-1 text-xs text-gray-500">
            IRD mode: VAT credit tracked on purchases, TDS not applied on purchases.
          </p>
          {billFile ? <p className="mt-2 text-xs text-gray-500">Selected file: {billFile}</p> : null}
        </div>
        <div className="mt-5">
          <PrimaryButton type="submit" disabled={saving}>
            Submit Purchase Entry
          </PrimaryButton>
          <button
            type="button"
            onClick={() => setShowDetails((prev) => !prev)}
            className="ml-3 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            {showDetails ? 'Hide Purchase History' : 'View Purchase History'}
          </button>
        </div>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        {submittedMessage ? <p className="mt-3 text-sm text-green-600">{submittedMessage}</p> : null}
      </form>

      {showDetails ? (
        <div className="rounded-lg bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900">Purchase Entry History</h3>
          <p className="mt-1 text-sm text-gray-500">Latest submitted purchase entries.</p>
          <div className="mt-4">
            <DataTable columns={columns} data={purchaseRows} />
            {purchaseRows.length === 0 ? (
              <p className="mt-3 text-sm text-gray-500">No purchase entries found yet.</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default PurchasesPage

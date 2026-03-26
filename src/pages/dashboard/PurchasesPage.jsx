import { useCallback, useEffect, useState } from 'react'
import DataTable from '../../components/DataTable'
import DatePickerInput from '../../components/DatePickerInput'
import FileUpload from '../../components/FileUpload'
import FormInput from '../../components/FormInput'
import PageHeader from '../../components/PageHeader'
import PrimaryButton from '../../components/PrimaryButton'
import SelectInput from '../../components/SelectInput'
import { PURCHASES_ENDPOINTS } from '../../config/api'
import { useLanguage } from '../../context/LanguageContext'
import {
  IRD_RULES,
  calculateVat,
  formatNpr,
  validatePanVatNumber,
} from '../../config/irdTaxRules'
import { getAccessToken } from '../../utils/auth'

function PurchasesPage() {
  const { t } = useLanguage()
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
  const [editingEntry, setEditingEntry] = useState(null)
  const [editFormData, setEditFormData] = useState({
    amount: '',
    supplier_pan_vat: '',
    nepali_date: '',
    fiscal_year: '',
    period_bucket: '',
  })

  const nepaliDatePattern = /^\d{4}-\d{2}-\d{2}$/

  const columns = [
    { key: 'nepali_date', label: t('commonDateBs') },
    { key: 'supplier_pan_vat', label: t('tableSupplierPanVat') },
    { key: 'amount', label: t('commonAmount'), render: (row) => formatNpr(row.amount) },
    { key: 'vat_amount', label: t('tableVat'), render: (row) => formatNpr(row.vat_amount) },
    { key: 'total_amount', label: t('tableTotal'), render: (row) => formatNpr(row.total_amount) },
    { key: 'fiscal_year', label: t('commonFiscalYearBs') },
    { key: 'period_bucket', label: t('tableBucket') },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          <PrimaryButton
            variant="secondary"
            className="py-1.5 text-sm"
            onClick={() => handleOpenEdit(row)}
          >
            Edit
          </PrimaryButton>
          <PrimaryButton
            variant="outline"
            className="py-1.5 text-sm text-red-600 hover:bg-red-50"
            onClick={() => handleDeleteEntry(row.id)}
          >
            Delete
          </PrimaryButton>
        </div>
      ),
    },
  ]

  const fetchPurchases = useCallback(async () => {
    const token = getAccessToken()
    if (!token) return

    const response = await fetch(PURCHASES_ENDPOINTS.listCreate, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!response.ok) throw new Error(t('purchasesErrFetch'))

    const data = await response.json()
    setPurchaseRows(Array.isArray(data) ? data : [])
  }, [t])

  useEffect(() => {
    const numericAmount = Number(amount) || 0
    const vat = calculateVat(numericAmount)
    const net = numericAmount + vat
    setPreview({ vat, net })
  }, [amount])

  useEffect(() => {
    fetchPurchases().catch(() => {
      setError(t('purchasesErrLoad'))
    })
  }, [fetchPurchases, t])

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!validatePanVatNumber(supplierPanVat)) {
      setError(t('purchasesErrPanVat'))
      return
    }

    if (!nepaliDatePattern.test(date)) {
      setError(t('commonDateFormatError'))
      return
    }

    const token = getAccessToken()
    if (!token) {
      setError(t('commonSessionExpired'))
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
          t('purchasesErrSubmit')
        throw new Error(message)
      }

      setSubmittedMessage(t('purchasesSuccessSubmit'))
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

  const handleOpenEdit = (entry) => {
    setEditingEntry(entry)
    setEditFormData({
      amount: entry.amount,
      supplier_pan_vat: entry.supplier_pan_vat,
      nepali_date: entry.nepali_date,
      fiscal_year: entry.fiscal_year,
      period_bucket: entry.period_bucket,
    })
  }

  const handleEditEntry = async (event) => {
    event.preventDefault()

    if (!validatePanVatNumber(editFormData.supplier_pan_vat)) {
      setError(t('purchasesErrPanVat'))
      return
    }

    if (!nepaliDatePattern.test(editFormData.nepali_date)) {
      setError(t('commonDateFormatError'))
      return
    }

    const token = getAccessToken()
    if (!token) {
      setError(t('commonSessionExpired'))
      return
    }

    setError('')
    setSaving(true)

    try {
      const response = await fetch(`${PURCHASES_ENDPOINTS.listCreate}${editingEntry.id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editFormData),
      })

      const data = await response.json()
      if (!response.ok) {
        const message =
          data?.supplier_pan_vat?.[0] ||
          data?.nepali_date?.[0] ||
          data?.amount?.[0] ||
          data?.detail ||
          t('purchasesErrSubmit')
        throw new Error(message)
      }

      setSubmittedMessage('Entry updated successfully')
      setEditingEntry(null)
      await fetchPurchases()
      setTimeout(() => setSubmittedMessage(''), 3000)
    } catch (editError) {
      setError(editError.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteEntry = async (entryId) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) return

    const token = getAccessToken()
    if (!token) {
      setError(t('commonSessionExpired'))
      return
    }

    setError('')
    setSaving(true)

    try {
      const response = await fetch(`${PURCHASES_ENDPOINTS.listCreate}${entryId}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) throw new Error('Failed to delete entry')

      setSubmittedMessage('Entry deleted successfully')
      await fetchPurchases()
      setTimeout(() => setSubmittedMessage(''), 3000)
    } catch (deleteError) {
      setError(deleteError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('purchasesTitle')} subtitle={t('purchasesSubtitle')} />
      <form className="rounded-lg bg-white p-5 shadow-sm" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <FormInput
            label={t('commonAmount')}
            name="amount"
            type="number"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder={t('commonAmount')}
            required
          />
          <FormInput
            label={t('purchasesSupplierPanVat')}
            name="supplierPanVat"
            value={supplierPanVat}
            onChange={(event) => setSupplierPanVat(event.target.value)}
            placeholder={t('placeholderPanVatDigits')}
            required
          />
          <DatePickerInput
            label={t('commonDateBs')}
            name="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
          <SelectInput
            label={t('commonFiscalYearBs')}
            name="fiscalYear"
            value={fiscalYear}
            onChange={(event) => setFiscalYear(event.target.value)}
            options={IRD_RULES.fiscalYears.map((item) => ({ label: item, value: item }))}
          />
          <SelectInput
            label={t('commonTaxReturnBucket')}
            name="periodBucket"
            value={periodBucket}
            onChange={(event) => setPeriodBucket(event.target.value)}
            options={IRD_RULES.periodBuckets.map((item) => ({
              value: item.value,
              label: item.value === 'monthly'
                ? t('reportsPeriodMonthly')
                : item.value === 'quarterly'
                  ? t('reportsPeriodQuarterly')
                  : t('reportsPeriodAnnual'),
            }))}
          />
          <FileUpload
            label={t('commonBillUpload')}
            name="billUpload"
            onChange={(event) => setBillFile(event.target.files?.[0]?.name ?? '')}
          />
        </div>
        <div className="mt-5 rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-gray-700">
          <p>{t('purchasesInputVat')}: {formatNpr(preview.vat)}</p>
          <p className="font-semibold">{t('purchasesTotalWithVat')}: {formatNpr(preview.net)}</p>
          <p className="mt-1 text-xs text-gray-500">
            {t('purchasesIrdModeNote')}
          </p>
          {billFile ? <p className="mt-2 text-xs text-gray-500">{t('commonSelectedFile')}: {billFile}</p> : null}
        </div>
        <div className="mt-5">
          <PrimaryButton type="submit" disabled={saving}>
            {t('purchasesSubmit')}
          </PrimaryButton>
          <button
            type="button"
            onClick={() => setShowDetails((prev) => !prev)}
            className="ml-3 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            {showDetails ? t('purchasesHideHistory') : t('purchasesViewHistory')}
          </button>
        </div>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        {submittedMessage ? <p className="mt-3 text-sm text-green-600">{submittedMessage}</p> : null}
      </form>

      {showDetails ? (
        <div className="rounded-lg bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900">{t('purchasesHistoryTitle')}</h3>
          <p className="mt-1 text-sm text-gray-500">{t('purchasesHistorySubtitle')}</p>
          <div className="mt-4">
            <DataTable columns={columns} data={purchaseRows} />
            {purchaseRows.length === 0 ? (
              <p className="mt-3 text-sm text-gray-500">{t('purchasesNoEntries')}</p>
            ) : null}
          </div>
        </div>
      ) : null}

      {editingEntry ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900">Edit Purchase Entry</h3>
            <form className="mt-4 space-y-4" onSubmit={handleEditEntry}>
              <FormInput
                label="Amount"
                type="number"
                value={editFormData.amount}
                onChange={(e) => setEditFormData({ ...editFormData, amount: e.target.value })}
                required
              />
              <FormInput
                label="Supplier PAN/VAT"
                value={editFormData.supplier_pan_vat}
                onChange={(e) => setEditFormData({ ...editFormData, supplier_pan_vat: e.target.value })}
                required
              />
              <DatePickerInput
                label="Date (BS)"
                value={editFormData.nepali_date}
                onChange={(e) => setEditFormData({ ...editFormData, nepali_date: e.target.value })}
              />
              <SelectInput
                label="Fiscal Year"
                value={editFormData.fiscal_year}
                onChange={(e) => setEditFormData({ ...editFormData, fiscal_year: e.target.value })}
                options={IRD_RULES.fiscalYears.map((item) => ({ label: item, value: item }))}
              />
              <SelectInput
                label="Period"
                value={editFormData.period_bucket}
                onChange={(e) => setEditFormData({ ...editFormData, period_bucket: e.target.value })}
                options={IRD_RULES.periodBuckets.map((item) => ({
                  value: item.value,
                  label: item.value === 'monthly' ? 'Monthly' : item.value === 'quarterly' ? 'Quarterly' : 'Annual',
                }))}
              />
              <div className="flex gap-3 pt-4">
                <PrimaryButton type="submit" disabled={saving} className="flex-1">
                  Save
                </PrimaryButton>
                <PrimaryButton
                  type="button"
                  variant="outline"
                  disabled={saving}
                  onClick={() => setEditingEntry(null)}
                  className="flex-1"
                >
                  Cancel
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default PurchasesPage

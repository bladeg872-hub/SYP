import { useCallback, useEffect, useState } from 'react'
import DataTable from '../../components/DataTable'
import DatePickerInput from '../../components/DatePickerInput'
import FileUpload from '../../components/FileUpload'
import FormInput from '../../components/FormInput'
import PageHeader from '../../components/PageHeader'
import PrimaryButton from '../../components/PrimaryButton'
import SelectInput from '../../components/SelectInput'
import { EXPENSES_ENDPOINTS } from '../../config/api'
import { useLanguage } from '../../context/LanguageContext'
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
  const { t } = useLanguage()
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
  const [editingEntry, setEditingEntry] = useState(null)
  const [editFormData, setEditFormData] = useState({
    amount: '',
    expense_type: 'salary',
    vendor_pan_vat: '',
    tds_rate: '0',
    nepali_date: '',
    fiscal_year: '',
    period_bucket: '',
  })

  const tdsApplicable = isTdsApplicableExpenseType(expenseType)
  const nepaliDatePattern = /^\d{4}-\d{2}-\d{2}$/

  const columns = [
    { key: 'nepali_date', label: t('commonDateBs') },
    { key: 'expense_type', label: t('tableType') },
    { key: 'vendor_pan_vat', label: t('tableVendorPanVat') },
    { key: 'amount', label: t('commonAmount'), render: (row) => formatNpr(row.amount) },
    { key: 'vat_amount', label: t('tableVat'), render: (row) => formatNpr(row.vat_amount) },
    { key: 'tds_amount', label: t('tableTds'), render: (row) => formatNpr(row.tds_amount) },
    { key: 'total_amount', label: t('tableTotal'), render: (row) => formatNpr(row.total_amount) },
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

  const fetchExpenses = useCallback(async () => {
    const token = getAccessToken()
    if (!token) return

    const response = await fetch(EXPENSES_ENDPOINTS.listCreate, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!response.ok) throw new Error(t('expensesErrFetch'))

    const data = await response.json()
    setExpenseRows(Array.isArray(data) ? data : [])
  }, [t])

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
      setError(t('expensesErrLoad'))
    })
  }, [fetchExpenses, t])

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!validatePanVatNumber(vendorPanVat)) {
      setError(t('expensesErrPanVat'))
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
          t('expensesErrSubmit')
        throw new Error(message)
      }

      setSubmittedMessage(t('expensesSuccessSubmit'))
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

  const handleOpenEdit = (entry) => {
    setEditingEntry(entry)
    setEditFormData({
      amount: entry.amount,
      expense_type: entry.expense_type,
      vendor_pan_vat: entry.vendor_pan_vat,
      tds_rate: entry.tds_rate,
      nepali_date: entry.nepali_date,
      fiscal_year: entry.fiscal_year,
      period_bucket: entry.period_bucket,
    })
  }

  const handleEditEntry = async (event) => {
    event.preventDefault()

    if (!validatePanVatNumber(editFormData.vendor_pan_vat)) {
      setError(t('expensesErrPanVat'))
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
      const response = await fetch(`${EXPENSES_ENDPOINTS.listCreate}${editingEntry.id}/`, {
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
          data?.vendor_pan_vat?.[0] ||
          data?.nepali_date?.[0] ||
          data?.amount?.[0] ||
          data?.detail ||
          t('expensesErrSubmit')
        throw new Error(message)
      }

      setSubmittedMessage('Entry updated successfully')
      setEditingEntry(null)
      await fetchExpenses()
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
      const response = await fetch(`${EXPENSES_ENDPOINTS.listCreate}${entryId}/`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) throw new Error('Failed to delete entry')

      setSubmittedMessage('Entry deleted successfully')
      await fetchExpenses()
      setTimeout(() => setSubmittedMessage(''), 3000)
    } catch (deleteError) {
      setError(deleteError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('expensesTitle')} subtitle={t('expensesSubtitle')} />
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
          <SelectInput
            label={t('expensesType')}
            name="expenseType"
            value={expenseType}
            onChange={(event) => setExpenseType(event.target.value)}
            options={IRD_RULES.expenseTypeOptions.map((item) => ({
              value: item.value,
              label: item.value === 'salary'
                ? t('expenseTypeSalary')
                : item.value === 'other'
                  ? t('expenseTypeOther')
                  : item.value === 'operational'
                    ? t('expenseTypeOperational')
                    : t('expenseTypeCapital'),
            }))}
          />
          <FormInput
            label={t('expensesVendorPanVat')}
            name="vendorPanVat"
            value={vendorPanVat}
            onChange={(event) => setVendorPanVat(event.target.value)}
            placeholder={t('placeholderPanVatDigits')}
            required
          />
          <SelectInput
            label={t('expensesTdsRate')}
            name="tdsRate"
            value={tdsRate}
            onChange={(event) => setTdsRate(event.target.value)}
            options={IRD_RULES.tdsOptions}
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
          <p>{t('expensesVat13')}: {formatNpr(preview.vat)}</p>
          <p>
            {t('expensesTdsLabel')} ({tdsApplicable ? `${tdsRate}%` : t('expensesTdsNa')}): {formatNpr(preview.tds)}
          </p>
          <p className="font-semibold">{t('expensesNetAfterTax')}: {formatNpr(preview.net)}</p>
          <p className="mt-1 text-xs text-gray-500">
            {t('expensesIrdNote')}
          </p>
          {billFile ? <p className="mt-2 text-xs text-gray-500">{t('commonSelectedFile')}: {billFile}</p> : null}
        </div>
        <div className="mt-5">
          <PrimaryButton type="submit" disabled={saving}>
            {t('expensesSubmit')}
          </PrimaryButton>
          <button
            type="button"
            onClick={() => setShowDetails((prev) => !prev)}
            className="ml-3 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            {showDetails ? t('expensesHideHistory') : t('expensesViewHistory')}
          </button>
        </div>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        {submittedMessage ? <p className="mt-3 text-sm text-green-600">{submittedMessage}</p> : null}
      </form>

      {showDetails ? (
        <div className="rounded-lg bg-white p-5 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900">{t('expensesHistoryTitle')}</h3>
          <p className="mt-1 text-sm text-gray-500">{t('expensesHistorySubtitle')}</p>
          <div className="mt-4">
            <DataTable columns={columns} data={expenseRows} />
            {expenseRows.length === 0 ? (
              <p className="mt-3 text-sm text-gray-500">{t('expensesNoEntries')}</p>
            ) : null}
          </div>
        </div>
      ) : null}

      {editingEntry ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900">Edit Expense Entry</h3>
            <form className="mt-4 space-y-4" onSubmit={handleEditEntry}>
              <FormInput
                label="Amount"
                type="number"
                value={editFormData.amount}
                onChange={(e) => setEditFormData({ ...editFormData, amount: e.target.value })}
                required
              />
              <SelectInput
                label="Expense Type"
                value={editFormData.expense_type}
                onChange={(e) => {
                  setEditFormData({ ...editFormData, expense_type: e.target.value })
                }}
                options={[
                  { value: 'salary', label: 'Salary' },
                  { value: 'other', label: 'Other Expenses' },
                  { value: 'operational', label: 'Operational' },
                  { value: 'capital', label: 'Capital' },
                ]}
              />
              <FormInput
                label="Vendor PAN/VAT"
                value={editFormData.vendor_pan_vat}
                onChange={(e) => setEditFormData({ ...editFormData, vendor_pan_vat: e.target.value })}
                required
              />
              {isTdsApplicableExpenseType(editFormData.expense_type) ? (
                <FormInput
                  label="TDS Rate (%)"
                  type="number"
                  value={editFormData.tds_rate}
                  onChange={(e) => setEditFormData({ ...editFormData, tds_rate: e.target.value })}
                />
              ) : null}
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

export default ExpensesPage

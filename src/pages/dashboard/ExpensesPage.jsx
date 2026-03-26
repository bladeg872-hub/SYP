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
    </div>
  )
}

export default ExpensesPage

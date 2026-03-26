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

  const nepaliDatePattern = /^\d{4}-\d{2}-\d{2}$/

  const columns = [
    { key: 'nepali_date', label: t('commonDateBs') },
    { key: 'supplier_pan_vat', label: t('tableSupplierPanVat') },
    { key: 'amount', label: t('commonAmount'), render: (row) => formatNpr(row.amount) },
    { key: 'vat_amount', label: t('tableVat'), render: (row) => formatNpr(row.vat_amount) },
    { key: 'total_amount', label: t('tableTotal'), render: (row) => formatNpr(row.total_amount) },
    { key: 'fiscal_year', label: t('commonFiscalYearBs') },
    { key: 'period_bucket', label: t('tableBucket') },
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
    </div>
  )
}

export default PurchasesPage

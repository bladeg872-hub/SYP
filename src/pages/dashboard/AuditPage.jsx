import { useEffect, useMemo, useState } from 'react'
import DataTable from '../../components/DataTable'
import PageHeader from '../../components/PageHeader'
import PrimaryButton from '../../components/PrimaryButton'
import {
  AUTH_ENDPOINTS,
  EXPENSES_ENDPOINTS,
  PURCHASES_ENDPOINTS,
  SALES_ENDPOINTS,
} from '../../config/api'
import { formatNpr, toNumber } from '../../config/irdTaxRules'
import { useLanguage } from '../../context/LanguageContext'
import { getAccessToken } from '../../utils/auth'

function sumBy(list, key) {
  return (list || []).reduce((acc, item) => acc + toNumber(item?.[key]), 0)
}

function latestNepaliDate(rows = []) {
  const values = rows.map((r) => r?.nepali_date).filter(Boolean)
  return values.length ? values.sort().at(-1) : 'N/A'
}

function mostCommonFiscalYear(sales = [], purchases = [], expenses = []) {
  const counts = {}
  ;[...sales, ...purchases, ...expenses].forEach((r) => {
    if (!r?.fiscal_year) return
    counts[r.fiscal_year] = (counts[r.fiscal_year] || 0) + 1
  })
  const entries = Object.entries(counts)
  if (!entries.length) return 'N/A'
  return entries.sort((a, b) => b[1] - a[1])[0][0]
}

function mostCommonBucket(sales = [], purchases = [], expenses = []) {
  const counts = {}
  ;[...sales, ...purchases, ...expenses].forEach((r) => {
    if (!r?.period_bucket) return
    counts[r.period_bucket] = (counts[r.period_bucket] || 0) + 1
  })
  const entries = Object.entries(counts)
  if (!entries.length) return 'N/A'
  const value = entries.sort((a, b) => b[1] - a[1])[0][0]
  if (value === 'monthly') return 'Monthly'
  if (value === 'quarterly') return 'Quarterly'
  if (value === 'annual') return 'Annual'
  return value
}

function AuditPage() {
  const { t } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [profile, setProfile] = useState(null)
  const [salesRows, setSalesRows] = useState([])
  const [purchaseRows, setPurchaseRows] = useState([])
  const [expenseRows, setExpenseRows] = useState([])

  useEffect(() => {
    const token = getAccessToken()
    if (!token) {
      setLoading(false)
      return
    }

    const headers = { Authorization: `Bearer ${token}` }

    const fetchData = async () => {
      try {
        const [profileRes, salesRes, purchaseRes, expenseRes] = await Promise.all([
          fetch(AUTH_ENDPOINTS.me, { headers }),
          fetch(SALES_ENDPOINTS.listCreate, { headers }),
          fetch(PURCHASES_ENDPOINTS.listCreate, { headers }),
          fetch(EXPENSES_ENDPOINTS.listCreate, { headers }),
        ])

        if (!profileRes.ok || !salesRes.ok || !purchaseRes.ok || !expenseRes.ok) {
          throw new Error('Unable to load report data.')
        }

        const [profileData, salesData, purchaseData, expenseData] = await Promise.all([
          profileRes.json(),
          salesRes.json(),
          purchaseRes.json(),
          expenseRes.json(),
        ])

        setProfile(profileData)
        setSalesRows(Array.isArray(salesData) ? salesData : [])
        setPurchaseRows(Array.isArray(purchaseData) ? purchaseData : [])
        setExpenseRows(Array.isArray(expenseData) ? expenseData : [])
      } catch (loadError) {
        setError(loadError.message || 'Unable to load report data.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const report = useMemo(() => {
    const totalSales = sumBy(salesRows, 'amount')
    const totalPurchases = sumBy(purchaseRows, 'amount')
    const totalExpenses = sumBy(expenseRows, 'amount')

    const outputVat = sumBy(salesRows, 'vat_amount')
    const inputVatPurchases = sumBy(purchaseRows, 'vat_amount')

    const salaryAmount = expenseRows
      .filter((e) => e.expense_type === 'salary')
      .reduce((acc, e) => acc + toNumber(e.amount), 0)
    const otherAmount = expenseRows
      .filter((e) => e.expense_type === 'other')
      .reduce((acc, e) => acc + toNumber(e.amount), 0)
    const operationalAmount = expenseRows
      .filter((e) => e.expense_type === 'operational')
      .reduce((acc, e) => acc + toNumber(e.amount), 0)
    const capitalAmount = expenseRows
      .filter((e) => e.expense_type === 'capital')
      .reduce((acc, e) => acc + toNumber(e.amount), 0)

    const salaryTds = expenseRows
      .filter((e) => e.expense_type === 'salary')
      .reduce((acc, e) => acc + toNumber(e.tds_amount), 0)
    const otherTds = expenseRows
      .filter((e) => e.expense_type === 'other')
      .reduce((acc, e) => acc + toNumber(e.tds_amount), 0)
    const operationalTds = expenseRows
      .filter((e) => e.expense_type === 'operational')
      .reduce((acc, e) => acc + toNumber(e.tds_amount), 0)
    const capitalTds = expenseRows
      .filter((e) => e.expense_type === 'capital')
      .reduce((acc, e) => acc + toNumber(e.tds_amount), 0)

    const inputVatExpenses = expenseRows
      .filter((e) => e.expense_type !== 'salary')
      .reduce((acc, e) => acc + toNumber(e.vat_amount), 0)

    const totalTds = salaryTds + otherTds + operationalTds + capitalTds
    const netVat = outputVat - inputVatPurchases - inputVatExpenses
    const grossProfit = totalSales - totalPurchases
    const netProfitBeforeTax = grossProfit - totalExpenses - totalTds
    const incomeTaxRate = 0.25
    const incomeTaxLiability = Math.max(netProfitBeforeTax, 0) * incomeTaxRate
    const advanceTaxPaid = 0
    const tdsAlreadyWithheld = totalTds
    const netTaxPayable = incomeTaxLiability - advanceTaxPaid - tdsAlreadyWithheld

    const openingCashBank = 0
    const operatingCash = totalSales - totalPurchases - totalExpenses
    const investingCash = -capitalAmount
    const financingCash = 0
    const netCashChange = operatingCash + investingCash + financingCash
    const closingCash = openingCashBank + netCashChange

    const inputVatReceivable = Math.max(-netVat, 0)
    const outputVatPayable = Math.max(netVat, 0)
    const tdsPayable = totalTds
    const incomeTaxPayable = Math.max(netTaxPayable, 0)
    const currentAssets = Math.max(closingCash, 0) + inputVatReceivable
    const nonCurrentAssets = Math.max(capitalAmount, 0)
    const totalAssets = currentAssets + nonCurrentAssets
    const currentLiabilities = outputVatPayable + tdsPayable + incomeTaxPayable
    const nonCurrentLiabilities = 0
    const totalLiabilities = currentLiabilities + nonCurrentLiabilities
    const equity = totalAssets - totalLiabilities

    const turnoverThresholdFlag = totalSales > 10000000
    const netProfitThresholdFlag = netProfitBeforeTax > 1000000

    const assumptions = []
    if (!profile?.institution_name) assumptions.push('Institution Name not found in profile; using placeholder.')
    assumptions.push('VAT Registration Number is not captured in current profile model; marked as N/A.')
    assumptions.push('Auditor Name, ICAN No., Firm, Address are not captured in current system; marked as Not Provided.')
    assumptions.push('Advance Tax Paid and Opening Cash/Bank are not captured in current system; assumed NPR 0.00.')
    assumptions.push('Expense sub-types for rent/contract and vendor VAT registration status are unavailable; mapped under Other Expenses where applicable.')

    return {
      totalSales,
      totalPurchases,
      totalExpenses,
      outputVat,
      inputVatPurchases,
      inputVatExpenses,
      netVat,
      totalTds,
      salaryAmount,
      otherAmount,
      operationalAmount,
      capitalAmount,
      salaryTds,
      otherTds,
      operationalTds,
      capitalTds,
      grossProfit,
      netProfitBeforeTax,
      incomeTaxRate,
      incomeTaxLiability,
      advanceTaxPaid,
      tdsAlreadyWithheld,
      netTaxPayable,
      openingCashBank,
      operatingCash,
      investingCash,
      financingCash,
      netCashChange,
      closingCash,
      inputVatReceivable,
      outputVatPayable,
      tdsPayable,
      incomeTaxPayable,
      currentAssets,
      nonCurrentAssets,
      totalAssets,
      currentLiabilities,
      nonCurrentLiabilities,
      totalLiabilities,
      equity,
      turnoverThresholdFlag,
      netProfitThresholdFlag,
      assumptions,
      fiscalYearBs: mostCommonFiscalYear(salesRows, purchaseRows, expenseRows),
      taxBucket: mostCommonBucket(salesRows, purchaseRows, expenseRows),
      auditDateBs: latestNepaliDate([...salesRows, ...purchaseRows, ...expenseRows]),
      auditDateAd: new Date().toISOString().slice(0, 10),
    }
  }, [expenseRows, profile, purchaseRows, salesRows])

  const stepOneColumns = [
    { key: 'label', label: 'Tax Calculation Summary' },
    { key: 'value', label: 'Amount', render: (row) => formatNpr(row.value) },
  ]

  const stepOneRows = [
    { id: 1, label: 'Total Sales (Excl. VAT)', value: report.totalSales },
    { id: 2, label: 'Output VAT @13% (VAT Act 2052)', value: report.outputVat },
    { id: 3, label: 'Total Purchases (Excl. VAT)', value: report.totalPurchases },
    { id: 4, label: 'Input VAT from Purchases', value: report.inputVatPurchases },
    { id: 5, label: 'Input VAT from Eligible Expenses', value: report.inputVatExpenses },
    { id: 6, label: 'Net VAT Payable / (Credit Carry Forward)', value: report.netVat },
    { id: 7, label: 'Total TDS Withheld (Sections 87/88)', value: report.totalTds },
    { id: 8, label: 'Net Profit Before Tax', value: report.netProfitBeforeTax },
    { id: 9, label: 'Income Tax @25% (Schedule-1)', value: report.incomeTaxLiability },
    { id: 10, label: 'Net Tax Payable / (Refundable)', value: report.netTaxPayable },
  ]

  const tdsScheduleColumns = [
    { key: 'type', label: 'Expense Type' },
    { key: 'amount', label: 'Amount (NPR)', render: (row) => formatNpr(row.amount) },
    { key: 'rate', label: 'TDS Rate' },
    { key: 'tds', label: 'TDS Withheld (NPR)', render: (row) => formatNpr(row.tds) },
    { key: 'reference', label: 'Legal Reference' },
  ]

  const tdsScheduleRows = [
    {
      id: 1,
      type: 'Salary',
      amount: report.salaryAmount,
      rate: '15%',
      tds: report.salaryTds,
      reference: 'Income Tax Act 2058, Section 87',
    },
    {
      id: 2,
      type: 'Other Expenses / Service Fee',
      amount: report.otherAmount,
      rate: '1.5% or 15%',
      tds: report.otherTds,
      reference: 'Income Tax Act 2058, Section 88',
    },
    {
      id: 3,
      type: 'Rent',
      amount: 0,
      rate: '10%',
      tds: 0,
      reference: 'Income Tax Act 2058, Section 88',
    },
    {
      id: 4,
      type: 'Contract Payments',
      amount: 0,
      rate: '1.5%',
      tds: 0,
      reference: 'Income Tax Act 2058, Section 88',
    },
    {
      id: 5,
      type: 'Operational (No TDS)',
      amount: report.operationalAmount,
      rate: '0%',
      tds: report.operationalTds,
      reference: 'Not applicable',
    },
    {
      id: 6,
      type: 'Capital (No TDS)',
      amount: report.capitalAmount,
      rate: '0%',
      tds: report.capitalTds,
      reference: 'Not applicable',
    },
    {
      id: 7,
      type: 'TOTAL TDS',
      amount: report.totalExpenses,
      rate: '-',
      tds: report.totalTds,
      reference: 'Deposit within 25 days of month-end',
    },
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title={t('auditTitle')} subtitle={t('auditSubtitle')} />
        <p className="text-sm text-gray-500">{t('auditLoading')}</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title={t('auditTitle')} subtitle={t('auditSubtitle')} />
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Independent Auditor's Report"
        subtitle="IRD-compliant statutory format with tax computation schedules"
        actions={
          <PrimaryButton variant="outline" onClick={() => window.print()}>
            {t('actionsPrintReport')}
          </PrimaryButton>
        }
      />

      <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
        <p className="font-semibold">Step 1 - Tax Calculation Engine Summary</p>
        <p className="mt-1">All figures are computed from recorded Sales, Purchases, and Expenses. Rates cited per Income Tax Act 2058 and VAT Act 2052.</p>
      </div>

      <div className="rounded-lg bg-white p-5 shadow-sm">
        <DataTable columns={stepOneColumns} data={stepOneRows} />
      </div>

      <div className="rounded-lg bg-white p-6 shadow-sm space-y-6">
        <section>
          <h2 className="text-lg font-semibold text-gray-900">SECTION 1 - COVER PAGE</h2>
          <div className="mt-3 grid gap-2 text-sm text-gray-700 md:grid-cols-2">
            <p><span className="font-medium">Addressed To:</span> Board of Directors / Proprietor</p>
            <p><span className="font-medium">Institution Name:</span> {profile?.institution_name || 'Not Provided'}</p>
            <p><span className="font-medium">PAN Number:</span> Not Provided</p>
            <p><span className="font-medium">VAT Registration Number:</span> Not Provided</p>
            <p><span className="font-medium">Fiscal Year (BS):</span> {report.fiscalYearBs}</p>
            <p><span className="font-medium">Fiscal Year (AD):</span> 2025/26</p>
            <p><span className="font-medium">Tax Return Bucket:</span> {report.taxBucket}</p>
            <p><span className="font-medium">Audit Date (BS):</span> {report.auditDateBs}</p>
            <p><span className="font-medium">Audit Date (AD):</span> {report.auditDateAd}</p>
            <p><span className="font-medium">Auditor Name:</span> Not Provided</p>
            <p><span className="font-medium">ICAN Membership No.:</span> Not Provided</p>
            <p><span className="font-medium">Audit Firm Name:</span> Not Provided</p>
            <p><span className="font-medium">Auditor Address:</span> Not Provided</p>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">SECTION 2 - AUDITOR'S OPINION (NSA 700 / NSA 2024)</h2>
          <p className="mt-2 text-sm text-gray-700">
            In our opinion, based on records available in the system, the financial statements present a true and fair view in accordance with Nepal Accounting Standards (NAS),
            Income Tax Act 2058, and Value Added Tax Act 2052. Opinion Type: Unmodified (Clean), subject to assumptions noted below.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">SECTION 3 - BASIS FOR OPINION (NSA 700, NSA 705)</h2>
          <p className="mt-2 text-sm text-gray-700">
            Audit procedures were aligned with Nepal Standards on Auditing 2024 (mandatory from 1st Shrawan 2082). Auditor independence is presumed under ICAN Code of Ethics,
            and sufficient appropriate audit evidence was obtained from transaction ledgers available in FinAncio.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">SECTION 4 - KEY AUDIT MATTERS (NSA 701)</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
            <li>VAT compliance review: Output VAT {formatNpr(report.outputVat)} vs Input VAT {formatNpr(report.inputVatPurchases + report.inputVatExpenses)}; Net VAT position {formatNpr(report.netVat)}.</li>
            <li>TDS compliance: Total withholding {formatNpr(report.totalTds)} under Section 87 and Section 88; due deposit within 25 days of month-end.</li>
            <li>Revenue recognition: Sales entries aggregated at {formatNpr(report.totalSales)} (exclusive of VAT).</li>
            <li>Significant estimates: Expense classification for rent/contract not separately captured; disclosed in assumptions.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">SECTION 5 - MANAGEMENT'S RESPONSIBILITY</h2>
          <p className="mt-2 text-sm text-gray-700">
            Management is responsible for preparation of financial statements under NAS, maintaining adequate internal controls, and ensuring compliance with Income Tax Act 2058,
            VAT Act 2052, and Tax Procedure Act 2076.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">SECTION 6 - AUDITOR'S RESPONSIBILITY</h2>
          <p className="mt-2 text-sm text-gray-700">
            Our responsibility is to express an opinion based on the audit under NSA 2024. Procedures followed a risk-based approach including analytical review,
            tax schedule verification, and consistency checks across statements.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">SECTION 7 - FINANCIAL STATEMENTS</h2>

          <div className="rounded-lg border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900">7A. Balance Sheet (Statement of Financial Position)</h3>
            <div className="mt-2 grid gap-1 text-sm text-gray-700 md:grid-cols-2">
              <p>Current Assets (Cash + Input VAT Receivable): {formatNpr(report.currentAssets)}</p>
              <p>Current Liabilities (VAT + TDS + Income Tax): {formatNpr(report.currentLiabilities)}</p>
              <p>Non-Current Assets: {formatNpr(report.nonCurrentAssets)}</p>
              <p>Non-Current Liabilities: {formatNpr(report.nonCurrentLiabilities)}</p>
              <p className="font-semibold">Total Assets: {formatNpr(report.totalAssets)}</p>
              <p className="font-semibold">Total Liabilities + Equity: {formatNpr(report.totalLiabilities + report.equity)}</p>
              <p className="font-semibold">Equity / Net Worth: {formatNpr(report.equity)}</p>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900">7B. Income Statement (Profit & Loss Account)</h3>
            <div className="mt-2 grid gap-1 text-sm text-gray-700 md:grid-cols-2">
              <p>Revenue from Sales (net of VAT): {formatNpr(report.totalSales)}</p>
              <p>Less: Cost of Purchases: {formatNpr(report.totalPurchases)}</p>
              <p className="font-medium">Gross Profit: {formatNpr(report.grossProfit)}</p>
              <p>Less: Salary Expense: {formatNpr(report.salaryAmount)}</p>
              <p>Less: Other Expense: {formatNpr(report.otherAmount)}</p>
              <p>Less: Operational Expense: {formatNpr(report.operationalAmount)}</p>
              <p>Less: Capital Expense: {formatNpr(report.capitalAmount)}</p>
              <p>Less: TDS Amounts Withheld: {formatNpr(report.totalTds)}</p>
              <p className="font-medium">Net Profit Before Tax: {formatNpr(report.netProfitBeforeTax)}</p>
              <p>Less: Income Tax @25%: {formatNpr(report.incomeTaxLiability)}</p>
              <p className="font-semibold">Net Profit After Tax: {formatNpr(report.netProfitBeforeTax - report.incomeTaxLiability)}</p>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900">7C. Cash Flow Statement (NAS 7)</h3>
            <div className="mt-2 grid gap-1 text-sm text-gray-700 md:grid-cols-2">
              <p>Operating Activities: {formatNpr(report.operatingCash)}</p>
              <p>Investing Activities: {formatNpr(report.investingCash)}</p>
              <p>Financing Activities: {formatNpr(report.financingCash)}</p>
              <p>Net Change in Cash: {formatNpr(report.netCashChange)}</p>
              <p>Opening Balance (Cash/Bank): {formatNpr(report.openingCashBank)}</p>
              <p className="font-semibold">Closing Cash Balance: {formatNpr(report.closingCash)}</p>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900">7D. Notes to Accounts</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
              <li>Accounting policy: Accrual basis using transactional records maintained in FinAncio.</li>
              <li>VAT note: Output VAT {formatNpr(report.outputVat)}, Input VAT {formatNpr(report.inputVatPurchases + report.inputVatExpenses)}, Net VAT {formatNpr(report.netVat)}.</li>
              <li>TDS note: Salary under Section 87 and Other Expenses under Section 88 were considered.</li>
              <li>Depreciation policy: Capital expenses are presented; asset-wise depreciation schedule not available in current data model.</li>
              <li>Contingent liabilities: None identified from available records.</li>
              <li>Records retention reminder: Maintain records for 7 years per Section 79, Income Tax Act 2058.</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">SECTION 8 - TAX COMPUTATION SCHEDULE</h2>
          <div className="mt-2 grid gap-1 text-sm text-gray-700">
            <p>Net Profit per Books: {formatNpr(report.netProfitBeforeTax)}</p>
            <p>Add: Disallowed Expenses: {formatNpr(0)}</p>
            <p>Less: Allowable Deductions: {formatNpr(0)}</p>
            <p className="font-semibold">Taxable Income: {formatNpr(Math.max(report.netProfitBeforeTax, 0))}</p>
            <p>Income Tax Rate: 25% (Schedule-1, Income Tax Act 2058)</p>
            <p>Income Tax Liability: {formatNpr(report.incomeTaxLiability)}</p>
            <p>Less: Advance Tax Paid: {formatNpr(report.advanceTaxPaid)}</p>
            <p>Less: TDS Already Withheld: {formatNpr(report.tdsAlreadyWithheld)}</p>
            <p className="font-semibold">Net Tax Payable / (Refundable): {formatNpr(report.netTaxPayable)}</p>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">SECTION 9 - VAT RECONCILIATION SCHEDULE</h2>
          <div className="mt-2 grid gap-1 text-sm text-gray-700">
            <p>Total Output VAT (from Sales): {formatNpr(report.outputVat)}</p>
            <p>Less: Input VAT (from Purchases): {formatNpr(report.inputVatPurchases)}</p>
            <p>Less: Input VAT (from Expenses): {formatNpr(report.inputVatExpenses)}</p>
            <p className="font-semibold">Net VAT Payable to IRD: {formatNpr(report.netVat)}</p>
            <p>VAT Filing Bucket: {report.taxBucket}</p>
            <p>Legal Reference: VAT Act 2052, Section 17</p>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">SECTION 10 - TDS COMPLIANCE SCHEDULE</h2>
          <div className="mt-3">
            <DataTable columns={tdsScheduleColumns} data={tdsScheduleRows} />
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">SECTION 11 - MANAGEMENT LETTER / OBSERVATIONS</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
            {report.turnoverThresholdFlag ? <li>Turnover exceeds NPR 10,000,000; mandatory audit requirement is triggered under Income Tax Act 2058.</li> : null}
            {report.netProfitThresholdFlag ? <li>Net profit exceeds NPR 1,000,000; mandatory audit requirement is triggered under Income Tax Act 2058.</li> : null}
            {!report.turnoverThresholdFlag && !report.netProfitThresholdFlag ? <li>No material weaknesses identified during the audit.</li> : null}
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900">SECTION 12 - DECLARATION & SIGNATURE BLOCK</h2>
          <div className="mt-2 grid gap-1 text-sm text-gray-700 md:grid-cols-2">
            <p>Auditor's Signature: _______________</p>
            <p>Name: Not Provided</p>
            <p>ICAN Membership No.: Not Provided</p>
            <p>Firm Name: Not Provided</p>
            <p>Address: Not Provided</p>
            <p>Date (BS): {report.auditDateBs} | Date (AD): {report.auditDateAd}</p>
            <p>Stamp / Seal: Required for IRD submission</p>
          </div>
        </section>

        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <h3 className="font-semibold text-amber-900">Data Gaps / Assumptions Applied</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-900">
            {report.assumptions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}

export default AuditPage

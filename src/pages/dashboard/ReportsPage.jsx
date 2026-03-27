import { useCallback, useEffect, useState } from 'react'
import { IRD_RULES, formatNpr } from '../../config/irdTaxRules'
import DataTable from '../../components/DataTable'
import PageHeader from '../../components/PageHeader'
import PrimaryButton from '../../components/PrimaryButton'
import SelectInput from '../../components/SelectInput'
import { REPORTS_ENDPOINTS } from '../../config/api'
import { useLanguage } from '../../context/LanguageContext'
import { getAccessToken } from '../../utils/auth'

function ReportsPage() {
  const { t } = useLanguage()
  const [period, setPeriod] = useState('')
  const [quarter, setQuarter] = useState('q1')
  const [fiscalYear, setFiscalYear] = useState(IRD_RULES.fiscalYears[1])
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [generatingCert, setGeneratingCert] = useState(false)
  const [generatingChallan, setGeneratingChallan] = useState(false)

  const periodOptions = [
    { label: t('reportsPeriodAll'), value: '' },
    { label: t('reportsPeriodMonthly'), value: 'monthly' },
    { label: t('reportsPeriodQuarterly'), value: 'quarterly' },
    { label: t('reportsPeriodAnnual'), value: 'annual' },
  ]

  const quarterOptions = [
    { label: t('reportsQuarterQ1'), value: 'q1' },
    { label: t('reportsQuarterQ2'), value: 'q2' },
    { label: t('reportsQuarterQ3'), value: 'q3' },
  ]

  const columns = [
    { key: 'item', label: t('reportsParticular') },
    { key: 'amount', label: t('commonAmount'), render: (row) => formatNpr(row.amount) },
  ]

  const fetchReport = useCallback(async () => {
    const token = getAccessToken()
    if (!token) return

    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (fiscalYear) params.set('fiscal_year', fiscalYear)
      if (period) params.set('period', period)
      if (period === 'quarterly') params.set('quarter', quarter)

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
  }, [fiscalYear, period, quarter])

  const generateTdsCertificate = async () => {
    const token = getAccessToken()
    if (!token) return

    setGeneratingCert(true)
    try {
      const params = new URLSearchParams()
      if (fiscalYear) params.set('fiscal_year', fiscalYear)

      const response = await fetch(`${REPORTS_ENDPOINTS.tdsCertificate}?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) return

      const data = await response.json()
      openTdsCertificatePrint(data)
    } catch (error) {
      console.error('Error generating TDS certificate:', error)
    } finally {
      setGeneratingCert(false)
    }
  }

  const generateChallanSlip = async () => {
    const token = getAccessToken()
    if (!token) return

    setGeneratingChallan(true)
    try {
      const params = new URLSearchParams()
      if (fiscalYear) params.set('fiscal_year', fiscalYear)

      const response = await fetch(`${REPORTS_ENDPOINTS.challanSlip}?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) return

      const data = await response.json()
      openChallanSlipPrint(data)
    } catch (error) {
      console.error('Error generating challan slip:', error)
    } finally {
      setGeneratingChallan(false)
    }
  }

  const openTdsCertificatePrint = (data) => {
    const printWindow = window.open('', '', 'height=900, width=1200')
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>TDS Certificate</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Arial', sans-serif; background: #f5f5f5; padding: 20px; }
            .container { max-width: 900px; margin: 0 auto; background: white; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .header { text-align: center; border-bottom: 3px solid #1f2937; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { color: #1f2937; font-size: 28px; margin-bottom: 5px; }
            .header p { color: #6b7280; font-size: 14px; }
            .certificate-number { text-align: right; color: #6b7280; margin-bottom: 20px; font-size: 12px; }
            .info-section { margin-bottom: 30px; }
            .info-row { display: flex; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; }
            .info-label { font-weight: 600; color: #374151; width: 40%; }
            .info-value { color: #1f2937; }
            .table-section { margin-top: 30px; }
            .table-section h3 { color: #1f2937; font-size: 16px; margin-bottom: 15px; border-bottom: 2px solid #d1d5db; padding-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; }
            th { background-color: #f3f4f6; padding: 12px; text-align: left; font-weight: 600; color: #374151; border: 1px solid #d1d5db; font-size: 12px; }
            td { padding: 10px 12px; border: 1px solid #e5e7eb; font-size: 12px; }
            tr:nth-child(even) { background-color: #f9fafb; }
            .total-row { background-color: #f3f4f6; font-weight: 600; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #d1d5db; text-align: center; font-size: 11px; color: #6b7280; }
            .note { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin-top: 20px; font-size: 12px; color: #92400e; }
            .print-info { text-align: center; margin-bottom: 20px; font-size: 12px; color: #6b7280; }
            @media print {
              body { background: white; }
              .container { box-shadow: none; }
              .print-info { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="print-info">Generated on: ${new Date().toLocaleString()} | This is an official TDS Certificate</div>
          <div class="container">
            <div class="header">
              <h1>Tax Deducted at Source (TDS) Certificate</h1>
              <p>Nepali Fiscal Year: ${data.fiscal_year}</p>
            </div>
            
            <div class="certificate-number">Certificate #: ${data.certificate_number}</div>
            
            <div class="info-section">
              <div class="info-row">
                <span class="info-label">Institution Name:</span>
                <span class="info-value">${data.institution_name}</span>
              </div>
              <div class="info-row">
                <span class="info-label">PAN/VAT Number:</span>
                <span class="info-value">${data.pan_vat_number}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Certificate Issued:</span>
                <span class="info-value">${data.issued_date}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Total TDS Amount:</span>
                <span class="info-value" style="font-weight: 600; color: #dc2626;">NPR ${parseFloat(data.total_tds).toFixed(2)}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Total Transaction Amount:</span>
                <span class="info-value">NPR ${parseFloat(data.total_amount_of_concerned_transaction).toFixed(2)}</span>
              </div>
            </div>
            
            <div class="table-section">
              <h3>TDS Transaction Details</h3>
              <table>
                <thead>
                  <tr>
                    <th>Date (BS)</th>
                    <th>Vendor PAN/VAT</th>
                    <th>Description</th>
                    <th>Amount (NPR)</th>
                    <th>TDS Rate (%)</th>
                    <th>TDS Amount (NPR)</th>
                  </tr>
                </thead>
                <tbody>
                  ${
                    data.entries && data.entries.length > 0
                      ? data.entries
                          .map(
                            (entry) => `
                    <tr>
                      <td>${entry.date}</td>
                      <td>${entry.vendor_pan_vat}</td>
                      <td>${entry.description}</td>
                      <td>${parseFloat(entry.amount).toFixed(2)}</td>
                      <td>${parseFloat(entry.tds_rate).toFixed(1)}%</td>
                      <td style="font-weight: 600; color: #dc2626;">${parseFloat(entry.tds_amount).toFixed(2)}</td>
                    </tr>
                  `
                          )
                          .join('')
                      : '<tr><td colspan="6" style="text-align: center; color: #6b7280;">No TDS transactions found</td></tr>'
                  }
                  <tr class="total-row">
                    <td colspan="5" style="text-align: right;">TOTAL:</td>
                    <td style="color: #dc2626;">NPR ${parseFloat(data.total_tds).toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div class="note">
              <strong>ℹ️ Important Note:</strong> This certificate is generated automatically by the FinAncio system for institutional record-keeping. 
              Please verify all entries before submission to IRD. For official TDS certificates, consult with your tax advisor.
            </div>
            
            <div class="footer">
              <p>FinAncio Financial Management System | Kathmandu, Nepal</p>
              <p>Generated for: ${data.institution_name} | Fiscal Year: ${data.fiscal_year}</p>
            </div>
          </div>
          <script>
            window.print();
          </script>
        </body>
      </html>
    `
    printWindow.document.write(html)
    printWindow.document.close()
  }

  const openChallanSlipPrint = (data) => {
    const printWindow = window.open('', '', 'height=900, width=1200')
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Challan Slip</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Arial', sans-serif; background: #f5f5f5; padding: 20px; }
            .container { max-width: 900px; margin: 0 auto; background: white; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .header { text-align: center; border-bottom: 3px solid #1f2937; padding-bottom: 20px; margin-bottom: 30px; }
            .header h1 { color: #1f2937; font-size: 28px; margin-bottom: 5px; }
            .header p { color: #6b7280; font-size: 14px; }
            .challan-number { text-align: right; color: #6b7280; margin-bottom: 20px; font-size: 12px; }
            .info-section { margin-bottom: 30px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .info-box { border: 1px solid #e5e7eb; padding: 15px; border-radius: 6px; background-color: #f9fafb; }
            .info-label { font-weight: 600; color: #374151; font-size: 12px; text-transform: uppercase; margin-bottom: 5px; }
            .info-value { color: #1f2937; font-size: 16px; font-weight: 500; }
            .tax-summary { margin-top: 30px; padding: 20px; background-color: #f0f9ff; border-left: 4px solid #0284c7; border-radius: 4px; }
            .tax-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #bfdbfe; font-size: 14px; }
            .tax-row:last-child { border-bottom: none; }
            .tax-label { color: #1e40af; font-weight: 500; }
            .tax-amount { color: #1e40af; font-weight: 600; }
            .total-section { margin-top: 20px; display: flex; justify-content: space-between; padding: 15px; background-color: #dcfce7; border: 2px solid #22c55e; border-radius: 4px; font-weight: 700; font-size: 16px; }
            .total-label { color: #166534; }
            .total-amount { color: #22c55e; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #d1d5db; text-align: center; font-size: 11px; color: #6b7280; }
            .note { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin-top: 20px; font-size: 12px; color: #92400e; }
            .print-info { text-align: center; margin-bottom: 20px; font-size: 12px; color: #6b7280; }
            @media print {
              body { background: white; }
              .container { box-shadow: none; }
              .print-info { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="print-info">Generated on: ${new Date().toLocaleString()} | Tax Challan Slip for IRD Submission</div>
          <div class="container">
            <div class="header">
              <h1>Tax Challan Slip</h1>
              <p>For Institutional Tax Compliance | ${data.tax_period}</p>
            </div>
            
            <div class="challan-number">Challan #: ${data.challan_number}</div>
            
            <div class="info-section">
              <div class="info-grid">
                <div class="info-box">
                  <div class="info-label">Institution Name</div>
                  <div class="info-value">${data.institution_name}</div>
                </div>
                <div class="info-box">
                  <div class="info-label">PAN/VAT Number</div>
                  <div class="info-value">${data.pan_vat_number}</div>
                </div>
                <div class="info-box">
                  <div class="info-label">Fiscal Year</div>
                  <div class="info-value">${data.fiscal_year}</div>
                </div>
                <div class="info-box">
                  <div class="info-label">Challan Generated</div>
                  <div class="info-value">${data.issued_date}</div>
                </div>
              </div>
            </div>
            
            <div class="tax-summary">
              <h3 style="color: #1e40af; margin-bottom: 15px; font-size: 16px;">Tax Summary</h3>
              <div class="tax-row">
                <span class="tax-label">Total VAT Output (13% on Sales):</span>
                <span class="tax-amount">NPR ${parseFloat(data.total_vat_output).toFixed(2)}</span>
              </div>
              <div class="tax-row">
                <span class="tax-label">Total VAT Input (13% on Purchases & Expenses):</span>
                <span class="tax-amount">NPR ${parseFloat(data.total_vat_input).toFixed(2)}</span>
              </div>
              <div class="tax-row">
                <span class="tax-label">Net VAT Payable:</span>
                <span class="tax-amount">NPR ${parseFloat(data.net_vat_payable).toFixed(2)}</span>
              </div>
              <div class="tax-row">
                <span class="tax-label">TDS Withheld (From Eligible Expenses):</span>
                <span class="tax-amount">NPR ${parseFloat(data.total_tds).toFixed(2)}</span>
              </div>
            </div>
            
            <div class="total-section">
              <span class="total-label">TOTAL AMOUNT PAYABLE TO IRD:</span>
              <span class="total-amount">NPR ${parseFloat(data.total_amount_payable).toFixed(2)}</span>
            </div>
            
            <div class="note">
              <strong>Important Notice:</strong> This challan slip should be submitted to the IRD within the specified due date. 
              Payment must be made through authorized banks or tax payment centers. Keep all supporting documents for audit trail.
            </div>
            
            <div class="footer">
              <p>FinAncio Financial Management System | Kathmandu, Nepal</p>
              <p>Generated for: ${data.institution_name} | Period: ${data.tax_period}</p>
              <p style="margin-top: 10px; font-size: 10px; color: #9ca3af;">For official IRD compliance, please consult with a certified tax consultant</p>
            </div>
          </div>
          <script>
            window.print();
          </script>
        </body>
      </html>
    `
    printWindow.document.write(html)
    printWindow.document.close()
  }

  useEffect(() => {
    fetchReport()
  }, [fetchReport, fiscalYear, period, quarter])

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('reportsTitle')}
        subtitle={t('reportsSubtitle')}
        actions={
          <div className="flex gap-2">
            <PrimaryButton variant="outline">{t('actionsExportPdf')}</PrimaryButton>
            <PrimaryButton variant="outline">{t('actionsExportWord')}</PrimaryButton>
          </div>
        }
      />

      <div className="grid gap-4 rounded-lg bg-white p-5 shadow-sm md:grid-cols-3">
        <SelectInput
          label={t('commonFiscalYearBs')}
          name="fiscalYear"
          value={fiscalYear}
          onChange={(event) => setFiscalYear(event.target.value)}
          options={IRD_RULES.fiscalYears.map((item) => ({ label: item, value: item }))}
        />
        <SelectInput
          label={t('reportsPeriodLabel')}
          name="reportPeriod"
          value={period}
          onChange={(event) => setPeriod(event.target.value)}
          options={periodOptions}
        />
        {period === 'quarterly' ? (
          <SelectInput
            label={t('reportsQuarterLabel')}
            name="reportQuarter"
            value={quarter}
            onChange={(event) => setQuarter(event.target.value)}
            options={quarterOptions}
          />
        ) : null}
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">{t('reportsLoading')}</p>
      ) : (
        <DataTable columns={columns} data={rows} />
      )}

      <div className="rounded-lg bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-gray-900">{t('reportsWithholdingTitle')}</h3>
        <p className="mt-1 text-sm text-gray-500">
          {t('reportsWithholdingSubtitle')}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <PrimaryButton
            variant="outline"
            onClick={generateTdsCertificate}
            disabled={generatingCert}
          >
            {generatingCert ? '⏳ Generating...' : t('reportsGenerateTdsCert')}
          </PrimaryButton>
          <PrimaryButton
            variant="outline"
            onClick={generateChallanSlip}
            disabled={generatingChallan}
          >
            {generatingChallan ? '⏳ Generating...' : t('reportsGenerateChallan')}
          </PrimaryButton>
        </div>
      </div>
    </div>
  )
}

export default ReportsPage

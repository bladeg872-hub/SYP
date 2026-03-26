import { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import PageHeader from '../../components/PageHeader'
import SummaryCard from '../../components/SummaryCard'
import PrimaryButton from '../../components/PrimaryButton'
import { DASHBOARD_ENDPOINTS } from '../../config/api'
import { formatNpr, toNumber } from '../../config/irdTaxRules'
import { useLanguage } from '../../context/LanguageContext'
import { getAccessToken } from '../../utils/auth'

function DashboardHomePage() {
  const { t } = useLanguage()
  const [summary, setSummary] = useState({
    total_sales: '0',
    total_expenses: '0',
    total_vat: '0',
    total_tds: '0',
    net: '0',
    net_status: 'profit',
  })
  const [salesTrend, setSalesTrend] = useState([])
  const [expenseTrend, setExpenseTrend] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboard = async () => {
      const token = getAccessToken()
      if (!token) {
        console.warn('No auth token found')
        setLoading(false)
        return
      }

      try {
        console.log('Fetching dashboard from:', DASHBOARD_ENDPOINTS.summary)
        const response = await fetch(DASHBOARD_ENDPOINTS.summary, {
          headers: { Authorization: `Bearer ${token}` },
        })

        console.log('Dashboard response status:', response.status)

        if (!response.ok) {
          console.error('Dashboard API error:', response.status, response.statusText)
          setLoading(false)
          return
        }

        const data = await response.json()
        console.log('Dashboard data received:', data)
        
        setSummary(data.summary || {})
        setSalesTrend(
          (data.sales_trend || []).map((r) => ({ name: r.name, value: Number(r.value) }))
        )
        setExpenseTrend(
          (data.expense_trend || []).map((r) => ({ name: r.name, value: Number(r.value) }))
        )
      } catch (error) {
        console.error('Dashboard fetch error:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()
  }, [])

  const handlePrintChart = (chartId, title) => {
    const chartElement = document.getElementById(chartId)
    if (!chartElement) return

    const printWindow = window.open('', '', 'height=900, width=1200')
    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #1f2937; margin-bottom: 10px; }
            .chart-container { margin-top: 20px; }
            svg { max-width: 100%; }
            .footer { margin-top: 20px; font-size: 12px; color: #6b7280; }
          </style>
        </head>
        <body>
          <h1>${t('dashboardChartPrintTitle')}</h1>
          <h2>${title}</h2>
          <div class="chart-container">
            ${chartElement.innerHTML}
          </div>
          <div class="footer">
            <p>Generated on: ${new Date().toLocaleString()}</p>
            <p>FinAncio Financial Management System</p>
          </div>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  const totalSales = toNumber(summary?.total_sales || '0')
  const totalExpenses = toNumber(summary?.total_expenses || '0')
  const totalVat = toNumber(summary?.total_vat || '0')
  const totalTds = toNumber(summary?.total_tds || '0')
  const netProfit = toNumber(summary?.net || '0')
  const grossProfit = totalSales - totalExpenses
  const profitMargin = totalSales > 0 ? ((grossProfit / totalSales) * 100).toFixed(2) : 0
  const expenseRatio = totalSales > 0 ? ((totalExpenses / totalSales) * 100).toFixed(2) : 0

  const getTrendIcon = (trend) => {
    if (trend > 0) return '📈'
    if (trend < 0) return '📉'
    return '➡️'
  }

  const getSalesChange =
    salesTrend.length > 1
      ? salesTrend[salesTrend.length - 1].value - salesTrend[0].value
      : 0

  const getExpenseChange =
    expenseTrend.length > 1
      ? expenseTrend[expenseTrend.length - 1].value - expenseTrend[0].value
      : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <PageHeader
            title={t('dashboardTitle')}
            subtitle={t('dashboardSubtitle')}
          />
        </div>
        <PrimaryButton variant="outline" onClick={() => window.print()}>
          🖨️ {t('actionsPrintReport')}
        </PrimaryButton>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">{t('dashboardLoading')}</p>
      ) : (
        <>
          {/* Summary Cards */}
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <SummaryCard
              title={t('dashboardTotalSales')}
              value={formatNpr(totalSales)}
              trend={`${getTrendIcon(getSalesChange)} ${getSalesChange > 0 ? t('dashboardTrendUp') : t('dashboardTrendDown')}`}
              description={t('dashboardSalesDescription')}
              icon="📊"
            />
            <SummaryCard
              title={t('dashboardTotalExpenses')}
              value={formatNpr(totalExpenses)}
              trend={`${getTrendIcon(getExpenseChange)} ${t('dashboardTrendUp')}`}
              description={t('dashboardExpensesDescription')}
              icon="💸"
            />
            <SummaryCard
              title={t('dashboardTotalVat')}
              value={formatNpr(totalVat)}
              status={totalVat > 0 ? 'loss' : 'profit'}
              trend={totalVat > 0 ? t('dashboardNetPayable') : t('dashboardNetCredit')}
              description={t('dashboardVatDescription')}
              icon="🧾"
            />
            <SummaryCard
              title={t('dashboardTotalTds')}
              value={formatNpr(totalTds)}
              trend={totalTds > 0 ? 'Withheld from expenses' : 'No TDS withheld'}
              description={t('dashboardTdsDescription')}
              icon="📋"
            />
            <SummaryCard
              title={t('dashboardNetProfitLoss')}
              value={formatNpr(netProfit)}
              status={summary?.net_status || 'neutral'}
              trend={`${profitMargin}% margin`}
              description={t('dashboardProfitDescription')}
              icon={(summary?.net_status || 'neutral') === 'profit' ? '✅' : '⚠️'}
            />
          </section>

          {/* Key Insights */}
          <section className="rounded-lg border border-blue-200 bg-blue-50 p-5">
            <h3 className="mb-3 text-sm font-semibold text-blue-900">{t('dashboardInsights')}</h3>
            <div className="grid gap-3 text-sm text-blue-800 md:grid-cols-3">
              <div>
                <p className="font-medium">{t('dashboardGrossMargin')}</p>
                <p className="mt-1 text-lg font-bold">{profitMargin}%</p>
                <p className="text-xs text-blue-700 mt-1">Gross profit relative to sales</p>
              </div>
              <div>
                <p className="font-medium">{t('dashboardExpenseRatio')}</p>
                <p className="mt-1 text-lg font-bold">{expenseRatio}%</p>
                <p className="text-xs text-blue-700 mt-1">Expenses relative to sales</p>
              </div>
              <div>
                <p className="font-medium">{t('dashboardTaxEfficiency')}</p>
                <p className="mt-1 text-lg font-bold">{totalSales > 0 ? (((totalVat + totalTds) / totalSales) * 100).toFixed(2) : '0'}%</p>
                <p className="text-xs text-blue-700 mt-1">Total tax burden on sales</p>
              </div>
            </div>
          </section>

          {/* Charts */}
          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-lg bg-white p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">{t('dashboardSalesTrend')}</h3>
                  <p className="text-xs text-gray-500 mt-1">Revenue over time by transaction date</p>
                </div>
                {salesTrend.length > 0 && (
                  <PrimaryButton variant="outline" onClick={() => handlePrintChart('salesChart', t('dashboardSalesTrend'))}>
                    {t('dashboardPrintChart')}
                  </PrimaryButton>
                )}
              </div>
              <div className="h-80" id="salesChart">
                {salesTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={salesTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" style={{ fontSize: '12px' }} />
                      <YAxis style={{ fontSize: '12px' }} />
                      <Tooltip
                        formatter={(value) => formatNpr(value)}
                        labelStyle={{ color: '#1f2937' }}
                      />
                      <Legend wrapperStyle={{ paddingTop: '20px' }} />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#2563eb"
                        strokeWidth={3}
                        dot={{ fill: '#2563eb', r: 4 }}
                        activeDot={{ r: 6 }}
                        name="Sales Amount"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="flex h-full items-center justify-center text-sm text-gray-400">
                    {t('dashboardNoSalesData')}
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-lg bg-white p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">{t('dashboardExpenseTrend')}</h3>
                  <p className="text-xs text-gray-500 mt-1">Expenditures over time by transaction date</p>
                </div>
                {expenseTrend.length > 0 && (
                  <PrimaryButton variant="outline" onClick={() => handlePrintChart('expenseChart', t('dashboardExpenseTrend'))}>
                    {t('dashboardPrintChart')}
                  </PrimaryButton>
                )}
              </div>
              <div className="h-80" id="expenseChart">
                {expenseTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={expenseTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" style={{ fontSize: '12px' }} />
                      <YAxis style={{ fontSize: '12px' }} />
                      <Tooltip
                        formatter={(value) => formatNpr(value)}
                        labelStyle={{ color: '#1f2937' }}
                      />
                      <Legend wrapperStyle={{ paddingTop: '20px' }} />
                      <Bar
                        dataKey="value"
                        fill="#374151"
                        radius={[8, 8, 0, 0]}
                        name="Expense Amount"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="flex h-full items-center justify-center text-sm text-gray-400">
                    {t('dashboardNoExpenseData')}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Detailed Analysis Summary */}
          <section className="rounded-lg bg-white p-5 shadow-sm border border-gray-100">
            <h3 className="text-base font-semibold text-gray-900 mb-4">{t('dashboardDetailedAnalysis')}</h3>
            <div className="grid gap-6 text-sm md:grid-cols-2">
              <div className="space-y-2 border-r border-gray-200 pr-6">
                <p>
                  <span className="text-gray-600">Gross Profit:</span>
                  <span className="ml-2 font-semibold text-gray-900">{formatNpr(grossProfit)}</span>
                </p>
                <p>
                  <span className="text-gray-600">After All Expenses:</span>
                  <span className="ml-2 font-semibold text-gray-900">{formatNpr(netProfit)}</span>
                </p>
                <p>
                  <span className="text-gray-600">Tax Withholdings (TDS):</span>
                  <span className="ml-2 font-semibold text-red-600">{formatNpr(totalTds)}</span>
                </p>
              </div>
              <div className="space-y-2">
                <p>
                  <span className="text-gray-600">VAT Position:</span>
                  <span className={`ml-2 font-semibold ${totalVat > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {totalVat > 0 ? `Payable: ${formatNpr(totalVat)}` : `Credit: ${formatNpr(-totalVat)}`}
                  </span>
                </p>
                <p>
                  <span className="text-gray-600">Profit Margin:</span>
                  <span className="ml-2 font-semibold text-gray-900">{profitMargin}%</span>
                </p>
                <p>
                  <span className="text-gray-600">Operating Efficiency:</span>
                  <span className="ml-2 font-semibold text-gray-900">{(100 - expenseRatio).toFixed(2)}%</span>
                </p>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  )
}

export default DashboardHomePage

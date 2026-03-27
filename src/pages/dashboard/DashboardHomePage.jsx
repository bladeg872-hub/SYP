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
  Cell,
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
    total_purchases: '0',
    total_vat: '0',
    total_tds: '0',
    net: '0',
    net_status: 'profit',
  })
  const [salesTrend, setSalesTrend] = useState([])
  const [expenseTrend, setExpenseTrend] = useState([])
  const [purchaseTrend, setPurchaseTrend] = useState([])
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
        setPurchaseTrend(
          (data.purchase_trend || []).map((r) => ({ name: r.name, value: Number(r.value) }))
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
  const totalPurchases = toNumber(summary?.total_purchases || '0')
  const totalVat = toNumber(summary?.total_vat || '0')
  const totalTds = toNumber(summary?.total_tds || '0')
  const netProfit = toNumber(summary?.net || '0')
  const grossProfit = totalSales - totalExpenses - totalPurchases
  const profitMargin = totalSales > 0 ? ((netProfit / totalSales) * 100).toFixed(2) : 0
  const expenseRatio = totalSales > 0 ? ((totalExpenses / totalSales) * 100).toFixed(2) : 0

  // Prepare comprehensive chart data
  const comprehensiveChartData = [
    {
      name: 'Sales',
      value: totalSales,
      fill: '#2563eb',
      category: 'Income',
    },
    {
      name: 'Purchases',
      value: totalPurchases,
      fill: '#f97316',
      category: 'Expense',
    },
    {
      name: 'Expenses',
      value: totalExpenses,
      fill: '#ef4444',
      category: 'Expense',
    },
    {
      name: 'Profit',
      value: netProfit,
      fill: netProfit >= 0 ? '#10b981' : '#dc2626',
      category: 'Net',
    },
    {
      name: 'VAT',
      value: Math.abs(totalVat),
      fill: '#8b5cf6',
      category: 'Tax',
    },
    {
      name: 'TDS',
      value: totalTds,
      fill: '#ec4899',
      category: 'Tax',
    },
  ]

  const getTrendIcon = (trend) => {
    if (trend > 0) return '+'
    if (trend < 0) return '-'
    return ''
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
          {t('actionsPrintReport')}
        </PrimaryButton>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">{t('dashboardLoading')}</p>
      ) : (
        <>
          {/* Summary Cards */}
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
            <SummaryCard
              title={t('dashboardTotalSales')}
              value={formatNpr(totalSales)}
              trend={`${getTrendIcon(getSalesChange)} ${getSalesChange > 0 ? t('dashboardTrendUp') : t('dashboardTrendDown')}`}
              description={t('dashboardSalesDescription')}
            />
            <SummaryCard
              title={t('dashboardTotalPurchases') || 'Total Purchases'}
              value={formatNpr(totalPurchases)}
              trend={`${getTrendIcon(getExpenseChange)} ${t('dashboardTrendUp')}`}
              description="Cost of goods purchased"
            />
            <SummaryCard
              title={t('dashboardTotalExpenses')}
              value={formatNpr(totalExpenses)}
              trend={`${getTrendIcon(getExpenseChange)} ${t('dashboardTrendUp')}`}
              description={t('dashboardExpensesDescription')}
            />
            <SummaryCard
              title={t('dashboardTotalVat')}
              value={formatNpr(totalVat)}
              status={totalVat > 0 ? 'loss' : 'profit'}
              trend={totalVat > 0 ? t('dashboardNetPayable') : t('dashboardNetCredit')}
              description={t('dashboardVatDescription')}
            />
            <SummaryCard
              title={t('dashboardTotalTds')}
              value={formatNpr(totalTds)}
              trend={totalTds > 0 ? 'Withheld from expenses' : 'No TDS withheld'}
              description={t('dashboardTdsDescription')}
            />
            <SummaryCard
              title={t('dashboardNetProfitLoss')}
              value={formatNpr(netProfit)}
              status={summary?.net_status || 'neutral'}
              trend={`${profitMargin}% margin`}
              description={t('dashboardProfitDescription')}
            />
          </section>

          {/* Comprehensive Financial Overview Chart */}
          <section className="rounded-lg bg-white p-6 shadow-md border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Financial Overview</h3>
                <p className="text-sm text-gray-600 mt-1">Complete financial metrics at a glance - Sales, Purchases, Expenses, Profit, VAT, and TDS</p>
              </div>
              <PrimaryButton variant="outline" onClick={() => handlePrintChart('comprehensiveChart', 'Financial Overview')}>
                {t('dashboardPrintChart')}
              </PrimaryButton>
            </div>
            <div className="h-96" id="comprehensiveChart">
              {comprehensiveChartData.some((d) => d.value > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comprehensiveChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={true} vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      style={{ fontSize: '13px', fontWeight: 500 }}
                      tick={{ fill: '#374151' }}
                    />
                    <YAxis 
                      style={{ fontSize: '12px' }}
                      tick={{ fill: '#6b7280' }}
                      label={{ value: 'Amount (NPR)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip
                      formatter={(value) => formatNpr(value)}
                      labelStyle={{ color: '#1f2937' }}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                      }}
                    />
                    <Bar 
                      dataKey="value" 
                      radius={[8, 8, 0, 0]}
                      name="Amount"
                    >
                      {comprehensiveChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className="text-gray-400 text-center">
                    <p className="text-sm mb-2">No financial data available yet</p>
                    <p className="text-xs">Add transactions to see the overview</p>
                  </p>
                </div>
              )}
            </div>
            
            {/* Chart Legend & Explanation */}
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <div>
                  <p className="text-xs font-semibold text-blue-900">Sales</p>
                  <p className="text-xs text-blue-700">{formatNpr(totalSales)}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
                <div className="w-4 h-4 bg-orange-500 rounded"></div>
                <div>
                  <p className="text-xs font-semibold text-orange-900">Purchases</p>
                  <p className="text-xs text-orange-700">{formatNpr(totalPurchases)}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <div>
                  <p className="text-xs font-semibold text-red-900">Expenses</p>
                  <p className="text-xs text-red-700">{formatNpr(totalExpenses)}</p>
                </div>
              </div>
              <div className={`flex items-center space-x-3 p-3 ${netProfit >= 0 ? 'bg-green-50' : 'bg-red-50'} rounded-lg`}>
                <div className={`w-4 h-4 ${netProfit >= 0 ? 'bg-green-500' : 'bg-red-500'} rounded`}></div>
                <div>
                  <p className={`text-xs font-semibold ${netProfit >= 0 ? 'text-green-900' : 'text-red-900'}`}>Profit/Loss</p>
                  <p className={`text-xs ${netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>{formatNpr(netProfit)}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                <div className="w-4 h-4 bg-purple-500 rounded"></div>
                <div>
                  <p className="text-xs font-semibold text-purple-900">VAT</p>
                  <p className="text-xs text-purple-700">{formatNpr(Math.abs(totalVat))}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-pink-50 rounded-lg">
                <div className="w-4 h-4 bg-pink-500 rounded"></div>
                <div>
                  <p className="text-xs font-semibold text-pink-900">TDS</p>
                  <p className="text-xs text-pink-700">{formatNpr(totalTds)}</p>
                </div>
              </div>
            </div>
          </section>
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
          <section className="grid gap-6 lg:grid-cols-3">
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
                  <h3 className="text-base font-semibold text-gray-900">{t('dashboardPurchaseTrend') || 'Purchase Trend'}</h3>
                  <p className="text-xs text-gray-500 mt-1">Purchases over time by transaction date</p>
                </div>
                {purchaseTrend.length > 0 && (
                  <PrimaryButton variant="outline" onClick={() => handlePrintChart('purchaseChart', 'Purchase Trend')}>
                    {t('dashboardPrintChart')}
                  </PrimaryButton>
                )}
              </div>
              <div className="h-80" id="purchaseChart">
                {purchaseTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={purchaseTrend}>
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
                        fill="#f97316"
                        radius={[8, 8, 0, 0]}
                        name="Purchase Amount"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="flex h-full items-center justify-center text-sm text-gray-400">
                    No purchase data available
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
          <section className="rounded-lg bg-gradient-to-br from-gray-900 to-gray-800 p-8 shadow-lg text-white border border-gray-700">
            <h3 className="text-lg font-bold mb-6">Financial Breakdown</h3>
            <div className="grid gap-8 text-sm md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-3 p-4 bg-gray-700 bg-opacity-50 rounded-lg">
                <p className="font-semibold text-blue-300">Sales Revenue</p>
                <p className="text-2xl font-bold text-white">{formatNpr(totalSales)}</p>
                <p className="text-xs text-gray-300">Total income from sales</p>
              </div>
              <div className="space-y-3 p-4 bg-gray-700 bg-opacity-50 rounded-lg">
                <p className="font-semibold text-orange-300">Total Purchases</p>
                <p className="text-2xl font-bold text-white">{formatNpr(totalPurchases)}</p>
                <p className="text-xs text-gray-300">Cost of goods purchased</p>
              </div>
              <div className="space-y-3 p-4 bg-gray-700 bg-opacity-50 rounded-lg">
                <p className="font-semibold text-red-300">Total Expenses</p>
                <p className="text-2xl font-bold text-white">{formatNpr(totalExpenses)}</p>
                <p className="text-xs text-gray-300">Operating and other expenses</p>
              </div>
              <div className={`space-y-3 p-4 bg-gray-700 bg-opacity-50 rounded-lg`}>
                <p className={`font-semibold ${netProfit >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                  Gross Profit
                </p>
                <p className="text-2xl font-bold text-white">{formatNpr(grossProfit)}</p>
                <p className="text-xs text-gray-300">Sales - Purchases - Expenses</p>
              </div>
              <div className={`space-y-3 p-4 bg-gray-700 bg-opacity-50 rounded-lg`}>
                <p className={`font-semibold ${netProfit >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                  Net Profit/Loss
                </p>
                <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatNpr(netProfit)}</p>
                <p className="text-xs text-gray-300">Final net income</p>
              </div>
              <div className="space-y-3 p-4 bg-gray-700 bg-opacity-50 rounded-lg">
                <p className="font-semibold text-purple-300">Profit Margin</p>
                <p className="text-2xl font-bold text-white">{profitMargin}%</p>
                <p className="text-xs text-gray-300">Profit relative to sales</p>
              </div>
              <div className={`space-y-3 p-4 bg-gray-700 bg-opacity-50 rounded-lg`}>
                <p className={`font-semibold ${totalVat > 0 ? 'text-red-300' : 'text-green-300'}`}>
                  VAT Position
                </p>
                <p className={`text-2xl font-bold ${totalVat > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {totalVat > 0 ? `Rs${formatNpr(totalVat)}` : `Rs${formatNpr(-totalVat)}`}
                </p>
                <p className="text-xs text-gray-300">{totalVat > 0 ? 'Payable' : 'Credit'}</p>
              </div>
              <div className="space-y-3 p-4 bg-gray-700 bg-opacity-50 rounded-lg">
                <p className="font-semibold text-pink-300">TDS Withheld</p>
                <p className="text-2xl font-bold text-white">{formatNpr(totalTds)}</p>
                <p className="text-xs text-gray-300">Tax deducted at source</p>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  )
}

export default DashboardHomePage

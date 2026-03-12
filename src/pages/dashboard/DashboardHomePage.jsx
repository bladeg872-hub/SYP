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
import { DASHBOARD_ENDPOINTS } from '../../config/api'
import { formatNpr } from '../../config/irdTaxRules'
import { getAccessToken } from '../../utils/auth'

function DashboardHomePage() {
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
      if (!token) return

      try {
        const response = await fetch(DASHBOARD_ENDPOINTS.summary, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!response.ok) return

        const data = await response.json()
        setSummary(data.summary)
        setSalesTrend(
          data.sales_trend.map((r) => ({ name: r.name, value: Number(r.value) }))
        )
        setExpenseTrend(
          data.expense_trend.map((r) => ({ name: r.name, value: Number(r.value) }))
        )
      } catch {
        // keep defaults
      } finally {
        setLoading(false)
      }
    }

    fetchDashboard()
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="Overview of sales, expenses, taxes and profitability"
      />

      {loading ? (
        <p className="text-sm text-gray-500">Loading dashboard data...</p>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <SummaryCard title="Total Sales" value={formatNpr(summary.total_sales)} />
            <SummaryCard title="Total Expenses" value={formatNpr(summary.total_expenses)} />
            <SummaryCard title="Total VAT" value={formatNpr(summary.total_vat)} />
            <SummaryCard title="Total TDS" value={formatNpr(summary.total_tds)} />
            <SummaryCard
              title="Net Profit/Loss"
              value={formatNpr(summary.net)}
              status={summary.net_status}
            />
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg bg-white p-4 shadow-sm">
              <h3 className="mb-4 text-base font-semibold text-gray-900">Sales Trend</h3>
              <div className="h-72">
                {salesTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={salesTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="flex h-full items-center justify-center text-sm text-gray-400">
                    No sales data yet
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-lg bg-white p-4 shadow-sm">
              <h3 className="mb-4 text-base font-semibold text-gray-900">Expense Trend</h3>
              <div className="h-72">
                {expenseTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={expenseTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" fill="#374151" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="flex h-full items-center justify-center text-sm text-gray-400">
                    No expense data yet
                  </p>
                )}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  )
}

export default DashboardHomePage

import { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import PageHeader from '../../components/PageHeader'
import { ANALYTICS_ENDPOINTS } from '../../config/api'
import { getAccessToken } from '../../utils/auth'

const taxColors = ['#2563eb', '#16a34a', '#dc2626']

function AnalyticsPage() {
  const [salesTrend, setSalesTrend] = useState([])
  const [expenseTrend, setExpenseTrend] = useState([])
  const [taxDistribution, setTaxDistribution] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnalytics = async () => {
      const token = getAccessToken()
      if (!token) return

      try {
        const response = await fetch(ANALYTICS_ENDPOINTS.summary, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!response.ok) return

        const data = await response.json()
        setSalesTrend(
          (data.sales_trend || []).map((r) => ({ name: r.name, value: Number(r.value) }))
        )
        setExpenseTrend(
          (data.expense_trend || []).map((r) => ({ name: r.name, value: Number(r.value) }))
        )
        setTaxDistribution(
          (data.tax_distribution || []).map((r) => ({ name: r.name, value: Number(r.value) }))
        )
      } catch {
        // keep defaults
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Analytics" subtitle="Visual trends for sales, expenses and tax distribution" />
        <p className="text-sm text-gray-500">Loading analytics...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" subtitle="Visual trends for sales, expenses and tax distribution" />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-base font-semibold text-gray-900">Sales Trend</h3>
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
              <p className="flex h-full items-center justify-center text-sm text-gray-400">No sales data yet</p>
            )}
          </div>
        </div>

        <div className="rounded-lg bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-base font-semibold text-gray-900">Expense Trend</h3>
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
              <p className="flex h-full items-center justify-center text-sm text-gray-400">No expense data yet</p>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-base font-semibold text-gray-900">Tax Distribution</h3>
        <div className="h-72">
          {taxDistribution.some((r) => r.value > 0) ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={taxDistribution} dataKey="value" cx="50%" cy="50%" outerRadius={100} label>
                  {taxDistribution.map((entry, index) => (
                    <Cell key={entry.name} fill={taxColors[index % taxColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="flex h-full items-center justify-center text-sm text-gray-400">No tax data yet</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default AnalyticsPage

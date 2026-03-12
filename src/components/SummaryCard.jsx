function SummaryCard({ title, value, trend, status = 'neutral' }) {
  const statusColor =
    status === 'profit'
      ? 'text-green-600'
      : status === 'loss'
        ? 'text-red-600'
        : 'text-gray-500'

  return (
    <div className="rounded-lg bg-white p-4 shadow-sm">
      <p className="text-sm text-gray-500">{title}</p>
      <p className={`mt-2 text-xl font-semibold ${statusColor}`}>{value}</p>
      {trend ? <p className="mt-1 text-xs text-gray-500">{trend}</p> : null}
    </div>
  )
}

export default SummaryCard

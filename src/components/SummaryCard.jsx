function SummaryCard({ title, value, trend, status = 'neutral', description, icon }) {
  const statusColor =
    status === 'profit'
      ? 'text-green-600 bg-green-50'
      : status === 'loss'
        ? 'text-red-600 bg-red-50'
        : 'text-blue-600 bg-blue-50'

  const statusBorder =
    status === 'profit'
      ? 'border-l-4 border-green-600'
      : status === 'loss'
        ? 'border-l-4 border-red-600'
        : 'border-l-4 border-blue-600'

  return (
    <div className={`rounded-lg bg-white p-4 shadow-sm hover:shadow-md transition-shadow ${statusBorder}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{title}</p>
          <p className={`mt-2 text-2xl font-bold ${statusColor.split(' ')[0]}`}>{value}</p>
          {trend && <p className="mt-1 text-xs text-gray-500">{trend}</p>}
        </div>
        {icon && <span className="text-2xl ml-2">{icon}</span>}
      </div>
      {description && (
        <p className="mt-3 text-xs text-gray-600 leading-relaxed border-t border-gray-100 pt-2">
          {description}
        </p>
      )}
    </div>
  )
}

export default SummaryCard

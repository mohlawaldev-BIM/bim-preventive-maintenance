export default function AssetCard({ asset }) {
  const statusConfig = {
    healthy: { color: 'bg-green-100 text-green-800', dot: 'bg-green-500', label: 'Healthy' },
    due_soon: { color: 'bg-yellow-100 text-yellow-800', dot: 'bg-yellow-500', label: 'Due Soon' },
    overdue: { color: 'bg-red-100 text-red-800', dot: 'bg-red-500', label: 'Overdue' },
  }

  const config = statusConfig[asset.status] || statusConfig.healthy

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2 overflow-hidden gap-2">
        <h3 className="font-semibold text-gray-800 text-sm leading-tight flex-1 mr-2 truncate" title={asset.name}>
          {asset.name}
        </h3>
        <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${config.color}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></span>
          {config.label}
        </span>
      </div>
      <p className="text-xs text-gray-500 mb-1">
        Category: <span className="text-gray-700">{asset.category}</span>
      </p>
      <p className="text-xs text-gray-500 mb-1">
        Location: <span className="text-gray-700">{asset.location || 'Unknown'}</span>
      </p>
      <p className="text-xs text-gray-500">
        Next due: <span className="text-gray-700">
          {asset.next_maintenance_date
            ? new Date(asset.next_maintenance_date).toLocaleDateString()
            : 'Not set'}
        </span>
      </p>
      {asset.days_until_due !== null && (
        <p className={`text-xs mt-2 font-medium ${asset.days_until_due < 0 ? 'text-red-600' : 'text-gray-600'}`}>
          {asset.days_until_due < 0
            ? `${Math.abs(asset.days_until_due)} days overdue`
            : `${asset.days_until_due} days until due`}
        </p>
      )}
    </div>
  )
}
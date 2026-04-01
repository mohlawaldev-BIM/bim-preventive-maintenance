export default function StatsCard({ title, value, subtitle, color }) {
  const colors = {
    green: 'bg-green-50 border-green-200 text-green-800',
    red: 'bg-red-50 border-red-200 text-red-800',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
  }

  return (
    <div className={`rounded-xl border-2 p-6 ${colors[color]}`}>
      <p className="text-sm font-medium opacity-70">{title}</p>
      <p className="text-4xl font-bold mt-1">{value ?? '...'}</p>
      {subtitle && <p className="text-sm mt-2 opacity-60">{subtitle}</p>}
    </div>
  )
}
import { useQuery } from '@tanstack/react-query'
import { getAssets, getAllWorkOrders } from '../api'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { useCategoryFilter } from '../context/CategoryContext'
import { useProject } from '../context/ProjectContext'

export default function Analytics() {
  const { activeProject } = useProject()
  const projectId = activeProject?.id
  const { selectedCategories } = useCategoryFilter()

  const { data: assetsData } = useQuery({
    queryKey: ['assets-analytics', selectedCategories, projectId],
    queryFn: () => getAssets({ page: 1, limit: 1000, categories: selectedCategories, projectId }),
    enabled: !!projectId,
  })

  // Fetch ALL work orders for analytics
  const { data: woData } = useQuery({
    queryKey: ['workorders-analytics', selectedCategories, projectId],
    queryFn: () => getAllWorkOrders({ categories: selectedCategories, projectId }),
    enabled: !!projectId,
  })

  const assets = assetsData?.data?.assets || []
  const workOrderList = woData?.data?.workOrders || []

  // Asset status breakdown for pie chart
  const statusData = [
    { name: 'Healthy', value: assets.filter(a => a.status === 'healthy').length, color: '#22c55e' },
    { name: 'Due Soon', value: assets.filter(a => a.status === 'due_soon').length, color: '#eab308' },
    { name: 'Overdue', value: assets.filter(a => a.status === 'overdue').length, color: '#ef4444' },
  ].filter(d => d.value > 0)

  // Assets by category for bar chart
  const categoryMap = {}
  assets.forEach(a => {
    categoryMap[a.category] = (categoryMap[a.category] || 0) + 1
  })
  const categoryData = Object.entries(categoryMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  // Work orders by priority
  const priorityData = [
    { name: 'High', value: workOrderList.filter(w => w.priority === 'high' && w.status === 'pending').length, color: '#ef4444' },
    { name: 'Medium', value: workOrderList.filter(w => w.priority === 'medium' && w.status === 'pending').length, color: '#eab308' },
    { name: 'Completed', value: workOrderList.filter(w => w.status === 'completed').length, color: '#22c55e' },
  ]

  return (
    <div className="space-y-8">

      {/* Row 1 — Pie + Priority */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Asset health pie */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Asset health breakdown</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [value + ' assets', name]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Work order priority */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Work order status</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={priorityData} barSize={48}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {priorityData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 2 — Assets by category */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Assets by category</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={categoryData} barSize={36}>
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Row 3 — Key insights */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Key insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-red-50 rounded-lg p-4 border border-red-100">
            <p className="text-sm font-medium text-red-800">Most critical category</p>
            <p className="text-lg font-bold text-red-900 mt-1">
              {categoryData[0]?.name || 'N/A'}
            </p>
            <p className="text-xs text-red-600 mt-1">{categoryData[0]?.count} assets to maintain</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
            <p className="text-sm font-medium text-blue-800">Maintenance coverage</p>
            <p className="text-lg font-bold text-blue-900 mt-1">
              {assets.length > 0
                ? Math.round((assets.filter(a => a.status === 'healthy').length / assets.length) * 100)
                : 0}%
            </p>
            <p className="text-xs text-blue-600 mt-1">Assets currently healthy</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 border border-green-100">
            <p className="text-sm font-medium text-green-800">Work orders resolved</p>
            <p className="text-lg font-bold text-green-900 mt-1">
              {workOrderList.filter(w => w.status === 'completed').length}
            </p>
            <p className="text-xs text-green-600 mt-1">Completed so far</p>
          </div>
        </div>
      </div>

    </div>
  )
}
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { completeWorkOrder, getWorkOrders } from '../api'
import Pagination from './Pagination'
import { useCategoryFilter } from '../context/CategoryContext'
import toast from 'react-hot-toast'
import { useProject } from '../context/ProjectContext'


export default function WorkOrders() {
  const [filter, setFilter] = useState('all')
  const [completingId, setCompletingId] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const { activeProject } = useProject()
  const projectId = activeProject?.id
  const queryClient = useQueryClient()

  const { selectedCategories } = useCategoryFilter()

  const { data, isLoading } = useQuery({
    queryKey: ['workorders', currentPage, filter, selectedCategories, projectId],
    queryFn: () => getWorkOrders({
      page: currentPage, limit: 20, status: 'pending',
      priority: filter !== 'all' ? filter : undefined,
      categories: selectedCategories,
      projectId,
    }),
    enabled: !!projectId,
    keepPreviousData: true,
  })

  const workOrders = data?.data?.workOrders || []
  const pagination = data?.data?.pagination || null

  const completeMutation = useMutation({
    mutationFn: completeWorkOrder,
    onMutate: (id) => {
      setCompletingId(id)
    },
    onSuccess: () => {
      setCompletingId(null)
      queryClient.invalidateQueries(['workorders'])
      queryClient.invalidateQueries(['workorders-analytics'])
      queryClient.invalidateQueries(['assets'])
      queryClient.invalidateQueries(['asset-stats'])
      queryClient.invalidateQueries(['stats'])
      toast.success('Work order completed! Asset status updated to healthy.')
    },
    onError: () => {
      setCompletingId(null)
      toast.error('Failed to complete work order. Try again.')
    }
  })

  const handleFilterChange = (f) => {
    setFilter(f)
    setCurrentPage(1)
  }

  const priorityConfig = {
    high: 'bg-red-100 text-red-800 border-red-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-green-100 text-green-800 border-green-200',
  }

  return (
    <div>
      {/* Filter buttons */}
      <div className="flex gap-2 mb-4">
        {['all', 'high', 'medium'].map(f => (
          <button
            key={f}
            onClick={() => handleFilterChange(f)}
            className={`px-4 py-1.5 rounded-full text-sm cursor-pointer font-medium transition-colors
              ${filter === f
                ? 'bg-gray-800 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Count */}
      {pagination && (
        <p className="text-xs text-gray-400 mb-4">
          {pagination.total} pending work orders
        </p>
      )}

      {/* Work order list */}
      {isLoading ? (
        <p className="text-gray-400 text-sm py-8 text-center">Loading work orders...</p>
      ) : (
        <>
          <div className="space-y-3">
            {workOrders.length === 0 && (
              <p className="text-gray-400 text-sm py-8 text-center">No work orders found.</p>
            )}
            {workOrders.map(wo => (
              <div key={wo.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1 mr-4 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded border font-medium whitespace-nowrap ${priorityConfig[wo.priority]}`}>
                        {wo.priority.toUpperCase()}
                      </span>
                      <span className="text-xs text-gray-400">#{wo.id}</span>
                    </div>
                    <h3 className="font-medium text-gray-800 text-sm truncate" title={wo.title}>
                      {wo.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      {wo.category} · {wo.location || 'Unknown location'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Due: {wo.due_date ? new Date(wo.due_date).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <button
                    onClick={() => completeMutation.mutate(wo.id)}
                    disabled={completingId === wo.id}
                    className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 whitespace-nowrap cursor-pointer"
                  >
                    {completingId === wo.id ? 'Saving...' : 'Complete'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <Pagination
            pagination={pagination}
            onPageChange={(p) => setCurrentPage(p)}
          />
        </>
      )}
    </div>
  )
}
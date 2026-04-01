import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAssets, getWorkOrders, getStats, generateWorkOrders, runMaintenanceCheck, getCategories, getAssetStats } from './api'
import CategoryConfigModal from './components/CategoryConfigModal'
import CategoryDropdown from './components/CategoryDropdown'
import StatsCard from './components/StatsCard'
import AssetCard from './components/AssetCard'
import WorkOrders from './components/WorkOrders'
import Analytics from './components/Analytics'
import Pagination from './components/Pagination'
import UploadIFC from './components/UploadIFC'
import toast from 'react-hot-toast'
import { useProject } from './context/ProjectContext'
import { useCategoryFilter } from './context/CategoryContext'
import { getAllWorkOrdersForExport } from './api'
import ProjectSwitcher from './components/ProjectSwitcher'

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1);
  const queryClient = useQueryClient()

  const { loadForProject, selectedCategories, isFiltered, openConfig, clearAll } = useCategoryFilter()

  const { activeProject, isValidating, registerCategoryLoader } = useProject()
  const projectId = activeProject?.id

  const { data: assetsData, isLoading: assetsLoading } = useQuery({
    queryKey: ['assets', currentPage, statusFilter, categoryFilter, selectedCategories, projectId],
    queryFn: () => getAssets({
      page: currentPage, limit: 20, projectId,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      category: categoryFilter !== 'all' ? categoryFilter : undefined,
      categories: selectedCategories,
    }),
    enabled: !!projectId,
    keepPreviousData: true,
  })

  const { data: assetStatsData } = useQuery({
    queryKey: ['asset-stats', selectedCategories, projectId],
    queryFn: () => getAssetStats({ categories: selectedCategories, projectId }),
    enabled: !!projectId,
  })

  const { data: categoriesData } = useQuery({
    queryKey: ['categories', projectId],
    queryFn: () => getCategories({ projectId }),
    enabled: !!projectId,
  })

  const { data: workOrdersData, isLoading: woLoading } = useQuery({
    queryKey: ['workorders'],
    queryFn: getWorkOrders,
  })

  const { data: statsData } = useQuery({
    queryKey: ['stats', selectedCategories, projectId],
    queryFn: () => getStats({ categories: selectedCategories, projectId }),
    enabled: !!projectId,
  })

  const generateMutation = useMutation({
    mutationFn: () => generateWorkOrders({ categories: selectedCategories, projectId }),
    onSuccess: (data) => {
      const result = data?.data
      queryClient.invalidateQueries(['workorders'])
      queryClient.invalidateQueries(['workorders-analytics'])
      queryClient.invalidateQueries(['stats'])
      queryClient.invalidateQueries(['asset-stats'])
      if (result?.generated === 0) {
        toast('No new work orders needed — all assets already have pending orders.', {
          icon: 'ℹ️',
        })
      } else {
        toast.success(`${result?.generated} work orders generated successfully!`)
      }
    },
    onError: () => toast.error('Failed to generate work orders. Try again.')
  })

  const checkMutation = useMutation({
    mutationFn: () => runMaintenanceCheck({ categories: selectedCategories, projectId }),
    onSuccess: (data) => {
      const result = data?.data
      queryClient.invalidateQueries(['assets'])
      queryClient.invalidateQueries(['stats'])
      queryClient.invalidateQueries(['asset-stats'])
      toast.success(
        result
          ? `Check complete — ${result.overdue} overdue, ${result.dueSoon} due soon, ${result.healthy} healthy`
          : 'Maintenance check completed!'
      )
    },
    onError: () => toast.error('Maintenance check failed. Try again.')
  })

  const assets = assetsData?.data?.assets || [];
  const pagination = assetsData?.data?.pagination || null;
  const stats = statsData?.data || {}

  const handleStatusFilter = (s) => { setStatusFilter(s); setCurrentPage(1); };
  const handleCategoryFilter = (e) => { setCategoryFilter(e.target.value); setCurrentPage(1); };

  // Compute asset stats
  const assetStats = assetStatsData?.data || {}
  const totalAssets = parseInt(assetStats.total) || 0
  const overdue = parseInt(assetStats.overdue) || 0
  const dueSoon = parseInt(assetStats.due_soon) || 0
  const healthy = parseInt(assetStats.healthy) || 0

  // Get unique categories
  const categories = [
    'all',
    ...(isFiltered
      ? (categoriesData?.data || []).filter(c => selectedCategories.includes(c))
      : (categoriesData?.data || []))
  ]

  const tabs = ['dashboard', 'assets', 'work orders', 'analytics', 'upload']

  // Filter assets
  const filteredAssets = assets.filter(a => {
    const categoryMatch = categoryFilter === 'all' || a.category === categoryFilter
    const statusMatch = statusFilter === 'all' || a.status === statusFilter
    return categoryMatch && statusMatch
  })

  useEffect(() => {
    setCategoryFilter('all')
    setCurrentPage(1)
  }, [selectedCategories])

  useEffect(() => {
    registerCategoryLoader(loadForProject)
  }, [loadForProject])

  if (isValidating) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900">BIM Maintenance System</h1>
            <p className="text-xs text-gray-500 mt-0.5">Preventive Maintenance Platform</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={openConfig}
              className={`text-sm px-4 py-2 rounded-lg font-medium cursor-pointer transition-colors border
                ${isFiltered
                  ? 'bg-purple-600 hover:bg-purple-700 text-white border-transparent'
                  : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200'}`}
            >
              {isFiltered ? `Categories (${selectedCategories.length})` : 'Configure Categories'}
            </button>
            <button
              onClick={() => checkMutation.mutate()}
              disabled={checkMutation.isPending || !activeProject}
              className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 cursor-pointer"
            >
              {checkMutation.isPending ? 'Running...' : 'Run Check'}
            </button>
            <button
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending || !activeProject}
              className="text-sm bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 cursor-pointer"
            >
              {generateMutation.isPending ? 'Generating...' : 'Generate Work Orders'}
            </button>
            <button
              onClick={() => {
                if (!activeProject) return
                const url = getAllWorkOrdersForExport({ projectId, categories: selectedCategories })
                window.open(url, '_blank')
                toast.success('PDF export started!')
              }}
              disabled={!activeProject}
              className="text-sm bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Export PDF
            </button>
            <ProjectSwitcher />
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="max-w-7xl mx-auto flex gap-6">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 text-sm font-medium cursor-pointer capitalize border-b-2 transition-colors
                ${activeTab === tab
                  ? 'border-gray-800 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'upload' && (
          <div className="w-full">
            <h2 className="text-lg font-semibold text-gray-800 mb-6">Upload IFC File</h2>
            <UploadIFC />
          </div>
        )}
        {activeTab !== 'upload' && !activeProject && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-5xl mb-4">🏗️</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">No project selected</h2>
            <p className="text-gray-500 text-sm mb-6">
              Upload an IFC file to create your first project, or select an existing one from the dropdown above.
            </p>
            <button
              onClick={() => setActiveTab('upload')}
              className="bg-gray-800 hover:bg-gray-900 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer"
            >
              Upload IFC file
            </button>
          </div>
        )}
        {activeProject && (
          <>
            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && (
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-6">Overview</h2>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <StatsCard title="Total Assets" value={totalAssets} subtitle="From IFC model" color="blue" />
                  <StatsCard title="Overdue" value={overdue} subtitle="Need immediate action" color="red" />
                  <StatsCard title="Due Soon" value={dueSoon} subtitle="Within 14 days" color="yellow" />
                  <StatsCard title="Healthy" value={healthy} subtitle="Up to date" color="green" />
                </div>

                {/* Work order stats */}
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Work Orders</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <StatsCard title="Pending" value={stats.pending} subtitle="Awaiting action" color="yellow" />
                  <StatsCard title="High Priority" value={stats.high_priority} subtitle="Overdue assets" color="red" />
                  <StatsCard title="Medium Priority" value={stats.medium_priority} subtitle="Due soon assets" color="blue" />
                  <StatsCard title="Completed" value={stats.completed} subtitle="Resolved orders" color="green" />
                </div>

                {/* Recent overdue assets */}
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Most Urgent Assets</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {assets
                    .filter(a => a.status === 'overdue')
                    .slice(0, 6)
                    .map(asset => (
                      <AssetCard key={asset.id} asset={asset} />
                    ))}
                </div>
              </div>
            )}

            {/* Assets Tab */}
            {activeTab === 'assets' && (
              <div>
                <div className="flex flex-wrap gap-3 mb-6">
                  {/* Status filter */}
                  <div className="flex gap-2">
                    {['all', 'overdue', 'due_soon', 'healthy'].map(s => (
                      <button
                        key={s}
                        onClick={() => handleStatusFilter(s)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors
                          ${statusFilter === s
                            ? 'bg-gray-800 text-white'
                            : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                      >
                        {s.replace('_', ' ').charAt(0).toUpperCase() + s.replace('_', ' ').slice(1)}
                      </button>
                    ))}
                  </div>

                  {/* Category filter */}
                  <CategoryDropdown
                    categories={categories}
                    categoryFilter={categoryFilter}
                    onFilterChange={(val) => {
                      setCategoryFilter(val)
                      setCurrentPage(1)
                    }}
                  />

                  <span className="text-xs text-gray-400 self-center">
                    {pagination?.total ?? 0} {categoryFilter !== 'all' || statusFilter !== 'all' ? 'matching' : ''} assets
                  </span>
                </div>

                {assetsLoading ? (
                  <p className="text-gray-400 text-sm">Loading assets...</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredAssets.slice(0, 100).map(asset => (
                      <AssetCard key={asset.id} asset={asset} />
                    ))}
                    {filteredAssets.length > 100 && (
                      <p className="text-xs text-gray-400 col-span-full text-center pt-4">
                        Showing 100 of {filteredAssets.length} assets
                      </p>
                    )}
                  </div>
                )}
                <Pagination
                  pagination={pagination}
                  onPageChange={(p) => setCurrentPage(p)}
                />
              </div>
            )}

            {/* Work Orders Tab */}
            {activeTab === 'work orders' && (
              <div>
                {woLoading ? (
                  <p className="text-gray-400 text-sm">Loading work orders...</p>
                ) : (
                  <WorkOrders />
                )}
              </div>
            )}

            {activeTab === 'analytics' && (
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-6">Analytics</h2>
                <Analytics />
              </div>
            )}
          </>
        )}
      </main>
      <CategoryConfigModal />
    </div>
  )
}
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getCategories } from '../api'
import { useCategoryFilter } from '../context/CategoryContext'
import { useProject } from '../context/ProjectContext'
import toast from 'react-hot-toast'

export default function CategoryConfigModal() {
  const { isConfigOpen, closeConfig, selectedCategories, setSelectedCategories, clearAll } = useCategoryFilter()
  const { activeProject } = useProject()
  const [localSelected, setLocalSelected] = useState([])

  const projectId = activeProject?.id

  const { data: categoriesData, isLoading } = useQuery({
    queryKey: ['categories', projectId],
    queryFn: () => getCategories({ projectId }),
    enabled: isConfigOpen && !!projectId,
  })

  const allCategories = categoriesData?.data || []

  // Sync local state when modal opens
  useEffect(() => {
    if (isConfigOpen && allCategories.length > 0) {
      setLocalSelected(selectedCategories.length > 0 ? selectedCategories : [...allCategories])
    }
  }, [isConfigOpen, allCategories])

  const toggle = (category) => {
    setLocalSelected(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  const handleSelectAll = () => setLocalSelected([...allCategories])
  const handleClearAll = () => setLocalSelected([])

  const handleApply = () => {
    if (localSelected.length === allCategories.length) {
      clearAll()
      toast.success('Showing all categories across the app.')
    } else {
      setSelectedCategories(localSelected)
      toast.success(
        `${localSelected.length} ${localSelected.length === 1 ? 'category' : 'categories'} selected for management.`
      )
    }
    closeConfig()
  }

  if (!isConfigOpen) return null

  const categoryColors = {
    FlowTerminal: 'bg-blue-100 text-blue-800',
    BuildingElementProxy: 'bg-purple-100 text-purple-800',
    Door: 'bg-amber-100 text-amber-800',
    Window: 'bg-cyan-100 text-cyan-800',
    Slab: 'bg-gray-100 text-gray-800',
    Member: 'bg-orange-100 text-orange-800',
    Plate: 'bg-pink-100 text-pink-800',
    Railing: 'bg-green-100 text-green-800',
    Column: 'bg-red-100 text-red-800',
    StairFlight: 'bg-indigo-100 text-indigo-800',
    FurnishingElement: 'bg-yellow-100 text-yellow-800',
    WallStandardCase: 'bg-stone-100 text-stone-800',
  }

  const getColor = (cat) => categoryColors[cat] || 'bg-gray-100 text-gray-700'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={(e) => e.target === e.currentTarget && closeConfig()}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Configure asset categories</h2>
          <p className="text-sm text-gray-500 mt-1">
            Select the categories you want to track. Only selected categories will appear across the entire app.
          </p>
        </div>

        {/* Select all / clear all */}
        <div className="px-6 py-3 border-b border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {localSelected.length} of {allCategories.length} selected
          </span>
          <div className="flex gap-3">
            <button
              onClick={handleSelectAll}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
            >
              Select all
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={handleClearAll}
              className="text-xs text-gray-500 hover:text-gray-700 font-medium cursor-pointer"
            >
              Clear all
            </button>
          </div>
        </div>

        {/* Category list */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <p className="text-sm text-gray-400 text-center py-8">Loading categories...</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {allCategories.map(category => {
                const isSelected = localSelected.includes(category)
                return (
                  <button
                    key={category}
                    onClick={() => toggle(category)}
                    className={`flex items-center cursor-pointer gap-3 p-3 rounded-xl border-2 text-left transition-all
                      ${isSelected
                        ? 'border-gray-800 bg-gray-50'
                        : 'border-gray-100 hover:border-gray-200'}`}
                  >
                    {/* Checkbox */}
                    <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 transition-colors
                      ${isSelected ? 'bg-gray-800' : 'border-2 border-gray-300'}`}
                    >
                      {isSelected && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    {/* Label */}
                    <div className="min-w-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getColor(category)}`}>
                        {category}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center">
          <button
            onClick={closeConfig}
            className="text-sm text-gray-500 hover:text-gray-700 font-medium cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={localSelected.length === 0}
            className="text-sm bg-gray-800 hover:bg-gray-900 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            Apply ({localSelected.length} categories)
          </button>
        </div>

      </div>
    </div>
  )
}
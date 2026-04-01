import { useState, useRef, useEffect } from 'react'
import { useCategoryFilter } from '../context/CategoryContext'

export default function CategoryDropdown({ categories, categoryFilter, onFilterChange }) {
  const { selectedCategories } = useCategoryFilter()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (value) => {
    onFilterChange(value)
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="flex items-center gap-2 text-sm border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
      >
        <span className="max-w-32 truncate">
          {categoryFilter === 'all' ? 'All categories' : categoryFilter}
        </span>
        <svg
          className={`w-3 h-3 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1 w-64 bg-white rounded-xl border border-gray-200 shadow-lg z-50">
          <div className="p-2">
            <p className="text-xs text-gray-400 px-2 py-1.5 font-medium">
              {selectedCategories.length > 0 ? 'Configured categories' : 'All categories'}
            </p>

            {/* All categories option */}
            <div
              onClick={() => handleSelect('all')}
              className={`flex items-center px-3 py-2.5 rounded-lg cursor-pointer transition-colors
                ${categoryFilter === 'all'
                  ? 'bg-gray-800 text-white'
                  : 'hover:bg-gray-50 text-gray-700'}`}
            >
              <p className="text-sm font-medium">All categories</p>
            </div>

            {/* Individual categories */}
            {categories.filter(c => c !== 'all').map(category => (
              <div
                key={category}
                onClick={() => handleSelect(category)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors
                  ${categoryFilter === category
                    ? 'bg-gray-800 text-white'
                    : 'hover:bg-gray-50 text-gray-700'}`}
              >
                <p className="text-sm font-medium truncate">{category}</p>
                {categoryFilter === category && (
                  <svg className="w-3.5 h-3.5 shrink-0 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            ))}

            {categories.filter(c => c !== 'all').length === 0 && (
              <p className="text-xs text-gray-400 px-2 py-3 text-center">
                No categories found
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
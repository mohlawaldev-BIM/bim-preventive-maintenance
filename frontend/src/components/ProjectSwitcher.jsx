import { useState, useRef, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useProject } from '../context/ProjectContext'
import { useCategoryFilter } from '../context/CategoryContext'
import api from '../api'
import toast from 'react-hot-toast'

export default function ProjectSwitcher() {
  const { activeProject, setActiveProject } = useProject()
  const { clearAll } = useCategoryFilter()
  const queryClient = useQueryClient()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  const { data, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get('/projects'),
  })

  const projects = data?.data || []

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

  const handleSwitch = (project) => {
    if (activeProject?.id === project.id) { setIsOpen(false); return }
    setActiveProject(project)
    queryClient.invalidateQueries()
    setIsOpen(false)
    toast.success(`Switched to "${project.name}"`)
  }

  const handleDelete = async (e, projectId) => {
    e.stopPropagation()
    if (!confirm('Delete this project and all its data?')) return
    try {
      await api.delete(`/projects/${projectId}`)
      if (activeProject?.id === projectId) {
        setActiveProject(null)
        clearAll()
      }
      queryClient.invalidateQueries(['projects'])
      queryClient.invalidateQueries()
      toast.success('Project deleted')
    } catch {
      toast.error('Failed to delete project')
    }
  }

  if (isLoading) return null

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="flex items-center gap-2 text-sm border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
      >
        <span className="w-2 h-2 rounded-full bg-green-500"></span>
        <span className="max-w-32 truncate">
          {activeProject ? activeProject.name : 'Select project'}
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
        <div className="absolute right-0 top-full mt-1 w-72 bg-white rounded-xl border border-gray-200 shadow-lg z-50">
          <div className="p-2">
            <p className="text-xs text-gray-400 px-2 py-1.5 font-medium">Your projects</p>

            {projects.length === 0 && (
              <p className="text-xs text-gray-400 px-2 py-3 text-center">
                No projects yet — upload an IFC file to get started
              </p>
            )}

            {projects.map(project => (
              <div
                key={project.id}
                onClick={() => handleSwitch(project)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors
                  ${activeProject?.id === project.id
                    ? 'bg-gray-800 text-white'
                    : 'hover:bg-gray-50 text-gray-700'}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{project.name}</p>
                  <p className={`text-xs mt-0.5 ${activeProject?.id === project.id ? 'text-gray-300' : 'text-gray-400'}`}>
                    {project.asset_count} assets · {project.pending_orders} pending orders
                  </p>
                </div>
                <button
                  onClick={(e) => handleDelete(e, project.id)}
                  className={`ml-2 text-xs px-2 py-1 rounded transition-colors shrink-0
                    ${activeProject?.id === project.id
                      ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                      : 'text-gray-300 hover:text-red-600 hover:bg-red-50'}`}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
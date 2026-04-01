import { createContext, useContext, useState, useEffect } from 'react'

const CategoryContext = createContext()

// Helper to get categories for a specific project
const loadCategoriesForProject = (projectId) => {
  if (!projectId) return []
  try {
    const saved = localStorage.getItem(`bim-categories-${projectId}`)
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

// Helper to save categories for a specific project
const saveCategoriesToProject = (projectId, categories) => {
  if (!projectId) return
  localStorage.setItem(`bim-categories-${projectId}`, JSON.stringify(categories))
}

export function CategoryProvider({ children }) {
  const [selectedCategories, setSelectedCategories] = useState([])
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [currentProjectId, setCurrentProjectId] = useState(null)

  // Called by ProjectContext when active project changes
  const loadForProject = (projectId) => {
    setCurrentProjectId(projectId)
    const saved = loadCategoriesForProject(projectId)
    setSelectedCategories(saved)
  }

  // Save whenever categories change for current project
  useEffect(() => {
    if (currentProjectId) {
      saveCategoriesToProject(currentProjectId, selectedCategories)
    }
  }, [selectedCategories, currentProjectId])

  const isFiltered = selectedCategories.length > 0

  const isCategorySelected = (category) => {
    if (!isFiltered) return true
    return selectedCategories.includes(category)
  }

  const toggleCategory = (category) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  const selectAll = (categories) => setSelectedCategories(categories)

  const clearAll = () => setSelectedCategories([])

  const openConfig = () => setIsConfigOpen(true)
  const closeConfig = () => setIsConfigOpen(false)

  return (
    <CategoryContext.Provider value={{
      selectedCategories,
      isFiltered,
      isConfigOpen,
      isCategorySelected,
      toggleCategory,
      selectAll,
      clearAll,
      openConfig,
      closeConfig,
      setSelectedCategories,
      loadForProject,
      currentProjectId,
    }}>
      {children}
    </CategoryContext.Provider>
  )
}

export function useCategoryFilter() {
  return useContext(CategoryContext)
}
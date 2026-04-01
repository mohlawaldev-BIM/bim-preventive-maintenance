import { createContext, useContext, useState, useEffect, useRef } from 'react'
import axios from 'axios'

const ProjectContext = createContext()

export function ProjectProvider({ children }) {
  const [activeProject, setActiveProjectState] = useState(null)
  const [isValidating, setIsValidating] = useState(true)
  const loadForProjectRef = useRef(null)

  // Register the loadForProject function from CategoryContext
  const registerCategoryLoader = (fn) => {
    loadForProjectRef.current = fn
  }

  // Switch project — loads that project's saved categories automatically
  const setActiveProject = (project) => {
    setActiveProjectState(project)
    if (project && loadForProjectRef.current) {
      loadForProjectRef.current(project.id)
    } else if (!project && loadForProjectRef.current) {
      loadForProjectRef.current(null)
    }
  }

  useEffect(() => {
    const validateSavedProject = async () => {
      try {
        const saved = localStorage.getItem('bim-active-project')
        if (!saved) { setIsValidating(false); return }

        const project = JSON.parse(saved)
        const res = await axios.get('http://localhost:5000/api/projects')
        const projects = res.data
        const stillExists = projects.find(p => p.id === project.id)

        if (stillExists) {
          setActiveProjectState(project)
          // Load this project's categories after validation
          if (loadForProjectRef.current) {
            loadForProjectRef.current(project.id)
          }
        } else {
          localStorage.removeItem('bim-active-project')
        }
      } catch {
        localStorage.removeItem('bim-active-project')
      } finally {
        setIsValidating(false)
      }
    }

    validateSavedProject()
  }, [])

  useEffect(() => {
    if (activeProject) {
      localStorage.setItem('bim-active-project', JSON.stringify(activeProject))
    } else {
      localStorage.removeItem('bim-active-project')
    }
  }, [activeProject])

  return (
    <ProjectContext.Provider value={{
      activeProject,
      setActiveProject,
      isValidating,
      registerCategoryLoader,
    }}>
      {children}
    </ProjectContext.Provider>
  )
}

export function useProject() {
  return useContext(ProjectContext)
}
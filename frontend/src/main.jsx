import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CategoryProvider } from './context/CategoryContext'
import { ProjectProvider } from './context/ProjectContext'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.jsx'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ProjectProvider>
        <CategoryProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                fontSize: '13px',
                borderRadius: '10px',
                padding: '12px 16px',
              },
              success: {
                iconTheme: {
                  primary: '#16a34a',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#dc2626',
                  secondary: '#fff',
                },
              },
            }}
          />
          <App />
        </CategoryProvider>
      </ProjectProvider>
    </QueryClientProvider>
  </StrictMode>,
)
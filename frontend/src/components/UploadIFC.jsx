import { useState, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import api from '../api'
import { useCategoryFilter } from '../context/CategoryContext'
import { useProject } from '../context/ProjectContext'

export default function UploadIFC() {
  const { openConfig, clearAll } = useCategoryFilter()  
  const [isDragging, setIsDragging] = useState(false)
  const [status, setStatus] = useState(null)
  const [message, setMessage] = useState('')
  const [fileName, setFileName] = useState(null)
  const [fileSize, setFileSize] = useState(null)
  const [assetCount, setAssetCount] = useState(0)
  const [pollCount, setPollCount] = useState(0)
  const fileInputRef = useRef(null)
  const queryClient = useQueryClient()
  const pollRef = useRef(null)
  const { setActiveProject } = useProject()

  const formatSize = (bytes) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  const startPolling = (projectId, projectName) => {
    let attempts = 0

    pollRef.current = setInterval(async () => {
        attempts++
        setPollCount(attempts)

        try {
          const res = await api.get('/upload/status')
          const { assetCount: count, isParsing } = res.data

          setAssetCount(count)

          // Still parsing — keep waiting
          if (isParsing) {
              setMessage(`Parser is running... ${count > 0 ? `(${count} assets found so far)` : ''}`)
              return
          }

          // Parser finished
          if (!isParsing && count > 0) {
              clearInterval(pollRef.current)
              setStatus('done')
              setMessage(`Successfully imported ${count} assets!`)

              setActiveProject({ id: projectId, name: projectName })

              queryClient.invalidateQueries(['projects'])
              queryClient.invalidateQueries(['assets'])
              queryClient.invalidateQueries(['assets-analytics'])
              queryClient.invalidateQueries(['workorders'])
              queryClient.invalidateQueries(['workorders-analytics'])
              queryClient.invalidateQueries(['stats'])
              queryClient.invalidateQueries(['asset-stats'])
              queryClient.invalidateQueries(['categories'])
              clearAll()
              setTimeout(() => openConfig(), 1500)
              return
          }

          // Parser finished but no assets found
          if (!isParsing && count === 0 && attempts > 3) {
              clearInterval(pollRef.current)
              setStatus('error')
              setMessage('Parsing finished but no assets were found. Try a different IFC file.')
          }

          // Timeout after 2 minutes
          if (attempts > 40) {
              clearInterval(pollRef.current)
              setStatus('error')
              setMessage('Parsing is taking too long. Check your backend terminal for errors.')
          }

        } catch {
        // Keep polling on network hiccup
        }
    }, 3000)
  }

  const handleFile = async (file) => {
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.ifc')) {
      setStatus('error')
      setMessage('Please upload a valid .ifc file')
      return
    }

    // Clear previous poll if any
    if (pollRef.current) clearInterval(pollRef.current)

    setFileName(file.name)
    setFileSize(formatSize(file.size))
    setStatus('uploading')
    setMessage('Uploading file to server...')
    setAssetCount(0)

    const formData = new FormData()
    formData.append('ifcFile', file)

    try {
      const response = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
      })
      const { projectId, projectName } = response.data

      setStatus('parsing')
      setMessage('File uploaded! Assets are now being extracted...')
      startPolling(projectId, projectName)

    } catch (err) {
        if (err.response?.status === 409) {
        setStatus('error')
        setMessage('Another file is currently being parsed. Please wait and try again.')
        } else {
            setStatus('error')
            setMessage(err.response?.data?.error || 'Upload failed. Please try again.')
        }
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  const handleReset = () => {
    if (pollRef.current) clearInterval(pollRef.current)
    setStatus(null)
    setMessage('')
    setFileName(null)
    setFileSize(null)
    setAssetCount(0)
    setPollCount(0)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const statusConfig = {
    uploading: {
      bg: 'bg-blue-50 border-blue-200',
      text: 'text-blue-700',
      icon: '⏳',
    },
    parsing: {
      bg: 'bg-yellow-50 border-yellow-200',
      text: 'text-yellow-700',
      icon: '⚙️',
    },
    done: {
      bg: 'bg-green-50 border-green-200',
      text: 'text-green-700',
      icon: '✅',
    },
    error: {
      bg: 'bg-red-50 border-red-200',
      text: 'text-red-700',
      icon: '❌',
    },
  }

  const config = status ? statusConfig[status] : null

  return (
    <div className="space-y-6 w-full">

      {/* Upload card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-800 mb-1">Upload IFC File</h3>
        <p className="text-xs text-gray-500 mb-4">
          Upload any IFC file — the system will automatically detect and extract all maintainable assets
        </p>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => status !== 'parsing' && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-10 text-center transition-colors
            ${status === 'parsing' ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
            ${isDragging
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
        >
          <div className="text-4xl mb-3">
            {status === 'done' ? '🏗️' : status === 'parsing' ? '⚙️' : '📂'}
          </div>
          <p className="text-sm font-medium text-gray-700">
            {fileName || 'Drop your IFC file here'}
          </p>
          {fileSize && (
            <p className="text-xs text-gray-400 mt-1">{fileSize}</p>
          )}
          {!fileName && (
            <p className="text-xs text-gray-400 mt-1">or click to browse — .ifc files only</p>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".ifc"
            onChange={(e) => handleFile(e.target.files[0])}
            className="hidden"
          />
        </div>

        {/* Status message */}
        {status && config && (
          <div className={`mt-4 px-4 py-3 rounded-lg border text-sm ${config.bg}`}>
            <div className="flex items-center gap-2">
              <span className="text-lg">{config.icon}</span>
              <span className={`font-medium ${config.text}`}>{message}</span>
            </div>

            {/* Parsing progress indicator */}
            {status === 'parsing' && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-yellow-600 mb-1">
                  <span>Extracting assets...</span>
                  <span>{assetCount > 0 ? `${assetCount} found so far` : `Checking... (${pollCount * 3}s)`}</span>
                </div>
                <div className="w-full bg-yellow-100 rounded-full h-1.5">
                  <div
                    className="bg-yellow-400 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((pollCount / 20) * 100, 95)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Done actions */}
            {status === 'done' && (
              <div className="mt-3 flex gap-2">
                <button
                  onClick={handleReset}
                  className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors  cursor-pointer"
                >
                  Upload another file
                </button>
                <button
                  onClick={() => queryClient.invalidateQueries()}
                  className="text-xs border border-green-300 text-green-700 hover:bg-green-50 px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer"
                >
                  Refresh dashboard
                </button>
              </div>
            )}

            {/* Error reset */}
            {status === 'error' && (
              <button
                onClick={handleReset}
                className="mt-3 text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
              >
                Try again
              </button>
            )}
          </div>
        )}
      </div>

      {/* Info card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-800 mb-3">How it works</h3>
        <div className="space-y-3">
          {[
            { step: '1', title: 'Upload your IFC file', desc: 'Drag and drop or click to browse. Any IFC 2x3 or IFC4 file works.' },
            { step: '2', title: 'Automatic asset detection', desc: 'The system scans the file and finds all maintainable elements — HVAC, doors, windows, equipment and more.' },
            { step: '3', title: 'Click "Run Check" button above', desc: 'This will initiate the maintenance check for all detected assets.' },
            { step: '4', title: 'Maintenance schedules assigned', desc: 'Each asset gets a maintenance interval based on its category automatically.' },
            { step: '5', title: 'Dashboard updates', desc: 'Your asset list, work orders and analytics all refresh with the new data.' },
          ].map(item => (
            <div key={item.step} className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-gray-800 text-white text-xs flex items-center justify-center shrink-0 mt-0.5">
                {item.step}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">{item.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
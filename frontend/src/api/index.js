import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
})

export const getAssets = (params = {}) => {
  const query = new URLSearchParams({
    page: params.page || 1,
    limit: params.limit || 20,
    ...(params.projectId && { projectId: params.projectId }),
    ...(params.status && { status: params.status }),
    ...(params.category && { category: params.category }),
    ...(params.categories?.length && { categories: params.categories.join(',') }),
  })
  return api.get(`/assets?${query}`)
}

export const getAssetStats = (params = {}) => {
  const query = new URLSearchParams({
    ...(params.projectId && { projectId: params.projectId }),
    ...(params.categories?.length && { categories: params.categories.join(',') }),
  })
  return api.get(`/assets/stats?${query}`)
}

export const getCategories = (params = {}) => {
  const query = new URLSearchParams({
    ...(params.projectId && { projectId: params.projectId }),
  })
  return api.get(`/assets/categories?${query}`)
}

export const getWorkOrders = (params = {}) => {
  const query = new URLSearchParams({
    page: params.page || 1,
    limit: params.limit || 20,
    status: params.status || 'pending',
    ...(params.projectId && { projectId: params.projectId }),
    ...(params.priority && { priority: params.priority }),
    ...(params.categories?.length && { categories: params.categories.join(',') }),
  })
  return api.get(`/workorders?${query}`)
}

export const getAllWorkOrders = (params = {}) => {
  const query = new URLSearchParams({
    ...(params.projectId && { projectId: params.projectId }),
    ...(params.categories?.length && { categories: params.categories.join(',') }),
  })
  return api.get(`/workorders/all?${query}`)
}

export const getStats = (params = {}) => {
  const query = new URLSearchParams({
    ...(params.projectId && { projectId: params.projectId }),
    ...(params.categories?.length && { categories: params.categories.join(',') }),
  })
  return api.get(`/workorders/stats?${query}`)
}

export const runMaintenanceCheck = (params = {}) => {
  const query = new URLSearchParams({
    ...(params.projectId && { projectId: params.projectId }),
    ...(params.categories?.length && { categories: params.categories.join(',') }),
  })
  return api.get(`/assets/maintenance/run?${query}`)
}

export const generateWorkOrders = (params = {}) => {
  const query = new URLSearchParams({
    ...(params.projectId && { projectId: params.projectId }),
    ...(params.categories?.length && { categories: params.categories.join(',') }),
  })
  return api.post(`/workorders/generate?${query}`)
}

export const completeWorkOrder = (id) => api.patch(`/workorders/${id}/complete`)

export const getAllWorkOrdersForExport = (params = {}) => {
  const query = new URLSearchParams({
    ...(params.projectId && { projectId: params.projectId }),
    ...(params.categories?.length && { categories: params.categories.join(',') }),
  })
  return `http://localhost:5000/api/export/workorders/pdf?${query}`
}

export default api
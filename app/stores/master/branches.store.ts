import { defineStore } from 'pinia'
import type { Branch } from '~/types/master'

export const useBranchStore = defineStore('branch-store', () => {
  // State 1: Untuk Halaman Master Branch (Paginasi)
  const branches = ref<Branch[]>([]) 
  const totalItems = ref(0)
  
  // State 2: KHUSUS UNTUK DROPDOWN (Semua Data)
  const branchList = ref<Branch[]>([]) 

  const loading = ref(false)

  // 1. Fetch Paginasi (Dipakai di page branches.vue)
  async function fetchBranches(params: { page: number; per_page: number; q?: string }) {
    loading.value = true
    try {
      const response = await useApi<any>('/api/v1/branches', { query: params })
      branches.value = response.data
      totalItems.value = response.meta?.total || 0
    } finally {
      loading.value = false
    }
  }

  // 2. Fetch List (Dipakai di Dropdown page floors.vue)
  async function fetchBranchList() {
    // Kalau sudah ada data, gak usah fetch lagi (hemat request)
    if (branchList.value.length > 0) return

    try {
      // Ambil 100 data agar masuk semua di dropdown
      const response = await useApi<any>('/api/v1/branches', { 
        query: { per_page: 100 } 
      })
      branchList.value = response.data
    } catch (e) {
      console.error(e)
    }
  }

  // ... (create, update, delete biarkan sama) ...
  async function createBranch(payload: Partial<Branch>) {
      const { data } = await useApi<{ data: Branch }>('/api/v1/branches', { method: 'POST', body: payload })
      // Reset branchList biar kalau ada data baru, dropdown di-refresh nanti
      branchList.value = [] 
      return data
  }
  
  async function updateBranch(id: number, payload: Partial<Branch>) {
      const { data } = await useApi<{ data: Branch }>(`/api/v1/branches/${id}`, { method: 'PUT', body: payload })
      branchList.value = [] // Reset cache
      const index = branches.value.findIndex(b => b.id === id)
      if (index !== -1) branches.value[index] = data
      return data
  }

  async function deleteBranch(id: number) {
      await useApi(`/api/v1/branches/${id}`, { method: 'DELETE' })
      branchList.value = [] // Reset cache
  }

  return {
    branches,
    branchList, // <--- JANGAN LUPA DI RETURN
    totalItems,
    loading,
    fetchBranches,
    fetchBranchList, // <--- JANGAN LUPA DI RETURN
    createBranch,
    updateBranch,
    deleteBranch
  }
})
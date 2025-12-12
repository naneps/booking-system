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
      console.log("response.data", response.data)
      totalItems.value = response.meta?.total || 0
    } finally {
      loading.value = false
    }
  }

  // 2. Fetch List (Dipakai di Dropdown page floors.vue)
// useBranchStore.ts (relevant parts)
async function fetchBranchList(params: { q?: string; page?: number; per_page?: number } = {}) {
  // Jika ada query q, kita wajib fetch ulang. Jika tidak ada q dan branchList sudah ada -> optional skip
  if (!params.q && branchList.value.length > 0) return

  loading.value = true
  try {
    const res = await useApi<any>('/api/v1/branches', {
      query: {
        page: params.page ?? 1,
        per_page: params.per_page ?? 100,
        q: params.q ?? ''
      }
    })

    // Defensive parsing: beberapa API return { data: [...] } (paginated) atau langsung array
    const payload = res ?? {}
    // Prefer top-level data (paginated)
    let data = payload.data ?? payload // fallback

    // If payload.data itself contains data property (double nested), try that:
    if (data && data.data) data = data.data

    // Ensure array
    if (!Array.isArray(data)) data = []

    // Set branchList (reset even if empty)
    branchList.value = data

  } catch (e) {
    console.error('fetchBranchList error', e)
    // reset to empty to avoid stale items showing
    branchList.value = []
  } finally {
    loading.value = false
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
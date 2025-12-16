import { defineStore } from 'pinia'
import type { Branch } from '~/types/master'

export const useBranchStore = defineStore('branch-store', () => {
  
  // =========================================
  // STATE
  // =========================================
  
  // 1. Untuk Halaman Master Branch (Table Pagination)
  const branches = ref<Branch[]>([]) 
  const totalItems = ref(0)
  
  // 2. Untuk Global Dropdown / Switcher (Semua Data)
  const branchList = ref<Branch[]>([]) 

  // 3. Loading State Global
  const loading = ref(false)

  // 4. State Branch Aktif (Persist di Cookie)
  const branchCookie = useCookie<number | null>('selected_branch_id', {
      maxAge: 60 * 60 * 24 * 365, // 1 tahun
      path: '/'
  })

  // =========================================
  // GETTERS / COMPUTED
  // =========================================
  
  // Mengambil object Branch lengkap berdasarkan ID di cookie
  const currentBranch = computed(() => {
    if (!branchList.value.length) return null
    return branchList.value.find(b => b.id === branchCookie.value) || null
  })

  // =========================================
  // ACTIONS
  // =========================================

  /**
   * 1. FETCH PAGINATED (Untuk Halaman Master > Branches)
   */
  async function fetchBranches(params: { page: number; per_page: number; q?: string }) {
    loading.value = true
    try {
      const response = await useApi<any>('/api/v1/branches', { query: params })
      
      // Handle response structure variations
      const data = response.data?.data || response.data || []
      
      branches.value = Array.isArray(data) ? data : []
      totalItems.value = response.meta?.total || response.total || 0
    } catch (e) {
      console.error('fetchBranches error', e)
      branches.value = []
      totalItems.value = 0
    } finally {
      loading.value = false
    }
  }

  /**
   * 2. FETCH LIST (Untuk Dropdown Switcher & Global Context)
   * Logika: Fetch semua data -> Set branchList -> Auto select jika cookie kosong
   */
  async function fetchBranchList(params: { q?: string; page?: number; per_page?: number } = {}) {
    // Jika data sudah ada dan tidak sedang search, skip biar hemat API call
    if (!params.q && branchList.value.length > 0) {
        // Tetap pastikan current branch tervalidasi
        if (!branchCookie.value && branchList.value.length > 0) {
            branchCookie.value = branchList.value[0].id
        }
        return
    }

    loading.value = true
    try {
      const res = await useApi<any>('/api/v1/branches', {
        query: {
          page: params.page ?? 1,
          per_page: params.per_page ?? 100, // Ambil banyak untuk dropdown
          q: params.q ?? ''
        }
      })

      // Defensive Parsing (Jaga-jaga struktur API beda)
      const payload = res ?? {}
      let data = payload.data ?? payload 
      if (data && data.data) data = data.data // Handle nested data.data
      if (!Array.isArray(data)) data = []

      branchList.value = data

      // --- AUTO SELECT LOGIC ---
      // Jika cookie kosong atau ID di cookie tidak ditemukan di list baru,
      // Default ke branch pertama di list.
      if (branchList.value.length > 0) {
          const isCookieValid = branchList.value.some(b => b.id === branchCookie.value)
          
          if (!branchCookie.value || !isCookieValid) {
              branchCookie.value = branchList.value[0].id
          }
      }

    } catch (e) {
      console.error('fetchBranchList error', e)
      branchList.value = []
    } finally {
      loading.value = false
    }
  }

  /**
   * 3. SET BRANCH (Switching Action)
   */
  function setBranch(branchId: number) {
    branchCookie.value = branchId
    
    // Opsional: Reload window agar semua data (Booking, Reports) 
    // di-fetch ulang bersih dengan branch_id baru
    window.location.reload()
  }

  // =========================================
  // CRUD ACTIONS
  // =========================================

  async function createBranch(payload: Partial<Branch>) {
      loading.value = true
      try {
        const { data } = await useApi<any>('/api/v1/branches', { method: 'POST', body: payload })
        
        // Reset cache list agar dropdown update
        branchList.value = [] 
        await fetchBranches({ page: 1, per_page: 10 }) // Refresh table master
        
        return data
      } finally {
        loading.value = false
      }
  }
  
  async function updateBranch(id: number, payload: Partial<Branch>) {
      loading.value = true
      try {
        const { data } = await useApi<any>(`/api/v1/branches/${id}`, { method: 'PUT', body: payload })
        
        branchList.value = [] // Reset cache list
        
        // Update local state table master
        const index = branches.value.findIndex(b => b.id === id)
        if (index !== -1) branches.value[index] = data
        
        return data
      } finally {
        loading.value = false
      }
  }

  async function deleteBranch(id: number) {
      loading.value = true
      try {
        await useApi(`/api/v1/branches/${id}`, { method: 'DELETE' })
        
        branchList.value = [] // Reset cache list
        
        // Remove from local table master
        branches.value = branches.value.filter(b => b.id !== id)
        totalItems.value--

        // Safety check: Kalau branch yang dihapus adalah branch yang sedang aktif
        if (branchCookie.value === id) {
             branchCookie.value = null // Reset cookie
             window.location.reload()  // Reload untuk memaksa auto-select branch lain
        }
      } finally {
        loading.value = false
      }
  }

  return {
    // State
    branches,
    branchList,
    currentBranch, // <--- Reactive Computed
    totalItems,
    loading,

    // Actions
    fetchBranches,
    fetchBranchList,
    setBranch,     // <--- Action Switcher
    createBranch,
    updateBranch,
    deleteBranch
  }
})
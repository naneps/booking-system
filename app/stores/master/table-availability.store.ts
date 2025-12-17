import { defineStore } from 'pinia'

export interface AvailableTable {
  id: number
  name: string
  capacity: number
  status: 'available' | 'occupied'
  booking?: {
    id: number
    code: string
    customer_name: string
    party_size: number
    start_at: string
    end_at: string
    status: string
  } | null
}

export const useTableAvailabilityStore = defineStore('table-availability', () => {
  const tables = ref<AvailableTable[]>([])
  const meta = ref<any>(null)
  const loading = ref(false)
  const brancHId = useCookie('selected_branch_id', {path: '/'})

  async function checkAvailability(params: {
    floor_id?: number
    start_at: string
    end_at?: string
    duration_minutes?: number
  }) {
    loading.value = true
    try {
      const res = await useApi<any>('/api/v1/tables/availability', {
        query: {...params , branch_id: brancHId.value},
      })
      tables.value = res.data.tables
      console.log(res)
      meta.value = res.data.meta
    } finally {
      loading.value = false
    }
  }

  function reset() {
    tables.value = []
    meta.value = null
  }

  return {
    tables,
    meta,
    loading,
    checkAvailability,
    reset
  }
})

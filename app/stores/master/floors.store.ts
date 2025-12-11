import { defineStore } from 'pinia'
import type { Floor } from '~/types/master'

export const useFloorStore = defineStore('floor-store', () => {
  const floors = ref<Floor[]>([])
  const totalItems = ref(0)
  const loading = ref(false)

  // --- READ ---
  // Kita tambahkan parameter 'branch_id' biar nanti bisa filter lantai per cabang
  async function fetchFloors(params: { page: number; per_page: number; q?: string; branch_id?: number | null }) {
    loading.value = true
    try {
      const response = await useApi<any>('/api/v1/floors', {
        query: params 
      })
      
      floors.value = response.data
      totalItems.value = response.meta?.total || 0
      
    } catch (error) {
      floors.value = []
      totalItems.value = 0
    } finally {
      loading.value = false
    }
  }

  // --- CREATE ---
  async function createFloor(payload: Partial<Floor>) {
    const { data } = await useApi<{ data: Floor }>('/api/v1/floors', {
      method: 'POST',
      body: payload
    })
    return data
  }

  // --- UPDATE ---
  async function updateFloor(id: number, payload: Partial<Floor>) {
    const { data } = await useApi<{ data: Floor }>(`/api/v1/floors/${id}`, {
      method: 'PUT',
      body: payload
    })
    
    // Update state lokal biar UI langsung berubah
    const index = floors.value.findIndex(f => f.id === id)
    if (index !== -1) floors.value[index] = data
    
    return data
  }

  // --- DELETE ---
  async function deleteFloor(id: number) {
    await useApi(`/api/v1/floors/${id}`, { method: 'DELETE' })
    // Kita refresh data dari Page saja nanti
  }

  return {
    floors,
    totalItems,
    loading,
    fetchFloors,
    createFloor,
    updateFloor,
    deleteFloor
  }
})
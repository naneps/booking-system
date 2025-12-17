import { defineStore } from 'pinia'
import type { Floor } from '~/types/master'

export const useFloorStore = defineStore('floor-store', () => {
  const floors = ref<Floor[]>([])
  const totalItems = ref(0)
  const loading = ref(false)
  const brancHId = useCookie('selected_branch_id', { path: '/' })
  
  // --- READ ---
  async function fetchFloors(params: { page: number; per_page: number; q?: string; }) {
    loading.value = true
    try {
      const response = await useApi<any>('/api/v1/floors', {
        query: {...params,
          branch_id: brancHId.value,
          order_by: 'ordered'
        } 
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
      body: {  ...payload , branch_id: brancHId.value }
    })
    return data
  }

  // --- UPDATE ---
  async function updateFloor(id: number, payload: Partial<Floor>) {
    const { data } = await useApi<{ data: Floor }>(`/api/v1/floors/${id}`, {
      method: 'PUT',
      body: {...payload  , branch_id: brancHId.value}
    })
    
    // Update state lokal biar UI langsung berubah
    const index = floors.value.findIndex(f => f.id === id)
    if (index !== -1) floors.value[index] = data
    
    return data
  }

  // --- REORDER ---
  async function reorderFloors(newOrder: Floor[]) {
    // Update UI dulu (optimistic update)
    const oldFloors = [...floors.value]
    floors.value = newOrder
    
    try {
      // Kirim ke backend
      const orders = newOrder.map((floor, index) => ({
        id: floor.id,
        sort_order: index
      }))
      
      await useApi('/api/v1/floors/reorder', {
        method: 'POST',
        body: { orders }
      })
      
    } catch (error) {
      // Kalo gagal, rollback ke order lama
      floors.value = oldFloors
      throw error
    }
  }

  // --- DELETE ---
  async function deleteFloor(id: number) {
    await useApi(`/api/v1/floors/${id}`, { method: 'DELETE' })
  }

  return {
    floors,
    totalItems,
    loading,
    fetchFloors,
    createFloor,
    updateFloor,
    reorderFloors, // ← Tambah ini
    deleteFloor
  }
})
import { defineStore } from 'pinia'
import type { Table } from '~/types/master'

export const useTableStore = defineStore('table-store', () => {
  const tables = ref<Table[]>([])
  const loading = ref(false)

  // --- READ ---
  async function fetchTables(params: { branch_id?: number; floor_id?: number }) {
    loading.value = true
    try {
      const { data } = await useApi<{ data: Table[] }>('/api/v1/tables', {
        query: { ...params, per_page: 200 }
      })
      tables.value = data
    } finally {
      loading.value = false
    }
  }

  // --- CREATE ---
  async function createTable(payload: Partial<Table>) {
    const { data } = await useApi<{ data: Table }>('/api/v1/tables', {
      method: 'POST',
      body: payload
    })
    tables.value.push(data)
    return data
  }

  // --- UPDATE ---
  async function updateTable(id: number, payload: Partial<Table>) {
    const { data } = await useApi<{ data: Table }>(`/api/v1/tables/${id}`, {
      method: 'PUT',
      body: payload
    })
    
    const index = tables.value.findIndex(t => t.id === id)
    if (index !== -1) tables.value[index] = data
    return data
  }

  // --- DELETE ---
  async function deleteTable(id: number) {
    await useApi(`/api/v1/tables/${id}`, { method: 'DELETE' })
    tables.value = tables.value.filter(t => t.id !== id)
  }

  // --- ACTIONS (Custom) ---
  async function holdTable(tableId: number) {
    const res = await useApi(`/api/v1/tables/${tableId}/hold`, { method: 'POST' })
    
    // Optimistic Update
    const index = tables.value.findIndex(t => t.id === tableId)
    if (index !== -1 && tables.value[index]) tables.value[index].status = 'hold'
    
    return res
  }

  async function releaseTable(tableId: number) {
    await useApi(`/api/v1/tables/${tableId}/release-hold`, { method: 'POST' })
    
    const index = tables.value.findIndex(t => t.id === tableId)
    if (index !== -1 && tables.value[index]) tables.value[index].status = 'available'
  }

  return {
    tables,
    loading,
    fetchTables,
    createTable,
    updateTable,
    deleteTable,
    holdTable,
    releaseTable
  }
})
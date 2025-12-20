import { defineStore } from 'pinia'

export interface CalendarBooking {
  id: number
  customer_name: string
  table_name: string
  floor: string
  date: string
  guests: number
  phone: string
  status: 'confirmed' | 'pending' | 'checked_in' | 'completed' | 'cancelled'
  notes?: string
}

export const useCalendarStore = defineStore('calendar', () => {
  /* ================= STATE ================= */
  const bookings = ref<CalendarBooking[]>([])
  const loading = ref(false)
  const currentDate = ref(new Date())
  const viewMode = ref<'month' | 'week' | 'day'>('month')

  const filters = reactive({
    status: 'all',
    q: '',
  })

  /* ================= ACTIONS ================= */

  async function fetchCalendar(params: {
    branch_id: number
    from: string
    to: string
  }) {
    loading.value = true
    try {
      // MENGGUNAKAN REAL API
      const res = await $fetch<any>('/api/v1/bookings', {
        params: {
          branch_id: params.branch_id,
          from: params.from,
          to: params.to,
          // Kirim parameter filter hanya jika ada isinya
          ...(filters.status !== 'all' && { status: filters.status }),
          ...(filters.q && { q: filters.q }),
        },
      })

      // Mapping response API ke Interface Frontend
      // Pastikan struktur 'res.data' sesuai dengan response JSON API kamu
      bookings.value = (res.data || []).map((b: any) => ({
        id: b.id,
        customer_name: b.customer_name,
        table_name: b.tables?.[0]?.name ?? '-',
        floor: b.tables?.[0]?.floor?.name ?? '-',
        date: b.start_at, // Pastikan format ISO String
        guests: b.party_size,
        status: b.status,
        phone: b.customer_phone || '-', // Sesuaikan field API
        notes: b.notes || ''
      }))

    } catch (error) {
      console.error('Failed to fetch bookings:', error)
      // Opsional: Handle error notification disini
    } finally {
      loading.value = false
    }
  }

  async function rescheduleBooking(payload: {
    id: number
    start_at: string
  }) {
    // Optimistic Update (Update tampilan dulu biar cepat)
    const idx = bookings.value.findIndex(b => b.id === payload.id)
    const oldData = idx !== -1 ? { ...bookings.value[idx] } : null

    if (idx !== -1) {
      bookings.value[idx].date = payload.start_at
    }

    try {
      // REAL API CALL
      await $fetch(`/api/v1/bookings/${payload.id}/reschedule`, {
        method: 'PATCH',
        body: payload,
      })
      
      // Jika API mengembalikan data terbaru, bisa update lagi disini untuk memastikan
      // const res = await ...
      
    } catch (error) {
      // Rollback jika gagal
      console.error('Reschedule failed', error)
      if (oldData && idx !== -1) bookings.value[idx] = oldData
      throw error // Lempar error agar komponen tau kalau gagal
    }
  }

  return {
    bookings,
    loading,
    currentDate,
    viewMode,
    filters,
    fetchCalendar,
    rescheduleBooking,
  }
})
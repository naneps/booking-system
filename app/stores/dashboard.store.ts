import { defineStore } from 'pinia'

/* ================= TYPES ================= */

export interface DashboardStats {
  total_bookings_today: number
  seated_guests: number
  upcoming_2h: number
  available_tables: number
}

export interface UpcomingBooking {
  id: number
  customer: string
  pax: number
  time: string
  time_diff: string
  status: 'confirmed' | 'pending' | 'checked_in'
  is_urgent: boolean
}

export interface WaitingGuest {
  id: number
  customer: string
  pax: number
  joined_at: string
  wait_time: number
  phone?: string
}

export interface FloorOccupancy {
  name: string
  current: number
  max: number
  color: 'green' | 'orange' | 'primary'
}

export interface DashboardAlert {
  type: 'overtime' | 'warning'
  message: string
  details?: string
}

/* ================= STORE ================= */

export const useDashboardStore = defineStore('dashboard', () => {
  /* ---------- STATE ---------- */
  const loading = ref(false)

  const stats = ref<DashboardStats>({
    total_bookings_today: 0,
    seated_guests: 0,
    upcoming_2h: 0,
    available_tables: 0,
  })

  const upcomingSchedule = ref<UpcomingBooking[]>([])
  const waitingList = ref<WaitingGuest[]>([])
  const floorStatus = ref<FloorOccupancy[]>([])
  const alerts = ref<DashboardAlert[]>([])
  const branchId = useCookie('selected_branch_id', { path: '/' })
  /* ---------- ACTIONS ---------- */

  const fetchDashboard = async () => {
    loading.value = true
    try {
      // METHOD: GET (Default)
      const res = await useApi<any>('/api/v1/dashboard', {
        params: { branch_id: branchId.value },
      })

      // Mapping data dari response API
      // Pastikan backend mengembalikan struktur { data: { stats: ..., ... } }
      const data = res
      
      stats.value = data.stats
      upcomingSchedule.value = data.upcoming_schedule
      waitingList.value = data.waiting_list
      floorStatus.value = data.floor_status
      alerts.value = data.alerts
    } catch (error) {
      console.error('Failed to fetch dashboard', error)
    } finally {
      loading.value = false
    }
  }

  const seatWaitlistGuest = async (waitlistId: number) => {
    try {
        // METHOD: POST
        await useApi(`/api/v1/waitlists/${waitlistId}/seat`, {
            method: 'POST'
        })
        
        // Optimistic update: Hapus dari list local
        waitingList.value = waitingList.value.filter(w => w.id !== waitlistId)
        stats.value.seated_guests += 1 
    } catch (error) {
        console.error('Failed to seat guest', error)
    }
  }

  const removeWaitlistGuest = async (waitlistId: number) => {
    try {
      // METHOD: DELETE
      await useApi(`/api/v1/waitlists/${waitlistId}`, {
          method: 'DELETE'
      })
      waitingList.value = waitingList.value.filter(w => w.id !== waitlistId)
    } catch (error) {
      console.error('Failed to remove waitlist', error)
    }
  }

  const checkInBooking = async (bookingId: number) => {
    try {
        // METHOD: POST
        await useApi(`/api/v1/bookings/${bookingId}/check-in`, {
            method: 'POST'
        })
        
        // Update status local
        const booking = upcomingSchedule.value.find(b => b.id === bookingId)
        if (booking) {
            booking.status = 'checked_in'
            stats.value.seated_guests += booking.pax
        }
    } catch (error) {
        console.error('Failed to check-in', error)
    }
  }

  const addWaitlistGuest = async (payload: { customer: string; pax: number }) => {
     try {
        // METHOD: POST + BODY
        const res = await useApi<any>('/api/v1/waitlists', {
            method: 'POST',
            body: payload
        })
        // Asumsi res.data berisi object guest baru yang dibuat
        waitingList.value.push(res.data) 
     } catch (error) {
        console.error('Failed to add waitlist', error)
     }
  }

  return {
    // state
    loading,
    stats,
    upcomingSchedule,
    waitingList,
    floorStatus,
    alerts,

    // actions
    fetchDashboard,
    seatWaitlistGuest,
    removeWaitlistGuest,
    checkInBooking,
    addWaitlistGuest
  }
})
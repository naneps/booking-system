import { defineStore } from 'pinia';

/* --- TYPES (Sesuai JSON Resource) --- */

export interface BookingSnapshot {
  id: number;
  code: string;
  customer: string | null; // Bisa null kalau belum assign nama
  party_size: number;
  start_at: string; // "15:30"
  end_at: string;   // "17:00"
  status: string;   // "checked_in", "confirmed", etc
}

export interface TableFlags {
  is_available: boolean;
  is_reserved: boolean;
  is_occupied: boolean;
  has_current_booking: boolean;
  has_next_booking: boolean;
  can_walk_in: boolean;
  can_future_book: boolean;
  show_upcoming_badge: boolean;
  show_occupied_badge: boolean;
}

export interface FloorTable {
  id: number;
  code: string;
  name: string;
  capacity: number;
  status: 'occupied' | 'reserved' | 'available';
  
  current_booking: BookingSnapshot | null;
  next_booking: BookingSnapshot | null;
  
  flags: TableFlags;
}

/* --- STORE --- */
export const useFloorPlanStore = defineStore('floor-plan-store', () => {
  const tables = ref<FloorTable[]>([]);
  const loadingSnapshot = ref(false);
  const brancHId = useCookie('selected_branch_id', {path: '/'})

  async function fetchSnapshot(params: { floor_id?: number | null }) {
    loadingSnapshot.value = true;
    try {
      const response = await useApi<any>('/api/v1/floors/snapshot', {
        method: 'GET',
        params: {...params , branch_id: brancHId.value}, 
      });
      tables.value = response.data;
    } catch (error) {
      console.error('Snapshot error:', error);
      tables.value = [];
    } finally {
      loadingSnapshot.value = false;
    }
  }

  return { tables, loadingSnapshot, fetchSnapshot };
});
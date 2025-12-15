import { defineStore } from "pinia";
import type { Waitlist, WaitlistFilter, WaitlistForm } from "./waitlist.types";

export const useWaitlistStore = defineStore("waitlist-store", () => {
  // --- STATE ---
  const waitlists = ref<Waitlist[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // --- ACTIONS ---

  /**
   * FETCH LISTm l
   * GET /api/v1/waitlists
   */
  async function fetchWaitlists(params: WaitlistFilter) {
    loading.value = true;
    error.value = null;
    try {
      const response = await useApi<any>("/api/v1/waitlists", {
        method: "GET",
        params: params,
      });
      // Backend return resource collection, biasanya di wrap 'data'
      waitlists.value = response.data;
    } catch (err: any) {
      error.value = err.message || "Failed to fetch waitlist";
      waitlists.value = [];
    } finally {
      loading.value = false;
    }
  }

  /**
   * CREATE (Add Walk-in)
   * POST /api/v1/waitlists
   */
  async function addWaitlist(payload: WaitlistForm) {
    loading.value = true;
    error.value = null;
    try {
      const response = await useApi<any>("/api/v1/waitlists", {
        method: "POST",
        body: payload,
      });

      // Tambahkan data baru ke list paling bawah (atau refetch)
      // Karena backend return single resource:
      waitlists.value.push(response.data);

      return response.data;
    } catch (err: any) {
      error.value = err.data?.message || err.message;
      throw err; // Lempar error biar component bisa handle toast
    } finally {
      loading.value = false;
    }
  }

  /**
   * UPDATE (Edit Manual)
   * PUT /api/v1/waitlists/{id}
   */
  async function updateWaitlist(id: number, payload: Partial<WaitlistForm>) {
    loading.value = true;
    try {
      const response = await useApi<any>(`/api/v1/waitlists/${id}`, {
        method: "PUT",
        body: payload,
      });

      // Update local state
      const index = waitlists.value.findIndex((w) => w.id === id);
      if (index !== -1) {
        waitlists.value[index] = response.data;
      }
      return response.data;
    } catch (err: any) {
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * DELETE (Remove)
   * DELETE /api/v1/waitlists/{id}
   */
  async function removeWaitlist(id: number) {
    loading.value = true;
    try {
      await useApi(`/api/v1/waitlists/${id}`, {
        method: "DELETE",
      });

      // Hapus dari local state
      waitlists.value = waitlists.value.filter((w) => w.id !== id);
    } catch (err: any) {
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * SEAT GUEST (Convert to Booking)
   * POST /api/v1/waitlists/{id}/seat
   */
  async function seatGuest(id: number, tableIds: number[]) {
    loading.value = true;
    try {
      const response = await useApi<any>(`/api/v1/waitlists/${id}/seat`, {
        method: "POST",
        body: { table_ids: tableIds },
      });

      // Hapus dari list antrian karena statusnya sudah 'seated'
      // (Kecuali kita lagi filter status='all', tapi biasanya dashboard cuma nampilin 'waiting')
      waitlists.value = waitlists.value.filter((w) => w.id !== id);

      // Return data booking baru (siapa tau mau redirect ke booking detail)
      return response.data;
    } catch (err: any) {
      error.value = err.data?.message || err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  return {
    waitlists,
    loading,
    error,
    fetchWaitlists,
    addWaitlist,
    updateWaitlist,
    removeWaitlist,
    seatGuest,
  };
});

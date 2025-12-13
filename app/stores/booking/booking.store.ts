import { defineStore } from 'pinia';
import type { Booking, BookingFilter, BookingForm } from '~/types/booking.types';

export const useBookingStore = defineStore('booking-store', () => {
    // State
    const bookings = ref<Booking[]>([]);
    const booking = ref<Booking | null>(null);
    const totalItems = ref(0);
    const loading = ref(false);
    const error = ref<string | null>(null);

    /**
     * FETCH PAGINATED BOOKINGS
     * Corresponds to BookingService::paginate & Route::get('bookings')
     */
    async function fetchBookings(params: { q?: string; page: number; per_page: number } & BookingFilter) {
        loading.value = true;
        error.value = null;
        try {
            const response = await useApi<any>('/api/v1/bookings', {
                method: 'GET',
                params: params, // branch_id, from, to, status passed here
            });
            bookings.value = response.data;
            totalItems.value = response.meta.total;
        } catch (err: any) {
            error.value = err.message || 'Failed to fetch bookings';
            bookings.value = [];
            totalItems.value = 0;
        } finally {
            loading.value = false;
        }
    }

    /**
     * FIND ONE BOOKING
     * Corresponds to BookingService::find & Route::get('bookings/{id}')
     */
    async function fetchBooking(id: number) {
        loading.value = true;
        error.value = null;
        try {
            const response = await useApi<any>(`/api/v1/bookings/${id}`, {
                method: 'GET'
            });
            booking.value = response.data;
            return response.data;
        } catch (err: any) {
            error.value = err.message || 'Failed to fetch booking details';
            return null;
        } finally {
            loading.value = false;
        }
    }

    /**
     * CREATE BOOKING
     * Corresponds to BookingService::createBooking & Route::post('bookings')
     * Handles payload from StoreBookingRequest
     */
    async function createBooking(payload: BookingForm) {
        loading.value = true;
        error.value = null;
        try {
            const response = await useApi<any>('/api/v1/bookings', {
                method: 'POST',
                body: payload // branch_id, start_at, table_ids, etc.
            });
            return response.data;
        } catch (err: any) {
            // Laravel validation errors (422) or RuntimeException (conflict)
            error.value = err.data?.message || err.message || 'Failed to create booking';
            throw err; // Re-throw so component can handle UI feedback
        } finally {
            loading.value = false;
        }
    }

    /**
     * UPDATE BOOKING
     * Corresponds to BookingService::updateBooking & Route::put('bookings/{id}')
     */
    async function updateBooking(id: number, payload: Partial<BookingForm>) {
        loading.value = true;
        error.value = null;
        try {
            const response = await useApi<any>(`/api/v1/bookings/${id}`, {
                method: 'PUT',
                body: payload
            });
            // Update local state if the currently viewed booking is the one updated
            if (booking.value && booking.value.id === id) {
                booking.value = response.data;
            }
            return response.data;
        } catch (err: any) {
            error.value = err.data?.message || err.message || 'Failed to update booking';
            throw err;
        } finally {
            loading.value = false;
        }
    }

    /**
     * DELETE / CANCEL BOOKING
     * Corresponds to BookingController::destroy (which likely calls delete or cancel)
     * Based on your service, you have cancelBooking logic distinct from delete
     */
    async function deleteBooking(id: number) {
        loading.value = true;
        error.value = null;
        try {
            await useApi(`/api/v1/bookings/${id}`, {
                method: 'DELETE'
            });
            // Remove from local list
            bookings.value = bookings.value.filter((b) => b.id !== id);
            totalItems.value--;
        } catch (err: any) {
            error.value = err.message || 'Failed to delete booking';
            throw err;
        } finally {
            loading.value = false;
        }
    }

    /**
     * CHECK IN
     * Corresponds to BookingService::checkIn & Route::post('bookings/{id}/check-in')
     */
    async function checkIn(id: number) {
        loading.value = true;
        try {
            const response = await useApi<any>(`/api/v1/bookings/${id}/check-in`, {
                method: 'POST'
            });
            // Update local state
            const updated = response.data;
            const idx = bookings.value.findIndex(b => b.id === id);
            if (idx !== -1) bookings.value[idx] = updated;
            if (booking.value && booking.value.id === id) booking.value = updated;
            
            return updated;
        } catch (err: any) {
            error.value = err.message || 'Check-in failed';
            throw err;
        } finally {
            loading.value = false;
        }
    }

    /**
     * CHECK OUT
     * Corresponds to BookingService::checkOut & Route::post('bookings/{id}/check-out')
     */
    async function checkOut(id: number) {
        loading.value = true;
        try {
            const response = await useApi<any>(`/api/v1/bookings/${id}/check-out`, {
                method: 'POST'
            });
            // Update local state
            const updated = response.data;
            const idx = bookings.value.findIndex(b => b.id === id);
            if (idx !== -1) bookings.value[idx] = updated;
            if (booking.value && booking.value.id === id) booking.value = updated;
            
            return updated;
        } catch (err: any) {
            error.value = err.message || 'Check-out failed';
            throw err;
        } finally {
            loading.value = false;
        }
    }

    return {
        bookings,
        booking,
        totalItems,
        loading,
        error,
        fetchBookings,
        fetchBooking,
        createBooking,
        updateBooking,
        deleteBooking,
        checkIn,
        checkOut
    };
});
export interface BookingTable {
    id: number;
    name: string;
    floor_name: string;
    seats?: number;
    note?: string;
}

export interface Booking {
    id: number;
    uuid: string;
    code: string;
    branch_id: number;
    customer_name: string;
    customer_phone: string;
    party_size: number;
    start_at: string;
    end_at: string;
    status: 'reserved' | 'checked_in' | 'completed' | 'cancelled'; // Add other statuses as needed
    source?: string;
    notes?: string;
    tables: BookingTable[];
    created_by?: number;
    created_at?: string;
    updated_at?: string;
    // Add other fields from Resource if needed
}

export interface BookingForm {
    branch_id: number;
    customer_name?: string;
    customer_phone?: string;
    party_size: number;
    start_at: string;
    end_at?: string;
    duration_minutes?: number; // Optional helper for backend
    table_ids?: number[];
    source?: string;
    notes?: string;
    status?: string;
}

export interface BookingFilter {
    branch_id?: number;
    from?: string;
    to?: string;
    status?: string;
}
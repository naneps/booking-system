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
  status: "reserved" | "checked_in" | "completed" | "cancelled"; // Add other statuses as needed
  source?: string;
  notes?: string;
  tables: BookingTable[];
  created_by?: number;
  created_at?: string;
  updated_at?: string;
  // Add other fields from Resource if needed
}

export interface BookingForm {
  customer_name?: string;
  customer_phone?: string;
  party_size: number;
  start_at: string;
  end_at?: string;
  note?: string;
  duration_minutes?: number;
  table_items?: {
    table_id: number;
    note?: string;
  }[];
  source?: string;
  notes?: string;
  status?: string;
}

export interface BookingFilter {
  status?: string;
  
  // --- TAMBAHAN BARU ---
  from?: string;       // Untuk filter tanggal awal
  to?: string;         // Untuk filter tanggal akhir
  order_by?: string;   // Untuk sorting kolom
  order_dir?: 'asc' | 'desc'; // Arah sorting
}
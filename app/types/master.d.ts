// app/types/master.d.ts

// 1. Tipe Data Branch
export interface Branch {
  id: number
  name: string
  code?: string | null
  address?: string | null
  phone?: string | null
  meta?: Record<string, any> | null
  created_at?: string
  updated_at?: string
}

// 2. Tipe Data Floor
export interface Floor {
  id: number
  name: string
  code?: string | null
  layout_json?: string | null
  meta?: Record<string, any> | null
  created_at?: string
  updated_at?: string
  sort_order?: number
  
  // --- UPDATE BARU ---
  count_tables?: number // Jumlah meja
  branch?: Branch       // Relasi Branch
  tables?: {            // Struktur dari Resource PHP kamu
    id: number[]
    name: string[]
  }
}

// 3. Tipe Data Table (Persiapan buat nanti)
export type TableStatus = 'available' | 'hold' | 'booked' | 'occupied' | 'cleaning'

export interface Table {
  id: number
  floor_id: number
  name: string
  capacity: number
  position?: string | null
  status: TableStatus
  meta?: Record<string, any> | null
  
  // Relasi
  branch?: Branch
  floor?: Floor
}
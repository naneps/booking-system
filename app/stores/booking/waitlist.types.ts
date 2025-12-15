// types/waitlist.ts

export interface Waitlist {
  id: number;
  branch_id: number;
  code: string;           // e.g. "#005"
  queue_number: number;   // e.g. 5
  customer_name: string;
  customer_phone?: string;
  pax: number;
  status: 'waiting' | 'seated' | 'cancelled' | 'no_show';
  note?: string;
  joined_at: string;      // DateTime string
  joined_time: string;    // e.g. "14:30"
  wait_time: number;      // e.g. 15 (menit)
  created_at?: string;
}

export interface WaitlistForm {
  branch_id: number;
  customer_name: string;
  customer_phone?: string;
  pax: number;
  note?: string;
}

export interface WaitlistFilter {
  branch_id: number;
  q?: string;      // Search query
  status?: string; // default 'waiting'
}
// Path & name support; pakai key yang paling panjang (longest-prefix match)
export const ROUTE_ICON_MAP: Record<string, string> = {
  // --- Top Level ---
  '/': 'i-lucide-house',
  '/floor-planner': 'i-lucide-layout',
  '/bookings': 'i-lucide-calendar',
  '/waiting-list': 'i-lucide-clock',
  '/master': 'i-lucide-database',
  '/customers': 'i-lucide-users',
  '/staff': 'i-lucide-user-check',
  '/payments': 'i-lucide-credit-card',
  '/reports': 'i-lucide-pie-chart',
  '/settings': 'i-lucide-settings',

  // --- Floor Planner ---
  '/floor-planner/lantai-1': 'i-lucide-layers',
  '/floor-planner/lantai-2': 'i-lucide-layers',
  '/floor-planner/outdoor': 'i-lucide-sun',

  // --- Bookings ---
  '/bookings/create': 'i-lucide-plus', // atau i-lucide-calendar-plus
  '/bookings/calendar': 'i-lucide-calendar',
  '/bookings/checkin': 'i-lucide-log-in',

  // --- Waiting List ---
  '/waiting-list/create': 'i-lucide-user-plus', // Quick action

  // --- Master Data (Sesuai update sebelumnya) ---
  '/master/branches': 'i-lucide-store',
  '/master/floors': 'i-lucide-layers-2',
  '/master/tables': 'i-lucide-armchair',

  // --- Customers ---
  '/customers/create': 'i-lucide-user', // Quick action

  // --- Reports ---
  '/reports/occupancy': 'i-lucide-bar-chart-2',
  '/reports/sales': 'i-lucide-dollar-sign',
  '/reports/waiting-list': 'i-lucide-clock',

  // --- Settings ---
  '/settings/general': 'i-lucide-sliders',
  '/settings/users': 'i-lucide-shield',
  '/settings/notifications': 'i-lucide-bell',
  '/settings/venue': 'i-lucide-map', // Jika masih ada link venue lama

  // --- Optional: Support by Route Name (jika perlu) ---
  'master-branches': 'i-lucide-store',
  'master-tables': 'i-lucide-armchair',
  'bookings-create': 'i-lucide-plus',
}
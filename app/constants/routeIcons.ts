// Path & name support; pakai key yang paling panjang (longest-prefix match)
export const ROUTE_ICON_MAP: Record<string, string> = {
  // Top level
  
  '/': 'i-lucide-house',
  '/master-data': 'i-lucide-database',
  '/taksasi': 'i-lucide-trending-up',
  '/planning-purchasing': 'i-lucide-clipboard-list',
  '/purchasing-stock': 'i-lucide-boxes',
  '/sales': 'i-lucide-bar-chart-3',
  '/reporting': 'i-lucide-pie-chart',
  '/report-visit': 'i-lucide-map-pin',
  '/distribusi': 'i-lucide-truck',

  // Master Data children
  '/master-data/items': 'i-lucide-package',
  '/master-data/item-variants': 'i-lucide-layers',
  '/master-data/units': 'i-lucide-ruler',

  '/master-data/users': 'i-lucide-user-round',
  '/master-data/users/create-user': 'i-lucide-user-plus',
  
  '/master-data/categories': 'i-lucide-folder-tree',
  '/master-data/warehouses': 'i-lucide-building-2',
  '/master-data/suppliers': 'i-lucide-handshake',
  '/master-data/customers': 'i-lucide-users',
  '/master-data/price-lists': 'i-lucide-badge-percent',
  '/master-data/payment-terms': 'i-lucide-credit-card',

  // (opsional) by route name juga boleh
  'master-data-items': 'i-lucide-package',
  'master-data-item-variants': 'i-lucide-layers',


}

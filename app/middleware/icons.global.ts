import { ROUTE_ICON_MAP } from '~/constants/routeIcons'

export default defineNuxtRouteMiddleware((to) => {
  const keys = Object.keys(ROUTE_ICON_MAP).sort((a, b) => b.length - a.length)
  to.matched.forEach((rec) => {
    const meta: any = rec.meta || {}
    if (meta.icon || meta.breadcrumbIcon) return
    const path = rec.path
    const name = String(rec.name ?? '')
    for (const key of keys) {
      if (path.startsWith(key) || (name && name.startsWith(key))) {
        meta.icon = ROUTE_ICON_MAP[key]
        break
      }
    }
  })
})

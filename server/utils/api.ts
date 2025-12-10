// server/utils/api.ts
import { useRuntimeConfig } from '#imports'

export async function api<T>(path: string, opts: Parameters<typeof $fetch>[1] = {}) {
  const { API_BASE, API_TOKEN } = useRuntimeConfig()
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`
  return $fetch<T>(url, {
    retry: 1,
    headers: {
      ...(opts.headers || {}),
      ...(API_TOKEN ? { Authorization: `Bearer ${API_TOKEN}` } : {}),
    },
    ...opts,
  })
}

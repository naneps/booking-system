import type { NitroFetchOptions, NitroFetchRequest } from 'nitropack'

export function useApi<T = unknown>(
  request: NitroFetchRequest, 
  opts?: NitroFetchOptions<NitroFetchRequest>
) {
  // Kita HAPUS useToast() dari sini untuk menghindari error inject()
  
  // Header auth otomatis ditangani oleh server/api/v1/[...].ts (Proxy)
  // Jadi di sini kita cukup handle error return-nya saja

  return $fetch<T>(request, {
    ...opts,
    onRequest({ options }) {
      options.headers = options.headers || {}
      // @ts-ignore
      options.headers.Accept = 'application/json'
    },
    onResponseError({ response }) {
      // Handle 401 Global (Logout)
      if (response.status === 401 && process.client) {
         // Lakukan hard reload atau redirect login
         window.location.href = '/login'
      }
      // Error lain (422, 500) biarkan dilempar (throw) agar ditangkap di component
    }
  })
}
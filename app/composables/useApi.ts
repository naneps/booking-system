import type { NitroFetchOptions, NitroFetchRequest } from 'nitropack'

export function useApi<T = unknown>(
  request: NitroFetchRequest, 
  opts?: NitroFetchOptions<NitroFetchRequest>
) {

  return $fetch<T>(request, {
    ...opts,
    onRequest({ options }) {
      options.headers = options.headers || {}
      options.headers.Accept = 'application/json'

    
    },
    onResponseError({ response }) {
      // Handle 401 Global (Logout)
      if (response.status === 401 && process.client) {
         // Lakukan hard reload atau redirect login
         window.location.href = '/auth'
      }
      // Error lain (422, 500) biarkan dilempar (throw) agar ditangkap di component
    }
  })
}
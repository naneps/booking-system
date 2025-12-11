// server/api/v1/[...].ts
import { joinURL } from 'ufo'

export default defineEventHandler(async (event) => {
  // 1. Ambil Config
  const config = useRuntimeConfig()
  const apiBase = config.externalApiBase || 'http://127.0.0.1:8000'
  
  // 2. Tentukan Target URL
  // event.path berisi full path, misal: /api/v1/branches?per_page=10
  // Kita gabungkan dengan base URL Laravel
  const targetUrl = joinURL(apiBase, event.path)

  console.log(`[Proxy] Forwarding to: ${targetUrl}`) // Cek console terminal untuk debug

  // 3. Ambil Token dari Cookie HttpOnly
  const cookieName = config.authCookieName || 'auth_token'
  const token = getCookie(event, cookieName)

  // 4. Siapkan Headers Tambahan
  const headers: Record<string, string> = {
    'Accept': 'application/json',
  }

  // Inject Token jika ada
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
    console.log('[Proxy] Token injected!')
  } else {
    console.log('[Proxy] No token found in cookie')
  }

  // 5. Lakukan Proxy Request
  // proxyRequest adalah helper bawaan Nuxt/H3 yang otomatis stream response
  return proxyRequest(event, targetUrl, {
    headers: headers,
    fetchOptions: {
      // Opsi ini penting agar method POST/PUT body-nya ikut terkirim
      duplex: 'half' 
    }
  })
})
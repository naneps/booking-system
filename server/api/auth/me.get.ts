// server/api/auth/me.get.ts
import { Buffer } from 'node:buffer'
import { $fetch } from 'ofetch'

function decodeJwt<T = any>(token: string): T | null {
  try {
    const [, payloadB64url] = token.split('.')
    const b64 = payloadB64url.replace(/-/g, '+').replace(/_/g, '/')
    const padded = b64 + '==='.slice((b64.length + 3) % 4)
    return JSON.parse(Buffer.from(padded, 'base64').toString('utf8')) as T
  } catch { return null }
}

export default defineEventHandler(async (event) => {
  const { authCookieName, externalApiBase, externalMePath } = useRuntimeConfig()
  const token = getCookie(event, authCookieName)
  if (!token) throw createError({ statusCode: 401, statusMessage: 'Belum login' })

  if (externalMePath) {
    const data = await $fetch<any>(externalApiBase + externalMePath, {
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${token}`,
      }
    })
    return { ok: true, user: (data?.user ?? data) }
  }

  const jwt = decodeJwt(token)
  if (!jwt) throw createError({ statusCode: 400, statusMessage: 'Token tidak valid' })
  return { ok: true, jwt }
})

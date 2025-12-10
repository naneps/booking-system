function maxAgeFromJwt(token?: string) {
  try {
    if (!token) return 0
    const [, payloadB64url] = token.split('.')
    const b64 = payloadB64url.replace(/-/g, '+').replace(/_/g, '/')
    const padded = b64 + '==='.slice((b64.length + 3) % 4)
    const payload = JSON.parse(Buffer.from(padded, 'base64').toString('utf8'))
    const now = Math.floor(Date.now() / 1000)
    return Math.max((payload?.exp ?? 0) - now, 0)
  } catch { return 0 }
}

export default defineEventHandler(async (event) => {
  const { externalApiBase, externalLoginPath, authCookieName , isDev } = useRuntimeConfig()
  const body = await readBody<{ username: string; password: string }>(event)
  if (!body?.username || !body?.password) {
    throw createError({ statusCode: 400, statusMessage: 'username & password wajib' })
  }

  const res = await $fetch<{ token?: string; user?: any }>(externalApiBase + externalLoginPath, {
    method: 'POST',
    body,
    headers: { accept: 'application/json' }
  }).catch((e: any) => {
    throw createError({ statusCode: e?.status || 500, statusMessage: e?.data?.message || 'Login gagal' })
  })

  if (!res?.token) throw createError({ statusCode: 401, statusMessage: 'Login gagal' })

  setCookie(event, authCookieName, res.token, {
    httpOnly: true,
    secure: !isDev,
    sameSite: 'lax',
    path: '/',
    maxAge: maxAgeFromJwt(res.token) || 60 * 60 * 24 * 7
  })

  return { ok: true, user: res.user }
})

// server/api/auth/logout.post.ts

const REVOKE_PATH = '/mobile/auth/logout' 
export default defineEventHandler(async (event) => {
  const { authCookieName, externalApiBase } = useRuntimeConfig()
  const token = getCookie(event, authCookieName)

  if (token) {
    try {
      await $fetch(externalApiBase + REVOKE_PATH, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, accept: 'application/json' }
      })
    } catch { /* error revoke */ }
  }

  deleteCookie(event, authCookieName, { path: '/' })
  return { ok: true }
})

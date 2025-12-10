
export function decodeJwt<T = any>(token: string): T | null {
  try {
    const [, payloadB64url] = token.split('.')
    const b64 = payloadB64url.replace(/-/g, '+').replace(/_/g, '/')
    const padded = b64 + '==='.slice((b64.length + 3) % 4)
    return JSON.parse(Buffer.from(padded, 'base64').toString('utf8')) as T
  } catch { return null }
}

export async function extFetch<T>(event: any, path: string, opts: FetchOptions = {}) {
  const { externalApiBase, authCookieName } = useRuntimeConfig()
  const token = getCookie(event, authCookieName as string)
  const url = path.startsWith('http') ? path : `${externalApiBase}${path}`
  return $fetch<T>(url, {
    ...opts,
    headers: {
      accept: 'application/json',
      ...(opts.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    retry: 1
  })
}

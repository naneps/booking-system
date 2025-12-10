// /middleware/auth.global.ts
export default defineNuxtRouteMiddleware(async (to) => {
  // ——— path config (ubah sesuai routing kamu) ———
  const LOGIN_PATH = '/auth'         // ganti ke '/auth/login' kalau perlu
  const DASHBOARD_PATH = '/dashboard'
  const AUTH_PREFIX = '/auth'        // semua halaman auth (login/forgot/register dsb)
  const PROTECTED_PREFIXES = ['/dashboard'] // tambahin kalau ada area privat lain

  const auth = useAuthStore()

  // Hydrate user sekali per session (hindari fetchMe berulang)
  const hydrated = useState('auth:hydrated', () => false)
  if (!auth.isAuthenticated && !hydrated.value) {
    try { await auth.fetchMe() } catch {
      await auth.logout()
    }
    hydrated.value = true
  }

  const isAuth = auth.isAuthenticated

  // 1) Root redirect (karena ga ada index)
  if (to.path === '/') {
    const target = isAuth ? DASHBOARD_PATH : LOGIN_PATH
    if ((to.path as string) !== target) return navigateTo(target, { replace: true })
    return
  }

  // 2) Sudah login -> blokir semua halaman auth/*
  if (to.path.startsWith(AUTH_PREFIX) && isAuth) {
    if (to.path !== DASHBOARD_PATH) {
      return navigateTo(DASHBOARD_PATH, { replace: true })
    }
    return
  }

  // 3) Belum login -> blokir semua halaman privat
  const tryingProtected = PROTECTED_PREFIXES.some(p => to.path.startsWith(p))
  if (tryingProtected && !isAuth) {
    if (to.path !== LOGIN_PATH) {
      return navigateTo(LOGIN_PATH, { replace: true })
    }
    return
  }

  // 4) Lainnya: biarkan lewat
})

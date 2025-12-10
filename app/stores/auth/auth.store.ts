import type { User } from "~/types/user.types";


export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const pending = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!user.value)

  async function login(username: string, password: string) {
    pending.value = true
    error.value = null
    try {
      const res = await $fetch<{ ok: boolean; user: User }>('/api/auth/login', {
        method: 'POST',
        body: { username, password }
      })
      user.value = res.user ?? null
      return user.value
    } catch (e: any) {
      error.value = e?.data?.message || 'Login gagal'
      throw e
    } finally {
      pending.value = false
    }
  }

  async function fetchMe() {
    // biarkan server handle (pakai /api/auth/me yang bisa fallback decode JWT)
    try {
      const res = await $fetch<any>('/api/auth/me')
      user.value = (res?.user ?? res?.jwt ?? null) as User | null
    } catch {
      user.value = null
    }
    return user.value
  }

  async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST' })
    user.value = null
  }

  function $reset() {
    user.value = null
    pending.value = false
    error.value = null
  }

  return { user, pending, error, isAuthenticated, login, fetchMe, logout, $reset }
})

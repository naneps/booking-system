export default defineNuxtPlugin(async () => {
  const auth = useAuthStore()
  if (!auth.user) {
    try { await auth.fetchMe() } catch {
      await auth.logout()
    }
  }
})

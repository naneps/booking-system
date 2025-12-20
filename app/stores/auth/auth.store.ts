import type { User } from "~/types/user.types";

export const useAuthStore = defineStore("auth", () => {
  const user = ref<User | null>(null);
  const pending = ref(false);
  const error = ref<string | null>(null);

  const isAuthenticated = computed(() => !!user.value);

  async function login(email: string, password: string) {
    pending.value = true;
    error.value = null;
    try {
      await $fetch("/api/auth/login", {
        method: "POST",
        body: {email, password},
        credentials: "include", // 🔥 WAJIB
      });

      // 🔥 INI KUNCI UTAMA
      await fetchMe();

      return user.value;
    } catch (e: any) {
      error.value = e?.data?.message || "Login gagal";
      throw e;
    } finally {
      pending.value = false;
    }
  }

  async function fetchMe() {
  try {
    const res = await $fetch<any>('/api/auth/me', {
      credentials: 'include', // 🔥 INI PENTING
    })
    user.value = res?.data ?? res ?? null
  } catch {
    user.value = null
  }
  return user.value
}


  async function logout() {
    await $fetch("/api/auth/logout", {method: "POST"});
    user.value = null;
  }

  function $reset() {
    user.value = null;
    pending.value = false;
    error.value = null;
  }

  return {
    user,
    pending,
    error,
    isAuthenticated,
    login,
    fetchMe,
    logout,
    $reset,
  };
});

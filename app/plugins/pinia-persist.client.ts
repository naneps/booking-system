// plugins/pinia-persist.client.ts
import type { Pinia } from 'pinia'
import { createPersistedState } from 'pinia-plugin-persistedstate'
export default defineNuxtPlugin((nuxtApp) => {
  const pinia = (nuxtApp as { $pinia?: Pinia }).$pinia
  if (pinia) pinia.use(createPersistedState())
})

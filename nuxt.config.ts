// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: {enabled: true},

  modules: [
    "@nuxt/ui",
    "@nuxt/test-utils",
    "@nuxt/scripts",
    "@nuxt/image",
    "@nuxt/eslint",
    "@pinia/nuxt",
    "pinia-plugin-persistedstate/nuxt",
  ],
  pinia: {
    storesDirs: ["./stores/**", "./custom-folder/stores/**"],
  },
  runtimeConfig: {
    externalApiBase: process.env.EXTERNAL_API_BASE,
    externalLoginPath: process.env.EXTERNAL_LOGIN_PATH || "/mobile/auth/login",
    externalMePath: process.env.EXTERNAL_ME_PATH || "",
    authCookieName: process.env.AUTH_COOKIE_NAME || "auth_token",
    public: {},
  },
  css: ["assets/css/main.css"],
 
});

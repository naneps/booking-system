<script setup lang="ts">
import { z } from "zod"

definePageMeta({ layout: 'auth', })
useHead({ title: "Masuk" })

const schema = z.object({
  email: z.string().min(1, "Wajib diisi").email("Email tidak valid").or(z.string().min(1, "Wajib diisi")),
  password: z.string().min(6, "Minimal 6 karakter"),
  remember: z.boolean().optional(),
})
type FormState = z.infer<typeof schema>

const state = reactive<FormState>({ email: "", password: "", remember: true })
const showPass = ref(false)
const loading = ref(false)
const toast = useToast()
const router = useRouter()
const auth = useAuthStore()

// --- Slider ---
const slides = [
  {
    src: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1920&auto=format&fit=crop",
    title: "Bangun lebih cepat",
    desc: "Atur pekerjaan Anda dengan dashboard serba cepat dan aman.",
  },
  {
    src: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=1920&auto=format&fit=crop",
    title: "Kolaborasi tanpa batas",
    desc: "Terhubung dengan tim, bagikan progres, capai target bersama.",
  },
  {
    src: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1920&auto=format&fit=crop",
    title: "Data tetap privat",
    desc: "Keamanan berlapis dengan enkripsi modern untuk setiap akun.",
  },
]
const active = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  timer = setInterval(() => {
    active.value = (active.value + 1) % slides.length
  }, 4500)
})
onBeforeUnmount(() => { if (timer) clearInterval(timer) })

async function onSubmit() {
  loading.value = true
  try {
    await auth.login(state.email, state.password)
    toast.add({ title: "Berhasil masuk", color: "success" })
    navigateTo("/")
  } catch (e: any) {
    toast.add({
      title: "Gagal login",
      description: auth.error || "Periksa kredensial Anda.",
      color: "error",
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen grid grid-cols-1 lg:grid-cols-2">
    <!-- Left: Login form -->
    <div class="flex items-center justify-center p-6 lg:p-10 bg-background">
      <UCard class="w-full max-w-md">
        <template #header>
          <div class="flex items-center gap-3">
            <div class="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <UIcon name="i-heroicons-lock-closed" class="size-5 text-primary" />
            </div>
            <div>
              <h1 class="text-xl font-semibold">Selamat datang kembali</h1>
              <p class="text-sm text-muted">Masuk untuk melanjutkan</p>
            </div>
          </div>
        </template>

        <UForm :schema="schema" :state="state" @submit="onSubmit" class="space-y-5">
          <!-- Username / Email -->
          <UFormField label="Email atau Username" name="email">
            <UInput
              v-model="state.email"
              type="text"
              :disabled="loading"
              autocomplete="username"
              placeholder="cashier atau kamu@email.com"
              icon="i-heroicons-envelope"
              size="lg"
              class="w-full min-w-0"
            />
          </UFormField>

          <!-- Password -->
          <UFormField label="Kata sandi" name="password">
            <UInput
              v-model="state.password"
              :type="showPass ? 'text' : 'password'"
              :disabled="loading"
              autocomplete="current-password"
              placeholder="••••••••"
              size="lg"
              class="w-full min-w-0"
            >
              <template #leading>
                <UIcon name="i-heroicons-key" />
              </template>
              <template #trailing>
                <button
                  type="button"
                  class="px-2 opacity-70 hover:opacity-100"
                  @click="showPass = !showPass"
                  :aria-label="showPass ? 'Sembunyikan sandi' : 'Tampilkan sandi'"
                >
                  <UIcon :name="showPass ? 'i-heroicons-eye-slash' : 'i-heroicons-eye'" class="size-5" />
                </button>
              </template>
            </UInput>
          </UFormField>

          <div class="flex items-center justify-between">
            <UCheckbox v-model="state.remember" label="Tetap masuk" :disabled="loading" />
            <NuxtLink to="/auth/forgot" class="text-sm text-primary hover:underline">Lupa sandi?</NuxtLink>
          </div>

          <UButton type="submit" :loading="loading || auth.pending" size="lg" block>Masuk</UButton>


          <div class="grid grid-cols-2 gap-3">
            <UButton variant="outline" block icon="i-simple-icons-google" :disabled="loading || auth.pending">Google</UButton>
            <UButton variant="outline" block icon="i-simple-icons-github" :disabled="loading || auth.pending">GitHub</UButton>
          </div>
        </UForm>
      </UCard>
    </div>

    <!-- Right: Full slider -->
    <div class="relative hidden lg:block">
      <!-- Slides -->
      <div class="absolute inset-0">
        <TransitionGroup name="fade" tag="div">
          <img
            v-for="(s, i) in slides"
            v-show="active === i"
            :key="s.src"
            :src="s.src"
            class="absolute inset-0 size-full object-cover"
            :alt="s.title"
            decoding="async"
            loading="eager"
          />
        </TransitionGroup>
      </div>

      <!-- Overlay gradient -->
      <div class="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/10" />

      <!-- Caption + Dots -->
      <div class="absolute bottom-0 inset-x-0 p-8 xl:p-12 text-white">
        <h2 class="text-2xl font-semibold">{{ slides[active]?.title ?? "" }}</h2>
        <p class="mt-2 max-w-xl text-white/80">
          {{ slides[active]?.desc ?? "" }}
        </p>

        <div class="mt-6 flex gap-2">
          <button
            v-for="(s, i) in slides"
            :key="i"
            class="h-1.5 flex-1 rounded-full transition"
            :class="i === active ? 'bg-white' : 'bg-white/40 hover:bg-white/60'"
            @click="active = i"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active { transition: opacity .6s ease; }
.fade-enter-from,
.fade-leave-to { opacity: 0; }
</style>

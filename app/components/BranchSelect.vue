<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
const props = defineProps<{ modelValue?: number | null; placeholder?: string }>()
const emit = defineEmits(['update:modelValue'])

const branchStore = useBranchStore()
const { branchList } = storeToRefs(branchStore)

// ================================
//  ASYNC SEARCH
// ================================
const searchTerm = ref('')
let debounce: ReturnType<typeof setTimeout> | null = null

watch(searchTerm, (term) => {
  if (debounce) clearTimeout(debounce)
  debounce = setTimeout(() => {
    // call the store method that fills branchList
    branchStore.fetchBranchList({ q: term, page: 1, per_page: 10 })
  }, 400)
})

// initial load (small page for dropdown)
onMounted(() => {
  branchStore.fetchBranchList({ page: 1, per_page: 10 })
})

// ================================
// Convert API → Nuxt UI items format
// ================================
const items = computed(() => {
  return (branchList.value ?? []).map(b => ({
    label: b.name,      // sesuaikan kalau field berbeda
    value: b.id
  }))
})

// ================================
// Normal v-model binding (id as number | null)
// ================================
const internalValue = computed<number | null>({
  get: () => (props.modelValue ?? null),
  set: (val: number | null) => emit('update:modelValue', val)
})
</script>

<template>
  <USelectMenu
    v-model="internalValue"
    v-model:search-term="searchTerm"
    :items="items"
    value-key="value"
    label-key="label"
    ignore-filter
    searchable
    :placeholder="placeholder ?? 'Select Branch'"
    class="w-full"
    :loading="branchStore.loading"
    icon="i-lucide-store"
  />
</template>

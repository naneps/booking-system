<script setup lang="ts">
import { computed, onMounted, ref, resolveComponent, watch } from 'vue';

const USelectMenu = resolveComponent('USelectMenu')
const UIcon = resolveComponent('UIcon')

const props = defineProps<{
  modelValue?: number | null
  placeholder?: string
  perPage?: number
  branchId?: number | null   // <-- NEW: filter by branch
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: number | null): void
}>()

const floorStore = useFloorStore()
const { floorList } = storeToRefs(floorStore) as any
const fallbackList = storeToRefs(floorStore).floors ?? ref([])

const searchTerm = ref('')
let debounce: ReturnType<typeof setTimeout> | null = null

async function doFetch(term = '') {
  const perPage = props.perPage ?? 10

  // prefer fetchFloorList if available
  if (typeof (floorStore as any).fetchFloorList === 'function') {
    await (floorStore as any).fetchFloorList({
      q: term,
      page: 1,
      per_page: perPage,
      branch_id: props.branchId ?? undefined  // <-- pass branch filter
    })
    return
  }

  // fallback to fetchFloors (paginated)
  if (typeof (floorStore as any).fetchFloors === 'function') {
    await (floorStore as any).fetchFloors({
      q: term,
      page: 1,
      per_page: perPage,
      branch_id: props.branchId ?? undefined
    })
    return
  }
}

watch(searchTerm, (term) => {
  if (debounce) clearTimeout(debounce)
  debounce = setTimeout(() => doFetch(term), 350)
})

// WATCH branchId: refetch when branch changes (and clear selection if needed)
watch(() => props.branchId, (newId, oldId) => {
  // always refetch floors for new branch (even if empty string)
  doFetch(searchTerm.value ?? '')

  // if branch changed and current value is not in new list, caller should clear model
  // but we can also emit null to be safe if branch becomes null
  if (newId == null) {
    emit('update:modelValue', null)
  }
})

onMounted(() => doFetch(''))

const items = computed(() => {
  const list = (floorList && floorList.value && Array.isArray(floorList.value))
    ? floorList.value
    : (Array.isArray(fallbackList.value) ? fallbackList.value : [])

  return list.map((f: any) => ({
    label: f.name ?? f.label ?? String(f.id ?? ''),
    value: f.id ?? f.value ?? null
  }))
})

const internalValue = computed<number | null>({
  get: () => props.modelValue ?? null,
  set: (v: number | null) => emit('update:modelValue', v)
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
    :placeholder="placeholder ?? 'Select floor...'"
    class="w-full"
    :loading="floorStore.loading"
    icon="i-lucide-layers"
  >
    <template #empty>
      <div class="px-3 py-2 text-sm text-neutral-500">No floors found</div>
    </template>
  </USelectMenu>
</template>

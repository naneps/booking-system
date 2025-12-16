<script setup lang="ts">
const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits(['update:modelValue'])

const branchStore = useBranchStore()
const { branchList, currentBranch, loading } = storeToRefs(branchStore)

onMounted(() => {
  if (branchList.value.length === 0) branchStore.fetchBranchList()
})

const selectBranch = (branchId: number) => {
  branchStore.setBranch(branchId)
  emit('update:modelValue', false)
}

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})
</script>

<template>
  <UModal v-model="isOpen">
    <UCard :ui="{ ring: '', divide: 'divide-y divide-gray-100 dark:divide-gray-800' }">
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-base font-semibold leading-6 text-gray-900 dark:text-white">Switch Branch</h3>
          <UButton color="gray" variant="ghost" icon="i-heroicons-x-mark-20-solid" class="-my-1" @click="isOpen = false" />
        </div>
      </template>

      <div class="p-2 max-h-[60vh] overflow-y-auto">
        <div v-if="loading" class="flex justify-center py-4"><UIcon name="i-lucide-loader-2" class="animate-spin w-6 h-6 text-primary-500" /></div>
        <div v-else class="space-y-1">
          <button
            v-for="branch in branchList"
            :key="branch.id"
            @click="selectBranch(branch.id)"
            class="w-full text-left px-4 py-3 rounded-md flex items-center justify-between transition-colors"
            :class="currentBranch?.id === branch.id ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30' : 'hover:bg-gray-50 dark:hover:bg-gray-800'"
          >
            <div>
               <div class="font-medium text-sm">{{ branch.name }}</div>
               <div class="text-xs text-gray-500">{{ branch.address || 'No address' }}</div>
            </div>
            <UIcon v-if="currentBranch?.id === branch.id" name="i-lucide-check" class="w-5 h-5 text-primary-500" />
          </button>
        </div>
      </div>
    </UCard>
  </UModal>
</template>
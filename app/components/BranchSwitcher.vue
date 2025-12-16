<script setup lang="ts">
const branchStore = useBranchStore()
const { branchList, currentBranch, loading } = storeToRefs(branchStore)

// Inisialisasi saat component di-mount (biasanya di layout)
onMounted(() => {
  branchStore.initializeBranch()
})

const handleSelect = (branch: any) => {
  branchStore.setBranch(branch)
  // Opsional: Refresh halaman agar semua fetch data ulang menggunakan branch_id baru
  window.location.reload()
}
</script>

<template>
  <div class="min-w-[200px]">
    <USelectMenu
      v-if="!loading"
      :model-value="currentBranch"
      :options="branchList"
      option-attribute="name"
      placeholder="Select Branch"
      searchable
      searchable-placeholder="Search branch..."
      @update:model-value="handleSelect"
    >
      <template #label>
        <div v-if="currentBranch" class="flex items-center gap-2 truncate">
          <UIcon name="i-lucide-store" class="w-4 h-4 text-gray-500" />
          <span class="font-medium truncate">{{ currentBranch.name }}</span>
        </div>
        <span v-else class="text-gray-400">Select Branch</span>
      </template>

      <template #option="{ option }">
        <div class="flex flex-col">
          <span class="truncate">{{ option.name }}</span>
          <span class="text-xs text-gray-500 truncate">{{ option.address || 'No address' }}</span>
        </div>
      </template>
    </USelectMenu>
    
    <USkeleton v-else class="h-8 w-48" />
  </div>
</template>
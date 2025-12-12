<script setup lang="ts">
import type { FormSubmitEvent } from '#ui/types'
import type { TableColumn } from '@nuxt/ui'
import { getCoreRowModel } from '@tanstack/vue-table'
import { h, nextTick, onMounted, reactive, ref, resolveComponent, watch } from 'vue'
import { z } from 'zod'
import type { Floor } from '~/types/master'

// Resolve Nuxt UI components
const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UIcon = resolveComponent('UIcon')
const UInput = resolveComponent('UInput')
const USelect = resolveComponent('USelect')
const USelectMenu = resolveComponent('USelectMenu')
const UTable = resolveComponent('UTable')
const UPagination = resolveComponent('UPagination')
const UForm = resolveComponent('UForm')
const UFormField = resolveComponent('UFormField')
const UTextarea = resolveComponent('UTextarea')

// Local components (sesuaikan path jika beda)
import BranchSelect from '~/components/BranchSelect.vue'

// Stores
const floorStore = useFloorStore()
const branchStore = useBranchStore()

const { floors, loading: floorLoading, totalItems } = storeToRefs(floorStore)
const { branchList } = storeToRefs(branchStore)

// Toast
const toast = useToast()
const formLoading = ref(false)

// ------------------ Filters / Pagination ------------------
const q = ref('')
const page = ref(1)
const pageSize = ref(10)
const selectedBranchFilter = ref<number | undefined>(undefined)

function refreshData() {
  floorStore.fetchFloors({
    page: page.value,
    per_page: pageSize.value,
    q: q.value || undefined,
    branch_id: selectedBranchFilter.value ?? undefined
  })
}

// initial
onMounted(async () => {
  // load branch list for dropdown
  await branchStore.fetchBranchList({ per_page: 100 })
  refreshData()
})

// watchers
watch([page, pageSize, selectedBranchFilter], () => refreshData())

let searchTimeout: ReturnType<typeof setTimeout> | null = null
watch(q, () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    page.value = 1
    refreshData()
  }, 450)
})

function resetFilters() {
  q.value = ''
  page.value = 1
  pageSize.value = 10
  selectedBranchFilter.value = undefined
  refreshData()
}

// ------------------ Actions (row menu) ------------------
function getRowItems(row: Floor) {
  return [
    [
      {
        label: 'Edit details',
        icon: 'i-lucide-pencil',
        onSelect: () => openEdit(row)
      },
      {
        label: 'Delete floor',
        icon: 'i-lucide-trash-2',
        iconClass: 'text-error-500 dark:text-error-400',
        onSelect: () => handleDelete(row.id)
      }
    ]
  ]
}

// ------------------ Columns ------------------
const columns: TableColumn<Floor>[] = [
  {
    accessorKey: 'code',
    header: 'Code',
    size: 80,
    cell: ({ row }) => {
      const val = row.getValue('code') as string
      return val
        ? h(UBadge, { color: 'neutral', variant: 'subtle', size: 'xs', class: 'font-mono' }, () => val)
        : h('span', { class: 'text-neutral-400 text-xs italic' }, '-')
    }
  },
  {
    accessorKey: 'name',
    header: 'Floor Name',
    cell: ({ row }) => h('div', { class: 'font-medium text-neutral-900 dark:text-white' }, row.getValue('name') as string)
  },
  {
    accessorKey: 'count_tables',
    header: 'Tables',
    cell: ({ row }) => {
      const count = row.original.count_tables || 0
      return h(
        UBadge,
        { color: count > 0 ? 'primary' : 'neutral', variant: 'subtle', size: 'xs', class: 'gap-1' },
        () => [
          h(UIcon, { name: 'i-lucide-armchair', class: 'w-3 h-3' }),
          `${count} Tables`
        ]
      )
    }
  },
  {
    accessorKey: 'branch.name',
    header: 'Branch',
    cell: ({ row }) => {
      const branchName = row.original.branch?.name
      return branchName
        ? h('div', { class: 'flex items-center gap-1.5 text-sm text-neutral-600 dark:text-neutral-300' }, [
            h(UIcon, { name: 'i-lucide-store', class: 'w-3.5 h-3.5 text-neutral-400' }),
            h('span', branchName)
          ])
        : h('span', { class: 'text-neutral-400 text-xs italic' }, 'No Branch')
    }
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => {
      return h('div', { class: 'text-right' }, h(UDropdownMenu, { content: { align: 'end' }, items: getRowItems(row.original), mode: 'hover' }, () => h(UButton, { icon: 'i-lucide-ellipsis-vertical', color: 'neutral', variant: 'ghost', size: 'xs' })))
    }
  }
]

// ------------------ FORM ------------------
const isFormOpen = ref(false)
const isEdit = ref(false)
const formRef = ref<any>(null)
const nativeSubmitRef = ref<HTMLButtonElement | null>(null)

const schema = z.object({
  name: z.string().min(1, 'Floor Name is required'),
  code: z.string().optional(),
  branch_id: z.number({ required_error: 'Please select a branch' })
})
type Schema = z.output<typeof schema>

const state = reactive({
  id: 0,
  name: '',
  code: '',
  branch_id: undefined as number | undefined
})

function closeForm() {
  isFormOpen.value = false
  setTimeout(() => {
    isEdit.value = false
    Object.assign(state, { id: 0, name: '', code: '', branch_id: undefined })
    if (formRef.value && typeof formRef.value.clear === 'function') formRef.value.clear()
  }, 300)
}

function openCreate() {
  Object.assign(state, { id: 0, name: '', code: '', branch_id: undefined })
  if (selectedBranchFilter.value) state.branch_id = selectedBranchFilter.value
  if (formRef.value && typeof formRef.value.clear === 'function') formRef.value.clear()
  isEdit.value = false
  isFormOpen.value = true
  nextTick(() => {
    // optional: focus first input
  })
}

function openEdit(row: Floor) {
  Object.assign(state, { id: row.id, name: row.name, code: row.code || '', branch_id: row.branch_id })
  isEdit.value = true
  isFormOpen.value = true
  nextTick(() => {
    // optional focus
  })
}

async function onSubmit(event: FormSubmitEvent<Schema>) {
  formLoading.value = true
  try {
    if (isEdit.value) {
      await floorStore.updateFloor(state.id, event.data)
      toast.add({ title: 'Success', description: 'Floor updated', icon: 'i-lucide-check-circle', color: 'success' })
    } else {
      await floorStore.createFloor(event.data)
      toast.add({ title: 'Success', description: 'Floor created', icon: 'i-lucide-check-circle', color: 'success' })
      if (page.value !== 1) page.value = 1
      else refreshData()
    }
    closeForm()
    refreshData()
  } catch (err: any) {
    if (err?.statusCode === 422) {
      const errors = err.data?.errors
      if (errors && formRef.value?.setErrors) {
        const formErrors = Object.keys(errors).map(key => ({ path: key, message: errors[key][0] }))
        formRef.value.setErrors(formErrors)
      }
      toast.add({ color: 'error', title: 'Validation Failed', description: 'Check input fields.' })
    } else {
      toast.add({ color: 'error', title: 'Error', description: err?.data?.message || 'Server Error' })
    }
  } finally {
    formLoading.value = false
  }
}

function handleDelete(id: number) {
  if (isFormOpen.value && state.id === id) closeForm()

  toast.add({
    title: 'Delete Floor?',
    color: 'error',
    icon: 'i-lucide-alert-triangle',
    actions: [
      {
        label: 'Delete',
        color: 'error',
        click: async () => {
          try {
            await floorStore.deleteFloor(id)
            refreshData()
            toast.add({ title: 'Deleted', description: 'Floor removed', icon: 'i-lucide-trash-2', color: 'success' })
          } catch (e) {
            toast.add({ title: 'Failed', color: 'error' })
          }
        }
      },
      { label: 'Cancel', color: 'neutral' }
    ]
  })
}
</script>

<template>
  <div class="flex gap-4 h-[calc(100vh-6rem)] min-h-0 overflow-hidden">
    <!-- Main list (no UCard wrapper as requested) -->
    <div class="flex-1 flex flex-col min-w-0 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 shadow-sm transition-all duration-300">
      <!-- Header -->
      <div class="p-4 border-b border-neutral-200 dark:border-neutral-800 flex flex-col gap-4">
        <div class="flex justify-between items-center">
          <div class="flex items-center gap-3">
            <UIcon name="i-lucide-layers-2" class="text-primary-500 w-7 h-7" />
            <div>
              <h1 class="text-xl font-bold text-neutral-900 dark:text-white leading-none">Floors</h1>
              <p class="text-xs text-neutral-500 mt-1.5">Manage floor levels & areas</p>
            </div>
          </div>

          <div class="flex gap-2">
            <UButton v-if="!isFormOpen" color="primary" icon="i-lucide-plus" @click="openCreate">Add Floor</UButton>
          </div>
        </div>

        <!-- Filters -->
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-2 flex-1 min-w-0">
            <UInput
              v-model="q"
              icon="i-lucide-search"
              placeholder="Search floor..."
              class="w-full sm:w-64 min-w-0"
              :loading="floorLoading"
              :ui="{ icon: { trailing: { pointer: '' } } }"
            >
              <template #trailing v-if="q">
                <UButton color="neutral" variant="link" icon="i-lucide-x" :padded="false" @click="resetFilters" />
              </template>
            </UInput>

            <BranchSelect v-model="selectedBranchFilter" placeholder="Filter by Branch" class="w-48" />

            <UButton v-if="selectedBranchFilter" icon="i-lucide-x" color="neutral" variant="ghost" size="xs" @click="selectedBranchFilter = undefined" />
          </div>

          <div class="flex items-center gap-2">
            <span class="text-xs text-neutral-500 font-medium hidden sm:inline">Rows:</span>
            <USelect v-model="pageSize" :options="[10, 20, 50, 100]" class="w-20" size="sm" />
          </div>
        </div>
      </div>

      <!-- Table area (scroll-safe) -->
      <div class="flex-1 overflow-auto relative min-h-0">
        <div class="overflow-x-auto w-full">
          <div class="min-w-[800px]">
            <UTable
              sticky
              :columns="columns"
              :data="floors"
              :loading="floorLoading"
              loading-animation="carousel"
              loading-color="primary"
              :table-options="{ getCoreRowModel: getCoreRowModel() }"
              class="w-full min-w-full"
              :ui="{
                th: { base: 'whitespace-nowrap bg-neutral-50 dark:bg-neutral-800/50 py-3.5 text-neutral-500 font-semibold' },
                td: { base: 'py-3 border-b border-neutral-100 dark:border-neutral-800/50' }
              }"
            >
              <template #loading-state>
                <div class="flex flex-col items-center justify-center h-48 text-neutral-500 gap-3">
                  <UIcon name="i-lucide-loader-2" class="animate-spin w-8 h-8 text-primary-500" />
                  <span>Loading floors...</span>
                </div>
              </template>

              <template #empty-state>
                <div class="flex flex-col items-center justify-center h-48 text-neutral-400 gap-3">
                  <UIcon name="i-lucide-search-x" class="w-10 h-10 opacity-30" />
                  <span>No floors found</span>
                  <UButton v-if="q || selectedBranchFilter" variant="soft" color="neutral" size="xs" @click="resetFilters" class="mt-2">Clear Filters</UButton>
                </div>
              </template>
            </UTable>
          </div>
        </div>
      </div>

      <!-- Footer: pagination -->
      <div class="p-3 border-t border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-neutral-50/50 dark:bg-neutral-900">
        <span class="text-xs text-neutral-500">Total: <strong>{{ totalItems }}</strong> floors</span>
        <UPagination v-model:page="page" :total="totalItems" :per-page="pageSize" :max="5" size="xs" :disabled="floorLoading" />
      </div>
    </div>

    <!-- Sidebar Form -->
    <div
      class="h-full transition-all duration-300 ease-in-out bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-xl flex flex-col"
      :class="isFormOpen ? 'w-[400px] opacity-100 translate-x-0 mr-1' : 'w-0 opacity-0 translate-x-10 overflow-hidden border-0'">
      <div class="p-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-neutral-50/30 dark:bg-neutral-800/30">
        <div class="flex items-center gap-2">
          <UIcon :name="isEdit ? 'i-lucide-pencil' : 'i-lucide-plus'" class="w-5 h-5 text-primary-500" />
          <h3 class="font-semibold text-lg text-neutral-900 dark:text-white">{{ isEdit ? 'Edit Floor' : 'New Floor' }}</h3>
        </div>
        <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="xs" @click="closeForm" />
      </div>

      <div class="flex-1 overflow-y-auto p-5 custom-scrollbar min-h-0">
        <UForm ref="formRef" :schema="schema" :state="state" class="flex flex-col gap-3" @submit="onSubmit">
          <!-- native submit hidden for footer fallback -->
          <button ref="nativeSubmitRef" type="submit" class="hidden" />

          <UFormField label="Select Branch" name="branch_id" required>
            <BranchSelect v-model="state.branch_id" placeholder="Choose a branch" class="w-full" />
          </UFormField>

          <UFormField label="Floor Code (Optional)" name="code">
            <UInput v-model="state.code" placeholder="e.g. L1" icon="i-lucide-qr-code" class="w-full" />
          </UFormField>

          <UFormField label="Floor Name" name="name" required>
            <UInput v-model="state.name" placeholder="e.g. Main Hall" icon="i-lucide-layers" class="w-full" autofocus />
          </UFormField>

        </UForm>
      </div>

      <div class="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 flex gap-3">
        <UButton block color="neutral" variant="outline" @click="closeForm" class="flex-1">Cancel</UButton>
        <UButton block color="primary" :loading="formLoading" class="flex-1" @click="nativeSubmitRef?.click?.()" icon="i-lucide-save">
          {{ isEdit ? 'Save Changes' : 'Create Floor' }}
        </UButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); border-radius: 8px; }
</style>

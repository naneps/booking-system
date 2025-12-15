<script setup lang="ts">
import type { FormError, FormSubmitEvent } from '#ui/types'
import type { TableColumn } from '@nuxt/ui'
import { getCoreRowModel } from '@tanstack/vue-table'
import { h, resolveComponent } from 'vue'
import { z } from 'zod'
import type { Branch } from '~/types/master'

// Resolvers
const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UIcon = resolveComponent('UIcon')

// --- STORE & STATE ---
const branchStore = useBranchStore()
const { branches, loading, totalItems } = storeToRefs(branchStore)
const toast = useToast()
const formLoading = ref(false)

const q = ref('')
const page = ref(1)
const pageSize = ref(10)

const refreshData = () => {
  branchStore.fetchBranches({
    page: page.value,
    per_page: pageSize.value,
    q: q.value
  })
}

onMounted(() => refreshData())

watch([page, pageSize], () => refreshData())

let searchTimeout: NodeJS.Timeout
watch(q, () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => { page.value = 1; refreshData() }, 500)
})

function resetFilters() {
  q.value = ''
  page.value = 1
  pageSize.value = 10
  refreshData()
}

// --- HELPER ACTIONS (onSelect) ---
function getRowItems(row: Branch) {
  return [
    [
      {
        label: 'Edit details',
        icon: 'i-lucide-pencil',
        onSelect: () => openEdit(row)
      },
      {
        label: 'Delete branch',
        icon: 'i-lucide-trash-2',
        iconClass: 'text-error-500 dark:text-error-400',
        onSelect: () => handleDelete(row.id)
      }
    ]
  ]
}

// --- TABLE CONFIG ---
const columns: TableColumn<Branch>[] = [
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
    header: 'Branch Name',
    cell: ({ row }) => h('div', { class: 'font-medium text-neutral-900 dark:text-white' }, row.getValue('name') as string)
  },
  {
    accessorKey: 'phone',
    header: 'Phone',
    cell: ({ row }) => row.original.phone 
      ? h('div', { class: 'flex items-center gap-1.5 text-sm text-neutral-500' }, [
          h(UIcon, { name: 'i-lucide-phone', class: 'w-3.5 h-3.5 shrink-0' }),
          h('span', row.original.phone)
        ])
      : '-'
  },
  {
    accessorKey: 'address',
    header: 'Address',
    // FIX: Using line-clamp-2 allows 2 lines of text before truncating, 
    // and removing fixed max-width lets it fill available space.
    cell: ({ row }) => row.original.address 
      ? h('div', { class: 'flex items-start gap-1.5 text-sm text-neutral-500' }, [
          h(UIcon, { name: 'i-lucide-map-pin', class: 'w-3.5 h-3.5 mt-0.5 shrink-0' }),
          h('span', { class: 'line-clamp-2' }, row.original.address)
        ]) 
      : '-'
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => {
      return h(
        'div',
        { class: 'text-right' },
        h(
          UDropdownMenu,
          {
            content: { align: 'end' },
            items: getRowItems(row.original),
            mode: 'hover'
          },
          () => h(UButton, {
            icon: 'i-lucide-ellipsis-vertical',
            color: 'neutral',
            variant: 'ghost',
            size: 'xs'
          })
        )
      )
    }
  }
]

// --- FORM LOGIC ---
const isFormOpen = ref(false)
const isEdit = ref(false)
const formRef = ref()

const schema = z.object({
  code: z.string().optional(),
  name: z.string().min(1, 'Branch Name is required'),
  address: z.string().optional(),
  phone: z.string().optional()
})
type Schema = z.output<typeof schema>

const state = reactive({ id: 0, code: '', name: '', address: '', phone: '' })

function closeForm() {
  isFormOpen.value = false
  setTimeout(() => {
    isEdit.value = false
    Object.assign(state, { id: 0, code: '', name: '', address: '', phone: '' })
    if(formRef.value) formRef.value.clear()
  }, 300)
}

function openCreate() {
  Object.assign(state, { id: 0, code: '', name: '', address: '', phone: '' })
  if(formRef.value) formRef.value.clear()
  isEdit.value = false
  isFormOpen.value = true
}

function openEdit(row: Branch) {
  Object.assign(state, {
    id: row.id,
    code: row.code || '',
    name: row.name,
    address: row.address || '',
    phone: row.phone || ''
  })
  isEdit.value = true
  isFormOpen.value = true
}

async function onSubmit(event: FormSubmitEvent<Schema>) {
  formLoading.value = true
  try {
    if (isEdit.value) {
      await branchStore.updateBranch(state.id, event.data)
      toast.add({ title: 'Success', description: 'Branch updated successfully', icon: 'i-lucide-check-circle', color: 'success' })
    } else {
      await branchStore.createBranch(event.data)
      toast.add({ title: 'Success', description: 'New branch created', icon: 'i-lucide-check-circle', color: 'success' })
      page.value = 1
      q.value = ''
      refreshData()
    }
    closeForm()
  } catch (err: any) {
    if (err.statusCode === 422) {
      const errors = err.data?.errors
      const formErrors: FormError[] = []
      if (errors) {
        Object.keys(errors).forEach(key => {
          formErrors.push({ path: key, message: errors[key][0] })
        })
      }
      formRef.value.setErrors(formErrors)
      toast.add({ color: 'error', title: 'Validation Failed', description: 'Check input fields.' })
    } else {
      toast.add({ color: 'error', title: 'Error', description: err.data?.message || 'Server Error' })
    }
  } finally {
    formLoading.value = false
  }
}

function handleDelete(id: number) {
  if (isFormOpen.value && state.id === id) closeForm()

  toast.add({
    title: 'Delete Branch?',
    description: 'This action cannot be undone.',
    color: 'error',
    icon: 'i-lucide-alert-triangle',
    actions: [{
      label: 'Delete', 
      color: 'error',
      onClick: async () => {
        try {
          await branchStore.deleteBranch(id)
          refreshData()
          toast.add({ title: 'Deleted', description: 'Branch removed', icon: 'i-lucide-trash-2', color: 'success' })
        } catch (e) { 
          toast.add({ title: 'Failed', color: 'error' }) 
        }
      }
    }, { label: 'Cancel', color: 'neutral' }]
  })
}
</script>

<template>
  <div class="flex gap-4 h-[calc(100vh-6rem)] min-h-0 overflow-hidden">
    
    <div class="flex-1 flex flex-col min-w-0 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 shadow-sm transition-all duration-300">
      
      <div class="p-4 border-b border-neutral-200 dark:border-neutral-800 flex flex-col gap-4">
        <div class="flex justify-between items-center">
          
          <div class="flex items-center gap-3">
            <UIcon name="i-lucide-store" class="text-primary-500 w-7 h-7" />
            <div>
              <h1 class="text-xl font-bold text-neutral-900 dark:text-white leading-none">Branches</h1>
              <p class="text-xs text-neutral-500 mt-1.5">Manage outlet locations</p>
            </div>
          </div>

          <div class="flex gap-2">
             <UButton 
               v-if="!isFormOpen" 
               color="primary" 
               icon="i-lucide-plus" 
               @click="openCreate"
             >
               Add Branch
             </UButton>
          </div>
        </div>

        <div class="flex items-center justify-between gap-3">
          <div class="flex-1 relative">
             <UInput 
               v-model="q" 
               icon="i-lucide-search" 
               placeholder="Search branch name, code..." 
               class="w-full sm:w-72" 
               :loading="loading"
             >
               <template #trailing v-if="q">
                 <UButton color="neutral" variant="link" icon="i-lucide-x" :padded="false" @click="resetFilters" />
               </template>
             </UInput>
          </div>

          <div class="flex items-center gap-2">
             <span class="text-xs text-neutral-500 font-medium hidden sm:inline">Rows:</span>
             <USelect 
               v-model="pageSize" 
               :items="[10, 20, 50, 100]" 
               class="w-20"
               size="sm"
             />
          </div>
        </div>
      </div>

      <div class="flex-1 overflow-auto relative">
        <UTable
          sticky
          :columns="columns"
          :data="branches"
          :loading="loading"
          loading-animation="carousel"
          loading-color="primary"
          :table-options="{ getCoreRowModel: getCoreRowModel() }"
          class="w-full"
        
        >
          <template #loading-state>
             <div class="flex flex-col items-center justify-center h-48 text-neutral-500 gap-3">
                <UIcon name="i-lucide-loader-2" class="animate-spin w-8 h-8 text-primary-500" />
                <span class="text-sm font-medium">Synchronizing data...</span>
             </div>
          </template>

          <template #empty-state>
             <div class="flex flex-col items-center justify-center h-48 text-neutral-400 gap-3">
                <UIcon name="i-lucide-search-x" class="w-10 h-10 opacity-30" />
                <div class="text-center">
                   <p class="font-medium text-neutral-600 dark:text-neutral-300">No branches found</p>
                   <p class="text-xs mt-1">Try adjusting your search filters</p>
                </div>
                <UButton v-if="q" variant="soft" color="neutral" size="xs" @click="resetFilters" class="mt-2">
                   Clear Search
                </UButton>
             </div>
          </template>
        </UTable>
      </div>

      <div class="p-3 border-t border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-neutral-50/50 dark:bg-neutral-900">
         <span class="text-xs text-neutral-500">
            Total: <strong class="text-neutral-700 dark:text-white">{{ totalItems }}</strong> records
         </span>
         <UPagination 
            v-model:page="page" 
            :total="totalItems" 
            :items-per-page="pageSize" 
            :max="5"
            size="xs"
            :disabled="loading"
         />
      </div>
    </div>

    <div 
      class="h-full transition-all duration-300 ease-in-out bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-xl flex flex-col"
      :class="isFormOpen ? 'w-[400px] opacity-100 translate-x-0 mr-1' : 'w-0 opacity-0 translate-x-10 overflow-hidden border-0'"
    >
        <div class="p-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-neutral-50/30 dark:bg-neutral-800/30">
           <div class="flex items-center gap-2">
              <UIcon :name="isEdit ? 'i-lucide-pencil' : 'i-lucide-plus'" class="w-5 h-5 text-primary-500" />
              <h3 class="font-semibold text-lg text-neutral-900 dark:text-white">
                 {{ isEdit ? 'Edit Branch' : 'New Branch' }}
              </h3>
           </div>
           <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="xs" @click="closeForm" />
        </div>

        <div class="flex-1 overflow-y-auto p-5 custom-scrollbar">
           
           <UForm ref="formRef" :schema="schema" :state="state" class="space-y-5" @submit="onSubmit">
              
              <UFormGroup label="Branch Code" name="code" help="Unique identifier code (e.g., JKT-01)">
                 <UInput 
                    v-model="state.code" 
                    placeholder="Auto generated if empty" 
                    icon="i-lucide-qr-code" 
                    class="w-full" 
                    autofocus 
                 />
              </UFormGroup>

              <UFormGroup label="Branch Name" name="name" required>
                 <UInput 
                    v-model="state.name" 
                    placeholder="Enter branch name" 
                    icon="i-lucide-store" 
                    class="w-full" 
                 />
              </UFormGroup>

              <div class="h-px bg-neutral-100 dark:bg-neutral-800 my-2"></div>

              <UFormGroup label="Phone Number" name="phone">
                 <UInput 
                    v-model="state.phone" 
                    placeholder="+62..." 
                    icon="i-lucide-phone" 
                    class="w-full" 
                 />
              </UFormGroup>

              <UFormGroup label="Full Address" name="address">
                 <UTextarea 
                    v-model="state.address" 
                    :rows="4" 
                    placeholder="Street name, city, postal code..." 
                    resize 
                    class="w-full" 
                 />
              </UFormGroup>
              
              <button type="submit" class="hidden"></button>
           </UForm>
        </div>

        <div class="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 flex gap-3">
           <UButton block color="neutral" variant="outline" @click="closeForm" class="flex-1">
             Cancel
           </UButton>
           <UButton block color="primary" :loading="formLoading" @click="formRef.submit()" class="flex-1" icon="i-lucide-save">
              {{ isEdit ? 'Save Changes' : 'Create Branch' }}
           </UButton>
        </div>
    </div>

  </div>
</template>s
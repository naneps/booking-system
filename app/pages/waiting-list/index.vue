<script setup lang="ts">
import type { FormSubmitEvent } from '#ui/types'
import type { TableColumn } from '@nuxt/ui'
import { getCoreRowModel } from '@tanstack/vue-table'
import { h, onMounted, reactive, ref, resolveComponent } from 'vue'
import { z } from 'zod'
import type { Waitlist } from '~/stores/waitlist.types'

// UI
const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')
const UIcon = resolveComponent('UIcon')

// STORE
const waitlistStore = useWaitlistStore()
const { waitlists, loading } = storeToRefs(waitlistStore)
const toast = useToast()

// FORM
const isFormOpen = ref(false)
const formLoading = ref(false)
const formRef = ref()

const schema = z.object({
  customer_name: z.string().min(1, 'Customer name is required'),
  customer_phone: z.string().optional(),
  pax: z.number().min(1),
  note: z.string().optional()
})
type Schema = z.output<typeof schema>

const state = reactive({
  customer_name: '',
  customer_phone: '',
  pax: 1,
  note: ''
})

// FETCH
onMounted(() => {
  waitlistStore.fetchWaitlists({ status: 'waiting' })
})

// ACTIONS
function openCreate() {
  Object.assign(state, { customer_name: '', customer_phone: '', pax: 1, note: '' })
  if (formRef.value) formRef.value.clear()
  isFormOpen.value = true
}

function closeForm() {
  isFormOpen.value = false
}

async function onSubmit(e: FormSubmitEvent<Schema>) {
  formLoading.value = true
  try {
    await waitlistStore.addWaitlist(e.data)
    toast.add({
      title: 'Success',
      description: 'Guest added to waitlist',
      color: 'success',
      icon: 'i-lucide-check-circle'
    })
    closeForm()
  } catch (err: any) {
    toast.add({
      title: 'Error',
      description: err.message || 'Failed',
      color: 'error'
    })
  } finally {
    formLoading.value = false
  }
}

async function seatGuest(id: number) {
  try {
    await waitlistStore.seatGuest(id, [])
    toast.add({ title: 'Seated', color: 'success' })
  } catch {
    toast.add({ title: 'Failed', color: 'error' })
  }
}

async function cancelWaitlist(id: number) {
  try {
    await waitlistStore.updateWaitlist(id, { status: 'cancelled' })
    toast.add({ title: 'Cancelled', color: 'neutral' })
  } catch {
    toast.add({ title: 'Failed', color: 'error' })
  }
}

// TABLE COLUMNS
const columns: TableColumn<Waitlist>[] = [
  {
    accessorKey: 'queue_number',
    header: '#',
    size: 60,
    cell: ({ row }) =>
      h(UBadge, { size: 'xs', color: 'primary', variant: 'soft', class: 'font-mono' },
        () => `#${row.getValue('queue_number')}`)
  },
  {
    accessorKey: 'customer_name',
    header: 'Customer',
    cell: ({ row }) =>
      h('div', { class: 'flex flex-col' }, [
        h('span', { class: 'font-medium text-neutral-900 dark:text-white' },
          row.getValue('customer_name')),
        row.original.note
          ? h('span', { class: 'text-xs text-neutral-400 line-clamp-1' }, row.original.note)
          : null
      ])
  },
  {
    accessorKey: 'pax',
    header: 'Pax',
    size: 70,
    cell: ({ row }) =>
      h(UBadge, { size: 'xs', variant: 'subtle' }, () => `${row.getValue('pax')} pax`)
  },
  {
    accessorKey: 'joined_time',
    header: 'Join',
    size: 80,
    cell: ({ row }) =>
      h('span', { class: 'font-mono text-sm text-neutral-600' },
        row.getValue('joined_time'))
  },
  {
    accessorKey: 'wait_time',
    header: 'Wait',
    size: 80,
    cell: ({ row }) =>
      h(
        UBadge,
        {
          size: 'xs',
          color: row.original.wait_time >= 30 ? 'error' : 'warning',
          variant: 'soft'
        },
        () => `${row.getValue('wait_time')}m`
      )
  },
  {
    id: 'actions',
    header: '',
    size: 120,
    cell: ({ row }) =>
      h('div', { class: 'flex justify-end gap-1' }, [
        h(UButton, {
          icon: 'i-lucide-armchair',
          size: 'xs',
          color: 'success',
          variant: 'soft',
          title: 'Seat',
          onClick: () => seatGuest(row.original.id)
        }),
        h(UButton, {
          icon: 'i-lucide-x',
          size: 'xs',
          color: 'error',
          variant: 'ghost',
          title: 'Cancel',
          onClick: () => cancelWaitlist(row.original.id)
        })
      ])
  }
]
</script>

<template>
  <div class="flex gap-4 h-[calc(100vh-6rem)] min-h-0 overflow-hidden">

    <!-- LEFT : TABLE -->
    <div
      class="flex-1 flex flex-col min-w-0 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 shadow-sm">

      <div class="p-4 border-b flex justify-between items-center">
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-users" class="w-6 h-6 text-primary-500" />
          <h1 class="text-lg font-bold">Waitlist</h1>
        </div>
        <UButton color="primary" icon="i-lucide-plus" @click="openCreate">
          Add Walk-in
        </UButton>
      </div>

      <div class="flex-1 overflow-auto">
        <UTable
          sticky
          :columns="columns"
          :data="waitlists"
          :loading="loading"
          :table-options="{ getCoreRowModel }"
        />
      </div>
    </div>

    <!-- RIGHT : FORM -->
    <div
      class="h-full transition-all duration-300 ease-in-out bg-white dark:bg-neutral-900
             border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-xl flex flex-col"
      :class="isFormOpen
        ? 'w-[400px] opacity-100 translate-x-0'
        : 'w-0 opacity-0 translate-x-10 overflow-hidden border-0'">

      <div class="p-4 border-b flex justify-between items-center bg-neutral-50 dark:bg-neutral-800/40">
        <h3 class="font-semibold text-lg">New Walk-in</h3>
        <UButton icon="i-lucide-x" variant="ghost" size="xs" @click="closeForm" />
      </div>

      <!-- FORM BODY -->
      <div class="flex-1 overflow-y-auto p-5">
        <UForm
          ref="formRef"
          :schema="schema"
          :state="state"
          class="space-y-5"
          @submit="onSubmit"
        >
          <UFormGroup label="Customer Name" name="customer_name" required>
            <UInput
              v-model="state.customer_name"
              placeholder="Customer full name"
              icon="i-lucide-user"
              class="w-full"
              autofocus
            />
          </UFormGroup>

          <UFormGroup label="Phone Number" name="customer_phone">
            <UInput
              v-model="state.customer_phone"
              placeholder="+62..."
              icon="i-lucide-phone"
              class="w-full"
            />
          </UFormGroup>

          <UFormGroup label="Number of Guests" name="pax">
            <UInput
              v-model.number="state.pax"
              type="number"
              min="1"
              icon="i-lucide-users"
              class="w-full"
            />
          </UFormGroup>

          <div class="h-px bg-neutral-100 dark:bg-neutral-800"></div>

          <UFormGroup label="Note" name="note">
            <UTextarea
              v-model="state.note"
              :rows="4"
              placeholder="Stroller, baby chair, smoking..."
              class="w-full"
            />
          </UFormGroup>

          <button type="submit" class="hidden"></button>
        </UForm>
      </div>

      <!-- FOOTER -->
      <div class="p-4 border-t flex gap-3">
        <UButton block variant="outline" @click="closeForm">Cancel</UButton>
        <UButton
          block
          color="primary"
          :loading="formLoading"
          icon="i-lucide-save"
          @click="formRef.submit()"
        >
          Save
        </UButton>
      </div>
    </div>

  </div>
</template>

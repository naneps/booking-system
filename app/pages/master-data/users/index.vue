<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { getCoreRowModel } from '@tanstack/vue-table'
import { h, resolveComponent } from 'vue'

const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')
const UDropdownMenu = resolveComponent('UDropdownMenu')

type UserRow = {
  id: number
  avatar?: string
  name: string
  username: string
  email: string
  roles: string[]
  branch: string
  is_active: boolean
  created_at: string // ISO
}

const rows = ref<UserRow[]>([
  { id:1, name:'Jihan', username:'cashier', email:'cashier@example.com', roles:['Cashier'],    branch:'HARU CAFE STAGGING', is_active:true,  created_at:'2024-01-30T01:55:55Z', avatar:'https://i.pravatar.cc/96?u=1' },
  { id:2, name:'Alya Putri', username:'alya', email:'alya@haru.cafe',    roles:['Manager'],    branch:'HARU CAFE STAGGING', is_active:true,  created_at:'2024-02-12T09:22:00Z', avatar:'https://i.pravatar.cc/96?u=2' },
  { id:3, name:'Rama Dwi', username:'rama',   email:'rama@haru.cafe',    roles:['Cashier'],    branch:'HARU CAFE STAGGING', is_active:false, created_at:'2024-03-03T11:05:00Z', avatar:'https://i.pravatar.cc/96?u=3' },
  { id:4, name:'Salsa',    username:'salsa',  email:'salsa@haru.cafe',   roles:['Supervisor'], branch:'HARU CAFE STAGGING', is_active:true,  created_at:'2024-03-18T15:40:00Z', avatar:'https://i.pravatar.cc/96?u=4' },
  { id:5, name:'Andi',     username:'andi',   email:'andi@haru.cafe',    roles:['Admin'],      branch:'HARU CAFE HQ',       is_active:true,  created_at:'2024-04-01T08:10:00Z', avatar:'https://i.pravatar.cc/96?u=5' },
  { id:6, name:'Rani',     username:'rani',   email:'rani@haru.cafe',    roles:['Barista'],    branch:'HARU CAFE HQ',       is_active:false, created_at:'2024-05-19T17:45:00Z', avatar:'https://i.pravatar.cc/96?u=8' },
  { id:7, name:'Gilang',   username:'gil',    email:'gilang@haru.cafe',  roles:['Admin'],      branch:'HARU CAFE HQ',       is_active:true,  created_at:'2024-06-01T10:20:00Z', avatar:'https://i.pravatar.cc/96?u=9' },
  { id:8, name:'Sinta',    username:'sinta',  email:'sinta@haru.cafe',   roles:['Manager'],    branch:'HARU CAFE STAGGING', is_active:true,  created_at:'2024-06-12T14:05:00Z', avatar:'https://i.pravatar.cc/96?u=10' }
])

/* --------- filters (dummy; nanti server-side) --------- */
const q = ref('')
const status = ref<'all'|'active'|'inactive'>('all')
const branch = ref<string | undefined>(undefined)
const rolesSel = ref<string[]>([])
const page = ref(1)
const pageSize = ref(10)
definePageMeta({
  title: 'Users',
  breadcrumb: 'Users',
  icon: 'i-lucide-user-round'
})
const branchItems = computed(() => [
  { label: 'All branches', value: undefined },
  ...Array.from(new Set(rows.value.map(r => r.branch))).map(b => ({ label: b, value: b }))
])
const roleItems = computed(() =>
  Array.from(new Set(rows.value.flatMap(r => r.roles))).map(r => ({ label: r, value: r }))
)

const filtered = computed(() => {
  const s = q.value.trim().toLowerCase()
  return rows.value.filter(r => {
    if (s && !(r.name.toLowerCase().includes(s) || r.username.toLowerCase().includes(s) || r.email.toLowerCase().includes(s))) return false
    if (status.value !== 'all') {
      if (status.value === 'active' && !r.is_active) return false
      if (status.value === 'inactive' && r.is_active) return false
    }
    if (branch.value && r.branch !== branch.value) return false
    if (rolesSel.value.length && !rolesSel.value.every(role => r.roles.includes(role))) return false
    return true
  })
})

/* --------- client pagination --------- */
const paged = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filtered.value.slice(start, start + pageSize.value)
})
watch([filtered, pageSize], () => (page.value = 1))

/* ---------------- columns ---------------- */
const columns: TableColumn<UserRow>[] = [
  {
    accessorKey: 'avatar',
    header: '',
    enableSorting: false,
    size: 48,
    cell: ({ row }) => h('img', {
      src: (row.getValue('avatar') as string) || 'https://dummyimage.com/96x96/2e2e2e/ffffff.png&text=U',
      alt: 'avatar', class: 'size-8 rounded-full object-cover'
    })
  },
  {
    accessorKey: 'name',
    header: 'User',
    cell: ({ row }) => h('div', { class:'leading-tight' }, [
      h('div', { class:'font-medium' }, row.getValue('name') as string),
      h('div', { class:'text-xs text-muted' }, row.original.email)
    ])
  },
  { accessorKey: 'username', header: 'Username' },
  {
    accessorKey: 'roles',
    header: 'Roles',
    cell: ({ row }) =>
      h('div', { class:'flex flex-wrap gap-1' },
        (row.getValue('roles') as string[]).map(r =>
          h('span', { key:r, class:'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary' }, r)
        )
      )
  },
  { accessorKey: 'branch', header: 'Branch' },
  {
    accessorKey: 'is_active',
    header: 'Status',
    cell: ({ row }) =>
      h(UBadge, { color: (row.getValue('is_active')) ? 'success' : 'error', variant: 'subtle' },
        () => (row.getValue('is_active')) ? 'Active' : 'Inactive')
  },
  {
    accessorKey: 'created_at',
    header: 'Created',
    cell: ({ row }) =>
      new Date(row.getValue('created_at') as string).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' })
  },
  {
    id: 'actions',
    header: '',
    enableSorting: false,
    cell: ({ row }) =>
      h('div', { class:'text-right' },
        h(UDropdownMenu, {
          'aria-label':'Actions', content:{ align:'end' },
          items:[
            { type:'label', label:'Actions' },
            { label:'View',  icon:'i-lucide-eye',    onSelect:() => console.log('view', row.original.id) },
            { label:'Edit',  icon:'i-lucide-pencil', onSelect:() => console.log('edit', row.original.id) },
            { type:'separator' },
            { label:'Delete', icon:'i-lucide-trash-2', onSelect:() => console.log('delete', row.original.id) }
          ]
        }, () => h(UButton, { icon:'i-lucide-ellipsis-vertical', color:'neutral', variant:'ghost' }))
      )
  }
]

function resetFilters() {
  q.value=''; status.value='all'; branch.value=undefined; rolesSel.value=[]; page.value=1
}
</script>

<template>
  <UCard>
    <!-- filters -->
    <template #header>
      <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-users" class="text-primary" />
          <h2 class="text-base font-semibold">Users</h2>
        </div>

        <div class="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
          <UInput v-model="q" class="w-full md:w-64" icon="i-lucide-search" placeholder="Cari nama / username / email…" />
          <USelect v-model="status" :items="[
            {label:'All status', value:'all'},
            {label:'Active', value:'active'},
            {label:'Inactive', value:'inactive'}]" class="w-36" />
          <USelect v-model="branch" :items="branchItems" class="w-48" />
          <USelectMenu v-model="rolesSel" :items="roleItems" multiple placeholder="Roles" class="w-48" />
          <USelect v-model="pageSize" :items="[{label:'10 rows',value:10},{label:'20 rows',value:20},{label:'50 rows',value:50}]" class="w-28" />
          <UButton variant="soft" color="neutral" icon="i-lucide-rotate-ccw" @click="resetFilters">Reset</UButton>
          <UButton color="primary" icon="i-lucide-plus" to="/master-data/users/create-user">Tambah Baru</UButton>
        </div>
      </div>
    </template>

    <!-- table -->
    <template #default>
      <UTable
        sticky
        :columns="columns"
        :data="paged"
        :table-options="{ getCoreRowModel: getCoreRowModel() }"
        class="flex-1 max-h-[520px]"
      />
    </template>

    <!-- pagination bottom -->
    <template #footer>
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div class="text-sm text-muted">
          Showing <span class="font-medium">{{ paged.length }}</span> of
          <span class="font-medium">{{ filtered.length }}</span> users
        </div>
        <div class="flex justify-center border-t border-default pt-4 w-full sm:w-auto">
          <UPagination v-model:page="page" :total="filtered.length" :items-per-page="pageSize" />
        </div>
      </div>
    </template>
  </UCard>
</template>

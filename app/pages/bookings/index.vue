
<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import { getCoreRowModel } from "@tanstack/vue-table";
import { h, onMounted, ref, resolveComponent, watch } from "vue";

/* --- COMPONENTS --- */
const UButton = resolveComponent("UButton");
const UBadge = resolveComponent("UBadge");
const UInput = resolveComponent("UInput");
const USelect = resolveComponent("USelect");
const USelectMenu = resolveComponent("USelectMenu");
const UIcon = resolveComponent("UIcon");
const toast = useToast();

// import BranchSelect from "~/components/common/BranchSelect.vue";
// import FloorSelect from "~/components/common/FloorSelect.vue";

/* --- STORES --- */
const bookingStore = useBookingStore();
const { bookings, loading, totalItems } = storeToRefs(bookingStore);

/* --- STATE --- */
const q = ref("");
const page = ref(1);
const pageSize = ref(10);

// --- FILTERS STATE ---
const selectedBranchFilter = ref<number | undefined>(undefined);
const selectedFloorFilter = ref<number | undefined>(undefined);
const selectedStatusFilter = ref<string | undefined>(undefined);

// BARU: Filter Tanggal
const filterDateFrom = ref<string | undefined>(undefined);
const filterDateTo = ref<string | undefined>(undefined);

// Sorting
const sort = ref<{ column: string; direction: 'asc' | 'desc' } | null>({ column: 'start_at', direction: 'desc' });

const statusOptions = [
  "pending",
  "confirmed",
  "checked_in",
  "completed",
  "cancelled",
];

/* --- FETCH DATA --- */
const refreshData = async () => {
  const params: any = {
    page: page.value,
    per_page: pageSize.value,
    q: q.value,
    branch_id: selectedBranchFilter.value,
    // floor_id: selectedFloorFilter.value, // Aktifkan jika backend support
    status: selectedStatusFilter.value,
    order_by: sort.value?.column,
    order_dir: sort.value?.direction,
    
    // BARU: Kirim Date Range ke Backend
    from: filterDateFrom.value,
    to: filterDateTo.value
  };

  await bookingStore.fetchBookings(params);
};

onMounted(() => {
  refreshData();
});

// Watchers: Auto refresh saat filter berubah
watch([
  page, 
  pageSize, 
  selectedBranchFilter, 
  selectedFloorFilter, 
  selectedStatusFilter, 
  filterDateFrom, // Watch From
  filterDateTo,   // Watch To
  sort
], () => {
  refreshData();
});

// Search Debounce
let searchTimeout: NodeJS.Timeout;
watch(q, () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    page.value = 1;
    refreshData();
  }, 500);
});

/* --- ACTIONS (API CALLS) --- */
const handleConfirm = async (id: number) => {
  try {
    await bookingStore.updateBooking(id, { status: 'confirmed' });
    toast.add({ title: "Booking Confirmed", color: "success", icon: "i-lucide-check" });
    refreshData();
  } catch (e: any) {
    toast.add({ title: "Error", description: e.message, color: "error" });
  }
};

const handleSeat = async (id: number) => {
  try {
    await bookingStore.checkIn(id); 
    toast.add({ title: "Customer Seated", color: "info", icon: "i-lucide-armchair" });
    refreshData();
  } catch (e: any) {
    toast.add({ title: "Error", description: e.message, color: "error" });
  }
};

const handleComplete = async (id: number) => {
  try {
    await bookingStore.checkOut(id); 
    toast.add({ title: "Booking Completed", color: "success", icon: "i-lucide-check-circle" });
    refreshData();
  } catch (e: any) {
    toast.add({ title: "Error", description: e.message, color: "error" });
  }
};

const handleCancel = async (id: number) => {
  try {
    await bookingStore.deleteBooking(id); 
    toast.add({ title: "Booking Cancelled", color: "error", icon: "i-lucide-x-circle" });
    refreshData();
  } catch (e: any) {
    toast.add({ title: "Error", description: e.message, color: "error" });
  }
};

/* --- HELPERS --- */
const resetFilters = () => {
  q.value = ''; 
  selectedBranchFilter.value = undefined; 
  selectedFloorFilter.value = undefined; 
  selectedStatusFilter.value = undefined;
  filterDateFrom.value = undefined;
  filterDateTo.value = undefined;
}

/* --- TABLE COLUMNS --- */
const columns: TableColumn<Booking>[] = [
  {
    accessorKey: "code",
    header: "CODE",
    enableSorting: true,
    size: 60,
    cell: ({ row }) => h("span", { class: "font-mono text-xs text-neutral-500" }, `#${row.original.code || row.original.id}`),
  },
  {
    accessorKey: "customer_name",
    header: "Customer",
    enableSorting: true,
    cell: ({ row }) => {
        const name = row.getValue("customer_name") || "Guest";
        const phone = row.original.customer_phone || "-";
        return h("div", { class: "flex flex-col" }, [
            h("span", { class: "font-medium text-neutral-900 dark:text-white" }, name),
            h("span", { class: "text-xs text-neutral-500" }, phone),
        ]);
    },
  },
  {
    accessorKey: "party_size",
    header: "Pax",
    enableSorting: true,
    size: 70,
    cell: ({ row }) => h(UBadge, { variant: "subtle", size: "xs", color: 'neutral' }, () => `${row.getValue("party_size")} pax`),
  },
  {
    accessorKey: "start_at",
    header: "Schedule",
    enableSorting: true,
    minSize: 180,
    cell: ({ row }) => {
        const start = row.original.start_at ? new Date(row.original.start_at) : null;
        const end = row.original.end_at ? new Date(row.original.end_at) : null;
        
        if (!start) return "-";
        
        const dateStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const timeStr = `${start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })} - ${end ? end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '?'}`;

        return h("div", { class: "flex flex-col" }, [
            h("span", { class: "font-semibold text-sm" }, dateStr),
            h("span", { class: "text-xs text-neutral-500" }, timeStr),
        ]);
    },
  },
  {
    accessorKey: "tables",
    header: "Tables",
    enableSorting: false,
    cell: ({ row }) => {
      const tables = row.original.tables || [];
      if (!tables.length) return h("span", { class: "text-neutral-400 italic text-xs" }, "Unassigned");
      
      return h("div", { class: "flex flex-wrap gap-1" }, 
        tables.map((t: any) => 
            h(UBadge, { size: "xs", variant: "outline", class: "font-mono border-neutral-300 dark:border-neutral-700" }, 
            () => t.name)
        )
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    enableSorting: true,
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const mapping: Record<string, string> = {
        pending: "warning",
        confirmed: "primary",
        checked_in: "info",
        seated: "info",
        completed: "success",
        cancelled: "neutral",
      };
      
      const color = mapping[status] || "neutral";
      const label = status.replace('_', ' '); 
      
      return h(UBadge, { color: color as any, variant: "subtle", size: "xs", class: "capitalize" }, () => label);
    },
  },
  {
    id: "actions",
    header: "",
    enableSorting: false,
    cell: ({ row }) => {
      const b = row.original;
      const btnBase = 'text-xs w-20 h-7 flex items-center justify-center transition-all';
      const ghostBase = btnBase + ' bg-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800';
      const makeBtn = (label: string, props: any = {}) =>
        h(UButton, { ...props, class: props.class ? `${props.class} ${btnBase}` : btnBase }, { default: () => label });
      const makeGhost = (label: string, props: any = {}) =>
        h(UButton, { ...props, variant: 'ghost', class: props.class ? `${props.class} ${ghostBase}` : ghostBase }, { default: () => label });

      const nodeList: any[] = [];

      if (b.status === 'pending' || b.status === 'reserved') {
        nodeList.push(makeBtn('Confirm', { color: 'primary', onClick: () => handleConfirm(b.id) }));
        nodeList.push(makeGhost('Cancel', { color: 'error', onClick: () => handleCancel(b.id) }));
      } else if (b.status === 'confirmed') {
        nodeList.push(makeBtn('Seat', { color: 'info', onClick: () => handleSeat(b.id) }));
        nodeList.push(makeGhost('Cancel', { color: 'error', onClick: () => handleCancel(b.id) }));
      } else if (b.status === 'checked_in' || b.status === 'seated') {
        nodeList.push(makeBtn('Complete', { color: 'success', onClick: () => handleComplete(b.id) }));
        nodeList.push(makeGhost('Cancel', { color: 'error', onClick: () => handleCancel(b.id) }));
      } 
      return h('div', { class: 'flex items-center justify-end gap-2' }, nodeList);
    }
  }
];
</script>

<template>
  <div class="flex gap-4 h-[calc(100vh-6rem)] min-h-0 overflow-hidden">
    <div class="flex-1 flex flex-col min-w-0 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 shadow-sm transition-all duration-300">
      
      <div class="p-4 border-b border-neutral-200 dark:border-neutral-800 flex flex-col gap-4">
        <div class="flex justify-between items-center">
          <div class="flex items-center gap-3">
            <UIcon name="i-lucide-calendar-days" class="text-primary-500 w-7 h-7" />
            <div>
              <h1 class="text-xl font-bold text-neutral-900 dark:text-white leading-none">Bookings</h1>
              <p class="text-xs text-neutral-500 mt-1.5">Manage daily reservations</p>
            </div>
          </div>
          <div class="flex gap-2">
            <UButton to="/bookings/create-new" color="primary" icon="i-lucide-plus">New Booking</UButton>
          </div>
        </div>

        <div class="flex flex-wrap items-end gap-3">
            
            <div class="flex-1 min-w-[200px]">
                <UInput 
                  v-model="q" 
                  icon="i-lucide-search" 
                  placeholder="Search customer, ID..." 
                  class="w-full" 
                  :loading="loading"
                />
            </div>
            
            <div class="flex items-center gap-2">
              <div class="w-36">
                 <UInput 
                    v-model="filterDateFrom" 
                    type="date" 
                    placeholder="From" 
                    class="w-full" 
                    :ui="{ icon: { trailing: { pointer: '' } } }"
                 />
              </div>
              <span class="text-neutral-400">-</span>
              <div class="w-36">
                 <UInput 
                    v-model="filterDateTo" 
                    type="date" 
                    placeholder="To" 
                    class="w-full"
                 />
              </div>
            </div>

            <div class="w-40">
                 <BranchSelect
                    v-model="selectedBranchFilter"
                    class="w-full"
                    placeholder="Branch"
                 />
            </div>

            <div class="w-32">
                 <USelectMenu
                    v-model="selectedStatusFilter"
                    :items="statusOptions"
                    placeholder="Status"
                    class="w-full"
                />
            </div>
            
            <UButton
                v-if="q || selectedBranchFilter || selectedStatusFilter || filterDateFrom || filterDateTo"
                icon="i-lucide-x"
                color="neutral"
                variant="ghost"
                @click="resetFilters"
                tooltip="Reset Filters"
            />
            
            <div class="flex items-center gap-2 ml-auto border-l border-neutral-200 dark:border-neutral-800 pl-3">
                 <span class="text-xs text-neutral-500 font-medium">Rows:</span>
                 <USelect v-model="pageSize" :items="[5, 10, 20, 50]" class="w-16" size="sm" />
             </div>
        </div>
      </div>

      <UTable
        v-model:sort="sort"
        sticky
        :columns="columns"
        :data="bookings"
        :loading="loading"
        loading-animation="carousel"
        :table-options="{ getCoreRowModel: getCoreRowModel() }"
        class="w-full"
        :ui="{ 
             th: { base: 'whitespace-nowrap bg-neutral-50 dark:bg-neutral-800/50 py-3 text-neutral-500 font-semibold' },
             td: { base: 'py-3 border-b border-neutral-100 dark:border-neutral-800/50' }
        }"
      >
         <template #empty-state>
            <div class="flex flex-col items-center justify-center h-48 text-neutral-400 gap-3">
              <UIcon name="i-lucide-search-x" class="w-10 h-10 opacity-30" />
              <span>No bookings found</span>
            </div>
         </template>
      </UTable>

      <div class="p-3 border-t border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-neutral-50/50 dark:bg-neutral-900">
         <span class="text-xs text-neutral-500">Total: <strong>{{ totalItems }}</strong> bookings</span>
         <UPagination 
            v-model:page="page" 
            :total="totalItems" 
            :items-per-page="pageSize" 
            size="xs" 
            :disabled="loading" 
         />
      </div>

    </div>
  </div>
</template>
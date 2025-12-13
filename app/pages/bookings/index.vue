<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import { getCoreRowModel } from "@tanstack/vue-table";
import { h, onMounted, ref, resolveComponent, watch } from "vue";
import type { Booking } from "~/types/transaction";

/* --- COMPONENTS --- */
const UButton = resolveComponent("UButton");
const UBadge = resolveComponent("UBadge");
const UInput = resolveComponent("UInput");
const USelect = resolveComponent("USelect");
const USelectMenu = resolveComponent("USelectMenu");
const UIcon = resolveComponent("UIcon");
const toast = useToast();

// Asumsi komponen ini sudah auto-import atau teregistrasi global
// Jika belum, uncomment baris di bawah:
// import BranchSelect from "~/components/common/BranchSelect.vue";
// import FloorSelect from "~/components/common/FloorSelect.vue";

/* --- STORES --- */
const bookingStore = useBookingStore();
const { bookings, loading, totalItems } = storeToRefs(bookingStore);

/* --- STATE --- */
const q = ref("");
const page = ref(1);
const pageSize = ref(10);

// Filter State
const selectedBranchFilter = ref<number | undefined>(undefined);
const selectedFloorFilter = ref<number | undefined>(undefined);
const selectedStatusFilter = ref<string | undefined>(undefined);

const statusOptions = [
  "pending",
  "confirmed",
  "checked_in", // Sesuai backend usually 'checked_in' or 'seated'
  "completed",
  "cancelled",
];

/* --- FETCH DATA --- */
const refreshData = async () => {
  await bookingStore.fetchBookings({
    page: page.value,
    per_page: pageSize.value,
    q: q.value,
    branch_id: selectedBranchFilter.value,
    // floor_id: selectedFloorFilter.value, // Aktifkan jika backend support filter floor
    status: selectedStatusFilter.value,
    // q: q.value // Aktifkan jika backend support search query
  });
};

onMounted(() => {
  refreshData();
});

// Watchers
watch([page, pageSize, selectedBranchFilter, selectedFloorFilter, selectedStatusFilter], () => {
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
    await bookingStore.checkIn(id); // API: /check-in
    toast.add({ title: "Customer Seated", color: "info", icon: "i-lucide-armchair" });
    refreshData();
  } catch (e: any) {
    toast.add({ title: "Error", description: e.message, color: "error" });
  }
};

const handleComplete = async (id: number) => {
  try {
    await bookingStore.checkOut(id); // API: /check-out
    toast.add({ title: "Booking Completed", color: "success", icon: "i-lucide-check-circle" });
    refreshData();
  } catch (e: any) {
    toast.add({ title: "Error", description: e.message, color: "error" });
  }
};

const handleCancel = async (id: number) => {
  try {
    await bookingStore.deleteBooking(id); // API: DELETE (atau endpoint cancel khusus)
    toast.add({ title: "Booking Cancelled", color: "error", icon: "i-lucide-x-circle" });
    refreshData();
  } catch (e: any) {
    toast.add({ title: "Error", description: e.message, color: "error" });
  }
};

/* --- TABLE COLUMNS --- */
const columns: TableColumn<Booking>[] = [
  {
    accessorKey: "code",
    header: "CODE",
    size: 60,
    cell: ({ row }) => h("span", { class: "font-mono text-xs text-neutral-500" }, `#${row.original.code}`),
  },
  {
    accessorKey: "customer_name",
    header: "Customer",
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
    size: 70,
    cell: ({ row }) => h(UBadge, { variant: "subtle", size: "xs", color: 'neutral' }, () => `${row.getValue("party_size")} pax`),
  },
  {
    accessorKey: "start_at", // Menggunakan start_at dari JSON backend
    header: "Schedule",
    minSize: 180,
    cell: ({ row }) => {
        const start = row.original.start_at ? new Date(row.original.start_at) : null;
        const end = row.original.end_at ? new Date(row.original.end_at) : null;
        
        if (!start) return "-";
        
        // Format: Dec 12
        const dateStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        // Format: 06:00 PM - 08:18 PM
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
    cell: ({ row }) => {
      const tables = row.original.tables || [];
      if (!tables.length) return h("span", { class: "text-neutral-400 italic text-xs" }, "Unassigned");
      
      return h("div", { class: "flex flex-wrap gap-1" }, 
        tables.map((t: any) => 
            h(UBadge, { size: "xs", variant: "outline", class: "font-mono border-neutral-300 dark:border-neutral-700" }, 
            () => t.name) // Menampilkan nama meja (misal: "1-B9")
        )
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const mapping: Record<string, string> = {
        pending: "warning",   // Kuning
        confirmed: "primary", // Hijau/Primary
        checked_in: "info",   // Biru
        seated: "info",       // Biru (alias)
        completed: "success", // Hijau Tua
        cancelled: "neutral", // Abu-abu
      };
      
      const color = mapping[status] || "neutral";
      const label = status.replace('_', ' '); // checked_in -> checked in
      
      return h(UBadge, { color: color as any, variant: "subtle", size: "xs", class: "capitalize" }, () => label);
    },
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => {
      const b = row.original;
      
      // -- BUTTON HELPERS (Sama seperti request awal) --
      const btnBase = 'text-xs w-20 h-7 flex items-center justify-center transition-all';
      const ghostBase = btnBase + ' bg-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800';

      const makeBtn = (label: string, props: any = {}) =>
        h(UButton, { ...props, class: props.class ? `${props.class} ${btnBase}` : btnBase }, { default: () => label });

      const makeGhost = (label: string, props: any = {}) =>
        h(UButton, { ...props, variant: 'ghost', class: props.class ? `${props.class} ${ghostBase}` : ghostBase }, { default: () => label });

      const nodeList: any[] = [];

      // -- LOGIC ACTIONS SESUAI STATUS --
      if (b.status === 'pending' || b.status === 'reserved') {
        // Confirm & Cancel
        nodeList.push(makeBtn('Confirm', { color: 'primary', onClick: () => handleConfirm(b.id) }));
        nodeList.push(makeGhost('Cancel', { color: 'error', onClick: () => handleCancel(b.id) }));
      
      } else if (b.status === 'confirmed') {
        // Seat (Check In) & Cancel
        nodeList.push(makeBtn('Seat', { color: 'info', onClick: () => handleSeat(b.id) }));
        nodeList.push(makeGhost('Cancel', { color: 'error', onClick: () => handleCancel(b.id) }));
      
      } else if (b.status === 'checked_in' || b.status === 'seated') {
        // Complete (Check Out) & Cancel
        nodeList.push(makeBtn('Complete', { color: 'success', onClick: () => handleComplete(b.id) }));
        // Kadang user salah check-in, jadi mungkin butuh cancel, atau void
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
            <UButton color="primary" icon="i-lucide-plus">New Booking</UButton>
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
            
            <div class="w-48">
                 <BranchSelect
                    v-model="selectedBranchFilter"
                    class="w-full"
                    placeholder="All Branches"
                 />
            </div>

            <div class="w-48">
                 <FloorSelect
                    v-model="selectedFloorFilter"
                    :branch-id="selectedBranchFilter"
                    class="w-full"
                    placeholder="All Floors"
                 />
            </div>

            <div class="w-40">
                 <USelectMenu
                    v-model="selectedStatusFilter"
                    :options="statusOptions"
                    placeholder="All Status"
                    class="w-full"
                />
            </div>
            
            <UButton
                v-if="q || selectedBranchFilter || selectedFloorFilter || selectedStatusFilter"
                icon="i-lucide-x"
                color="neutral"
                variant="ghost"
                @click="q = ''; selectedBranchFilter = undefined; selectedFloorFilter = undefined; selectedStatusFilter = undefined;"
            />
            
             <div class="flex items-center gap-2 ml-auto border-l border-neutral-200 dark:border-neutral-800 pl-3">
                 <span class="text-xs text-neutral-500 font-medium">Rows:</span>
                 <USelect v-model="pageSize" :options="[5, 10, 20, 50]" class="w-16" size="sm" />
             </div>
        </div>
      </div>

          <UTable

            sticky
            :columns="columns"
            :data="bookings"
            :loading="loading"
            loading-animation="carousel"
            :table-options="{ getCoreRowModel: getCoreRowModel() }"
            class="w-full"
            :ui="{ 
                th: { base: 'whitespace-nowrap bg-neutral-50 dark:bg-neutral-800/50 py-3.5 text-neutral-500 font-semibold' },
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

            :page-count="pageSize" 
            :max="5" 
            size="xs" 
            :disabled="loading" 
         />
      </div>

    </div>
  </div>
</template>
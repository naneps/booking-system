<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import { getCoreRowModel } from "@tanstack/vue-table";
import { computed, h, ref, resolveComponent, watch } from "vue";

/* Resolve Nuxt UI components */
const UButton = resolveComponent("UButton");
const UInput = resolveComponent("UInput");
const USelect = resolveComponent("USelect");
const USelectMenu = resolveComponent("USelectMenu");
const UTable = resolveComponent("UTable");
const UPagination = resolveComponent("UPagination");
const UBadge = resolveComponent("UBadge");
const UIcon = resolveComponent("UIcon");
const toast = useToast();

/* ---------- Types ---------- */
type BookingStatus =
  | "pending"
  | "confirmed"
  | "seated"
  | "completed"
  | "cancelled";

interface Booking {
  id: number;
  code: string;
  customer: string;
  pax: number;

  booked_at: string;
  start_at: string | null;
  end_at: string | null;

  tables: string[];
  branch: string | null;
  floor: string | null;
  status: BookingStatus;
  notes?: string;
}

/* ---------- Dummy data (includes booked_at/start_at/end_at + multiple tables) ---------- */
const dummyBookings = ref<Booking[]>([
  {
    id: 1,
    code: "BK-0001",
    customer: "Agus Santoso",
    pax: 4,
    booked_at: "2025-12-12T16:00:00",
    start_at: null,
    end_at: null,
    tables: ["A1", "A2"],
    branch: "Central Kitchen Jakarta",
    floor: "Ground Floor",
    status: "confirmed",
    notes: "Birthday",
  },
  {
    id: 2,
    code: "BK-0002",
    customer: "Siti Nurhaliza",
    pax: 2,
    booked_at: "2025-12-12T17:15:00",
    start_at: null,
    end_at: null,
    tables: ["B2"],
    branch: "Central Kitchen Jakarta",
    floor: "Ground Floor",
    status: "pending",
  },
  {
    id: 3,
    code: "BK-0003",
    customer: "Budi Wijaya",
    pax: 6,
    booked_at: "2025-12-13T10:00:00",
    start_at: null,
    end_at: null,
    tables: [],
    branch: "Central Kitchen Bandung",
    floor: "First Floor",
    status: "cancelled",
  },
  {
    id: 4,
    code: "BK-0004",
    customer: "Rina",
    pax: 3,
    booked_at: "2025-12-13T11:00:00",
    start_at: "2025-12-13T12:58:00",
    end_at: null,
    tables: ["C3"],
    branch: "Central Kitchen Jakarta",
    floor: "Ground Floor",
    status: "seated",
  },
  {
    id: 5,
    code: "BK-0005",
    customer: "Doni",
    pax: 2,
    booked_at: "2025-12-14T18:10:00",
    start_at: null,
    end_at: null,
    tables: ["D1", "D2", "D3"],
    branch: "Central Kitchen Jakarta",
    floor: "Second Floor",
    status: "confirmed",
  },
  {
    id: 6,
    code: "BK-0006",
    customer: "Mira",
    pax: 5,
    booked_at: "2025-12-15T09:45:00",
    start_at: null,
    end_at: null,
    tables: [],
    branch: "Central Kitchen Bandung",
    floor: "First Floor",
    status: "pending",
  },
  {
    id: 7,
    code: "BK-0007",
    customer: "Yoga",
    pax: 2,
    booked_at: "2025-12-16T18:12:00",
    start_at: "2025-12-16T19:30:00",
    end_at: "2025-12-16T20:50:00",
    tables: ["E1"],
    branch: "Central Kitchen Jakarta",
    floor: "Ground Floor",
    status: "completed",
  },
  {
    id: 8,
    code: "BK-0008",
    customer: "Nia",
    pax: 8,
    booked_at: "2025-12-17T08:30:00",
    start_at: null,
    end_at: null,
    tables: ["F1", "F2"],
    branch: null,
    floor: null,
    status: "pending",
  },
  {
    id: 9,
    code: "BK-0009",
    customer: "Tono",
    pax: 4,
    booked_at: "2025-12-18T14:00:00",
    start_at: null,
    end_at: null,
    tables: [],
    branch: "Central Kitchen Bandung",
    floor: "Second Floor",
    status: "confirmed",
  },
  {
    id: 10,
    code: "BK-0010",
    customer: "Lala",
    pax: 2,
    booked_at: "2025-12-18T15:30:00",
    start_at: "2025-12-18T21:00:00",
    end_at: null,
    tables: ["A2"],
    branch: "Central Kitchen Jakarta",
    floor: "Ground Floor",
    status: "seated",
  },
]);

const dummyBranches = ref([
  {id: 1, name: "Central Kitchen Jakarta"},
  {id: 2, name: "Central Kitchen Bandung"},
]);
const dummyFloors = ref([
  {id: 1, name: "Ground Floor"},
  {id: 2, name: "First Floor"},
  {id: 3, name: "Second Floor"},
]);

/* ---------- Filters & pagination ---------- */
const q = ref("");
const page = ref(1);
const pageSize = ref(10);
const selectedBranchFilter = ref<string | undefined>(undefined);
const selectedFloorFilter = ref<string | undefined>(undefined);
const selectedStatusFilter = ref<string | undefined>(undefined);
const statusOptions = [
  "pending",
  "confirmed",
  "seated",
  "completed",
  "cancelled",
];

const branchNames = computed(() =>
  (dummyBranches.value ?? []).map((b) => b.name),
);
const floorNames = computed(() => (dummyFloors.value ?? []).map((f) => f.name));

const filtered = computed(() => {
  const term = q.value.trim().toLowerCase();
  return dummyBookings.value.filter((b) => {
    if (selectedBranchFilter.value) {
      if ((b.branch ?? "") !== selectedBranchFilter.value) return false;
    }
    if (selectedFloorFilter.value) {
      if ((b.floor ?? "") !== selectedFloorFilter.value) return false;
    }
    if (selectedStatusFilter.value) {
      if (b.status !== selectedStatusFilter.value) return false;
    }
    if (!term) return true;
    return (
      b.code.toLowerCase().includes(term) ||
      b.customer.toLowerCase().includes(term) ||
      b.tables.join(" ").toLowerCase().includes(term)
    );
  });
});

const totalItems = computed(() => filtered.value.length);
const pagedData = computed(() => {
  const start = (page.value - 1) * pageSize.value;
  return filtered.value.slice(start, start + pageSize.value);
});
watch(pageSize, () => {
  page.value = 1;
});

/* ---------- selection ---------- */
const selectedRows = ref(new Set<number>());
function toggleSelect(id: number) {
  if (selectedRows.value.has(id)) selectedRows.value.delete(id);
  else selectedRows.value.add(id);
  selectedRows.value = new Set(selectedRows.value);
}
const pageRowIds = computed(() => pagedData.value.map((r) => r.id));
const allOnPageSelected = computed(
  () =>
    pageRowIds.value.length > 0 &&
    pageRowIds.value.every((id) => selectedRows.value.has(id)),
);
function toggleSelectAllOnPage() {
  if (allOnPageSelected.value)
    pageRowIds.value.forEach((id) => selectedRows.value.delete(id));
  else pageRowIds.value.forEach((id) => selectedRows.value.add(id));
  selectedRows.value = new Set(selectedRows.value);
}
const selectedCount = computed(() => selectedRows.value.size);
const selectedBookings = computed(() =>
  dummyBookings.value.filter((b) => selectedRows.value.has(b.id)),
);

/* ---------- action logic (row + batch) ---------- */
function updateBookingAt(id: number, payload: Partial<Booking>) {
  const idx = dummyBookings.value.findIndex((x) => x.id === id);
  if (idx !== -1) {
    dummyBookings.value[idx] = {...dummyBookings.value[idx], ...payload};
  }
}
function setStatus(id: number, status: BookingStatus) {
  const idx = dummyBookings.value.findIndex((x) => x.id === id);
  if (idx === -1) return;
  const now = new Date().toISOString();
  if (status === "seated") {
    dummyBookings.value[idx].status = "seated";
    if (!dummyBookings.value[idx].start_at)
      dummyBookings.value[idx].start_at = now;
  } else if (status === "completed") {
    dummyBookings.value[idx].status = "completed";
    dummyBookings.value[idx].end_at = now;
  } else if (status === "cancelled") {
    dummyBookings.value[idx].status = "cancelled";
    dummyBookings.value[idx].start_at = null;
    dummyBookings.value[idx].end_at = null;
  } else {
    // pending / confirmed
    dummyBookings.value[idx].status = status;
  }
  toast.add({
    title: "Updated",
    description: `${dummyBookings.value[idx].code} → ${status}`,
    color: "success",
  });
}

function confirmBooking(id: number) {
  setStatus(id, "confirmed");
}
function seatBooking(id: number) {
  setStatus(id, "seated");
}
function completeBooking(id: number) {
  setStatus(id, "completed");
}
function cancelBooking(id: number) {
  setStatus(id, "cancelled");
}

function batchSetStatus(ids: number[], status: BookingStatus) {
  ids.forEach((id) => setStatus(id, status));
  if (status === "completed" || status === "cancelled") {
    ids.forEach((id) => selectedRows.value.delete(id));
    selectedRows.value = new Set(selectedRows.value);
  }
}

const anyPendingSelected = computed(() =>
  selectedBookings.value.some((b) => b.status === "pending"),
);
const anyConfirmedSelected = computed(() =>
  selectedBookings.value.some((b) => b.status === "confirmed"),
);
const anySeatedSelected = computed(() =>
  selectedBookings.value.some((b) => b.status === "seated"),
);
const anyNotCompletedSelected = computed(() =>
  selectedBookings.value.some(
    (b) => b.status !== "completed" && b.status !== "cancelled",
  ),
);

/* ---------- table columns ---------- */
const columns: TableColumn<Booking>[] = [
  {
    id: "select",
    header: () =>
      h("div", {class: "flex items-center justify-center"}, [
        h("input", {
          type: "checkbox",
          checked: allOnPageSelected.value,
          onChange: () => toggleSelectAllOnPage(),
        }),
      ]),
    cell: ({row}: any) => {
      const id = row.original.id;
      return h("div", {class: "flex items-center justify-center"}, [
        h("input", {
          type: "checkbox",
          checked: selectedRows.value.has(id),
          onChange: () => toggleSelect(id),
        }),
      ]);
    },
    size: 48,
  },
  {
    accessorKey: "code",
    header: "Booking",
    cell: ({row}: any) =>
      h(
        "div",
        {class: "font-medium text-neutral-900 dark:text-white"},
        row.getValue("code"),
      ),
  },
  {
    accessorKey: "customer",
    header: "Customer",
    cell: ({row}: any) => h("div", {}, row.getValue("customer")),
  },
  {
    accessorKey: "pax",
    header: "Pax",
    size: 80,
    cell: ({row}: any) =>
      h(
        UBadge,
        {variant: "subtle", size: "xs"},
        () => `${row.getValue("pax")} pax`,
      ),
  },
  {
    accessorKey: "booked_at",
    header: "Booked At",
    cell: ({row}: any) => {
      const v = row.getValue("booked_at") as string;
      return v ? new Date(v).toLocaleString() : "-";
    },
  },
  {
    accessorKey: "start_at",
    header: "Start",
    size: 160,
    cell: ({row}: any) => {
      const v = row.getValue("start_at") as string | null;
      return v ? new Date(v).toLocaleString() : "-";
    },
  },
  {
    accessorKey: "end_at",
    header: "End",
    size: 160,
    cell: ({row}: any) => {
      const v = row.getValue("end_at") as string | null;
      return v ? new Date(v).toLocaleString() : "-";
    },
  },
  {
    accessorKey: "tables",
    header: "Tables",
    cell: ({row}: any) => {
      const tables: string[] = row.original.tables ?? [];
      if (!tables.length)
        return h("span", {class: "text-neutral-400 italic text-sm"}, "TBD");
      return h(
        "div",
        {class: "flex flex-wrap gap-2"},
        tables.map((t) =>
          h(
            UBadge,
            {size: "xs", variant: "subtle", class: "font-mono"},
            () => t,
          ),
        ),
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    size: 120,
    cell: ({row}: any) => {
      const s = row.getValue("status") as BookingStatus;
      const mapping: Record<BookingStatus, {color: string; label: string}> = {
        pending: {color: "warning", label: "Pending"},
        confirmed: {color: "primary", label: "Confirmed"},
        seated: {color: "info", label: "Seated"},
        completed: {color: "success", label: "Completed"},
        cancelled: {color: "error", label: "Cancelled"},
      };
      const m = mapping[s] ?? {color: "neutral", label: s};
      return h(
        UBadge,
        {color: m.color, variant: "subtle", size: "xs"},
        () => m.label,
      );
    },
  },
  {
  id: 'actions',
  header: '',
  cell: ({ row }: any) => {
    const b = row.original as Booking

    // uniform button classes — gunakan w-20 atau min-w-[88px] sesuai preferensi
    const btnBase = 'text-xs w-20 h-7 flex items-center justify-center'
    const ghostBase = btnBase + ' bg-transparent' // for ghost we keep same width

    const makeBtn = (label: string, props: any = {}) =>
      h(UButton, { ...props, class: props.class ? `${props.class} ${btnBase}` : btnBase }, { default: () => label })

    const makeGhost = (label: string, props: any = {}) =>
      h(UButton, { ...props, variant: 'outline', class: props.class ? `${props.class} ${ghostBase}` : ghostBase }, { default: () => label })

    const nodeList: any[] = []

    if (b.status === 'pending') {
      nodeList.push(makeBtn('Confirm', { color: 'primary', onClick: () => confirmBooking(b.id) }))
      nodeList.push(makeGhost('Cancel', { color: 'error', onClick: () => cancelBooking(b.id), class: '' }))
    } else if (b.status === 'confirmed') {
      nodeList.push(makeBtn('Seat', { color: 'info', onClick: () => seatBooking(b.id) }))
      nodeList.push(makeGhost('Cancel', { color: 'error', onClick: () => cancelBooking(b.id), class: '' }))
    } else if (b.status === 'seated') {
      nodeList.push(makeBtn('Complete', { color: 'success', onClick: () => completeBooking(b.id) }))
      nodeList.push(makeGhost('Cancel', { color: 'error', onClick: () => cancelBooking(b.id), class: '' }))
    } else {
      nodeList.push(h('span', { class: 'text-xs text-neutral-400' }, '-'))
    }

    return h('div', { class: 'flex items-center justify-end gap-2' }, nodeList)
  }
}

];

/* ---------- sidebar detail ---------- */
const isDetailOpen = ref(false);
const detailBooking = ref<Booking | null>(null);
const isEditMode = ref(false);
function openDetail(b: Booking) {
  detailBooking.value = b;
  isEditMode.value = false;
  isDetailOpen.value = true;
}
function openEdit(b: Booking) {
  detailBooking.value = b;
  isEditMode.value = true;
  isDetailOpen.value = true;
}
function closeDetail() {
  isDetailOpen.value = false;
  detailBooking.value = null;
  isEditMode.value = false;
}

/* ---------- misc helpers ---------- */
function createDummyBooking() {
  const id = (dummyBookings.value[dummyBookings.value.length - 1]?.id ?? 0) + 1;
  dummyBookings.value.unshift({
    id,
    code: `BK-${String(id).padStart(4, "0")}`,
    customer: "New Customer",
    pax: 2,
    booked_at: new Date().toISOString(),
    start_at: null,
    end_at: null,
    tables: ["TBD"],
    branch: "Central Kitchen Jakarta",
    floor: "Ground Floor",
    status: "pending",
  });
  page.value = 1;
}

function runBatchConfirm() {
  const ids = selectedBookings.value
    .filter((b) => b.status === "pending")
    .map((b) => b.id);
  if (ids.length) batchSetStatus(ids, "confirmed");
}
function runBatchSeat() {
  const ids = selectedBookings.value
    .filter((b) => b.status === "confirmed")
    .map((b) => b.id);
  if (ids.length) batchSetStatus(ids, "seated");
}
function runBatchComplete() {
  const ids = selectedBookings.value
    .filter((b) => b.status === "seated")
    .map((b) => b.id);
  if (ids.length) batchSetStatus(ids, "completed");
}
function runBatchCancel() {
  const ids = selectedBookings.value
    .filter((b) => b.status !== "cancelled")
    .map((b) => b.id);
  if (ids.length) batchSetStatus(ids, "cancelled");
}

const tableData = computed(() => pagedData.value);
</script>

<template>
  <div class="flex gap-4 h-[calc(100vh-6rem)] min-h-0 overflow-hidden">
    <!-- Main list -->
    <div
      class="flex-1 flex flex-col min-w-0 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 shadow-sm transition-all duration-300">
      <!-- header -->
      <div
        class="p-4 border-b border-neutral-200 dark:border-neutral-800 flex flex-col gap-4">
        <div class="flex justify-between items-center">
          <div class="flex items-center gap-3">
            <UIcon name="i-lucide-calendar" class="text-primary-500 w-7 h-7" />
            <div>
              <h1
                class="text-xl font-bold text-neutral-900 dark:text-white leading-none">
                Bookings
              </h1>
              <p class="text-xs text-neutral-500 mt-1.5">Manage booking list</p>
            </div>
          </div>
          <div class="flex gap-2">
            <UButton
              color="primary"
              icon="i-lucide-plus"
              @click="createDummyBooking"
              >New Booking</UButton
            >
          </div>
        </div>

        <!-- filters + batch toolbar -->
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-2 flex-1 min-w-0">
            <UInput
              v-model="q"
              icon="i-lucide-search"
              placeholder="Search booking (code, customer, tables)..."
              class="w-full sm:w-64 min-w-0" />
            <USelectMenu
              class="w-48"
              placeholder="Branch"
              :items="branchNames"
              v-model="selectedBranchFilter"
              :search-input="{placeholder: 'Filter branch...'}" />
            <USelectMenu
              class="w-48"
              placeholder="Floor"
              :items="floorNames"
              v-model="selectedFloorFilter"
              :search-input="{placeholder: 'Filter floor...'}" />
            <USelectMenu
              class="w-40"
              placeholder="Status"
              :items="statusOptions"
              v-model="selectedStatusFilter"
              :search-input="false" />
            <UButton
              v-if="
                q ||
                selectedBranchFilter ||
                selectedFloorFilter ||
                selectedStatusFilter
              "
              icon="i-lucide-x"
              color="neutral"
              variant="outline"
              size="xs"
              @click="
                q = '';
                selectedBranchFilter = undefined;
                selectedFloorFilter = undefined;
                selectedStatusFilter = undefined;
              " />
          </div>

          <div class="flex items-center gap-2">
            <span v-if="selectedCount > 0" class="text-sm text-neutral-600 mr-2"
              >{{ selectedCount }} selected</span
            >

            <div v-if="selectedCount > 0" class="flex items-center gap-2">
              <UButton
                size="xs"
                :disabled="!anyPendingSelected"
                @click="runBatchConfirm"
                >Batch Confirm</UButton
              >
              <UButton
                size="xs"
                :disabled="!anyConfirmedSelected"
                @click="runBatchSeat"
                >Batch Seat</UButton
              >
              <UButton
                size="xs"
                :disabled="!anySeatedSelected"
                @click="runBatchComplete"
                >Batch Complete</UButton
              >
              <UButton
                size="xs"
                variant="outline"
                color="error"
                :disabled="!anyNotCompletedSelected"
                @click="runBatchCancel"
                >Batch Cancel</UButton
              >
            </div>

            <span
              class="text-xs text-neutral-500 font-medium hidden sm:inline ml-4"
              >Rows:</span
            >
            <USelect
              v-model="pageSize"
              :options="[5, 10, 20, 50]"
              class="w-20"
              size="sm" />
          </div>
        </div>
      </div>

      <!-- table area -->
      <div class="flex-1 overflow-auto relative min-h-0">
          <div class="min-w-[1100px]">
            <UTable
              sticky
              :columns="columns"
              :data="tableData"
              :loading="false"
              loading-animation="carousel"
              :table-options="{getCoreRowModel: getCoreRowModel()}"
              class="w-full min-w-full"
              :ui="{
                th: {
                  base: 'whitespace-nowrap bg-neutral-50 dark:bg-neutral-800/50 py-3.5 text-neutral-500 font-semibold',
                },
                td: {
                  base: 'py-3 border-b border-neutral-100 dark:border-neutral-800/50',
                },
              }">
              <template #empty-state>
                <div
                  class="flex flex-col items-center justify-center h-48 text-neutral-400 gap-3">
                  <UIcon
                    name="i-lucide-search-x"
                    class="w-10 h-10 opacity-30" />
                  <span>No bookings found</span>
                </div>
              </template>
            </UTable>
          </div>
      </div>

      <!-- footer -->
      <div
        class="p-3 border-t border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-neutral-50/50 dark:bg-neutral-900">
        <span class="text-xs text-neutral-500"
          >Total: <strong>{{ totalItems }}</strong> bookings</span
        >
        <UPagination
          v-model="page"
          :total="totalItems"
          :per-page="pageSize"
          :max="5"
          size="xs" />
      </div>
    </div>

    <!-- Sidebar detail -->
    <div
      class="h-full transition-all duration-300 ease-in-out bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-xl flex flex-col"
      :class="
        isDetailOpen
          ? 'w-[420px] opacity-100 translate-x-0 mr-1'
          : 'w-0 opacity-0 translate-x-10 overflow-hidden border-0'
      ">
      <div
        class="p-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-neutral-50/30 dark:bg-neutral-800/30">
        <div>
          <h3 class="font-semibold text-lg text-neutral-900 dark:text-white">
            {{ isEditMode ? "Edit Booking" : "Booking Detail" }}
          </h3>
        </div>
        <UButton
          icon="i-lucide-x"
          color="neutral"
          variant="outline"
          size="xs"
          @click="closeDetail" />
      </div>

      <div class="flex-1 overflow-y-auto p-5 custom-scrollbar min-h-0">
        <div v-if="detailBooking" class="space-y-3">
          <div class="text-sm text-neutral-400">Booking Code</div>
          <div class="text-lg font-medium">{{ detailBooking.code }}</div>

          <div class="text-sm text-neutral-400">Customer</div>
          <div class="text-base">{{ detailBooking.customer }}</div>

          <div class="flex gap-3">
            <div class="flex-1">
              <div class="text-sm text-neutral-400">Pax</div>
              <div>{{ detailBooking.pax }}</div>
            </div>
            <div class="flex-1">
              <div class="text-sm text-neutral-400">Tables</div>
              <div class="flex flex-wrap gap-2">
                <UBadge
                  v-for="t in detailBooking.tables"
                  :key="t"
                  size="xs"
                  variant="subtle"
                  class="font-mono"
                  >{{ t }}</UBadge
                >
                <span
                  v-if="!detailBooking.tables?.length"
                  class="text-neutral-400 italic"
                  >TBD</span
                >
              </div>
            </div>
          </div>

          <div>
            <div class="text-sm text-neutral-400">Booked At</div>
            <div>{{ new Date(detailBooking.booked_at).toLocaleString() }}</div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <div class="text-sm text-neutral-400">Start At</div>
              <div>
                {{
                  detailBooking.start_at
                    ? new Date(detailBooking.start_at).toLocaleString()
                    : "-"
                }}
              </div>
            </div>
            <div>
              <div class="text-sm text-neutral-400">End At</div>
              <div>
                {{
                  detailBooking.end_at
                    ? new Date(detailBooking.end_at).toLocaleString()
                    : "-"
                }}
              </div>
            </div>
          </div>

          <div>
            <div class="text-sm text-neutral-400">Branch / Floor</div>
            <div>
              {{ detailBooking.branch ?? "No branch" }} —
              {{ detailBooking.floor ?? "No floor" }}
            </div>
          </div>

          <div>
            <div class="text-sm text-neutral-400">Status</div>
            <div>
              <UBadge variant="subtle" size="xs">{{
                detailBooking.status
              }}</UBadge>
            </div>
          </div>

          <div>
            <div class="text-sm text-neutral-400">Notes</div>
            <div class="text-sm">{{ detailBooking.notes ?? "-" }}</div>
          </div>
        </div>

        <div v-else class="text-center text-neutral-400">
          No booking selected
        </div>
      </div>

      <div
        class="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 flex gap-3">
        <UButton
          block
          color="neutral"
          variant="outline"
          class="flex-1"
          @click="closeDetail"
          >Close</UButton
        >
        <UButton
          block
          color="primary"
          class="flex-1"
          @click="isEditMode = !isEditMode"
          >{{ isEditMode ? "Save" : "Edit" }}</UButton
        >
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.12);
  border-radius: 8px;
}
</style>

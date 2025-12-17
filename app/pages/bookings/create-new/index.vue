<script setup lang="ts">
import { computed, onMounted, reactive, ref, resolveComponent, watch } from "vue";
import { z } from "zod";

/* ================= UI ================= */
const UIcon = resolveComponent("UIcon");
const UButton = resolveComponent("UButton");
const UBadge = resolveComponent("UBadge");

/* ================= STORES ================= */
const availabilityStore = useTableAvailabilityStore();
const bookingStore = useBookingStore();
const floorStore = useFloorStore();
const toast = useToast();

/* ================= CONST ================= */

/* ================= HELPERS ================= */
function nowLocalDatetime() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

function formatTimeSafe(val?: string) {
  if (!val) return "-";
  if (/^\d{2}:\d{2}$/.test(val)) return val;
  const d = new Date(val);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleTimeString("id-ID", {hour: "2-digit", minute: "2-digit"});
}

/* ================= FORM ================= */
const schema = z.object({
  customer_name: z.string().min(1, "Customer name required"),
  customer_phone: z.string().min(8, "Phone required"),
  party_size: z.number().min(1),
  start_at: z.string(),
  duration_minutes: z.number().min(15).max(480),
  note: z.string().optional(),
});

type Schema = z.output<typeof schema>;

const state = reactive<Schema>({
  customer_name: "",
  customer_phone: "",
  party_size: 2,
  start_at: nowLocalDatetime(),
  duration_minutes: 90,
  note: "",
});

/* ================= FLOOR FILTER ================= */
const activeFloorId = ref<number | null>(null);

/* ================= TABLE SELECT ================= */
const selectedTableIds = ref<number[]>([]);
const tableNotes = ref<Record<number, string>>({});

function toggleTable(id: number) {
  if (selectedTableIds.value.includes(id)) {
    selectedTableIds.value = selectedTableIds.value.filter((t) => t !== id);
    delete tableNotes.value[id];
  } else {
    selectedTableIds.value.push(id);
  }
}

/* ================= LOAD FLOORS ================= */
onMounted(async () => {
  await floorStore.fetchFloors({
    page: 1,
    per_page: 100,

  });
});

/* ================= AVAILABILITY ================= */
watch(
  () => [state.start_at, state.duration_minutes, activeFloorId.value],
  () => {
    availabilityStore.checkAvailability({
      floor_id: activeFloorId.value ?? undefined,
      start_at: state.start_at,
      duration_minutes: state.duration_minutes,
    });
  },
  {immediate: true},
);

/* ================= COMPUTED ================= */
const floors = computed(() => floorStore.floors);
const tables = computed(() => availabilityStore.tables ?? []);

/* ================= SUBMIT ================= */
async function submitBooking() {
  if (!selectedTableIds.value.length) {
    toast.add({
      title: "Select table first",
      color: "warning",
    });
    return;
  }

  try {
    await bookingStore.createBooking({
      customer_name: state.customer_name,
      customer_phone: state.customer_phone,
      party_size: state.party_size,
      start_at: state.start_at,
      duration_minutes: state.duration_minutes,
      note: state.note,
      source: "staff",
      table_items: selectedTableIds.value.map((id) => ({
        table_id: id,
        note: tableNotes.value[id] || undefined,
      })),
    });

    toast.add({
      title: "Booking created",
      color: "success",
      icon: "i-lucide-check",
    });

    navigateTo("/bookings");
  } catch (e: any) {
    toast.add({
      title: "Failed",
      description: e?.data?.message || "Create booking failed",
      color: "error",
    });
  }
}
// ===== sync selected vs availability =====
watch(
  () => availabilityStore.tables,
  (tables) => {
    if (!tables?.length) return;

    const availableIds = tables
      .filter((t) => t.status === "available")
      .map((t) => t.id);

    selectedTableIds.value = selectedTableIds.value.filter((id) =>
      availableIds.includes(id),
    );
  },
  {deep: true},
);

// ===== timer tick =====
const nowTick = ref(Date.now());
setInterval(() => {
  nowTick.value = Date.now();
}, 60_000);
function safeDate(val?: string) {
  if (!val) return null;

  // case: "20:30"
  if (/^\d{2}:\d{2}$/.test(val)) {
    const [h, m] = val.split(":").map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
  }

  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

function formatDuration(ms: number) {
  const m = Math.floor(ms / 60000);
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return h > 0 ? `${h}h ${mm}m` : `${mm}m`;
}

function bookingTimer(b: any) {
  const start = safeDate(b?.start_at);
  if (!start) return null;

  const end = safeDate(b?.end_at);
  const now = nowTick.value;

  const elapsed = now - start.getTime();
  const overtime = end && now > end.getTime() ? now - end.getTime() : 0;

  return {
    elapsed: Math.max(elapsed, 0),
    overtime: Math.max(overtime, 0),
  };
}
</script>

<template>
  <div
    class="flex flex-col lg:flex-row gap-4 h-auto lg:h-[calc(100vh-6rem)] min-h-0">
    <div
      class="w-full lg:w-[360px] rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col shadow-sm h-fit lg:h-full">
      <div
        class="p-4 border-b border-neutral-200 dark:border-neutral-800 font-semibold flex items-center gap-2">
        <UIcon name="i-lucide-plus-circle" class="w-5 h-5 text-primary-500" />
        Create Booking
      </div>

      <UForm
        :schema="schema"
        :state="state"
        class="flex-1 flex flex-col gap-4 p-4 overflow-y-auto custom-scrollbar">
        <UFormField label="Customer Name" name="customer_name" required>
          <UInput
            v-model="state.customer_name"
            class="w-full"
            placeholder="e.g. John Doe"
            icon="i-lucide-user" />
        </UFormField>

        <div class="grid grid-cols-2 gap-3">
          <UFormField label="Phone" name="customer_phone" required>
            <UInput
              v-model="state.customer_phone"
              class="w-full"
              placeholder="08..."
              icon="i-lucide-phone" />
          </UFormField>
          <UFormField label="Pax" name="party_size" required>
            <UInput
              type="number"
              v-model="state.party_size"
              class="w-full"
              min="1"
              icon="i-lucide-users" />
          </UFormField>
        </div>

        <div class="h-px bg-neutral-100 dark:bg-neutral-800 my-1"></div>

        <UFormField label="Start Time" name="start_at" required>
          <UInput
            type="datetime-local"
            v-model="state.start_at"
            class="w-full" />
        </UFormField>

        <UFormField label="Duration (Minutes)" name="duration_minutes" required>
          <UInput
            type="number"
            v-model="state.duration_minutes"
            class="w-full"
            step="15"
            icon="i-lucide-timer" />
        </UFormField>

        <UFormField label="Note" name="note">
          <UTextarea
            v-model="state.note"
            :rows="3"
            class="w-full"
            placeholder="Special request..." />
        </UFormField>

        <div class="hidden lg:block lg:flex-1"></div>

        <UButton
          block
          color="primary"
          size="lg"
          :loading="bookingStore.loading"
          icon="i-lucide-save"
          @click="submitBooking">
          Create Booking
        </UButton>
      </UForm>
    </div>

    <div
      class="flex-1 border border-neutral-200 dark:border-neutral-800 rounded-lg bg-white dark:bg-neutral-900 flex flex-col shadow-sm overflow-hidden">
      <div
        class="p-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
        <div
          class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3">
          <div
            class="font-bold text-neutral-800 dark:text-white flex items-center gap-2">
            <div class="p-1.5 bg-primary-50 dark:bg-primary-900/20 rounded-md">
              <UIcon
                name="i-lucide-layout-grid"
                class="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
            Select Tables
          </div>

          <div
            class="flex gap-3 text-xs font-medium text-neutral-500 bg-white dark:bg-neutral-800 px-3 py-1.5 rounded-full border border-neutral-200 dark:border-neutral-700 shadow-sm">
            <span class="flex items-center gap-1.5"
              ><span class="w-2 h-2 rounded-full bg-emerald-500"></span>
              Avail</span
            >
            <span class="flex items-center gap-1.5"
              ><span class="w-2 h-2 rounded-full bg-primary-500"></span>
              Pick</span
            >
            <span class="flex items-center gap-1.5"
              ><span class="w-2 h-2 rounded-full bg-rose-500"></span> Busy</span
            >
          </div>
        </div>

        <div class="flex gap-2 flex-wrap">
          <UButton
            size="xs"
            :variant="activeFloorId === null ? 'solid' : 'ghost'"
            :color="activeFloorId === null ? 'primary' : 'neutral'"
            @click="activeFloorId = null"
            class="rounded-full px-4">
            All Floors
          </UButton>

          <UButton
            v-for="f in floors"
            :key="f.id"
            size="xs"
            :variant="activeFloorId === f.id ? 'solid' : 'ghost'"
            :color="activeFloorId === f.id ? 'primary' : 'neutral'"
            @click="activeFloorId = f.id"
            class="rounded-full px-4">
            {{ f.name }}
          </UButton>
        </div>
      </div>

      <div
        class="flex-1 overflow-y-auto p-4 bg-neutral-50/30 dark:bg-neutral-950 custom-scrollbar">
        <div
          class="grid gap-4 grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          <div
            v-for="t in tables"
            :key="t.id"
            class="group relative rounded-xl border-2 transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md select-none"
            :class="[
              // STYLE: OCCUPIED
              t.status === 'occupied'
                ? 'bg-white dark:bg-neutral-900 border-rose-100 dark:border-rose-900/30 ring-1 ring-rose-50 dark:ring-rose-900/10'
                : // STYLE: SELECTED
                selectedTableIds.includes(t.id)
                ? 'bg-primary-50 dark:bg-primary-950/30 border-primary-500 ring-1 ring-primary-500 cursor-pointer transform scale-[1.02]'
                : // STYLE: AVAILABLE
                  'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 hover:border-emerald-400 dark:hover:border-emerald-500 cursor-pointer',
            ]"
            style="min-height: 140px"
            @click="t.status === 'available' && toggleTable(t.id)">
            <div
              class="px-3 py-2 flex justify-between items-center border-b transition-colors"
              :class="
                t.status === 'occupied'
                  ? 'bg-rose-50/50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-900/30'
                  : 'border-neutral-100 dark:border-neutral-700/50'
              ">
              <div class="flex items-center gap-2">
                <div
                  class="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider"
                  :class="[
                    t.status === 'occupied'
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300'
                      : selectedTableIds.includes(t.id)
                      ? 'bg-primary-600 text-white'
                      : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300 group-hover:bg-emerald-100 group-hover:text-emerald-700',
                  ]">
                  {{ t.name }}
                </div>
              </div>

              <div class="flex items-center text-xs text-neutral-400 gap-0.5">
                <UIcon name="i-lucide-users" class="w-3 h-3" />
                <span>{{ t.capacity }}</span>
              </div>
            </div>

            <div class="p-3 flex-1 flex flex-col justify-center gap-2 relative">
              <template v-if="t.status === 'occupied'">
                <div
                  class="font-bold text-sm text-neutral-800 dark:text-neutral-100 truncate flex items-center gap-1.5">
                  <UIcon
                    name="i-lucide-user"
                    class="w-3.5 h-3.5 text-rose-500" />
                  {{ t.booking?.customer_name || "Guest" }}
                </div>

                <div class="flex justify-between items-center text-xs mt-1">
                  <div
                    class="flex items-center gap-1 text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">
                    <UIcon name="i-lucide-clock" class="w-3 h-3" />
                    <span>{{ formatTimeSafe(t.booking?.start_at) }}</span>
                  </div>

                  <template v-if="bookingTimer(t.booking)">
                    <div
                      class="flex items-center gap-1 font-mono font-bold"
                      :class="bookingTimer(t.booking)!.overtime ? 'text-rose-600 animate-pulse' : 'text-emerald-600'">
                      <UIcon name="i-lucide-timer" class="w-3 h-3" />
                      <span>{{
                        formatDuration(bookingTimer(t.booking)!.elapsed)
                      }}</span>
                    </div>
                  </template>
                </div>

                <div class="mt-1.5">
                  <UBadge
                    :color="
                      t.booking?.status === 'seated' ? 'primary' : 'neutral'
                    "
                    variant="subtle"
                    size="xs"
                    class="w-full justify-center capitalize py-0.5">
                    {{ t.booking?.status || "Occupied" }}
                  </UBadge>
                </div>
              </template>

              <template v-else-if="selectedTableIds.includes(t.id)">
                <div
                  class="flex flex-col items-center justify-center h-full gap-2 animate-in fade-in zoom-in duration-200">
                  <div
                    class="text-primary-600 font-medium text-sm flex items-center gap-1.5">
                    <UIcon name="i-lucide-check-circle-2" class="w-5 h-5" />
                    Selected
                  </div>
                  <UInput
                    v-model="tableNotes[t.id]"
                    size="2xs"
                    color="white"
                    placeholder="Add note..."
                    class="w-full text-center mt-1"
                    :ui="{icon: {trailing: {pointer: ''}}}"
                    @click.stop />
                </div>
              </template>

              <template v-else>
                <div
                  class="flex flex-col items-center justify-center h-full text-neutral-300 dark:text-neutral-600 gap-1.5 group-hover:text-emerald-500/70 transition-colors">
                  <UIcon
                    name="i-lucide-armchair"
                    class="w-8 h-8 opacity-40 group-hover:opacity-100 transition-opacity" />
                  <span
                    class="text-[10px] font-medium uppercase tracking-widest opacity-60"
                    >Available</span
                  >
                </div>
              </template>
            </div>

            <div
              v-if="selectedTableIds.includes(t.id)"
              class="absolute top-0 right-0 p-1">
              <div
                class="bg-primary-500 text-white rounded-bl-lg rounded-tr-md w-5 h-5 flex items-center justify-center shadow-sm">
                <UIcon name="i-lucide-check" class="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        class="p-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 text-xs text-neutral-500 flex justify-between items-center font-medium">
        <span
          >Total Tables:
          <strong class="text-neutral-900 dark:text-white">{{
            tables.length
          }}</strong></span
        >
        <span v-if="selectedTableIds.length > 0" class="text-primary-600">
          Selected: <strong>{{ selectedTableIds.length }}</strong> tables
        </span>
        <span v-else>No table selected</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Custom scrollbar untuk area form dan grid agar tidak terlalu tebal */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.3);
  border-radius: 20px;
  border: 2px solid transparent;
  background-clip: content-box;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: rgba(156, 163, 175, 0.6);
}
</style>

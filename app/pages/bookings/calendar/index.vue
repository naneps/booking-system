<script setup lang="ts">
import { addDays, addMonths, endOfDay, endOfMonth, endOfWeek, startOfDay, startOfMonth, startOfWeek } from 'date-fns';
import { storeToRefs } from 'pinia';
import { useCalendarStore, type CalendarBooking } from '~/stores/booking/calendar.store';


const store = useCalendarStore();
const {bookings, loading, currentDate, viewMode, filters} = storeToRefs(store);
const {fetchCalendar, rescheduleBooking} = store;

const isModalOpen = ref(false);
const selectedBooking = ref<CalendarBooking | null>(null);
const draggedBookingId = ref<number | null>(null);
const BRANCH_ID = 1;

// --- DRAG & DROP LOGIC ---
const onDragStart = (event: DragEvent, booking: CalendarBooking) => {
  if (event.dataTransfer) {
    draggedBookingId.value = booking.id;
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", JSON.stringify(booking));
    (event.target as HTMLElement).style.opacity = "0.5";
  }
};

const onDragEnd = (event: DragEvent) => {
  (event.target as HTMLElement).style.opacity = "1";
  draggedBookingId.value = null;
};

const onDropOnDay = async (targetDate: Date) => {
  if (!draggedBookingId.value) return;
  const booking = bookings.value.find((b) => b.id === draggedBookingId.value);
  if (!booking) return;

  const originalDate = new Date(booking.date);
  const newDate = new Date(targetDate);
  newDate.setHours(originalDate.getHours(), originalDate.getMinutes());

  await handleReschedule(booking.id, newDate.toISOString());
};

const onDropOnTimeSlot = async (targetDate: Date, hour: number) => {
  if (!draggedBookingId.value) return;
  const booking = bookings.value.find((b) => b.id === draggedBookingId.value);
  if (!booking) return;

  const newDate = new Date(targetDate);
  newDate.setHours(hour, 0, 0, 0);

  await handleReschedule(booking.id, newDate.toISOString());
};

const handleReschedule = async (id: number, start_at: string) => {
  try {
    await rescheduleBooking({id, start_at});
  } catch (error) {
    alert("Gagal memindahkan jadwal");
  }
};

// --- DATA FETCHING ---
const loadData = async () => {
  let from, to;
  const date = currentDate.value;

  if (viewMode.value === "month") {
    from = startOfWeek(startOfMonth(date));
    to = endOfWeek(endOfMonth(date));
  } else if (viewMode.value === "week") {
    from = startOfWeek(date);
    to = endOfWeek(date);
  } else {
    from = startOfDay(date);
    to = endOfDay(date);
  }

  await fetchCalendar({
    branch_id: BRANCH_ID,
    from: from.toISOString(),
    to: to.toISOString(),
  });
};

// Watchers
let searchTimeout: NodeJS.Timeout;
watch(
  () => filters.value.q,
  () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(loadData, 500);
  },
);

watch(
  [currentDate, viewMode, () => filters.value.status],
  () => {
    loadData();
  },
  {immediate: true},
);

// --- COMPUTED VIEWS ---
const getDaysInMonthView = computed(() => {
  const start = startOfWeek(startOfMonth(currentDate.value));
  const end = endOfWeek(endOfMonth(currentDate.value));
  const days = [];
  let day = start;

  while (day <= end) {
    const d = new Date(day);
    days.push({
      date: d,
      isCurrentMonth: d.getMonth() === currentDate.value.getMonth(),
      isToday: d.toDateString() === new Date().toDateString(),
      bookings: bookings.value.filter(
        (b) => new Date(b.date).toDateString() === d.toDateString(),
      ),
    });
    day = addDays(day, 1);
  }
  return days;
});

const weekViewData = computed(() => {
  const start = startOfWeek(currentDate.value);
  const days = Array.from({length: 7}, (_, i) => addDays(start, i));
  const hours = Array.from({length: 13}, (_, i) => i + 9);

  return {
    weekDays: days,
    hours,
    columns: days.map((day) => ({
      day,
      isToday: day.toDateString() === new Date().toDateString(),
      bookings: bookings.value.filter(
        (b) => new Date(b.date).toDateString() === day.toDateString(),
      ),
    })),
  };
});

const dayViewData = computed(() => {
  const hours = Array.from({length: 13}, (_, i) => i + 9);
  return {
    hours,
    bookings: bookings.value.filter(
      (b) =>
        new Date(b.date).toDateString() === currentDate.value.toDateString(),
    ),
  };
});

// --- STYLING HELPERS (FIXED TAILWIND) ---
// Ini solusi untuk error "unknown utility class".
// Kita definisikan class lengkapnya di sini.
const getBookingStyles = (status: string) => {
  const styles: Record<string, string> = {
    confirmed:
      "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-800",
    pending:
      "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-800",
    completed:
      "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-800",
    cancelled:
      "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-200 dark:border-red-800",
    checked_in:
      "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-200 dark:border-purple-800",
  };
  // Default ke gray jika status tidak dikenal
  return (
    styles[status] ||
    "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
  );
};

const getStatusBadgeColor = (status: string) => {
  const colors: Record<string, string> = {
    confirmed: "emerald",
    pending: "amber",
    completed: "blue",
    cancelled: "red",
    checked_in: "purple",
  };
  return colors[status] || "gray";
};

const formatTime = (dateString: string) => {
  return new Date(dateString).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const navigateDate = (n: number) => {
  if (viewMode.value === "month")
    currentDate.value = addMonths(currentDate.value, n);
  else if (viewMode.value === "week")
    currentDate.value = addDays(currentDate.value, n * 7);
  else currentDate.value = addDays(currentDate.value, n);
};
</script>

<template>
  <div class="h-screen flex flex-col bg-gray-50 dark:bg-gray-950 relative">
    <div
      v-if="loading"
      class="absolute inset-0 z-50 bg-white/50 dark:bg-black/50 flex items-center justify-center backdrop-blur-sm">
      <UIcon
        name="i-lucide-loader-2"
        class="w-10 h-10 animate-spin text-primary-500" />
    </div>

    <div class="flex-1 overflow-y-auto">
      <div class="mx-auto p-4 space-y-4">
        <UCard>
          <div
            class="flex flex-col lg:flex-row gap-4 justify-between items-center">
            <div class="flex items-center gap-3">
              <UButton
                icon="i-lucide-chevron-left"
                variant="ghost"
                @click="navigateDate(-1)" />
              <h2 class="text-xl font-bold min-w-[200px] text-center">
                {{
                  currentDate.toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })
                }}
              </h2>
              <UButton
                icon="i-lucide-chevron-right"
                variant="ghost"
                @click="navigateDate(1)" />
              <UButton
                variant="soft"
                size="sm"
                @click="currentDate = new Date()"
                >Today</UButton
              >
            </div>

            <div class="flex gap-2 w-full lg:w-auto">
              <UInput
                v-model="filters.q"
                icon="i-lucide-search"
                placeholder="Search customer..."
                class="flex-1" />
              <USelectMenu
                v-model="filters.status"
                :options="[
                  'all',
                  'confirmed',
                  'pending',
                  'completed',
                  'cancelled',
                ]"
                class="w-32" />
              <UButtonGroup>
                <UButton
                  :variant="viewMode === 'month' ? 'solid' : 'ghost'"
                  @click="viewMode = 'month'"
                  >Month</UButton
                >
                <UButton
                  :variant="viewMode === 'week' ? 'solid' : 'ghost'"
                  @click="viewMode = 'week'"
                  >Week</UButton
                >
                <UButton
                  :variant="viewMode === 'day' ? 'solid' : 'ghost'"
                  @click="viewMode = 'day'"
                  >Day</UButton
                >
              </UButtonGroup>
            </div>
          </div>
        </UCard>

        <UCard class="overflow-hidden p-0" :ui="{}">
          <div v-if="viewMode === 'month'" class="w-full select-none">
            <div
              class="grid grid-cols-7 border-b dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
              <div
                v-for="d in ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']"
                :key="d"
                class="p-2 text-center text-xs font-bold">
                {{ d }}
              </div>
            </div>

            <div class="grid grid-cols-7 bg-gray-200 dark:bg-gray-800 gap-px">
              <div
                v-for="(cell, idx) in getDaysInMonthView"
                :key="idx"
                @dragover.prevent
                @drop="onDropOnDay(cell.date)"
                :class="[
                  'min-h-[120px] p-2 transition-colors relative group',
                  cell.isCurrentMonth
                    ? 'bg-white dark:bg-gray-950'
                    : 'bg-gray-50/50 dark:bg-gray-900/50',
                  cell.isToday && 'bg-blue-50/50 dark:bg-blue-900/10',
                ]">
                <div
                  :class="[
                    'text-xs font-bold mb-2 w-6 h-6 flex items-center justify-center rounded-full',
                    cell.isToday ? 'bg-blue-600 text-white' : 'text-gray-500',
                  ]">
                  {{ cell.date.getDate() }}
                </div>

                <div class="space-y-1">
                  <div
                    v-for="booking in cell.bookings"
                    :key="booking.id"
                    draggable="true"
                    @dragstart="onDragStart($event, booking)"
                    @dragend="onDragEnd"
                    @click="
                      selectedBooking = booking;
                      isModalOpen = true;
                    "
                    :class="[
                      'text-[10px] px-2 py-1 rounded border shadow-sm cursor-grab active:cursor-grabbing truncate',
                      getBookingStyles(booking.status), // MENGGUNAKAN STATIC CLASS LOOKUP
                    ]">
                    <span class="font-bold">{{
                      formatTime(booking.date)
                    }}</span>
                    {{ booking.customer_name }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="viewMode === 'week'" class="overflow-x-auto select-none">
            <div class="flex min-w-[1000px]">
              <div class="w-16 flex-shrink-0 border-r dark:border-gray-800">
                <div class="h-10 border-b dark:border-gray-800"></div>
                <div
                  v-for="h in weekViewData.hours"
                  :key="h"
                  class="h-20 border-b dark:border-gray-800 text-xs text-gray-400 text-right pr-2 pt-2">
                  {{ h }}:00
                </div>
              </div>
              <div
                v-for="(col, idx) in weekViewData.columns"
                :key="idx"
                class="flex-1 min-w-[140px] border-r dark:border-gray-800">
                <div
                  :class="[
                    'h-10 border-b dark:border-gray-800 text-center flex flex-col justify-center',
                    col.isToday
                      ? 'bg-blue-50 dark:bg-blue-900/20'
                      : 'bg-gray-50 dark:bg-gray-900',
                  ]">
                  <span class="text-xs font-bold">{{
                    col.day.toLocaleDateString("en-US", {
                      weekday: "short",
                      day: "numeric",
                    })
                  }}</span>
                </div>
                <div class="relative bg-white dark:bg-gray-950">
                  <div
                    v-for="h in weekViewData.hours"
                    :key="h"
                    @dragover.prevent
                    @drop="onDropOnTimeSlot(col.day, h)"
                    class="h-20 border-b dark:border-gray-800 border-dashed hover:bg-gray-50 dark:hover:bg-gray-900/50"></div>
                  <div
                    v-for="booking in col.bookings"
                    :key="booking.id"
                    draggable="true"
                    @dragstart="onDragStart($event, booking)"
                    @dragend="onDragEnd"
                    @click="
                      selectedBooking = booking;
                      isModalOpen = true;
                    "
                    :class="[
                      'absolute left-1 right-1 p-1.5 rounded text-xs border overflow-hidden z-10 hover:z-20 hover:shadow-lg cursor-grab active:cursor-grabbing',
                      getBookingStyles(booking.status),
                    ]"
                    :style="{
                      top: `${
                        (new Date(booking.date).getHours() - 9) * 80 +
                        (new Date(booking.date).getMinutes() / 60) * 80
                      }px`,
                      height: '75px',
                    }">
                    <div class="font-bold">{{ formatTime(booking.date) }}</div>
                    <div class="truncate font-medium">
                      {{ booking.customer_name }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            v-if="viewMode === 'day'"
            class="flex select-none h-[600px] overflow-y-auto">
            <div class="w-20 border-r dark:border-gray-800">
              <div
                v-for="h in dayViewData.hours"
                :key="h"
                class="h-24 border-b dark:border-gray-800 text-sm text-gray-500 text-center pt-2">
                {{ h }}:00
              </div>
            </div>
            <div class="flex-1 relative bg-white dark:bg-gray-950">
              <div
                v-for="h in dayViewData.hours"
                :key="h"
                @dragover.prevent
                @drop="onDropOnTimeSlot(currentDate, h)"
                class="h-24 border-b dark:border-gray-800 border-dashed hover:bg-gray-50 dark:hover:bg-gray-900"></div>
              <div
                v-for="booking in dayViewData.bookings"
                :key="booking.id"
                draggable="true"
                @dragstart="onDragStart($event, booking)"
                @dragend="onDragEnd"
                @click="
                  selectedBooking = booking;
                  isModalOpen = true;
                "
                :class="[
                  'absolute left-4 right-4 p-3 rounded-lg border shadow-sm cursor-grab active:cursor-grabbing',
                  getBookingStyles(booking.status),
                ]"
                :style="{
                  top: `${
                    (new Date(booking.date).getHours() - 9) * 96 +
                    (new Date(booking.date).getMinutes() / 60) * 96
                  }px`,
                  height: '90px',
                }">
                <div class="flex justify-between">
                  <span class="font-bold text-sm">{{
                    formatTime(booking.date)
                  }}</span>
                  <UBadge
                    :color="getStatusBadgeColor(booking.status)"
                    size="xs"
                    variant="subtle"
                    >{{ booking.status }}</UBadge
                  >
                </div>
                <div class="font-bold mt-1">{{ booking.customer_name }}</div>
                <div class="text-xs opacity-80 mt-1 flex gap-3">
                  <span class="flex items-center gap-1"
                    ><UIcon name="i-lucide-map-pin" class="w-3 h-3" />
                    {{ booking.table_name }}</span
                  >
                  <span class="flex items-center gap-1"
                    ><UIcon name="i-lucide-users" class="w-3 h-3" />
                    {{ booking.guests }} Guest</span
                  >
                </div>
              </div>
            </div>
          </div>
        </UCard>
      </div>
    </div>

    <UModal v-model="isModalOpen">
      <template #body>
        <UCard v-if="selectedBooking">
          <template #header>
            <div class="flex justify-between items-center">
              <h3 class="font-bold">Booking Details</h3>
              <UButton
                icon="i-lucide-x"
                variant="ghost"
                @click="isModalOpen = false" />
            </div>
          </template>
          <div class="space-y-4">
            <div class="flex items-center gap-3">
              <UAvatar :alt="selectedBooking.customer_name" size="lg" />
              <div>
                <div class="font-bold text-lg">
                  {{ selectedBooking.customer_name }}
                </div>
                <div class="text-gray-500">{{ selectedBooking.phone }}</div>
              </div>
            </div>
            <UDivider />
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span class="text-gray-500 block text-xs uppercase">Date</span>
                {{ new Date(selectedBooking.date).toLocaleString() }}
              </div>
              <div>
                <span class="text-gray-500 block text-xs uppercase">Table</span>
                {{ selectedBooking.table_name }}
              </div>
              <div>
                <span class="text-gray-500 block text-xs uppercase"
                  >Guests</span
                >
                {{ selectedBooking.guests }} Pax
              </div>
              <div>
                <span class="text-gray-500 block text-xs uppercase"
                  >Status</span
                >
                <UBadge :color="getStatusBadgeColor(selectedBooking.status)">{{
                  selectedBooking.status
                }}</UBadge>
              </div>
            </div>
          </div>
        </UCard>
      </template>
    </UModal>
  </div>
</template>

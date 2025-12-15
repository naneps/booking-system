<script setup lang="ts">
import { ref, resolveComponent } from "vue";

/* --- COMPONENTS --- */
const UIcon = resolveComponent("UIcon");
const UButton = resolveComponent("UButton");
const UBadge = resolveComponent("UBadge");
const UProgress = resolveComponent("UProgress");
const UAvatar = resolveComponent("UAvatar");
const UInput = resolveComponent("UInput");

/* --- STATE MANAGEMENT --- */
const activeTab = ref<'arrivals' | 'waitlist'>('arrivals');

/* --- DUMMY DATA --- */
const stats = ref({
  total_bookings_today: 42,
  seated_guests: 86,
  upcoming_2h: 5, 
  available_tables: 12,
});

// SCHEDULE (BOOKINGS)
const upcomingSchedule = ref([
  { id: 101, customer: "Budi Santoso", pax: 4, time: "16:15", time_diff: "in 15m", status: "confirmed", is_urgent: true },
  { id: 102, customer: "Siti Aminah", pax: 2, time: "16:30", time_diff: "in 30m", status: "confirmed", is_urgent: true },
  { id: 103, customer: "PT. Maju Mundur", pax: 12, time: "17:00", time_diff: "in 1h", status: "confirmed", is_urgent: true },
  { id: 104, customer: "Andi & Keluarga", pax: 6, time: "17:45", time_diff: "in 1h 45m", status: "pending", is_urgent: true },
]);

// WAITING LIST (WALK-INS)
const waitingList = ref([
  { id: 201, customer: "Rara Sekar", pax: 2, joined_at: "15:45", wait_time: 25, phone: "0812..." },
  { id: 202, customer: "Joni Iskandar", pax: 4, joined_at: "15:55", wait_time: 15, phone: "0813..." },
  { id: 203, customer: "Grup Kantor", pax: 8, joined_at: "16:05", wait_time: 5, phone: "0811..." },
]);

// FLOOR CAPACITY
const floorStatus = ref([
  { name: "Ground Floor", current: 45, max: 60, color: "green" },
  { name: "1st Floor (VIP)", current: 10, max: 20, color: "orange" },
  { name: "Rooftop", current: 31, max: 40, color: "primary" },
]);

/* --- ACTIONS --- */
const handleSeat = (id: number, type: 'booking' | 'waitlist') => {
  alert(`Seating ${type} ID: ${id}`);
  // Logic connect ke store nanti
};

const handleRemoveWaitlist = (id: number) => {
  waitingList.value = waitingList.value.filter(w => w.id !== id);
};

const getWaitColor = (min: number) => {
  if (min > 30) return 'text-red-600 bg-red-50 dark:bg-red-900/20';
  if (min > 15) return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20';
  return 'text-green-600 bg-green-50 dark:bg-green-900/20';
};
</script>

<template>
  <div class="flex flex-col gap-6 p-2 min-h-screen">
    
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
          Dashboard
          <span class="text-sm font-normal text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full">Live</span>
        </h1>
        <p class="text-neutral-500 text-sm mt-1">
          Operasional hari ini berjalan lancar.
        </p>
      </div>
      <div class="flex gap-2">
        <UButton color="white" icon="i-lucide-refresh-cw">Refresh</UButton>
        <UButton color="primary" icon="i-lucide-plus" to="/transaction/create-booking">New Booking</UButton>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm flex justify-between items-start">
        <div>
          <div class="text-neutral-500 text-xs font-bold uppercase tracking-wider mb-1">Total Bookings</div>
          <div class="text-2xl font-bold text-neutral-900 dark:text-white">{{ stats.total_bookings_today }}</div>
        </div>
        <div class="p-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-neutral-500"><UIcon name="i-lucide-calendar" class="w-5 h-5"/></div>
      </div>

      <div class="p-4 rounded-xl border border-orange-200 dark:border-orange-900/30 bg-orange-50 dark:bg-orange-900/10 shadow-sm flex justify-between items-start">
        <div>
          <div class="text-orange-600 dark:text-orange-400 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
            <UIcon name="i-lucide-clock" class="w-3 h-3" /> Upcoming (2h)
          </div>
          <div class="text-2xl font-bold text-neutral-900 dark:text-white">{{ stats.upcoming_2h }} <span class="text-sm font-normal text-neutral-500">groups</span></div>
        </div>
        <div class="p-2 bg-orange-100 dark:bg-orange-800/50 rounded-lg text-orange-600"><UIcon name="i-lucide-alert-circle" class="w-5 h-5"/></div>
      </div>

      <div class="p-4 rounded-xl border border-purple-200 dark:border-purple-900/30 bg-purple-50 dark:bg-purple-900/10 shadow-sm flex justify-between items-start">
        <div>
          <div class="text-purple-600 dark:text-purple-400 text-xs font-bold uppercase tracking-wider mb-1">Waiting List</div>
          <div class="text-2xl font-bold text-neutral-900 dark:text-white">{{ waitingList.length }} <span class="text-sm font-normal text-neutral-500">groups</span></div>
        </div>
        <div class="p-2 bg-purple-100 dark:bg-purple-800/50 rounded-lg text-purple-600"><UIcon name="i-lucide-clipboard-list" class="w-5 h-5"/></div>
      </div>

      <div class="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm flex justify-between items-start">
        <div>
          <div class="text-neutral-500 text-xs font-bold uppercase tracking-wider mb-1">Available Tables</div>
          <div class="text-2xl font-bold text-neutral-900 dark:text-white">{{ stats.available_tables }}</div>
        </div>
        <div class="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-600"><UIcon name="i-lucide-armchair" class="w-5 h-5"/></div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <div class="lg:col-span-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col min-h-[400px]">
        
        <div class="p-2 border-b border-neutral-200 dark:border-neutral-800 flex gap-2">
          <button 
            @click="activeTab = 'arrivals'"
            class="flex-1 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            :class="activeTab === 'arrivals' ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white' : 'text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800'"
          >
            <UIcon name="i-lucide-calendar-clock" class="w-4 h-4" />
            Arrivals
            <UBadge color="gray" variant="soft" size="xs" :ui="{ rounded: 'rounded-full' }">{{ upcomingSchedule.length }}</UBadge>
          </button>
          
          <button 
            @click="activeTab = 'waitlist'"
            class="flex-1 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 relative"
            :class="activeTab === 'waitlist' ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300' : 'text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800'"
          >
            <UIcon name="i-lucide-hourglass" class="w-4 h-4" />
            Waiting List
            <UBadge color="purple" size="xs" :ui="{ rounded: 'rounded-full' }">{{ waitingList.length }}</UBadge>
            
            <span v-if="waitingList.length > 5" class="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          </button>
        </div>

        <div v-if="activeTab === 'arrivals'" class="p-4 flex flex-col gap-3">
          <div 
            v-for="book in upcomingSchedule" 
            :key="book.id"
            class="flex items-center gap-4 p-3 rounded-lg border transition-all"
            :class="book.is_urgent ? 'border-orange-200 bg-orange-50/30 dark:border-orange-900/30 dark:bg-orange-900/10' : 'border-neutral-100 bg-white dark:border-neutral-800'"
          >
            <div class="flex flex-col items-center min-w-[60px]">
              <span class="text-lg font-bold text-neutral-900 dark:text-white">{{ book.time }}</span>
              <span class="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded text-white" 
                :class="book.is_urgent ? 'bg-orange-500' : 'bg-neutral-400'">
                {{ book.time_diff }}
              </span>
            </div>
            <div class="w-px h-10 bg-neutral-200 dark:bg-neutral-800"></div>
            <div class="flex-1">
              <div class="font-semibold text-neutral-900 dark:text-white">{{ book.customer }}</div>
              <div class="text-xs text-neutral-500 flex gap-3 mt-0.5">
                <span class="flex items-center gap-1"><UIcon name="i-lucide-users" class="w-3 h-3" /> {{ book.pax }} Pax</span>
                <span class="flex items-center gap-1"><UIcon name="i-lucide-utensils" class="w-3 h-3" /> Table TBD</span>
              </div>
            </div>
            <UButton size="xs" :color="book.status === 'pending' ? 'primary' : 'neutral'" :variant="book.status === 'pending' ? 'solid' : 'ghost'" @click="handleSeat(book.id, 'booking')">
              {{ book.status === 'pending' ? 'Confirm' : 'Check-in' }}
            </UButton>
          </div>
          <div v-if="upcomingSchedule.length === 0" class="text-center py-10 text-neutral-400">
            No upcoming bookings
          </div>
        </div>

        <div v-if="activeTab === 'waitlist'" class="p-4 flex flex-col gap-3">
          <div class="flex gap-2 mb-2">
            <UInput placeholder="Guest Name" size="sm" class="flex-1" icon="i-lucide-user" />
            <UInput placeholder="Pax" type="number" size="sm" class="w-20" />
            <UButton icon="i-lucide-plus" size="sm" color="purple">Add</UButton>
          </div>

          <div 
            v-for="guest in waitingList" 
            :key="guest.id"
            class="flex items-center gap-3 p-3 rounded-lg border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:shadow-sm transition-all"
          >
            <UAvatar :text="guest.customer.substring(0,2)" size="sm" :alt="guest.customer" class="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300" />
            
            <div class="flex-1">
              <div class="font-semibold text-sm text-neutral-900 dark:text-white flex items-center gap-2">
                {{ guest.customer }}
                <span class="text-xs font-normal text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-1.5 rounded">{{ guest.pax }} Pax</span>
              </div>
              <div class="text-xs text-neutral-500 mt-0.5">Joined at {{ guest.joined_at }}</div>
            </div>

            <div class="text-right px-3">
              <div class="text-xs text-neutral-400 uppercase font-bold tracking-wider">Waiting</div>
              <div class="font-mono font-bold text-sm px-1.5 rounded" :class="getWaitColor(guest.wait_time)">
                {{ guest.wait_time }}m
              </div>
            </div>

            <div class="flex gap-1">
              <UButton icon="i-lucide-armchair" size="xs" color="primary" variant="soft" @click="handleSeat(guest.id, 'waitlist')">Seat</UButton>
              <UButton icon="i-lucide-phone" size="xs" color="gray" variant="ghost" />
              <UButton icon="i-lucide-trash-2" size="xs" color="red" variant="ghost" @click="handleRemoveWaitlist(guest.id)" />
            </div>
          </div>

          <div v-if="waitingList.length === 0" class="flex flex-col items-center justify-center py-10 text-neutral-400 gap-2">
            <UIcon name="i-lucide-coffee" class="w-8 h-8 opacity-50" />
            <span>Waiting list is empty</span>
          </div>
        </div>

      </div>

      <div class="flex flex-col gap-6">
        
        <div class="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4">
          <h3 class="font-semibold mb-4 flex items-center gap-2 text-sm uppercase tracking-wide text-neutral-500">
            Floor Occupancy
          </h3>
          <div class="flex flex-col gap-5">
            <div v-for="floor in floorStatus" :key="floor.name">
              <div class="flex justify-between text-sm mb-1.5">
                <span class="font-medium text-neutral-800 dark:text-white">{{ floor.name }}</span>
                <span class="text-neutral-500 text-xs">{{ floor.current }}/{{ floor.max }}</span>
              </div>
              <UProgress :value="floor.current" :max="floor.max" :color="floor.color" size="sm" />
            </div>
          </div>
        </div>

        <div class="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 flex-1">
          <h3 class="font-semibold mb-3 text-sm uppercase tracking-wide text-neutral-500">Alerts</h3>
          <ul class="space-y-2">
            <li class="flex gap-3 items-start p-2.5 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 cursor-pointer">
              <UIcon name="i-lucide-clock" class="w-4 h-4 text-red-500 mt-0.5" />
              <div>
                <div class="text-sm font-medium text-red-700 dark:text-red-300">Table 5 Overtime</div>
                <div class="text-xs text-red-500/80">Exceeded booking time by 15m</div>
              </div>
            </li>
            <li class="flex gap-3 items-start p-2.5 rounded-lg bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/20 cursor-pointer">
              <UIcon name="i-lucide-alert-triangle" class="w-4 h-4 text-orange-500 mt-0.5" />
              <div>
                <div class="text-sm font-medium text-orange-700 dark:text-orange-300">Unconfirmed Booking</div>
                <div class="text-xs text-orange-500/80">#104 approaching in 1h 45m</div>
              </div>
            </li>
          </ul>
        </div>

      </div>
    </div>

  </div>
</template>
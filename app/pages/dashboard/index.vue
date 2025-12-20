<script setup lang="ts">
import { storeToRefs } from "pinia";
import { onMounted, ref } from "vue";
import { useDashboardStore } from "~/stores/dashboard.store";

/* --- INIT STORE --- */
const store = useDashboardStore();
// State (Read)
const { stats, upcomingSchedule, waitingList, floorStatus, alerts, loading } = storeToRefs(store);
// Action (Write)
const { fetchDashboard, seatWaitlistGuest, removeWaitlistGuest, checkInBooking, addWaitlistGuest } = store;

/* --- LOCAL STATE --- */
const activeTab = ref<'arrivals' | 'waitlist'>('arrivals');

// Form Add Waitlist
const newWaitlist = ref({
  customer: '',
  pax: 2
});

/* --- LIFECYCLE --- */
onMounted(() => {
  fetchDashboard();
});

/* --- HANDLERS --- */
const handleRefresh = () => {
  fetchDashboard();
};

const handleSeat = async (id: number, type: 'booking' | 'waitlist') => {
  if (type === 'waitlist') {
    if (confirm('Seat this guest?')) await seatWaitlistGuest(id);
  } else {
    if (confirm('Check-in booking?')) await checkInBooking(id);
  }
};

const handleRemoveWaitlist = async (id: number) => {
  if (confirm('Remove from list?')) await removeWaitlistGuest(id);
};

const handleAddWaitlist = async () => {
  if (!newWaitlist.value.customer) return;
  await addWaitlistGuest({
    customer: newWaitlist.value.customer,
    pax: Number(newWaitlist.value.pax)
  });
  // Reset Form
  newWaitlist.value.customer = '';
  newWaitlist.value.pax = 2;
};

// Helper warna waitlist
const getWaitColor = (min: number) => {
  if (min > 30) return 'text-red-600 bg-red-50 dark:bg-red-900/20';
  if (min > 15) return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20';
  return 'text-green-600 bg-green-50 dark:bg-green-900/20';
};
</script>

<template>
  <div class="flex flex-col gap-6 p-4 min-h-screen relative">
    
    <div v-if="loading && stats.total_bookings_today !== undefined" class="absolute inset-0 z-50 bg-white/50 dark:bg-black/50 flex items-center justify-center backdrop-blur-sm rounded-xl">
      <UIcon name="i-lucide-loader-2" class="w-10 h-10 animate-spin text-primary-500" />
    </div>

    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="text-2xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
          Restaurant Dashboard
          <span class="text-xs font-normal text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900/30 px-2 py-0.5 rounded-full flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Live
          </span>
        </h1>
        <p class="text-neutral-500 text-sm mt-1">Real-time overview of your restaurant floor.</p>
      </div>
      <div class="flex gap-2">
        <UButton color="white" icon="i-lucide-refresh-cw" :loading="loading" @click="handleRefresh">Refresh</UButton>
        <UButton color="primary" icon="i-lucide-plus" to="/transaction/create-booking">New Booking</UButton>
      </div>
    </div>

    <ClientOnly>
      <template #fallback>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
           <UCard v-for="i in 4" :key="i" :ui="{ body: { padding: 'p-4' } }">
             <div class="flex justify-between items-start">
               <div class="space-y-2">
                 <USkeleton class="h-3 w-20" />
                 <USkeleton class="h-8 w-10" />
               </div>
               <USkeleton class="h-9 w-9 rounded-lg" />
             </div>
           </UCard>
        </div>
      </template>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <UCard :ui="{ body: { padding: 'p-4' } }">
          <div class="flex justify-between items-start">
             <div>
               <div class="text-xs font-bold text-gray-500 uppercase">Total Bookings</div>
               <div class="text-2xl font-bold mt-1">{{ stats?.total_bookings_today || 0 }}</div>
             </div>
             <div class="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-500">
               <UIcon name="i-lucide-calendar" class="w-5 h-5"/>
             </div>
          </div>
        </UCard>

        <UCard :ui="{ body: { padding: 'p-4' }, ring: 'ring-1 ring-orange-200 dark:ring-orange-900' }" class="bg-orange-50 dark:bg-orange-900/10">
          <div class="flex justify-between items-start">
             <div>
               <div class="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase flex items-center gap-1">
                  <UIcon name="i-lucide-clock" class="w-3 h-3"/> Upcoming (2h)
               </div>
               <div class="text-2xl font-bold mt-1">{{ stats?.upcoming_2h || 0 }} <span class="text-sm font-normal text-gray-500">groups</span></div>
             </div>
             <div class="p-2 bg-orange-100 dark:bg-orange-800/50 rounded-lg text-orange-600">
               <UIcon name="i-lucide-alert-circle" class="w-5 h-5"/>
             </div>
          </div>
        </UCard>

        <UCard :ui="{ body: { padding: 'p-4' }, ring: 'ring-1 ring-purple-200 dark:ring-purple-900' }" class="bg-purple-50 dark:bg-purple-900/10">
          <div class="flex justify-between items-start">
             <div>
               <div class="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase">Waiting List</div>
               <div class="text-2xl font-bold mt-1">{{ waitingList?.length || 0 }} <span class="text-sm font-normal text-gray-500">groups</span></div>
             </div>
             <div class="p-2 bg-purple-100 dark:bg-purple-800/50 rounded-lg text-purple-600">
               <UIcon name="i-lucide-users" class="w-5 h-5"/>
             </div>
          </div>
        </UCard>

        <UCard :ui="{ body: { padding: 'p-4' } }">
          <div class="flex justify-between items-start">
             <div>
               <div class="text-xs font-bold text-gray-500 uppercase">Available Tables</div>
               <div class="text-2xl font-bold mt-1">{{ stats?.available_tables || 0 }}</div>
             </div>
             <div class="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-600">
               <UIcon name="i-lucide-armchair" class="w-5 h-5"/>
             </div>
          </div>
        </UCard>
      </div>
    </ClientOnly>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <div class="lg:col-span-2 flex flex-col gap-4">
        
        <div class="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
           <button @click="activeTab = 'arrivals'" 
             class="flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2"
             :class="activeTab === 'arrivals' ? 'bg-white dark:bg-gray-900 shadow-sm text-primary-600' : 'text-gray-500 hover:text-gray-700'">
             <UIcon name="i-lucide-calendar-clock" class="w-4 h-4"/> Arrivals
             <UBadge color="gray" size="xs">{{ upcomingSchedule?.length || 0 }}</UBadge>
           </button>
           <button @click="activeTab = 'waitlist'" 
             class="flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2"
             :class="activeTab === 'waitlist' ? 'bg-white dark:bg-gray-900 shadow-sm text-purple-600' : 'text-gray-500 hover:text-gray-700'">
             <UIcon name="i-lucide-hourglass" class="w-4 h-4"/> Waiting List
             <UBadge color="purple" size="xs">{{ waitingList?.length || 0 }}</UBadge>
           </button>
        </div>

        <ClientOnly>
          <template #fallback>
             <UCard class="min-h-[400px]">
               <div class="space-y-4 p-4">
                 <USkeleton class="h-12 w-full" v-for="n in 5" :key="n"/>
               </div>
             </UCard>
          </template>

          <UCard v-if="activeTab === 'arrivals'" class="min-h-[400px]">
             <div class="space-y-3">
               <div v-if="upcomingSchedule?.length === 0" class="text-center py-10 text-gray-400">
                 No upcoming bookings for now.
               </div>

               <div v-for="book in upcomingSchedule" :key="book.id" 
                 class="flex items-center gap-4 p-3 rounded-lg border transition-all"
                 :class="[
                   book.is_urgent ? 'border-orange-200 bg-orange-50/50 dark:border-orange-900/30 dark:bg-orange-900/10' : 'border-gray-200 dark:border-gray-800',
                   book.status === 'checked_in' ? 'opacity-50 grayscale' : ''
                 ]">
                 <div class="flex flex-col items-center min-w-[60px]">
                    <span class="text-lg font-bold">{{ book.time }}</span>
                    <span class="text-[10px] font-bold px-1.5 py-0.5 rounded text-white" :class="book.is_urgent ? 'bg-orange-500' : 'bg-gray-400'">
                      {{ book.time_diff }}
                    </span>
                 </div>
                 <div class="w-px h-10 bg-gray-200 dark:bg-gray-800"></div>
                 <div class="flex-1">
                    <div class="font-bold text-gray-900 dark:text-white">{{ book.customer }}</div>
                    <div class="text-xs text-gray-500 flex gap-3 mt-1">
                       <span class="flex items-center gap-1"><UIcon name="i-lucide-users" class="w-3 h-3"/> {{ book.pax }} Pax</span>
                       <span class="flex items-center gap-1 uppercase">
                         <UIcon name="i-lucide-circle" class="w-2 h-2" :class="book.status === 'checked_in' ? 'text-green-500' : 'text-blue-500'"/> 
                         {{ book.status.replace('_', ' ') }}
                       </span>
                    </div>
                 </div>
                 <UButton size="xs" 
                   :color="book.status === 'pending' ? 'primary' : 'gray'" 
                   :variant="book.status === 'pending' ? 'solid' : 'ghost'"
                   :disabled="book.status === 'checked_in'"
                   @click="handleSeat(book.id, 'booking')">
                   {{ book.status === 'checked_in' ? 'Seated' : 'Check-in' }}
                 </UButton>
               </div>
             </div>
          </UCard>

          <UCard v-if="activeTab === 'waitlist'" class="min-h-[400px]">
             <div class="flex gap-2 mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
               <UInput v-model="newWaitlist.customer" placeholder="Guest Name" icon="i-lucide-user" size="sm" class="flex-1"/>
               <UInput v-model="newWaitlist.pax" type="number" placeholder="Pax" size="sm" class="w-20"/>
               <UButton icon="i-lucide-plus" size="sm" color="purple" @click="handleAddWaitlist">Add</UButton>
             </div>

             <div class="space-y-3">
               <div v-if="waitingList?.length === 0" class="text-center py-10 text-gray-400">
                 Waiting list is empty.
               </div>

               <div v-for="guest in waitingList" :key="guest.id" 
                  class="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-purple-300 dark:hover:border-purple-800 transition-colors bg-white dark:bg-gray-900">
                  <UAvatar :alt="guest.customer" size="sm" class="bg-purple-100 text-purple-700"/>
                  
                  <div class="flex-1">
                     <div class="font-bold text-sm flex items-center gap-2">
                        {{ guest.customer }}
                        <UBadge color="gray" variant="soft" size="xs">{{ guest.pax }} Pax</UBadge>
                     </div>
                     <div class="text-xs text-gray-500 mt-0.5">Joined: {{ guest.joined_at }}</div>
                  </div>

                  <div class="text-right px-2">
                     <div class="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Waiting</div>
                     <div class="font-mono font-bold text-sm px-1.5 rounded" :class="getWaitColor(guest.wait_time)">
                        {{ guest.wait_time }}m
                     </div>
                  </div>

                  <div class="flex gap-1">
                     <UButton icon="i-lucide-armchair" size="xs" color="primary" variant="soft" @click="handleSeat(guest.id, 'waitlist')">Seat</UButton>
                     <UButton icon="i-lucide-trash-2" size="xs" color="red" variant="ghost" @click="handleRemoveWaitlist(guest.id)"/>
                  </div>
               </div>
             </div>
          </UCard>
        </ClientOnly>
      </div>

      <div class="flex flex-col gap-6">
        
        <UCard>
           <template #header>
             <h3 class="font-bold text-sm text-gray-500 uppercase tracking-wide">Floor Occupancy</h3>
           </template>
           
           <ClientOnly>
             <template #fallback>
                <div class="space-y-4">
                  <div v-for="n in 3" :key="n">
                    <div class="flex justify-between mb-1"><USkeleton class="h-4 w-20"/><USkeleton class="h-4 w-10"/></div>
                    <USkeleton class="h-2 w-full"/>
                  </div>
                </div>
             </template>
             <div class="space-y-4">
               <div v-for="floor in floorStatus" :key="floor.name">
                  <div class="flex justify-between text-sm mb-1">
                     <span class="font-medium">{{ floor.name }}</span>
                     <span class="text-gray-500 text-xs">{{ floor.current }}/{{ floor.max }}</span>
                  </div>
                  <UProgress :value="floor.current" :max="floor.max" :color="floor.color" size="sm"/>
               </div>
               <div v-if="floorStatus?.length === 0" class="text-sm text-gray-400 italic">No floor data available</div>
             </div>
           </ClientOnly>
        </UCard>

        <UCard class="flex-1">
           <template #header>
             <h3 class="font-bold text-sm text-gray-500 uppercase tracking-wide">Alerts & Warnings</h3>
           </template>
           
           <ClientOnly>
             <template #fallback>
                <div class="space-y-2">
                   <USkeleton class="h-12 w-full" v-for="n in 2" :key="n" />
                </div>
             </template>
             <ul class="space-y-2">
               <li v-for="(alert, i) in alerts" :key="i"
                  class="flex gap-3 items-start p-2.5 rounded-lg border text-sm"
                  :class="alert.type === 'overtime' ? 'bg-red-50 border-red-100 text-red-800 dark:bg-red-900/10 dark:border-red-900' : 'bg-orange-50 border-orange-100 text-orange-800 dark:bg-orange-900/10 dark:border-orange-900'">
                  <UIcon :name="alert.type === 'overtime' ? 'i-lucide-clock' : 'i-lucide-alert-triangle'" class="w-4 h-4 mt-0.5 flex-shrink-0"/>
                  <div>
                     <div class="font-bold">{{ alert.message }}</div>
                     <div class="text-xs opacity-80 mt-0.5">{{ alert.details || 'Please check.' }}</div>
                  </div>
               </li>
               <li v-if="alerts?.length === 0" class="text-center py-4 text-gray-400 text-sm">
                  <UIcon name="i-lucide-check-circle" class="w-5 h-5 mx-auto mb-1 text-green-500"/>
                  No active alerts
               </li>
             </ul>
           </ClientOnly>
        </UCard>
      </div>

    </div>
  </div>
</template>
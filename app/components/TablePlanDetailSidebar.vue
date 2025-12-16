<script setup lang="ts">

/* --- PROPS & EMITS --- */
const props = defineProps<{
  table: FloorTable | null;
  isOpen: boolean;
}>();

const emit = defineEmits(['close']);

/* --- COMPONENTS --- */
// Assuming Nuxt auto-imports or these are global. If not, resolveComponent them.
// const UIcon = resolveComponent("UIcon"); 
// const UButton = resolveComponent("UButton");
// const UInput = resolveComponent("UInput");

/* --- STORES --- */
const bookingStore = useBookingStore();
const toast = useToast(); // Assuming you have a useToast composable

/* --- STATE --- */
const loadingSchedule = ref(false);
const scheduleData = ref<any>(null);

// Date Filter State (Default: Today)
const filterDate = ref(new Date().toISOString().split('T')[0]);

/* --- FETCH LOGIC --- */
async function fetchSchedule() {
  if (!props.table) return;
  
  loadingSchedule.value = true;
  scheduleData.value = null;

  try {
    // Use the selected filterDate
    const res = await useApi<any>(`/api/v1/tables/${props.table.id}/schedule`, {
      params: { date: filterDate.value }
    });
    scheduleData.value = res;
  } catch (e) {
    console.error(e);
  } finally {
    loadingSchedule.value = false;
  }
}

// Watchers
// 1. If table changes or sidebar opens, reset date to today and fetch
watch(() => props.table?.id, (newId) => {
  if (newId && props.isOpen) {
    filterDate.value = new Date().toISOString().split('T')[0]; // Reset to today on open
    fetchSchedule();
  }
}, { immediate: true });

// 2. If user changes the date, re-fetch
watch(filterDate, () => {
  if (props.table && props.isOpen) {
    fetchSchedule();
  }
});

/* --- ACTIONS --- */
const navigateToBooking = (type: 'walk_in' | 'reservation') => {
  if (!props.table) return;
  navigateTo({
    path: '/transaction/create-booking',
    query: { 
      table_id: props.table.id, 
      type,
      date: filterDate.value // Optional: Pass date to create page
    }
  });
};

/* --- BOOKING STORE INTEGRATION --- */
const actionLoadingId = ref<number | null>(null); // Track which booking is processing

const handleBookingAction = async (bookingId: number, action: 'check_in' | 'cancel' | 'complete') => {
  actionLoadingId.value = bookingId;
  
  try {
    if (action === 'check_in') {
      await bookingStore.checkIn(bookingId);
      toast.add({ title: 'Guest Checked In', color: 'success', icon: 'i-lucide-check' });
    } 
    else if (action === 'complete') {
      await bookingStore.checkOut(bookingId);
      toast.add({ title: 'Booking Completed', color: 'success', icon: 'i-lucide-log-out' });
    } 
    else if (action === 'cancel') {
      // Assuming deleteBooking is used for cancellation based on your store
      if (!confirm('Are you sure you want to cancel this booking?')) return;
      await bookingStore.deleteBooking(bookingId);
      toast.add({ title: 'Booking Cancelled', color: 'neutral', icon: 'i-lucide-x' });
    }

    // Success! Refresh the schedule list
    await fetchSchedule();

  } catch (error: any) {
    toast.add({ 
      title: 'Action Failed', 
      description: error.message || 'Something went wrong', 
      color: 'error' 
    });
  } finally {
    actionLoadingId.value = null;
  }
};

/* --- HELPERS --- */
const getStatusBadge = (status: string) => {
  switch(status) {
    case 'checked_in': return { color: 'rose', label: 'Occupied' };
    case 'seated': return { color: 'rose', label: 'Seated' }; // Handle 'seated' if used interchangeably
    case 'reserved': return { color: 'amber', label: 'Reserved' };
    case 'confirmed': return { color: 'amber', label: 'Confirmed' };
    case 'completed': return { color: 'emerald', label: 'Done' };
    default: return { color: 'neutral', label: status };
  }
};

const isToday = computed(() => {
  const today = new Date().toISOString().split('T')[0];
  return filterDate.value === today;
});
</script>

<template>
  <div 
    class="fixed inset-y-0 right-0 w-full sm:w-[400px] bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-800 shadow-2xl transform transition-transform duration-300 z-30 lg:absolute flex flex-col"
    :class="isOpen ? 'translate-x-0' : 'translate-x-full'"
  >
    <div v-if="table" class="h-full flex flex-col bg-neutral-50/50 dark:bg-neutral-900">
      
      <div class="p-6 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm z-10">
        <div class="flex justify-between items-start mb-4">
           <div>
              <h2 class="text-2xl font-bold text-neutral-900 dark:text-white leading-none">{{ table.name }}</h2>
              <div class="text-xs text-neutral-500 mt-2 flex items-center gap-2">
                 <UBadge :color="table.flags.is_occupied ? 'rose' : (table.flags.is_reserved ? 'amber' : 'emerald')" variant="subtle" size="xs" class="capitalize">
                    {{ table.status.toUpperCase() }}
                 </UBadge>
                 <span class="text-neutral-300">•</span>
                 <span class="flex items-center gap-1"><UIcon name="i-lucide-users" class="w-3 h-3" /> {{ table.capacity }} Pax</span>
              </div>
           </div>
           <UButton icon="i-lucide-x" color="neutral" variant="ghost" @click="emit('close')" />
        </div>

        <div v-if="isToday" class="grid grid-cols-2 gap-3 animate-in fade-in duration-300">
           <UButton 
              @click="navigateToBooking('walk_in')" 
              block color="primary" icon="i-lucide-footprints" 
              :disabled="!table.flags.can_walk_in"
              :variant="table.flags.can_walk_in ? 'solid' : 'soft'"
           >
              Walk-in Now
           </UButton>
           
           <UButton 
              @click="navigateToBooking('reservation')" 
              block color="neutral" variant="outline" icon="i-lucide-calendar-plus"
           >
              Reserve
           </UButton>
        </div>
      </div>

      <div class="px-6 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-between">
         <span class="text-xs font-bold text-neutral-500 uppercase tracking-wider">Schedule For:</span>
         <div class="w-40">
            <UInput type="date" v-model="filterDate" size="xs" icon="i-lucide-calendar" />
         </div>
      </div>

      <div class="flex-1 overflow-y-auto p-6 relative custom-scrollbar bg-neutral-50/30 dark:bg-neutral-950">
         
         <div v-if="loadingSchedule" class="py-10 flex flex-col items-center justify-center gap-3 text-neutral-400">
            <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary-500" />
            <span class="text-xs font-medium">Loading schedule...</span>
         </div>

         <div v-else-if="scheduleData" class="space-y-6">
            
            <div class="relative pl-4 border-l-2 border-neutral-200 dark:border-neutral-800 space-y-6">
                <div v-for="(item, idx) in scheduleData.schedule" :key="idx" class="relative pl-6">
                   
                   <div 
                      class="absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white dark:border-neutral-900 z-10 shadow-sm"
                      :class="item.type === 'booking' ? 'bg-primary-500' : 'bg-neutral-300 dark:bg-neutral-700'"
                   ></div>

                   <div class="text-xs font-mono font-medium text-neutral-500 mb-2 flex items-center gap-2">
                      <span class="bg-white dark:bg-neutral-800 px-1 rounded border border-neutral-100 dark:border-neutral-700">{{ item.start_at }}</span>
                      <span class="w-4 h-px bg-neutral-300 dark:bg-neutral-700"></span>
                      <span class="bg-white dark:bg-neutral-800 px-1 rounded border border-neutral-100 dark:border-neutral-700">{{ item.end_at }}</span>
                   </div>

                   <div v-if="item.type === 'booking'" 
                        class="p-4 bg-white dark:bg-neutral-800 rounded-lg border shadow-sm transition-all duration-200 group"
                        :class="['checked_in', 'seated'].includes(item.status) ? 'border-rose-200 ring-1 ring-rose-100 dark:border-rose-900/50 dark:ring-rose-900/20' : 'border-neutral-200 hover:border-primary-300 hover:shadow-md'"
                   >
                      <div class="flex justify-between items-start mb-3">
                         <div class="flex items-center gap-2">
                            <UAvatar :alt="item.customer_name || '?'" size="2xs" :class="['checked_in', 'seated'].includes(item.status) ? 'bg-rose-100 text-rose-600' : 'bg-primary-50 text-primary-600'" />
                            <div>
                               <div class="font-bold text-sm text-neutral-900 dark:text-white leading-tight">
                                  {{ item.customer_name || 'Guest' }}
                               </div>
                               <div class="text-[10px] text-neutral-400 font-mono mt-0.5">#{{ item.code }}</div>
                            </div>
                         </div>
                         <UBadge :color="getStatusBadge(item.status).color" variant="soft" size="xs" class="capitalize">
                            {{ getStatusBadge(item.status).label }}
                         </UBadge>
                      </div>
                      
                      <div class="flex items-center gap-3 text-xs text-neutral-500 mb-4 bg-neutral-50 dark:bg-neutral-800/50 p-2 rounded-md">
                         <span class="flex items-center gap-1.5"><UIcon name="i-lucide-users" class="w-3.5 h-3.5" /> {{ item.party_size }} Pax</span>
                         <span class="w-px h-3 bg-neutral-300"></span>
                         <span class="flex items-center gap-1.5"><UIcon name="i-lucide-clock" class="w-3.5 h-3.5" /> {{ item.start_at }}</span>
                      </div>

                      <div class="pt-3 border-t border-neutral-100 dark:border-neutral-700 flex gap-2">
                          
                          <template v-if="['reserved', 'confirmed'].includes(item.status)">
                              <UButton 
                                 block size="xs" color="emerald" icon="i-lucide-check" 
                                 class="flex-1 font-semibold"
                                 :loading="actionLoadingId === item.id"
                                 @click="handleBookingAction(item.id, 'check_in')"
                              >
                                 Check In
                              </UButton>
                              <UButton 
                                 size="xs" color="rose" variant="ghost" icon="i-lucide-x"
                                 :loading="actionLoadingId === item.id" 
                                 @click="handleBookingAction(item.id, 'cancel')"
                                 tooltip="Cancel Booking"
                              />
                          </template>

                          <template v-else-if="['checked_in', 'seated'].includes(item.status)">
                              <UButton 
                                 block size="xs" color="neutral" variant="outline" icon="i-lucide-log-out" 
                                 class="w-full justify-center hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors"
                                 :loading="actionLoadingId === item.id"
                                 @click="handleBookingAction(item.id, 'complete')"
                              >
                                 Finish / Complete
                              </UButton>
                          </template>

                          <template v-else>
                              <span class="text-[10px] text-neutral-400 italic w-full text-center py-1">Booking closed</span>
                          </template>

                      </div>
                   </div>

                   <div v-else class="p-2 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-lg text-center group cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-colors" @click="navigateToBooking('reservation')">
                      <span class="text-[10px] font-medium text-neutral-400 group-hover:text-emerald-600 flex items-center justify-center gap-1">
                         <UIcon name="i-lucide-plus" class="w-3 h-3" /> Add Reservation
                      </span>
                   </div>

                </div>
            </div>
         </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 5px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.3);
  border-radius: 20px;
}
</style>
<script setup lang="ts">
import type { FloorTable } from "~/stores/transaction/floorPlan";

const props = defineProps<{
  table: FloorTable;
  isSelected: boolean;
}>();

const emit = defineEmits(['click']);

/* --- STYLING LOGIC --- */
const cardClasses = computed(() => {
  const base = "group relative rounded-xl border-2 transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md cursor-pointer select-none min-h-[140px]";
  
  // 1. Selected (Highlight Biru)
  if (props.isSelected) {
    return `${base} bg-primary-50 dark:bg-primary-900/20 border-primary-500 ring-1 ring-primary-500 transform scale-[1.02] z-20`;
  }

  // 2. Occupied (Merah - Tamu sedang duduk)
  if (props.table.flags.is_occupied) {
    return `${base} bg-white dark:bg-neutral-900 border-rose-200 dark:border-rose-900/50`;
  }

  // 3. Reserved / Incoming (Kuning - Kosong tapi ada janji)
  // Kuncinya disini: Background tetap PUTIH agar terlihat "Kosong", tapi Border KUNING
  if (props.table.flags.is_reserved || props.table.flags.has_next_booking) {
    return `${base} bg-amber-50/30 dark:bg-amber-900/10 border-amber-300 dark:border-amber-700 border-dashed`;
  }

  // 4. Pure Available (Putih/Abu)
  return `${base} bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 hover:border-emerald-400 hover:bg-emerald-50/20`;
});

const headerClasses = computed(() => {
  if (props.table.flags.is_occupied) return 'bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-900/30 text-rose-700';
  if (props.table.flags.is_reserved) return 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700';
  return 'bg-neutral-50 dark:bg-neutral-800 border-neutral-100 dark:border-neutral-700 text-neutral-600';
});
</script>

<template>
  <div :class="cardClasses" @click="emit('click', table)">
    
    <div class="px-3 py-2 flex justify-between items-center border-b transition-colors" :class="headerClasses">
      <div class="font-bold text-sm">{{ table.name }}</div>
      
      <div class="flex items-center gap-1.5">
        <span v-if="table.flags.is_occupied" class="flex h-2 w-2 rounded-full bg-rose-500 shadow-sm shadow-rose-200"></span>
        <span v-else-if="table.flags.is_reserved" class="flex h-2 w-2 rounded-full bg-amber-500 shadow-sm shadow-amber-200 animate-pulse"></span>
        <span v-else class="flex h-2 w-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-200"></span>

        <span class="text-xs opacity-70 flex items-center gap-0.5 ml-1 font-medium">
           <UIcon name="i-lucide-users" class="w-3 h-3" />{{ table.capacity }}
        </span>
      </div>
    </div>

    <div class="p-3 flex-1 flex flex-col justify-center gap-2 relative">
      
      <template v-if="table.flags.is_occupied && table.current_booking">
         <div class="flex items-center gap-2">
             <UAvatar :alt="table.current_booking.customer || '?'" size="2xs" class="bg-rose-100 text-rose-600 ring-1 ring-rose-200" />
             <div class="flex flex-col">
                <span class="text-xs font-bold text-neutral-900 dark:text-white truncate w-20">
                    {{ table.current_booking.customer || 'Guest' }}
                </span>
                <span class="text-[10px] text-neutral-400 leading-none">#{{ table.current_booking.code.slice(-4) }}</span>
             </div>
         </div>
      </template>

      <template v-else-if="table.flags.is_reserved && table.next_booking">
         <div class="flex flex-col items-center justify-center gap-1 text-amber-600 dark:text-amber-400">
            <UIcon name="i-lucide-clock" class="w-6 h-6 opacity-80" />
            
            <div class="text-center leading-none">
                <div class="text-[10px] uppercase font-bold tracking-wider opacity-70 mb-0.5">Incoming</div>
                <div class="text-lg font-bold font-mono">{{ table.next_booking.start_at }}</div>
            </div>
         </div>
      </template>

      <template v-else>
         <div class="flex flex-col items-center justify-center h-full text-neutral-300 dark:text-neutral-600 gap-1 group-hover:text-emerald-500/70 transition-colors">
            <UIcon name="i-lucide-armchair" class="w-8 h-8 opacity-30 group-hover:opacity-100 transition-opacity" />
            <span class="text-[10px] font-medium uppercase tracking-widest opacity-60">Empty</span>
         </div>
      </template>
    </div>

    <div 
       v-if="table.flags.has_next_booking && table.next_booking && !table.flags.is_occupied" 
       class="px-3 py-1.5 text-[10px] font-medium flex items-center justify-between border-t transition-colors"
       :class="table.flags.is_reserved ? 'bg-amber-100/50 text-amber-700 border-amber-200' : 'bg-neutral-50 text-neutral-500 border-neutral-100'"
    >
       <span class="flex items-center gap-1">
          <UIcon name="i-lucide-calendar-clock" class="w-3 h-3" />
          {{ table.flags.is_reserved ? 'Reserved At:' : 'Next:' }}
       </span>
       <span class="font-mono font-bold">{{ table.next_booking.start_at }}</span>
    </div>

    <div v-if="isSelected" class="absolute top-0 right-0 p-1 z-10">
       <div class="bg-primary-500 text-white rounded-bl-lg rounded-tr-md w-5 h-5 flex items-center justify-center shadow-sm">
          <UIcon name="i-lucide-check" class="w-3.5 h-3.5" />
       </div>
    </div>

  </div>
</template>
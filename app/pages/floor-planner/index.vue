<script setup lang="ts">
import Sortable from 'sortablejs';
import type { FloorTable } from "~/stores/transaction/floorPlan";

/* --- STORES --- */
const floorStore = useFloorStore();
const floorPlanStore = useFloorPlanStore();
const { tables, loadingSnapshot } = storeToRefs(floorPlanStore);
const { floors } = storeToRefs(floorStore);

/* --- STATE --- */
const activeFloorId = ref<number | null>(null);
const selectedTable = ref<FloorTable | null>(null);
const now = ref(new Date());
const isReordering = ref(false);
const floorListRef = ref<HTMLElement | null>(null);
let sortableInstance: Sortable | null = null;

/* --- INIT --- */
onMounted(async () => {
  await floorStore.fetchFloors({ page: 1, per_page: 100 });
  if (floors.value.length > 0) activeFloorId.value = floors.value[0].id;
  
  const timer = setInterval(() => { now.value = new Date(); }, 60000);
  onUnmounted(() => clearInterval(timer));

  // Setup Sortable manually
  if (floorListRef.value) {
    sortableInstance = new Sortable(floorListRef.value, {
      animation: 150,
      handle: '.drag-handle',
      ghostClass: 'opacity-30',
      disabled: true, // Default disabled
      onStart: () => {
        console.log('Drag started');
      },
      onEnd: async (evt) => {
        console.log('Drag ended:', evt.oldIndex, '→', evt.newIndex);
        if (evt.oldIndex !== undefined && evt.newIndex !== undefined && evt.oldIndex !== evt.newIndex && isReordering.value) {
          // Reorder array
          const movedFloor = floors.value.splice(evt.oldIndex, 1)[0];
          floors.value.splice(evt.newIndex, 0, movedFloor);
          
          try {
            await floorStore.reorderFloors(floors.value);
            console.log('Reorder saved successfully');
          } catch (error) {
            console.error('Failed to reorder floors:', error);
          }
        }
      }
    });
    console.log('Sortable initialized:', sortableInstance);
  }
});

/* --- WATCH REORDER MODE --- */
watch(isReordering, (newVal) => {
  console.log('Reorder mode:', newVal);
  if (sortableInstance) {
    sortableInstance.option('disabled', !newVal);
  }
});

/* --- WATCH & FETCH --- */
watch(activeFloorId, (newId) => {
  if (newId) {
    selectedTable.value = null;
    refreshSnapshot();
  }
});

async function refreshSnapshot() {
  if (!activeFloorId.value) return;
  await floorPlanStore.fetchSnapshot({ floor_id: activeFloorId.value });
}

/* --- HANDLERS --- */
function onTableClick(table: FloorTable) {
  selectedTable.value = table;
}

function onCloseSidebar() {
  selectedTable.value = null;
}

function toggleReorderMode() {
  isReordering.value = !isReordering.value;
}

/* --- COMPUTED HELPERS --- */
const currentTimeStr = computed(() => 
  now.value.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
);

const stats = computed(() => {
  const total = tables.value.length;
  const occupied = tables.value.filter(t => t.status === 'occupied').length;
  const reserved = tables.value.filter(t => t.flags.is_reserved).length;
  const available = total - occupied;
  
  return { total, occupied, reserved, available };
});

</script>

<template>
  <div class="flex h-[calc(100vh-6rem)] gap-0 overflow-hidden bg-neutral-50 dark:bg-neutral-950">
    
    <div class="flex-1 flex flex-col min-w-0 transition-all duration-300 relative" :class="selectedTable ? 'mr-0 lg:mr-[400px]' : ''">
      
      <div class="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col xl:flex-row justify-between items-center gap-4 shadow-sm z-20">
        
        <div class="flex items-center gap-4 w-full xl:w-auto overflow-x-auto no-scrollbar">
          
          <!-- Toggle Reorder Button -->
          <UTooltip :text="isReordering ? 'Done Reordering' : 'Reorder Floors'">
            <UButton 
              :icon="isReordering ? 'i-lucide-check' : 'i-lucide-grip-vertical'"
              :variant="isReordering ? 'solid' : 'ghost'"
              :color="isReordering ? 'primary' : 'neutral'"
              size="sm"
              @click="toggleReorderMode"
            />
          </UTooltip>

          <!-- Floor Tabs with Drag & Drop -->
          <div 
            ref="floorListRef"
            class="flex gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg shrink-0"
          >
            <button 
              v-for="floor in floors" 
              :key="floor.id"
              class="px-4 py-1.5 text-sm font-medium rounded-md transition-all whitespace-nowrap flex items-center gap-2"
              :class="[
                activeFloorId === floor.id 
                  ? 'bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-white ring-1 ring-black/5' 
                  : 'text-neutral-500 hover:text-neutral-700',
                isReordering ? 'cursor-move' : 'cursor-pointer'
              ]"
              @click="!isReordering && (activeFloorId = floor.id)"
            >
              <Icon 
                v-if="isReordering" 
                name="lucide:grip-vertical" 
                class="w-3.5 h-3.5 drag-handle cursor-grab active:cursor-grabbing opacity-40"
              />
              {{ floor.name }}
            </button>
          </div>

          <div class="h-8 w-px bg-neutral-200 dark:bg-neutral-800 hidden md:block"></div>

          <div class="hidden md:flex items-center gap-4 text-xs font-medium text-neutral-500">
             <div class="flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-rose-500"></span>
                <span>{{ stats.occupied }} Occupied</span>
             </div>
             <div class="flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>{{ stats.reserved }} Reserved</span>
             </div>
             <div class="flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>{{ stats.available }} Free</span>
             </div>
          </div>
        </div>

        <div class="flex items-center gap-3 w-full xl:w-auto justify-end">
           <div class="hidden md:flex items-center gap-2 px-3 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md text-xs font-mono text-neutral-600 dark:text-neutral-300">
              <Icon name="lucide:clock" class="w-3.5 h-3.5 text-primary-500" />
              {{ currentTimeStr }}
           </div>

           <UTooltip text="Refresh Layout">
             <UButton icon="i-lucide-refresh-cw" variant="ghost" color="neutral" :loading="loadingSnapshot" @click="refreshSnapshot" />
           </UTooltip>
        </div>
      </div>

      <!-- Alert saat reorder mode active -->
      <div v-if="isReordering" class="px-6 py-2 bg-primary-50 dark:bg-primary-950/30 border-b border-primary-200 dark:border-primary-800 flex items-center gap-2 text-sm text-primary-700 dark:text-primary-300">
        <Icon name="lucide:info" class="w-4 h-4" />
        <span class="font-medium">Drag floors to reorder</span>
        <span class="text-primary-600 dark:text-primary-400">• Changes are saved automatically</span>
      </div>

      <div class="flex-1 overflow-auto bg-neutral-50/50 dark:bg-neutral-950 custom-scrollbar relative p-4 sm:p-6">
        
        <div v-if="loadingSnapshot && tables.length === 0" class="flex flex-col justify-center items-center h-full gap-3 opacity-60">
             <Icon name="lucide:loader-2" class="w-10 h-10 animate-spin text-primary-500" />
             <p class="text-sm font-medium">Updating floor status...</p>
        </div>
        
        <div v-else-if="tables.length === 0" class="flex flex-col justify-center items-center h-full gap-4 text-center">
             <div class="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                <Icon name="lucide:layout-dashboard" class="w-8 h-8 text-neutral-400" />
             </div>
             <div>
                <h3 class="text-lg font-bold text-neutral-900 dark:text-white">No Tables Here</h3>
                <p class="text-sm text-neutral-500 max-w-xs mx-auto">This floor seems empty. Please switch to another floor or add tables in settings.</p>
             </div>
        </div>

        <div v-else class="max-w-[1800px] mx-auto pb-20">
          
          <div class="mb-6 flex items-center justify-between">
             <div class="text-sm text-neutral-500">
                Found <strong>{{ tables.length }}</strong> tables on <span class="font-bold text-neutral-800 dark:text-neutral-200">{{ floors.find(f => f.id === activeFloorId)?.name }}</span>.
                <span class="hidden sm:inline">Click any card to see details.</span>
             </div>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            <TablePlanCard 
               v-for="t in tables" 
               :key="t.id" 
               :table="t"
               :is-selected="selectedTable?.id === t.id"
               @click="onTableClick"
            />
          </div>

        </div>

        <div class="hidden 2xl:block absolute bottom-6 left-6 p-4 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-lg z-10 text-xs">
           <h4 class="font-bold text-neutral-900 dark:text-white mb-2 uppercase tracking-wider text-[10px]">Status Guide</h4>
           <div class="space-y-2">
              <div class="flex items-center gap-2">
                 <span class="w-3 h-3 rounded bg-emerald-400"></span>
                 <span class="text-neutral-600 dark:text-neutral-300">Available (Empty)</span>
              </div>
              <div class="flex items-center gap-2">
                 <span class="w-3 h-3 rounded bg-rose-500"></span>
                 <span class="text-neutral-600 dark:text-neutral-300">Occupied (Seated)</span>
              </div>
              <div class="flex items-center gap-2">
                 <div class="w-3 h-3 rounded bg-amber-100 border border-amber-300 border-dashed"></div>
                 <span class="text-neutral-600 dark:text-neutral-300">Reserved (Incoming)</span>
              </div>
           </div>
        </div>

      </div>
    </div>

    <TablePlanDetailSidebar 
       :is-open="!!selectedTable"
       :table="selectedTable"
       @close="onCloseSidebar"
    />

  </div>
</template>
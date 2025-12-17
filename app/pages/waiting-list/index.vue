<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import type { Waitlist, WaitlistForm } from "~/types/waitlist";

/* ================= STORES ================= */
const waitlistStore = useWaitlistStore();
const branchStore = useBranchStore();
const toast = useToast();

const { waitlists, loading } = storeToRefs(waitlistStore);

/* ================= STATE ================= */
const searchQuery = ref("");
const selectedItem = ref<Waitlist | null>(null);
const showForm = ref(false);

/* ================= TABLE COLUMNS ================= */
const columns = [
  { accessorKey: "queue_number", header: "#" },
  { accessorKey: "customer_name", header: "Customer" },
  { accessorKey: "pax", header: "Pax" },
  { accessorKey: "wait_time", header: "Wait Time" },
  { accessorKey: "status", header: "Status" },
  { id: "actions", header: "Actions" },
];

/* ================= DATA ================= */
async function refreshData() {
  if (!branchStore.currentBranch) return;

  await waitlistStore.fetchWaitlists({
    branch_id: branchStore.currentBranch.id,
    q: searchQuery.value,
    status: "waiting",
  });
}

watch(searchQuery, refreshData);

watch(
  () => branchStore.currentBranch?.id,
  (id) => id && refreshData()
);

onMounted(async () => {
  if (!branchStore.currentBranch) {
    await branchStore.fetchBranchList();
  }
  refreshData();
});

/* ================= ACTIONS ================= */
function openCreate() {
  selectedItem.value = null;
  showForm.value = true;
}

function openEdit(item: Waitlist) {
  selectedItem.value = item;
  showForm.value = true;
}

function closeForm() {
  selectedItem.value = null;
  showForm.value = false;
}

async function handleFormSubmit(formData: WaitlistForm) {
  try {
    const payload = {
      ...formData,
      branch_id: branchStore.currentBranch?.id || 1,
    };

    if (selectedItem.value) {
      await waitlistStore.updateWaitlist(selectedItem.value.id, payload);
      toast.add({ title: "Updated", color: "primary" });
    } else {
      await waitlistStore.addWaitlist(payload);
      toast.add({ title: "Added", color: "emerald" });
    }

    closeForm();
    refreshData();
  } catch (error: any) {
    toast.add({
      title: "Error",
      description: error.message,
      color: "rose",
    });
  }
}

async function handleDelete(id: number) {
  if (!confirm("Remove this guest?")) return;

  try {
    await waitlistStore.removeWaitlist(id);
    toast.add({ title: "Removed", color: "gray" });
    refreshData();
  } catch (error: any) {
    toast.add({ title: "Error", description: error.message, color: "rose" });
  }
}

async function handleSeat(item: Waitlist) {
  try {
    await waitlistStore.seatGuest(item.id, [1]);
    toast.add({
      title: "Seated",
      description: `${item.customer_name} seated`,
      color: "emerald",
    });
    refreshData();
  } catch (error: any) {
    toast.add({ title: "Failed", description: error.message, color: "rose" });
  }
}

/* ================= HELPERS ================= */
const getStatusColor = (status: string) => {
  if (status === "waiting") return "amber";
  if (status === "seated") return "emerald";
  return "gray";
};
</script>

<template>
  <div class="p-6 space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold">Waiting List</h1>
        <p class="text-sm text-gray-500">
          {{ branchStore.currentBranch?.name || "..." }}
        </p>
      </div>

      <UButton
        icon="i-lucide-plus"
        color="primary"
        @click="openCreate"
      >
        Add Walk-in
      </UButton>
    </div>

    <!-- Content -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- TABLE -->
      <UCard class="lg:col-span-2">
        <div class="flex gap-3 mb-4">
          <UInput
            v-model="searchQuery"
            icon="i-lucide-search"
            placeholder="Search name..."
            class="w-64"
          />
          <UButton
            icon="i-lucide-refresh-cw"
            variant="ghost"
            :loading="loading"
            @click="refreshData"
          />
        </div>

        <UTable
          :rows="waitlists"
          :columns="columns"
          :loading="loading"
        >
          <template #actions-header>
            <span class="sr-only">Actions</span>
          </template>

          <template #queue_number-data="{ row }">
            <UBadge color="primary" variant="subtle">
              #{{ row.queue_number }}
            </UBadge>
          </template>

          <template #status-data="{ row }">
            <UBadge
              :color="getStatusColor(row.status)"
              variant="soft"
              class="capitalize"
            >
              {{ row.status }}
            </UBadge>
          </template>

          <template #actions-data="{ row }">
            <div class="flex justify-end gap-2">
              <UButton
                size="xs"
                color="emerald"
                variant="soft"
                icon="i-lucide-armchair"
                @click="handleSeat(row)"
              />
              <UDropdown
                :items="[
                  [{ label: 'Edit', icon: 'i-lucide-pencil', click: () => openEdit(row) }],
                  [{ label: 'Remove', icon: 'i-lucide-trash', color: 'red', click: () => handleDelete(row.id) }],
                ]"
              >
                <UButton
                  size="xs"
                  variant="ghost"
                  icon="i-lucide-more-vertical"
                />
              </UDropdown>
            </div>
          </template>

          <template #empty>
            <div class="py-10 text-center text-gray-400">
              No waiting list
            </div>
          </template>
        </UTable>
      </UCard>

      <!-- FORM -->
      <UCard v-if="showForm" class="lg:col-span-1">
        <div class="flex justify-between items-center mb-4">
          <h3 class="font-semibold">
            {{ selectedItem ? "Edit Waitlist" : "Add Walk-in" }}
          </h3>
          <UButton
            icon="i-lucide-x"
            size="xs"
            variant="ghost"
            @click="closeForm"
          />
        </div>

        <WaitlistForm
          :initial-data="selectedItem"
          :loading="loading"
          @submit="handleFormSubmit"
          @cancel="closeForm"
        />
      </UCard>
    </div>
  </div>
</template>

<style scoped>
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
}
</style>

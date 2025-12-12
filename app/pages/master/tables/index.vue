<script setup lang="ts">
import type { FormSubmitEvent } from "#ui/types";
import type { TableColumn } from "@nuxt/ui";
import { getCoreRowModel } from "@tanstack/vue-table";
import {
    h,
    nextTick,
    onMounted,
    reactive,
    ref,
    resolveComponent,
    watch,
} from "vue";
import { z } from "zod";
import type { Table as TableType } from "~/types/master";

// Resolve UI components
const UButton = resolveComponent("UButton");
const UBadge = resolveComponent("UBadge");
const UDropdownMenu = resolveComponent("UDropdownMenu");
const UIcon = resolveComponent("UIcon");
const UInput = resolveComponent("UInput");
const USelect = resolveComponent("USelect");
const USelectMenu = resolveComponent("USelectMenu");
const UTable = resolveComponent("UTable");
const UPagination = resolveComponent("UPagination");
const UForm = resolveComponent("UForm");
const UFormField = resolveComponent("UFormField");
const UTextarea = resolveComponent("UTextarea");

// Local components (adjust paths if needed)
import BranchSelect from "~/components/BranchSelect.vue";
import FloorSelect from "~/components/FloorSelect.vue";

// Stores
const tableStore = useTableStore();
const branchStore = useBranchStore();
const floorStore = useFloorStore();

const {tables, loading: tableLoading, totalItems} = storeToRefs(tableStore);
const {branchList} = storeToRefs(branchStore);

// Toast
const toast = useToast();
const formLoading = ref(false);

// ---------------- Filters & Pagination ----------------
const q = ref("");
const page = ref(1);
const pageSize = ref(10);
const selectedBranchFilter = ref<number | undefined>(undefined);
const selectedFloorFilter = ref<number | undefined>(undefined);
const selectedStatusFilter = ref<string | undefined>(undefined);

const statusOptions = ["available", "hold", "booked", "occupied", "cleaning"];

function refreshData() {
  tableStore.fetchTables({
    q: q.value || undefined,
    page: page.value,
    per_page: pageSize.value,
    branch_id: selectedBranchFilter.value ?? undefined,
    floor_id: selectedFloorFilter.value ?? undefined,
    status: selectedStatusFilter.value ?? undefined,
  });
}

onMounted(async () => {
  // prefetch dropdowns
  await branchStore.fetchBranchList({per_page: 100});
  refreshData();
});

// watchers
watch(
  [
    page,
    pageSize,
    selectedBranchFilter,
    selectedFloorFilter,
    selectedStatusFilter,
  ],
  () => {
    refreshData();
  },
);

// debounce search
let searchTimeout: ReturnType<typeof setTimeout> | null = null;
watch(q, () => {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    page.value = 1;
    refreshData();
  }, 350);
});

function resetFilters() {
  q.value = "";
  page.value = 1;
  pageSize.value = 10;
  selectedBranchFilter.value = undefined;
  selectedFloorFilter.value = undefined;
  selectedStatusFilter.value = undefined;
  refreshData();
}

watch(selectedBranchFilter, () => {
  selectedFloorFilter.value = undefined;
});

// ---------------- Table columns ----------------
const columns: TableColumn<TableType>[] = [
  {
    accessorKey: "name",
    header: "Table",
    cell: ({row}) =>
      h(
        "div",
        {class: "font-medium text-neutral-900 dark:text-white"},
        row.getValue("name") as string,
      ),
  },
  {
    accessorKey: "capacity",
    header: "Capacity",
    size: 120,
    cell: ({row}) =>
      h(
        UBadge,
        {variant: "subtle", size: "xs"},
        () => `${row.getValue("capacity")} seats`,
      ),
  },
  {
    accessorKey: "status",
    header: "Status",
    size: 120,
    cell: ({row}) => {
      const st = row.getValue("status") as string;
      const mapping: Record<string, {color: string; label: string}> = {
        available: {color: "success", label: "Available"},
        hold: {color: "warning", label: "On Hold"},
        booked: {color: "info", label: "Booked"},
        occupied: {color: "error", label: "Occupied"},
        cleaning: {color: "neutral", label: "Cleaning"},
      };
      const m = mapping[st] ?? {color: "neutral", label: st};
      return h(
        UBadge,
        {color: m.color, variant: "subtle", size: "xs"},
        () => m.label,
      );
    },
  },
  {
    accessorKey: "branch.name",
    header: "Branch",
    cell: ({row}) => {
      const name = row.original.branch?.name;
      return name
        ? h(
            "div",
            {
              class:
                "flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300",
            },
            [
              h(UIcon, {
                name: "i-lucide-store",
                class: "w-3.5 h-3.5 text-neutral-400",
              }),
              h("span", name),
            ],
          )
        : h("span", {class: "text-neutral-400 text-xs italic"}, "No branch");
    },
  },
  {
    accessorKey: "floor.name",
    header: "Floor",
    cell: ({row}) => {
      const name = row.original.floor?.name;
      return name
        ? h(
            "div",
            {class: "text-sm text-neutral-600 dark:text-neutral-300"},
            name,
          )
        : h("span", {class: "text-neutral-400 text-xs italic"}, "No floor");
    },
  },
  {
    id: "actions",
    header: "",
    cell: ({row}) => {
      const items = [
        [
          {
            label: "Edit",
            icon: "i-lucide-pencil",
            onSelect: () => openEdit(row.original),
          },
          {
            label: "Delete",
            icon: "i-lucide-trash-2",
            iconClass: "text-error-500",
            onSelect: () => handleDelete(row.original.id),
          },
        ],
        [
          {
            label: row.original.status === "available" ? "Hold" : "Release",
            icon: "i-lucide-clock",
            onSelect: () =>
              row.original.status === "available"
                ? handleHold(row.original.id)
                : handleRelease(row.original.id),
          },
        ],
      ];
      return h(
        "div",
        {class: "text-right"},
        h(UDropdownMenu, {items, content: {align: "end"}, mode: "hover"}, () =>
          h(UButton, {
            icon: "i-lucide-ellipsis-vertical",
            color: "neutral",
            variant: "ghost",
            size: "xs",
          }),
        ),
      );
    },
  },
];

// ---------------- Form (create / edit) ----------------
const isFormOpen = ref(false);
const isEdit = ref(false);
const formRef = ref<any>(null);
const nativeSubmitRef = ref<HTMLButtonElement | null>(null);

const schema = z.object({
  branch_id: z.number({required_error: "Please select a branch"}),
  floor_id: z.number({required_error: "Please select a floor"}),
  name: z.string().min(1, "Table name is required"),
  capacity: z.number().min(1, "Capacity must be at least 1"),
  status: z.string().optional(),
  position: z.string().optional(),
});
type Schema = z.output<typeof schema>;

const state = reactive({
  id: 0,
  branch_id: undefined as number | undefined,
  floor_id: undefined as number | undefined,
  name: "",
  capacity: 2,
  status: "available",
  position: "",
});

function openCreate() {
  Object.assign(state, {
    id: 0,
    branch_id: undefined,
    floor_id: undefined,
    name: "",
    capacity: 2,
    status: "available",
    position: "",
  });
  isEdit.value = false;
  isFormOpen.value = true;
  nextTick(() => {});
}

function openEdit(row: TableType) {
  Object.assign(state, {
    id: row.id,
    branch_id: row.branch_id,
    floor_id: row.floor_id,
    name: row.name,
    capacity: row.capacity,
    status: row.status ?? "available",
    position:
      typeof row.position === "string"
        ? row.position
        : row.position
        ? JSON.stringify(row.position)
        : "",
  });
  isEdit.value = true;
  isFormOpen.value = true;
  nextTick(() => {});
}

function closeForm() {
  isFormOpen.value = false;
  setTimeout(() => {
    Object.assign(state, {
      id: 0,
      branch_id: undefined,
      floor_id: undefined,
      name: "",
      capacity: 2,
      status: "available",
      position: "",
    });
    formRef.value?.clear?.();
    isEdit.value = false;
  }, 260);
}

async function onSubmit(evt: FormSubmitEvent<Schema>) {
  formLoading.value = true;
  try {
    const payload = evt.data;
    payload.capacity = Number(payload.capacity);
    if (isEdit.value) {
      await tableStore.updateTable(state.id, payload);
      toast.add({
        title: "Success",
        description: "Table updated",
        color: "success",
      });
    } else {
      await tableStore.createTable(payload);
      toast.add({
        title: "Success",
        description: "Table created",
        color: "success",
      });
    }
    refreshData();
    closeForm();
  } catch (err: any) {
    if (err?.statusCode === 422) {
      const errors = err.data?.errors;
      if (errors && formRef.value?.setErrors) {
        const formErrors = Object.keys(errors).map((key) => ({
          path: key,
          message: errors[key][0],
        }));
        formRef.value.setErrors(formErrors);
      }
      toast.add({title: "Validation Failed", color: "error"});
    } else {
      toast.add({
        title: "Error",
        description: err?.data?.message || "Server error",
        color: "error",
      });
    }
  } finally {
    formLoading.value = false;
  }
}

// actions
async function handleDelete(id: number) {
  toast.add({
    title: "Delete table?",
    color: "error",
    actions: [
      {
        label: "Delete",
        color: "error",
        click: async () => {
          try {
            await tableStore.deleteTable(id);
            refreshData();
            toast.add({title: "Deleted", color: "success"});
          } catch {
            toast.add({title: "Failed", color: "error"});
          }
        },
      },
      {label: "Cancel", color: "neutral"},
    ],
  });
}

async function handleHold(id: number) {
  try {
    await tableStore.holdTable(id, String(useSupabaseUser?.id ?? "ui"));
    toast.add({title: "Held", color: "success"});
    refreshData();
  } catch (e: any) {
    toast.add({
      title: "Failed",
      description: e?.message ?? "Error",
      color: "error",
    });
  }
}
async function handleRelease(id: number) {
  try {
    await tableStore.releaseTable(id);
    toast.add({title: "Released", color: "success"});
    refreshData();
  } catch (e: any) {
    toast.add({
      title: "Failed",
      description: e?.message ?? "Error",
      color: "error",
    });
  }
}
</script>

<template>
  <div class="flex gap-4 h-[calc(100vh-6rem)] min-h-0 overflow-hidden">
    <!-- Main (style aligned with Floors) -->
    <div
      class="flex-1 flex flex-col min-w-0 bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 shadow-sm transition-all duration-300">
      <!-- header -->
      <div
        class="p-4 border-b border-neutral-200 dark:border-neutral-800 flex flex-col gap-4">
        <div class="flex justify-between items-center">
          <div class="flex items-center gap-3">
            <UIcon name="i-lucide-grid" class="text-primary-500 w-7 h-7" />
            <div>
              <h1
                class="text-xl font-bold text-neutral-900 dark:text-white leading-none">
                Tables
              </h1>
              <p class="text-xs text-neutral-500 mt-1.5">
                Manage restaurant tables
              </p>
            </div>
          </div>

          <div class="flex gap-2">
            <UButton
              v-if="!isFormOpen"
              color="primary"
              icon="i-lucide-plus"
              @click="openCreate"
              >Add Table</UButton
            >
          </div>
        </div>

        <!-- filters -->
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-2 flex-1 min-w-0">
            <UInput
              v-model="q"
              icon="i-lucide-search"
              placeholder="Search table..."
              class="w-full sm:w-64 min-w-0"
              :loading="tableLoading"
              :ui="{icon: {trailing: {pointer: ''}}}">
              <template #trailing v-if="q">
                <UButton
                  color="neutral"
                  variant="link"
                  icon="i-lucide-x"
                  :padded="false"
                  @click="resetFilters" />
              </template>
            </UInput>

            <BranchSelect
              v-model="selectedBranchFilter"
              class="w-48"
              placeholder="Branch" />
            <FloorSelect
              v-model="selectedFloorFilter"
              :branch-id="selectedBranchFilter"
              class="w-48"
              placeholder="Floor" />

            <USelectMenu
              v-model="selectedStatusFilter"
              :items="statusOptions"
              class="w-40"
              placeholder="Status"
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
              variant="ghost"
              size="xs"
              @click="resetFilters" />
          </div>

          <div class="flex items-center gap-2">
            <span class="text-xs text-neutral-500 font-medium hidden sm:inline"
              >Rows:</span
            >
            <USelect
              v-model="pageSize"
              :options="[10, 20, 50, 100]"
              class="w-20"
              size="sm" />
          </div>
        </div>
      </div>

      <!-- table area -->
      <div class="flex-1 overflow-auto relative min-h-0">
        <div class="overflow-x-auto w-full">
          <div class="min-w-[900px]">
            <UTable
              sticky
              :columns="columns"
              :data="tables"
              :loading="tableLoading"
              loading-animation="carousel"
              loading-color="primary"
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
              <template #loading-state>
                <div
                  class="flex flex-col items-center justify-center h-48 text-neutral-500 gap-3">
                  <UIcon
                    name="i-lucide-loader-2"
                    class="animate-spin w-8 h-8 text-primary-500" />
                  <span>Loading tables...</span>
                </div>
              </template>

              <template #empty-state>
                <div
                  class="flex flex-col items-center justify-center h-48 text-neutral-400 gap-3">
                  <UIcon
                    name="i-lucide-search-x"
                    class="w-10 h-10 opacity-30" />
                  <span>No tables found</span>
                  <UButton
                    v-if="
                      q ||
                      selectedBranchFilter ||
                      selectedFloorFilter ||
                      selectedStatusFilter
                    "
                    variant="soft"
                    color="neutral"
                    size="xs"
                    @click="resetFilters"
                    class="mt-2"
                    >Clear Filters</UButton
                  >
                </div>
              </template>
            </UTable>
          </div>
        </div>
      </div>

      <!-- footer -->
      <div
        class="p-3 border-t border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-neutral-50/50 dark:bg-neutral-900">
        <span class="text-xs text-neutral-500"
          >Total: <strong>{{ totalItems }}</strong> tables</span
        >
        <UPagination
          v-model:page="page"
          :total="totalItems"
          :per-page="pageSize"
          :max="5"
          size="xs"
          :disabled="tableLoading" />
      </div>
    </div>

    <!-- Sidebar form (aligned style with Floors) -->
    <div
      class="h-full transition-all duration-300 ease-in-out bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-xl flex flex-col"
      :class="
        isFormOpen
          ? 'w-[420px] opacity-100 translate-x-0 mr-1'
          : 'w-0 opacity-0 translate-x-10 overflow-hidden border-0'
      ">
      <div
        class="p-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center bg-neutral-50/30 dark:bg-neutral-800/30">
        <div class="flex items-center gap-2">
          <UIcon
            :name="isEdit ? 'i-lucide-pencil' : 'i-lucide-plus'"
            class="w-5 h-5 text-primary-500" />
          <h3 class="font-semibold text-lg text-neutral-900 dark:text-white">
            {{ isEdit ? "Edit Table" : "New Table" }}
          </h3>
        </div>
        <UButton
          icon="i-lucide-x"
          color="neutral"
          variant="ghost"
          size="xs"
          @click="closeForm" />
      </div>

      <div class="flex-1 overflow-y-auto p-5 custom-scrollbar min-h-0">
        <UForm
          ref="formRef"
          :schema="schema"
          :state="state"
          class="flex flex-col gap-3"
          @submit="onSubmit">
          <!-- native submit, used by footer save -->
          <button ref="nativeSubmitRef" type="submit" class="hidden" />

          <UFormField label="Branch" name="branch_id" required>
            <BranchSelect
              v-model="state.branch_id"
              class="w-full"
              placeholder="Choose branch" />
          </UFormField>

          <UFormField label="Floor" name="floor_id" required>
            <FloorSelect
              v-model="state.floor_id"
              :branch-id="state.branch_id"
              class="w-full"
              placeholder="Choose floor" />
          </UFormField>

          <UFormField label="Table Name" name="name" required>
            <UInput
              v-model="state.name"
              placeholder="A1, VIP01, etc"
              class="w-full" />
          </UFormField>

          <UFormField label="Capacity" name="capacity" required>
            <UInput
              v-model.number="state.capacity"
              type="number"
              min="1"
              class="w-full" />
          </UFormField>

          <UFormField label="Status" name="status">
            <USelectMenu
              v-model="state.status"
              :items="statusOptions"
              class="w-full"
              placeholder="Select status" />
          </UFormField>

          <UFormField label="Position (JSON)" name="position">
            <UTextarea
              v-model="state.position"
              rows="3"
              class="w-full"
              placeholder='{"x":0,"y":0,"rotation":0}' />
          </UFormField>
        </UForm>
      </div>

      <div
        class="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 flex gap-3">
        <UButton
          block
          color="neutral"
          variant="outline"
          class="flex-1"
          @click="closeForm"
          >Cancel</UButton
        >
        <UButton
          block
          color="primary"
          class="flex-1"
          :loading="formLoading"
          @click="nativeSubmitRef?.click?.()"
          >Save</UButton
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

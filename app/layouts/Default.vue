<script setup lang="ts">
import type { DropdownMenuItem, NavigationMenuItem } from "@nuxt/ui";
import AppBreadCrumb from "~/components/ui/AppBreadCrumb.vue";

const { isNotificationsSlideoverOpen } = useDashboard();
const route = useRoute();
const toast = useToast();

// --- BRANCH STATE ---
const branchStore = useBranchStore();
const {
  currentBranch,
  branchList,
  loading: branchLoading,
} = storeToRefs(branchStore);

// Handle Switch Branch
const handleBranchChange = (branch: any) => {
  branchStore.setBranch(branch.id);
  
  toast.add({
    title: `Switched to ${branch.name}`,
    color: "primary",
    icon: "i-lucide-check",
  });
};

// --- MENU & LINKS ---
const items = [
  [
    {
      label: "New booking",
      icon: "i-lucide-calendar-plus",
      to: "/bookings/create-new",
    },
  ],
] satisfies DropdownMenuItem[][];

const open = ref(false);

const links = [
  [
    {
      label: "Dashboard",
      icon: "i-lucide-house",
      to: "/",
      onSelect: () => { open.value = false; },
    },
    {
      label: "Floor Planner",
      icon: "i-lucide-layout",
      to: "/floor-planner",
      onSelect: () => { open.value = false; },
    },
    {
      label: "Bookings",
      icon: "i-lucide-calendar",
      to: "/bookings",
      type: "trigger",
      children: [
        { label: "All bookings", icon: "i-lucide-list", to: "/bookings", onSelect: () => { open.value = false; } },
        { label: "Create booking", icon: "i-lucide-plus", to: "/bookings/create-new", onSelect: () => { open.value = false; } },
        { label: "Calendar", icon: "i-lucide-calendar", to: "/bookings/calendar", onSelect: () => { open.value = false; } },
        // { label: "Check-in / Walk-in", icon: "i-lucide-log-in", to: "/bookings/checkin", onSelect: () => { open.value = false; } },
      ],
    },
    {
      label: "Waiting List",
      icon: "i-lucide-clock",
      to: "/waiting-list",
      onSelect: () => { open.value = false; },
    },
    {
      label: "Master Data",
      icon: "i-lucide-database",
      to: "/master",
      type: "trigger",
      children: [
        { label: "Branches", icon: "i-lucide-store", to: "/master/branches", onSelect: () => { open.value = false; } },
        { label: "Floors", icon: "i-lucide-layers-2", to: "/master/floors", onSelect: () => { open.value = false; } },
        { label: "Tables", icon: "i-lucide-armchair", to: "/master/tables", onSelect: () => { open.value = false; } },
      ],
    },
  ],
  [
    {
      label: "Help & Support",
      icon: "i-lucide-life-buoy",
      to: "#",
      target: "_blank",
    },
  ],
] satisfies NavigationMenuItem[][];

const groups = computed(() => [
  { id: "links", label: "Go to", items: links.flat() },
]);

// --- INIT ---
onMounted(async () => {
  const cookie = useCookie("cookie-consent");

  // Fetch branch list on load if empty
  if (branchList.value.length === 0) {
    await branchStore.fetchBranchList({ per_page: 100 });
  }

  if (cookie.value === "accepted") return;
});
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      collapsible
      resizable
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #header="{ collapsed }">
        <h1 class="text-2xl font-semibold">
          {{ collapsed ? "D" : "Dashboard" }}
        </h1>
      </template>

      <template #default="{ collapsed }">
        <UDashboardSearchButton
          :collapsed="collapsed"
          class="bg-transparent ring-default"
        />
        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[0]"
          orientation="vertical"
          tooltip
          popover
        />
        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[1]"
          orientation="vertical"
          tooltip
          class="mt-auto"
        />
      </template>

      <template #footer="{ collapsed }">
        <UserMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <UDashboardSearch :groups="groups" />

    <UDashboardPanel id="home">
      <template #header>
        <UDashboardNavbar :ui="{ right: 'gap-3' }">
          <template #leading>
            <UDashboardSidebarCollapse />

            <div class="hidden lg:block ml-2 pl-4 border-l border-gray-200 dark:border-gray-800">
              <ClientOnly>
                <template #fallback>
                   <div class="flex items-center gap-2 px-2 py-1.5 min-w-[200px]">
                      <USkeleton class="h-6 w-6 rounded-full" />
                      <div class="space-y-1 flex-1">
                         <USkeleton class="h-2 w-10" />
                         <USkeleton class="h-3 w-24" />
                      </div>
                      <USkeleton class="h-4 w-4 rounded" />
                   </div>
                </template>

                <USelectMenu
                  :model-value="currentBranch"
                  :items="branchList"
                  searchable
                  trailing-icon="null"
                  searchable-placeholder="Find branch..."
                  placeholder="Select Branch"
                  variant="ghost"
                  @update:model-value="handleBranchChange"
                >
                  <template #item-label="{ item }">
                    <div class="flex items-center gap-2">
                      <UAvatar
                        :alt="item?.name?.[0] || 'B'"
                        size="2xs"
                        class="bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-300"
                      />
                      <div class="flex flex-col">
                        <span class="text-[10px] text-gray-500 leading-none uppercase tracking-wider font-semibold">
                          Branch
                        </span>
                        <span class="text-sm font-bold text-gray-900 dark:text-white leading-tight truncate max-w-[240px]">
                          {{ item?.name || "Select..." }}
                        </span>
                      </div>
                    </div>
                  </template>

                  <template #default="{ open }">
                    <UButton
                      color="neutral"
                      variant="ghost"
                      class="w-full justify-between font-normal px-2"
                    >
                      <div class="flex items-center gap-2 text-left">
                        <UAvatar
                          :alt="currentBranch?.name?.[0] || 'B'"
                          size="2xs"
                          class="bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-300"
                        />
                        <div class="flex flex-col">
                          <span class="text-[10px] text-gray-500 leading-none uppercase tracking-wider font-semibold">
                            Branch
                          </span>
                          <span class="text-sm font-bold text-gray-900 dark:text-white leading-tight truncate max-w-[240px]">
                            {{ currentBranch?.name || "Select..." }}
                          </span>
                        </div>
                      </div>
                      <UIcon
                        name="i-heroicons-chevron-down-20-solid"
                        class="w-4 h-4 text-gray-400 transition-transform duration-200"
                        :class="[open && 'transform rotate-180']"
                      />
                    </UButton>
                  </template>
                </USelectMenu>
              </ClientOnly>
            </div>
          </template>

          <template #right>
            <UTooltip text="Notifications" :shortcuts="['N']">
              <UButton
                color="neutral"
                variant="ghost"
                square
                @click="isNotificationsSlideoverOpen = true"
              >
                <UChip color="error" inset>
                  <UIcon name="i-lucide-bell" class="size-5 shrink-0" />
                </UChip>
              </UButton>
            </UTooltip>
            <UDropdownMenu :items="items">
              <UButton icon="i-lucide-plus" size="md" class="rounded-full" />
            </UDropdownMenu>
          </template>
        </UDashboardNavbar>

        <UDashboardToolbar>
          <template #left>
            <AppBreadCrumb class="" :hide-root="false" />
          </template>
        </UDashboardToolbar>
      </template>

      <template #body>
        <slot />
      </template>
    </UDashboardPanel>
  </UDashboardGroup>
</template>
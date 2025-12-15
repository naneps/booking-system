<script setup lang="ts">
import type { DropdownMenuItem, NavigationMenuItem } from "@nuxt/ui";
import AppBreadCrumb from "~/components/ui/AppBreadCrumb.vue";

const { isNotificationsSlideoverOpen } = useDashboard()

// Dropdown quick actions
const items = [[
  {
    label: 'New booking',
    icon: 'i-lucide-calendar-plus',
    to: '/bookings/create-new'
  },
  {
    label: 'Add walk-in',
    icon: 'i-lucide-user-plus',
    to: '/waiting-list/create'
  },
  {
    label: 'New customer',
    icon: 'i-lucide-user',
    to: '/customers/create'
  }
]] satisfies DropdownMenuItem[][]

const route = useRoute();
const toast = useToast();

const open = ref(false);

// --- UPDATE DI SINI ---
const links = [
  [
    {
      label: "Dashboard",
      icon: "i-lucide-house",
      to: "/",
      onSelect: () => { open.value = false }
    },

    {
      label: "Floor Planner",
      icon: "i-lucide-layout",
      to: "/floor-planner",
      type: "trigger",
      children: [
        { label: "Lantai 1", icon: "i-lucide-layers", to: "/floor-planner/lantai-1", onSelect: () => { open.value = false } },
        { label: "Lantai 2", icon: "i-lucide-layers", to: "/floor-planner/lantai-2", onSelect: () => { open.value = false } },
        { label: "Outdoor",  icon: "i-lucide-sun",    to: "/floor-planner/outdoor",   onSelect: () => { open.value = false } },
      ],
    },

    {
      label: "Bookings",
      icon: "i-lucide-calendar",
      to: "/bookings",
      type: "trigger",
      children: [
        { label: "All bookings",      icon: "i-lucide-list",     to: "/bookings",               onSelect: () => { open.value = false } },
        { label: "Create booking",    icon: "i-lucide-plus",     to: "/bookings/create-new",        onSelect: () => { open.value = false } },
        { label: "Calendar",          icon: "i-lucide-calendar", to: "/bookings/calendar",      onSelect: () => { open.value = false } },
        { label: "Check-in / Walk-in",icon: "i-lucide-log-in",   to: "/bookings/checkin",       onSelect: () => { open.value = false } },
      ],
    },

    {
      label: "Waiting List",
      icon: "i-lucide-clock",
      to: "/waiting-list",
      onSelect: () => { open.value = false }
    },

    // --- NEW MASTER DATA MENU ---
    {
      label: "Master Data",
      icon: "i-lucide-database",
      to: "/master",
      type: "trigger",
      children: [
        { label: "Branches", icon: "i-lucide-store",    to: "/master/branches", onSelect: () => { open.value = false } },
        { label: "Floors",   icon: "i-lucide-layers-2", to: "/master/floors",   onSelect: () => { open.value = false } }, // Asumsi kamu buat page floors juga
        { label: "Tables",   icon: "i-lucide-armchair", to: "/master/tables",   onSelect: () => { open.value = false } },
      ]
    },

    {
      label: "Customers",
      icon: "i-lucide-users",
      to: "/customers",
      onSelect: () => { open.value = false }
    },

    {
      label: "Staff",
      icon: "i-lucide-user-check",
      to: "/staff",
      onSelect: () => { open.value = false }
    },

    {
      label: "Payments",
      icon: "i-lucide-credit-card",
      to: "/payments",
      onSelect: () => { open.value = false }
    },

    {
      label: "Reports",
      icon: "i-lucide-pie-chart",
      to: "/reports",
      type: "trigger",
      children: [
        { label: "Occupancy", icon: "i-lucide-bar-chart-2", to: "/reports/occupancy", onSelect: () => { open.value = false } },
        { label: "Sales",     icon: "i-lucide-dollar-sign", to: "/reports/sales",     onSelect: () => { open.value = false } },
        { label: "Waiting List", icon: "i-lucide-clock", to: "/reports/waiting-list", onSelect: () => { open.value = false } },
      ]
    },

    {
      label: "Settings",
      icon: "i-lucide-settings",
      to: "/settings",
      type: "trigger",
      children: [
        { label: "General", icon: "i-lucide-sliders", to: "/settings/general", onSelect: () => { open.value = false } },
        { label: "Users & Roles",  icon: "i-lucide-shield", to: "/settings/users", onSelect: () => { open.value = false } },
        { label: "Notification",   icon: "i-lucide-bell", to: "/settings/notifications", onSelect: () => { open.value = false } },
      ]
    },
  ],
  [
    {
      label: "Help & Support",
      icon: "i-lucide-life-buoy",
      to: "https://docs.example.com",
      target: "_blank",
    },
  ],
] satisfies NavigationMenuItem[][];


const groups = computed(() => [
  {
    id: "links",
    label: "Go to",
    items: links.flat(),
  }
]);

// ... sisa kode onMounted sama ...
onMounted(async () => {
  const cookie = useCookie("cookie-consent");
  if (cookie.value === "accepted") {
    return;
  }
  // ...
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
      :ui="{footer: 'lg:border-t lg:border-default'}">
      <template #header="{collapsed}">
         <h1 class="text-2xl font-semibold">{{ collapsed ? "D" : "Dashboard" }}</h1>
      </template>

      <template #default="{collapsed}">
        <UDashboardSearchButton
          :collapsed="collapsed"
          class="bg-transparent ring-default" />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[0]"
          orientation="vertical"
          tooltip
          popover />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[1]"
          orientation="vertical"
          tooltip
          class="mt-auto" />
      </template>

      <template #footer="{collapsed}">
        <UserMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <UDashboardSearch :groups="groups" />
    <UDashboardPanel id="home">
      <template #header>
        <UDashboardNavbar :ui="{right: 'gap-3'}">
          <template #leading>
            <UDashboardSidebarCollapse />
          </template>

          <template #right>
            <UTooltip text="Notifications" :shortcuts="['N']">
              <UButton
                color="neutral"
                variant="ghost"
                square
                @click="isNotificationsSlideoverOpen = true">
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
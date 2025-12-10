<script setup lang="ts">
import type { DropdownMenuItem, NavigationMenuItem } from "@nuxt/ui";
import AppBreadCrumb from "~/components/ui/AppBreadCrumb.vue";

const { isNotificationsSlideoverOpen } = useDashboard()

const items = [[{
  label: 'New mail',
  icon: 'i-lucide-send',
  to: '/inbox'
}, {
  label: 'New customer',
  icon: 'i-lucide-user-plus',
  to: '/customers'
}]] satisfies DropdownMenuItem[][]

const route = useRoute();
const toast = useToast();

const open = ref(false);

const links = [
  [
    {
      label: "Dashboard",
      icon: "i-lucide-house",
      to: "/",
      onSelect: () => { open.value = false }
    },
    {
      label: "Master Data",
      icon: "i-lucide-database",
      to: "/master-data",
      type: "trigger",
      defaultOpen: true,
      children: [
        //user
        { label: "Users",           icon: "i-lucide-users",        to: "/master-data/users",           onSelect: () => { open.value = false } },
        { label: "Items",           icon: "i-lucide-package",      to: "/master-data/items",           onSelect: () => { open.value = false } },
        { label: "Item Variants",   icon: "i-lucide-layers",       to: "/master-data/item-variants",   onSelect: () => { open.value = false } },
        { label: "Units",           icon: "i-lucide-ruler",        to: "/master-data/units",           onSelect: () => { open.value = false } },
        { label: "Categories",      icon: "i-lucide-folder-tree",  to: "/master-data/categories",      onSelect: () => { open.value = false } },
        { label: "Warehouses",      icon: "i-lucide-building-2",   to: "/master-data/warehouses",      onSelect: () => { open.value = false } },
        { label: "Suppliers",       icon: "i-lucide-handshake",    to: "/master-data/suppliers",       onSelect: () => { open.value = false } },
        { label: "Customers",       icon: "i-lucide-users",        to: "/master-data/customers",       onSelect: () => { open.value = false } },
        { label: "Price Lists",     icon: "i-lucide-badge-percent",to: "/master-data/price-lists",     onSelect: () => { open.value = false } },
        { label: "Payment Terms",   icon: "i-lucide-credit-card",  to: "/master-data/payment-terms",   onSelect: () => { open.value = false } },
      ],
    },
    {
      label: "Taksasi (Ekspektasi)",
      icon: "i-lucide-trending-up",
      to: "/taksasi",
      onSelect: () => { open.value = false }
    },
    {
      label: "Planning Purchasing",
      icon: "i-lucide-clipboard-list",
      to: "/planning-purchasing",
      onSelect: () => { open.value = false }
    },
    {
      label: "Purchasing & Stok (Realisasi)",
      icon: "i-lucide-boxes",
      to: "/purchasing-stock",
      onSelect: () => { open.value = false }
    },
    {
      label: "Sales",
      icon: "i-lucide-bar-chart-3",
      to: "/sales",
      onSelect: () => { open.value = false }
    },
    {
      label: "Reporting",
      icon: "i-lucide-pie-chart",
      to: "/reporting",
      onSelect: () => { open.value = false }
    },
    {
      label: "Report Visit",
      icon: "i-lucide-map-pin",
      to: "/report-visit",
      onSelect: () => { open.value = false }
    },
    {
      label: "Distribusi",
      icon: "i-lucide-truck",
      to: "/distribusi",
      onSelect: () => { open.value = false }
    },
  ],
  [
    {
      label: "Help & Support",
      icon: "i-lucide-life-buoy",
      to: "https://github.com/nuxt-ui-templates/dashboard",
      target: "_blank",
    },
  ],
] satisfies NavigationMenuItem[][];

const groups = computed(() => [
  {
    id: "links",
    label: "Go to",
    items: links.flat(),
  },
  {
    id: "code",
    label: "Code",
    items: [
      {
        id: "source",
        label: "View page source",
        icon: "i-simple-icons-github",
        to: `https://github.com/nuxt-ui-templates/dashboard/blob/main/app/pages${
          route.path === "/" ? "/index" : route.path
        }.vue`,
        target: "_blank",
      },
    ],
  },
]);

onMounted(async () => {
  const cookie = useCookie("cookie-consent");
  if (cookie.value === "accepted") {
    return;
  }

  toast.add({
    title:
      "We use first-party cookies to enhance your experience on our website.",
    duration: 0,
    close: false,
    actions: [
      {
        label: "Accept",
        color: "neutral",
        variant: "outline",
        onClick: () => {
          cookie.value = "accepted";
        },
      },
      {
        label: "Opt out",
        color: "neutral",
        variant: "ghost",
      },
    ],
  });
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
        <TeamsMenu :collapsed="collapsed" />
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

    <!-- <NotificationsSlideover /> -->
  </UDashboardGroup>
</template>

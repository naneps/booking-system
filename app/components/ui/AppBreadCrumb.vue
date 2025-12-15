<script setup lang="ts">
import type { Crumb } from "@/composables/useBreadCrumbs";
// 1. Import fungsi animasinya
import autoAnimate from "@formkit/auto-animate";

const props = defineProps<{
  hideRoot?: boolean;
  rootLabel?: string;
  rootTo?: string;
  excludeNames?: string[];
  trailingLink?: boolean;
}>();

const {items} = useBreadcrumbs({
  hideRoot: props.hideRoot,
  rootLabel: props.rootLabel,
  rootTo: props.rootTo,
  excludeNames: props.excludeNames,
  trailingLink: props.trailingLink,
});

// 2. Buat referensi ke komponen UBreadcrumb
const breadcrumbRef = ref();

onMounted(() => {
  // 3. Cari elemen <ol> di dalam UBreadcrumb dan pasang animasinya
  const listElement = breadcrumbRef.value?.$el?.querySelector("ol");

  if (listElement) {
    autoAnimate(listElement, {
      duration: 300, // Durasi animasi (ms)
      easing: "ease-in-out",
    });
  }
});
</script>

<template>
  <UBreadcrumb ref="breadcrumbRef" :items="items as Crumb[]" />
</template>

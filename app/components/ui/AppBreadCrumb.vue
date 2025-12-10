<script setup lang="ts">
import type { Crumb } from '@/composables/useBreadCrumbs';

const props = defineProps<{
  hideRoot?: boolean
  rootLabel?: string
  rootTo?: string
  excludeNames?: string[]
  trailingLink?: boolean
}>()

const { items } = useBreadcrumbs({
  hideRoot: props.hideRoot,
  rootLabel: props.rootLabel,
  rootTo: props.rootTo,
  excludeNames: props.excludeNames,
  trailingLink: props.trailingLink
})
</script>

<template>
  <UBreadcrumb :items="items as Crumb[]" />
</template>

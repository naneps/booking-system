<script setup lang="ts">
type Variant = "neutral" | "success" | "info" | "warning" | "danger";

const props = withDefaults(
  defineProps<{
    open: boolean;
    title?: string;
    subtitle?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: Variant;
    color?: string; // override warna (mis. 'red', 'emerald', 'primary', 'neutral')
    icon?: string; // override icon (lucide/heroicons)
    preventClose?: boolean;
    hideCancel?: boolean;
    loading?: boolean;
  }>(),
  {
    title: "Konfirmasi",
    subtitle: "",
    confirmLabel: "Lanjut",
    cancelLabel: "Batal",
    variant: "neutral",
    preventClose: false,
    hideCancel: false,
    loading: false,
  },
);

const emit = defineEmits<{
  "update:open": [boolean];
  confirm: [];
  cancel: [];
}>();

const mapColor: Record<
  Variant,
  "neutral" | "success" | "info" | "warning" | "error"
> = {
  neutral: "neutral",
  success: "success",
  info: "info",
  warning: "warning",
  danger: "error",
};
const mapIcon: Record<Variant, string> = {
  neutral: "i-lucide-help-circle",
  success: "i-lucide-check-circle-2",
  info: "i-lucide-info",
  warning: "i-lucide-alert-triangle",
  danger: "i-lucide-octagon-x",
};

const color = computed(() => {
  const validColors = [
    "neutral",
    "success",
    "info",
    "warning",
    "error",
    "primary",
    "secondary",
  ] as const;
  const mappedColor = mapColor[props.variant!];
  return props.color && validColors.includes(props.color as any)
    ? (props.color as (typeof validColors)[number])
    : mappedColor;
});
const iconName = computed(() => props.icon || mapIcon[props.variant!]);

function close() {
  emit("update:open", false);
  emit("cancel");
}
function confirm() {
  emit("confirm");
}
</script>

<template>
  <UModal
    v-model:open="$props.open"
    :prevent-close="preventClose || loading"
    :ui="{content: 'sm:max-w-md'  , header: 'p-6', footer: 'px-6 py-4 sm:flex justify-end sm:space-x-2' }"
    :title="title"
    :description="subtitle"
    :close="{
      color: color,
      variant: 'outline',
      class: 'rounded-full',
    }"
    
    @update:open="emit('update:open', $event)">


    <template #footer>
      <UButton
        v-if="!hideCancel"
        color="neutral"
        variant="soft"
        :disabled="loading"
        @click="close">
        {{ cancelLabel }}
      </UButton>
      <UButton :color="color" :loading="loading" @click="confirm">
        {{ confirmLabel }}
      </UButton>
    </template>
  </UModal>
</template>

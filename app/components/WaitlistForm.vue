<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import { z } from "zod";

const props = defineProps<{
  initialData?: Waitlist | null; // Jika null = Mode Create, jika ada object = Mode Edit
  loading?: boolean;
}>();

const emit = defineEmits(["submit", "cancel"]);

// Schema Validasi
const schema = z.object({
  customer_name: z.string().min(1, "Name is required"),
  pax: z.number().min(1, "Minimum 1 person"),
  customer_phone: z.string().optional(),
  note: z.string().optional(),
});

// State Form
const state = reactive<Partial<WaitlistForm>>({
  customer_name: "",
  pax: 2,
  customer_phone: "",
  note: "",
  branch_id: 1, // Default Branch, sebaiknya ambil dari global store currentBranch
});

// Isi form jika mode Edit
watch(
  () => props.initialData,
  (newVal) => {
    if (newVal) {
      state.customer_name = newVal.customer_name;
      state.pax = newVal.pax;
      state.customer_phone = newVal.customer_phone;
      state.note = newVal.note;
      // state.branch_id = newVal.branch_id; 
    } else {
      // Reset form
      state.customer_name = "";
      state.pax = 2;
      state.customer_phone = "";
      state.note = "";
    }
  },
  { immediate: true }
);

// Handle Submit
function onSubmit(event: FormSubmitEvent<WaitlistForm>) {
  emit("submit", event.data);
}
</script>

<template>
  <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
    
    <UFormGroup label="Customer Name" name="customer_name" required>
      <UInput v-model="state.customer_name" placeholder="John Doe" autofocus icon="i-lucide-user" />
    </UFormGroup>

    <div class="grid grid-cols-2 gap-4">
      <UFormGroup label="Pax" name="pax" required>
        <UInput v-model="state.pax" type="number" min="1" icon="i-lucide-users" />
      </UFormGroup>

      <UFormGroup label="Phone (Optional)" name="customer_phone">
        <UInput v-model="state.customer_phone" placeholder="08..." icon="i-lucide-phone" />
      </UFormGroup>
    </div>

    <UFormGroup label="Note" name="note">
      <UTextarea v-model="state.note" placeholder="Special request..." :rows="2" />
    </UFormGroup>

    <div class="flex justify-end gap-2 pt-2">
      <UButton type="button" color="neutral" variant="ghost" @click="emit('cancel')">
        Cancel
      </UButton>
      <UButton type="submit" color="primary" :loading="loading" icon="i-lucide-save">
        {{ initialData ? "Save Changes" : "Add to Waitlist" }}
      </UButton>
    </div>
  </UForm>
</template>
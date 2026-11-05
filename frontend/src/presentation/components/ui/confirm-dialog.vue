<script setup lang="ts">
import Modal from "./modal.vue";
import Button from "./button.vue";

withDefaults(
  defineProps<{
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: "accent" | "destructive";
    loading?: boolean;
  }>(),
  {
    confirmLabel: "Confirm",
    cancelLabel: "Cancel",
    variant: "accent",
    loading: false,
  },
);

const emit = defineEmits<{
  (event: "confirm"): void;
  (event: "cancel"): void;
}>();
</script>

<template>
  <Modal :title="title" @close="emit('cancel')">
    <div class="space-y-6">
      <p class="text-sm text-muted-foreground">{{ message }}</p>
      <div class="flex justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          :disabled="loading"
          data-testid="confirmation-cancel"
          @click="emit('cancel')"
        >
          {{ cancelLabel }}
        </Button>
        <Button
          type="button"
          :variant="variant"
          :loading="loading"
          data-testid="confirmation-confirm"
          @click="emit('confirm')"
        >
          {{ confirmLabel }}
        </Button>
      </div>
    </div>
  </Modal>
</template>

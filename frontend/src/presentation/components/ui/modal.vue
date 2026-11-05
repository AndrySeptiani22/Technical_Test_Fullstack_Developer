<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
const emit = defineEmits<{ (e: "close"): void }>();
const props = withDefaults(
  defineProps<{ title?: string; size?: "default" | "wide" }>(),
  { size: "default" },
);
function onKey(e: KeyboardEvent) {
  if (e.key === "Escape") emit("close");
}
onMounted(() => window.addEventListener("keydown", onKey));
onUnmounted(() => window.removeEventListener("keydown", onKey));
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      data-testid="modal-overlay"
    >
      <div
        class="absolute inset-0 bg-primary/40 backdrop-blur-sm"
        @click="emit('close')"
      ></div>
      <div
        class="relative bg-card w-full rounded-xl shadow-2xl border border-border overflow-hidden grain"
        :class="props.size === 'wide' ? 'max-w-5xl' : 'max-w-lg'"
        data-testid="modal-content"
      >
        <div
          v-if="title"
          class="px-6 py-4 border-b border-border flex items-center justify-between"
        >
          <h3 class="font-display text-lg font-semibold tracking-tight">
            {{ title }}
          </h3>
          <button
            class="text-muted-foreground hover:text-foreground"
            @click="emit('close')"
            data-testid="modal-close-btn"
          >
            ✕
          </button>
        </div>
        <div class="p-6"><slot /></div>
      </div>
    </div>
  </Teleport>
</template>

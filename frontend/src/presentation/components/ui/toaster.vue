<script setup lang="ts">
import { ref, watch, computed } from "vue";

interface ToastItem {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

const queue = ref<ToastItem[]>([]);
let seq = 0;

function push(message: string, type: ToastItem["type"] = "info") {
  const id = ++seq;
  queue.value.push({ id, message, type });
  setTimeout(() => {
    queue.value = queue.value.filter((t) => t.id !== id);
  }, 3500);
}

// Expose globally
(window as any).$toast = {
  success: (m: string) => push(m, "success"),
  error: (m: string) => push(m, "error"),
  info: (m: string) => push(m, "info"),
};
</script>

<template>
  <div
    class="fixed top-6 right-6 z-[100] flex flex-col gap-2"
    data-testid="toast-container"
  >
    <TransitionGroup name="toast">
      <div
        v-for="t in queue"
        :key="t.id"
        class="px-4 py-3 rounded-lg shadow-xl backdrop-blur border text-sm font-medium min-w-[260px]"
        :class="{
          'bg-emerald-50 border-emerald-200 text-emerald-900':
            t.type === 'success',
          'bg-rose-50 border-rose-200 text-rose-900': t.type === 'error',
          'bg-sky-50 border-sky-200 text-sky-900': t.type === 'info',
        }"
        :data-testid="`toast-${t.type}`"
      >
        {{ t.message }}
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-from {
  transform: translateX(20px);
  opacity: 0;
}
.toast-enter-active,
.toast-leave-active {
  transition: all 220ms ease;
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>

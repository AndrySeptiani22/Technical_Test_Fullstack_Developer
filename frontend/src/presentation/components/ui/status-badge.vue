<script setup lang="ts">
import { computed } from "vue";
import type { OrderStatus } from "@/domain/entities";
import { cn } from "@/presentation/lib/utils";

const props = defineProps<{ status: OrderStatus }>();

const styles = computed(() => {
  return {
    PENDING: "bg-amber-100 text-amber-800 ring-amber-200",
    PAID: "bg-sky-100 text-sky-800 ring-sky-200",
    SHIPPED: "bg-indigo-100 text-indigo-800 ring-indigo-200",
    COMPLETED: "bg-emerald-100 text-emerald-800 ring-emerald-200",
    CANCELLED: "bg-rose-100 text-rose-800 ring-rose-200",
  }[props.status];
});
</script>

<template>
  <span
    :class="
      cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide ring-1 ring-inset uppercase',
        styles,
      )
    "
  >
    <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
    {{ status }}
  </span>
</template>

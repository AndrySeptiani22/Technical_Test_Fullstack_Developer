<script setup lang="ts">
import { computed } from "vue";
import {
  Ban,
  CircleCheck,
  Clock3,
  CreditCard,
  Truck,
} from "lucide-vue-next";
import type { OrderStatus } from "@/domain/entities";
import { ORDER_STATUS } from "@/application/constants/order.constants";
import { cn } from "@/presentation/lib/utils";

const props = defineProps<{ status: OrderStatus }>();

const icons = {
  [ORDER_STATUS.PENDING]: Clock3,
  [ORDER_STATUS.PAID]: CreditCard,
  [ORDER_STATUS.SHIPPED]: Truck,
  [ORDER_STATUS.COMPLETED]: CircleCheck,
  [ORDER_STATUS.CANCELLED]: Ban,
};

const styles = computed(() => {
  return {
    [ORDER_STATUS.PENDING]: "bg-amber-100 text-amber-800 ring-amber-200",
    [ORDER_STATUS.PAID]: "bg-sky-100 text-sky-800 ring-sky-200",
    [ORDER_STATUS.SHIPPED]: "bg-indigo-100 text-indigo-800 ring-indigo-200",
    [ORDER_STATUS.COMPLETED]: "bg-emerald-100 text-emerald-800 ring-emerald-200",
    [ORDER_STATUS.CANCELLED]: "bg-rose-100 text-rose-800 ring-rose-200",
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
    <component :is="icons[status]" class="h-3 w-3" aria-hidden="true" />
    {{ status }}
  </span>
</template>

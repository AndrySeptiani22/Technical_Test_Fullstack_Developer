<script setup lang="ts">
import { useQuery } from "@tanstack/vue-query";
import { useCases } from "@/application/use-cases";
import Card from "../components/ui/card.vue";
import { formatIDR } from "../lib/utils";
import {
  Package,
  ShoppingCart,
  Clock,
  CheckCircle2,
  AlertTriangle,
  DollarSign,
} from "lucide-vue-next";
import { computed } from "vue";
import { RouterLink } from "vue-router";

const { data, isLoading } = useQuery({
  queryKey: ["dashboard-summary"],
  queryFn: async () => (await useCases.dashboardSummary()).data,
});

const cards = computed(() => {
  const s = data.value;
  return [
    {
      label: "Orders this month",
      value: s?.total_orders ?? 0,
      icon: ShoppingCart,
      tone: "bg-primary text-primary-foreground",
    },
    {
      label: "Pending",
      value: s?.pending_orders ?? 0,
      icon: Clock,
      tone: "bg-amber-500/90 text-white",
    },
    {
      label: "Paid & Beyond",
      value: s?.paid_orders ?? 0,
      icon: CheckCircle2,
      tone: "bg-emerald-500/90 text-white",
    },
    {
      label: "Revenue (month)",
      value: s ? formatIDR(s.revenue) : "Rp 0",
      icon: DollarSign,
      tone: "bg-accent text-accent-foreground",
      wide: true,
    },
    {
      label: "Active products",
      value: s?.active_products ?? 0,
      icon: Package,
      tone: "bg-sky-600/90 text-white",
    },
    {
      label: "Low stock",
      value: s?.low_stock_products ?? 0,
      icon: AlertTriangle,
      tone: "bg-rose-500/90 text-white",
    },
  ];
});
</script>

<template>
  <div>
    <div class="flex items-end justify-between mb-8">
      <div>
        <div
          class="text-xs uppercase tracking-[0.18em] text-muted-foreground font-medium mb-1"
        >
          Overview
        </div>
        <h1 class="font-display text-4xl font-semibold tracking-tight">
          Operations today
        </h1>
      </div>
      <RouterLink
        to="/orders/new"
        class="hidden md:inline-flex items-center gap-2 px-4 h-10 rounded-md bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 shadow-sm"
        data-testid="new-order-link"
      >
        + New order
      </RouterLink>
    </div>

    <div
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      data-testid="dashboard-cards"
    >
      <Card
        v-for="c in cards"
        :key="c.label"
        :class="['p-5', c.wide ? 'lg:col-span-2' : '']"
      >
        <div class="flex items-start justify-between">
          <div>
            <div class="text-xs uppercase tracking-wider text-muted-foreground">
              {{ c.label }}
            </div>
            <div
              class="font-display text-3xl font-semibold mt-2 tracking-tight"
              :data-testid="`stat-${c.label.toLowerCase().replace(/\s|\(|\)/g, '-')}`"
            >
              <template v-if="isLoading">—</template>
              <template v-else>{{ c.value }}</template>
            </div>
          </div>
          <div
            :class="['w-10 h-10 rounded-lg grid place-items-center', c.tone]"
          >
            <component :is="c.icon" class="w-5 h-5" />
          </div>
        </div>
      </Card>
    </div>

    <div class="mt-10">
      <h2 class="font-display text-xl font-semibold tracking-tight mb-3">
        Quick actions
      </h2>
      <div class="flex flex-wrap gap-3">
        <RouterLink
          to="/orders"
          class="px-4 py-2 rounded-md border border-border bg-card hover:bg-muted text-sm"
          >View orders</RouterLink
        >
        <RouterLink
          to="/products"
          class="px-4 py-2 rounded-md border border-border bg-card hover:bg-muted text-sm"
          >Manage products</RouterLink
        >
        <RouterLink
          to="/customers"
          class="px-4 py-2 rounded-md border border-border bg-card hover:bg-muted text-sm"
          >Customer directory</RouterLink
        >
        <RouterLink
          to="/reports"
          class="px-4 py-2 rounded-md border border-border bg-card hover:bg-muted text-sm"
          >Sales reports</RouterLink
        >
      </div>
    </div>
  </div>
</template>

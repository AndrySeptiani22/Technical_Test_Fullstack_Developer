<script setup lang="ts">
import { ref, computed } from "vue";
import { useQuery } from "@tanstack/vue-query";
import { RouterLink } from "vue-router";
import { useCases } from "@/application/use-cases";
import { useAuthStore } from "../stores/auth.store";
import Card from "../components/ui/card.vue";
import Button from "../components/ui/button.vue";
import StatusBadge from "../components/ui/status-badge.vue";
import { formatIDR, formatDateTime } from "../lib/utils";
import type { OrderStatus } from "@/domain/entities";
import { Plus } from "lucide-vue-next";

const auth = useAuthStore();
const page = ref(1);
const status = ref<OrderStatus | "">("");
const from = ref("");
const to = ref("");

const query = useQuery({
  queryKey: ["orders", page, status, from, to],
  queryFn: async () =>
    await useCases.listOrders({
      page: page.value,
      limit: 10,
      status: status.value || (undefined as any),
      from: from.value || undefined,
      to: to.value || undefined,
    }),
});
const items = computed(() => query.data.value?.data || []);
const meta = computed(() => query.data.value?.meta);

const STATUSES: OrderStatus[] = [
  "PENDING",
  "PAID",
  "SHIPPED",
  "COMPLETED",
  "CANCELLED",
];
</script>

<template>
  <div>
    <div class="flex items-end justify-between mb-8">
      <div>
        <div
          class="text-xs uppercase tracking-[0.18em] text-muted-foreground font-medium mb-1"
        >
          Lifecycle
        </div>
        <h1 class="font-display text-4xl font-semibold tracking-tight">
          Orders
        </h1>
      </div>
      <RouterLink v-if="auth.hasPermission('orders.create')" to="/orders/new">
        <Button variant="accent" data-testid="create-order-link"
          ><Plus class="w-4 h-4" /> New order</Button
        >
      </RouterLink>
    </div>

    <Card class="p-4 mb-4">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <label
            class="text-xs font-medium text-muted-foreground uppercase tracking-wider"
            >Status</label
          >
          <select
            v-model="status"
            class="mt-1.5 h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
            data-testid="orders-status-filter"
          >
            <option value="">All</option>
            <option v-for="s in STATUSES" :key="s" :value="s">{{ s }}</option>
          </select>
        </div>
        <div>
          <label
            class="text-xs font-medium text-muted-foreground uppercase tracking-wider"
            >From</label
          >
          <input
            v-model="from"
            type="date"
            class="mt-1.5 h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
            data-testid="orders-from-filter"
          />
        </div>
        <div>
          <label
            class="text-xs font-medium text-muted-foreground uppercase tracking-wider"
            >To</label
          >
          <input
            v-model="to"
            type="date"
            class="mt-1.5 h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
            data-testid="orders-to-filter"
          />
        </div>
      </div>
    </Card>

    <Card>
      <div class="overflow-x-auto">
        <table class="w-full text-sm" data-testid="orders-table">
          <thead
            class="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground"
          >
            <tr>
              <th class="text-left p-3">Order #</th>
              <th class="text-left p-3">Date</th>
              <th class="text-left p-3">Status</th>
              <th class="text-right p-3">Total</th>
              <th class="text-right p-3">Items</th>
              <th class="text-right p-3"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="query.isLoading.value">
              <td colspan="6" class="p-8 text-center text-muted-foreground">
                Loading…
              </td>
            </tr>
            <tr v-else-if="items.length === 0">
              <td colspan="6" class="p-8 text-center text-muted-foreground">
                No orders yet.
              </td>
            </tr>
            <tr
              v-for="o in items"
              :key="o.id"
              class="border-t border-border hover:bg-muted/40"
              :data-testid="`order-row-${o.id}`"
            >
              <td class="p-3 font-mono text-xs font-semibold">
                {{ o.order_number }}
              </td>
              <td class="p-3 text-muted-foreground">
                {{ formatDateTime(o.order_date) }}
              </td>
              <td class="p-3"><StatusBadge :status="o.status" /></td>
              <td class="p-3 text-right tabular-nums font-medium">
                {{ formatIDR(o.total_amount) }}
              </td>
              <td class="p-3 text-right tabular-nums text-muted-foreground">
                {{ o.items.length }}
              </td>
              <td class="p-3 text-right">
                <RouterLink
                  :to="`/orders/${o.id}`"
                  class="text-accent hover:underline text-sm"
                  :data-testid="`view-order-${o.id}`"
                  >View →</RouterLink
                >
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div
        v-if="meta"
        class="p-3 border-t border-border flex items-center justify-between text-sm"
      >
        <div class="text-muted-foreground">
          Page {{ meta.page }} of {{ meta.total_pages }} ·
          {{ meta.total }} orders
        </div>
        <div class="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            :disabled="page <= 1"
            @click="page--"
            >Prev</Button
          >
          <Button
            variant="outline"
            size="sm"
            :disabled="page >= (meta.total_pages || 1)"
            @click="page++"
            >Next</Button
          >
        </div>
      </div>
    </Card>
  </div>
</template>

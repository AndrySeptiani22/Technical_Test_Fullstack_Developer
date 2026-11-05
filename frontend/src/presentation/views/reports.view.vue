<script setup lang="ts">
import { ref, computed } from "vue";
import { useQuery } from "@tanstack/vue-query";
import { useCases } from "@/application/use-cases";
import Card from "../components/ui/card.vue";
import { formatIDR, nDaysAgoISO, todayISO } from "../lib/utils";

const from = ref(nDaysAgoISO(30));
const to = ref(todayISO());
const groupBy = ref<"day" | "month">("day");

const sales = useQuery({
  queryKey: ["sales", from, to, groupBy],
  queryFn: async () =>
    (await useCases.salesReport(from.value, to.value, groupBy.value)).data ||
    [],
});
const top = useQuery({
  queryKey: ["top-products", from, to],
  queryFn: async () =>
    (await useCases.topProductsReport(from.value, to.value, 10)).data || [],
});

const totalRevenue = computed(() =>
  (sales.data.value || []).reduce((s, x) => s + Number(x.revenue), 0),
);
const totalOrders = computed(() =>
  (sales.data.value || []).reduce((s, x) => s + x.total_orders, 0),
);
const maxRev = computed(() =>
  Math.max(1, ...(sales.data.value || []).map((x) => Number(x.revenue))),
);
</script>

<template>
  <div>
    <div class="mb-8">
      <div
        class="text-xs uppercase tracking-[0.18em] text-muted-foreground font-medium mb-1"
      >
        Analytics
      </div>
      <h1 class="font-display text-4xl font-semibold tracking-tight">
        Reports
      </h1>
    </div>

    <Card class="p-4 mb-4">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label
            class="text-xs font-medium text-muted-foreground uppercase tracking-wider"
            >From</label
          >
          <input
            v-model="from"
            type="date"
            class="mt-1.5 h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
            data-testid="report-from"
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
            data-testid="report-to"
          />
        </div>
        <div>
          <label
            class="text-xs font-medium text-muted-foreground uppercase tracking-wider"
            >Group by</label
          >
          <select
            v-model="groupBy"
            class="mt-1.5 h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
            data-testid="report-group"
          >
            <option value="day">Day</option>
            <option value="month">Month</option>
          </select>
        </div>
      </div>
    </Card>

    <div class="grid lg:grid-cols-3 gap-4 mb-4">
      <Card class="p-5">
        <div class="text-xs uppercase tracking-wider text-muted-foreground">
          Total revenue
        </div>
        <div
          class="font-display text-3xl font-semibold mt-2 tracking-tight"
          data-testid="total-revenue"
        >
          {{ formatIDR(totalRevenue) }}
        </div>
      </Card>
      <Card class="p-5">
        <div class="text-xs uppercase tracking-wider text-muted-foreground">
          Total orders
        </div>
        <div
          class="font-display text-3xl font-semibold mt-2 tracking-tight"
          data-testid="total-orders"
        >
          {{ totalOrders }}
        </div>
      </Card>
      <Card class="p-5">
        <div class="text-xs uppercase tracking-wider text-muted-foreground">
          Avg order value
        </div>
        <div
          class="font-display text-3xl font-semibold mt-2 tracking-tight"
          data-testid="aov"
        >
          {{ totalOrders ? formatIDR(totalRevenue / totalOrders) : "Rp 0" }}
        </div>
      </Card>
    </div>

    <div class="grid lg:grid-cols-2 gap-4">
      <Card class="p-5">
        <div class="font-semibold mb-4">Sales over time</div>
        <div
          v-if="!sales.data.value?.length"
          class="text-sm text-muted-foreground py-8 text-center"
        >
          No data in this period.
        </div>
        <div v-else class="space-y-2" data-testid="sales-chart">
          <div
            v-for="s in sales.data.value"
            :key="s.period"
            class="flex items-center gap-3"
          >
            <div class="w-24 text-xs text-muted-foreground tabular-nums">
              {{ s.period.slice(0, 10) }}
            </div>
            <div class="flex-1 h-6 bg-muted rounded relative overflow-hidden">
              <div
                class="h-full bg-accent transition-all"
                :style="{ width: (Number(s.revenue) / maxRev) * 100 + '%' }"
              ></div>
            </div>
            <div class="w-28 text-right text-xs tabular-nums font-medium">
              {{ formatIDR(s.revenue) }}
            </div>
            <div
              class="w-10 text-right text-xs text-muted-foreground tabular-nums"
            >
              {{ s.total_orders }}
            </div>
          </div>
        </div>
      </Card>

      <Card class="p-5">
        <div class="font-semibold mb-4">Top products</div>
        <div
          v-if="!top.data.value?.length"
          class="text-sm text-muted-foreground py-8 text-center"
        >
          No data.
        </div>
        <table v-else class="w-full text-sm" data-testid="top-products-table">
          <thead class="text-xs text-muted-foreground uppercase tracking-wider">
            <tr>
              <th class="text-left py-2">Product</th>
              <th class="text-right py-2">Qty</th>
              <th class="text-right py-2">Revenue</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="t in top.data.value"
              :key="t.product_id"
              class="border-t border-border"
            >
              <td class="py-2">
                <div class="font-medium">{{ t.product_name }}</div>
                <div class="text-xs text-muted-foreground font-mono">
                  {{ t.product_code }}
                </div>
              </td>
              <td class="py-2 text-right tabular-nums">
                {{ t.total_quantity }}
              </td>
              <td class="py-2 text-right tabular-nums font-medium">
                {{ formatIDR(t.revenue) }}
              </td>
            </tr>
          </tbody>
        </table>
      </Card>
    </div>
  </div>
</template>

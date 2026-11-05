<script setup lang="ts">
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useReportStore } from "@/presentation/stores/report.store";
import Card from "@/presentation/components/ui/card.vue";
import Button from "@/presentation/components/ui/button.vue";
import { formatIDR } from "@/presentation/lib/utils";
import { Search } from "lucide-vue-next";

const reportStore = useReportStore();
const {
  from,
  to,
  groupBy,
  dateRangeErrors,
  sales,
  topProducts,
  topProductsSearch,
  filteredTopProducts,
  visibleTopProducts,
  topProductsPage,
  topProductsTotalPages,
} = storeToRefs(reportStore);

const totalRevenue = computed(() =>
  sales.value.reduce((s, x) => s + Number(x.revenue), 0),
);
const totalOrders = computed(() =>
  sales.value.reduce((s, x) => s + x.total_orders, 0),
);
const maxRev = computed(() =>
  Math.max(1, ...sales.value.map((x) => Number(x.revenue))),
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
            :aria-invalid="!!dateRangeErrors.from"
            class="mt-1.5 h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
            data-testid="report-from"
          />
          <p v-if="dateRangeErrors.from" class="mt-1 text-xs text-destructive">
            {{ dateRangeErrors.from }}
          </p>
        </div>
        <div>
          <label
            class="text-xs font-medium text-muted-foreground uppercase tracking-wider"
            >To</label
          >
          <input
            v-model="to"
            type="date"
            :aria-invalid="!!dateRangeErrors.to"
            class="mt-1.5 h-10 w-full rounded-md border border-input bg-card px-3 text-sm"
            data-testid="report-to"
          />
          <p v-if="dateRangeErrors.to" class="mt-1 text-xs text-destructive">
            {{ dateRangeErrors.to }}
          </p>
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
          v-if="!sales.length"
          class="text-sm text-muted-foreground py-8 text-center"
        >
          No data in this period.
        </div>
        <div
          v-else
          class="max-h-[42rem] space-y-2 overflow-y-auto pr-2"
          data-testid="sales-chart"
        >
          <div
            v-for="s in sales"
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
        <div class="relative mb-3">
          <Search
            class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            v-model="topProductsSearch"
            type="search"
            placeholder="Search by product name or code…"
            aria-label="Search top products"
            class="h-10 w-full rounded-md border border-input bg-card pl-9 pr-3 text-sm"
            data-testid="top-products-search"
          />
        </div>
        <div
          v-if="!topProducts.length"
          class="text-sm text-muted-foreground py-8 text-center"
        >
          No data.
        </div>
        <template v-else>
          <template v-if="filteredTopProducts.length">
            <table class="w-full text-sm" data-testid="top-products-table">
              <thead
                class="text-xs text-muted-foreground uppercase tracking-wider"
              >
                <tr>
                  <th class="text-left py-2">Product</th>
                  <th class="text-right py-2">Qty</th>
                  <th class="text-right py-2">Revenue</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="t in visibleTopProducts"
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
            <div
              v-if="filteredTopProducts.length > 10"
              class="mt-3 flex items-center justify-between border-t border-border pt-3 text-sm"
            >
              <span class="text-muted-foreground">
                Page {{ topProductsPage }} of {{ topProductsTotalPages }}
              </span>
              <div class="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  :disabled="topProductsPage <= 1"
                  @click="topProductsPage--"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  :disabled="topProductsPage >= topProductsTotalPages"
                  @click="topProductsPage++"
                >
                  Next
                </Button>
              </div>
            </div>
          </template>
          <div v-else class="py-8 text-center text-sm text-muted-foreground">
            No products match your search.
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

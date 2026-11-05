<script setup lang="ts">
import { storeToRefs } from "pinia";
import { RouterLink } from "vue-router";
import { useAuthStore } from "@/presentation/stores/auth.store";
import { useOrderStore } from "@/presentation/stores/order.store";
import Card from "@/presentation/components/ui/card.vue";
import Button from "@/presentation/components/ui/button.vue";
import GridFilters, {
  type GridFilterField,
} from "@/presentation/components/ui/grid-filters.vue";
import GridPagination from "@/presentation/components/ui/grid-pagination.vue";
import StatusBadge from "@/presentation/components/ui/status-badge.vue";
import { formatIDR, formatDateTime } from "@/presentation/lib/utils";
import { ORDER_STATUS } from "@/application/constants/order.constants";
import {
  Ban,
  CircleCheck,
  Clock3,
  CreditCard,
  Eye,
  Plus,
  Search,
  Truck,
} from "lucide-vue-next";

const auth = useAuthStore();
const orderStore = useOrderStore();
const {
  page,
  pageSize,
  search,
  sortBy,
  sortOrder,
  filters,
  items,
  meta,
  isLoading,
} = storeToRefs(orderStore);
const filterFields: GridFilterField[] = [
  {
    key: "order_number",
    label: "Order #",
    kind: "text",
    sortBy: "orderNumber",
  },
  { key: "order_date", label: "Date", kind: "date", sortBy: "orderDate" },
  {
    key: "status",
    label: "Status",
    kind: "text",
    options: [
      { value: ORDER_STATUS.PENDING, label: "Pending", icon: Clock3 },
      { value: ORDER_STATUS.PAID, label: "Paid", icon: CreditCard },
      { value: ORDER_STATUS.SHIPPED, label: "Shipped", icon: Truck },
      { value: ORDER_STATUS.COMPLETED, label: "Completed", icon: CircleCheck },
      { value: ORDER_STATUS.CANCELLED, label: "Cancelled", icon: Ban },
    ],
  },
  {
    key: "total_amount",
    label: "Total",
    kind: "number",
    sortBy: "totalAmount",
    align: "right",
  },
  {
    key: "items_count",
    label: "Items",
    kind: "number",
    sortBy: "itemsCount",
    align: "right",
  },
];
</script>

<template>
  <div>
    <div class="mb-6">
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
    </div>

    <Card class="p-4 mb-4 flex items-center gap-3">
      <div class="relative min-w-0 flex-1">
        <Search
          class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <input
          v-model="search"
          maxlength="200"
          placeholder="Search by order number…"
          class="h-10 w-full rounded-md border border-input bg-card pl-9 pr-3 text-sm"
          data-testid="orders-search"
        />
      </div>
      <RouterLink
        v-if="auth.hasPermission('orders.create')"
        to="/orders/new"
        class="shrink-0"
      >
        <Button variant="accent" data-testid="create-order-link">
          <Plus class="w-4 h-4" /> New order
        </Button>
      </RouterLink>
    </Card>

    <Card>
      <div class="max-h-[36rem] overflow-auto">
        <table class="w-full text-sm" data-testid="orders-table">
          <thead
            class="sticky top-0 z-10 bg-muted text-xs uppercase tracking-wider text-muted-foreground"
          >
            <GridFilters
              v-model="filters"
              :fields="filterFields"
              action-column
              :sort-by="sortBy"
              :sort-order="sortOrder"
              @sort="orderStore.toggleSort"
              @update:model-value="page = 1"
            />
          </thead>
          <tbody>
            <tr v-if="isLoading">
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
              <td class="p-3 text-center">
                <StatusBadge :status="o.status" />
              </td>
              <td class="p-3 text-right tabular-nums font-medium">
                {{ formatIDR(o.total_amount) }}
              </td>
              <td class="p-3 text-right tabular-nums text-muted-foreground">
                {{ o.items.length }}
              </td>
              <td class="p-3 text-right">
                <RouterLink
                  :to="`/orders/${o.id}`"
                  class="inline-flex h-8 w-8 items-center justify-center rounded-md text-accent hover:bg-muted hover:text-foreground"
                  :data-testid="`view-order-${o.id}`"
                  title="View order"
                  aria-label="View order"
                  ><Eye class="h-4 w-4" aria-hidden="true"
                /></RouterLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <GridPagination
        v-if="meta"
        :meta="meta"
        :page="page"
        :page-size="pageSize"
        item-label="orders"
        @page-change="page = $event"
        @page-size-change="
          pageSize = $event;
          page = 1;
        "
      />
    </Card>
  </div>
</template>

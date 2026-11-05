<script setup lang="ts">
import { computed } from "vue";
import { useRoute, RouterLink } from "vue-router";
import { useQuery } from "@tanstack/vue-query";
import {
  getProduct,
  listStockMovements,
} from "@/application/use-cases/product.use-case";
import Card from "@/presentation/components/ui/card.vue";
import { formatIDR, formatDateTime } from "@/presentation/lib/utils";
import { ArrowLeft } from "lucide-vue-next";

const route = useRoute();
const id = computed(() => route.params.id as string);

const product = useQuery({
  queryKey: ["product", id],
  queryFn: async () => (await getProduct(id.value)).data,
});
const movements = useQuery({
  queryKey: ["movements", id],
  queryFn: async () =>
    (await listStockMovements(id.value, { page: 1, limit: 50 })).data,
});
</script>

<template>
  <div>
    <RouterLink
      to="/products"
      class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
    >
      <ArrowLeft class="w-4 h-4" /> Back to products
    </RouterLink>

    <div v-if="product.data.value" class="mb-6">
      <div
        class="text-xs uppercase tracking-[0.18em] text-muted-foreground font-medium mb-1 font-mono"
      >
        {{ product.data.value.product_code }}
      </div>
      <h1 class="font-display text-3xl font-semibold tracking-tight">
        {{ product.data.value.product_name }}
      </h1>
      <div class="flex gap-6 mt-3 text-sm">
        <div>
          <span class="text-muted-foreground">Stock:</span>
          <strong>{{ product.data.value.stock }}</strong>
        </div>
        <div>
          <span class="text-muted-foreground">Price:</span>
          <strong>{{ formatIDR(product.data.value.price) }}</strong>
        </div>
        <div>
          <span class="text-muted-foreground">Low threshold:</span>
          <strong>{{ product.data.value.low_stock_threshold }}</strong>
        </div>
      </div>
    </div>

    <Card>
      <div class="p-4 border-b border-border font-semibold">
        Stock movements
      </div>
      <table class="w-full text-sm">
        <thead
          class="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground"
        >
          <tr>
            <th class="text-left p-3">When</th>
            <th class="text-left p-3">Type</th>
            <th class="text-right p-3">Change</th>
            <th class="text-right p-3">After</th>
            <th class="text-left p-3">Note</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!movements.data.value?.length">
            <td colspan="5" class="p-8 text-center text-muted-foreground">
              No movements yet.
            </td>
          </tr>
          <tr
            v-for="m in movements.data.value"
            :key="m.id"
            class="border-t border-border"
          >
            <td class="p-3 text-muted-foreground">
              {{ formatDateTime(m.created_at) }}
            </td>
            <td class="p-3">
              <span class="text-xs px-2 py-0.5 rounded bg-muted">{{
                m.type
              }}</span>
            </td>
            <td
              class="p-3 text-right tabular-nums"
              :class="
                m.quantity_change < 0 ? 'text-rose-600' : 'text-emerald-600'
              "
            >
              {{ m.quantity_change > 0 ? "+" : "" }}{{ m.quantity_change }}
            </td>
            <td class="p-3 text-right tabular-nums">{{ m.stock_after }}</td>
            <td class="p-3 text-muted-foreground">{{ m.note || "—" }}</td>
          </tr>
        </tbody>
      </table>
    </Card>
  </div>
</template>

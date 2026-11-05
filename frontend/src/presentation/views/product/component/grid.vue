<script setup lang="ts">
import type { Product, PaginationMeta } from "@/domain/entities";
import Button from "@/presentation/components/ui/button.vue";
import Card from "@/presentation/components/ui/card.vue";
import GridFilters, {
  type GridFilterField,
} from "@/presentation/components/ui/grid-filters.vue";
import GridPagination from "@/presentation/components/ui/grid-pagination.vue";
import { formatIDR } from "@/presentation/lib/utils";
import { PackagePlus, Pencil, Trash2 } from "lucide-vue-next";
import type { ListFilter } from "@/domain/repositories";

defineProps<{
  items: Product[];
  meta?: PaginationMeta;
  page: number;
  pageSize: number | "all";
  loading: boolean;
  canAdjust: boolean;
  canEdit: boolean;
  canDelete: boolean;
  filters: ListFilter[];
  filterFields: GridFilterField[];
  sortBy: string;
  sortOrder: "ASC" | "DESC";
}>();

const emit = defineEmits<{
  (event: "sort", field: string): void;
  (event: "page-change", page: number): void;
  (event: "page-size-change", pageSize: number | "all"): void;
  (event: "adjust" | "edit" | "delete", product: Product): void;
  (event: "update:filters", filters: ListFilter[]): void;
}>();
</script>

<template>
  <Card>
    <div class="max-h-[36rem] overflow-auto">
      <table class="w-full text-sm" data-testid="products-table">
        <thead
          class="sticky top-0 z-10 bg-muted text-xs uppercase tracking-wider text-muted-foreground"
        >
          <GridFilters
            :model-value="filters"
            :fields="filterFields"
            action-column
            :sort-by="sortBy"
            :sort-order="sortOrder"
            @sort="emit('sort', $event)"
            @update:model-value="emit('update:filters', $event)"
          />
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="6" class="p-8 text-center text-muted-foreground">
              Loading…
            </td>
          </tr>
          <tr v-else-if="items.length === 0">
            <td colspan="6" class="p-8 text-center text-muted-foreground">
              No products found.
            </td>
          </tr>
          <tr
            v-for="product in items"
            :key="product.id"
            class="border-t border-border hover:bg-muted/40"
            :data-testid="`product-row-${product.id}`"
          >
            <td class="p-3 font-mono text-xs">{{ product.product_code }}</td>
            <td class="p-3 font-medium">{{ product.product_name }}</td>
            <td class="p-3 text-right">
              <span
                :class="[
                  'tabular-nums',
                  product.stock <= product.low_stock_threshold
                    ? 'text-rose-600 font-semibold'
                    : '',
                ]"
              >
                {{ product.stock }}
              </span>
            </td>
            <td class="p-3 text-right tabular-nums">
              {{ formatIDR(product.price) }}
            </td>
            <td class="p-3 text-right tabular-nums text-muted-foreground">
              {{ product.low_stock_threshold }}
            </td>
            <td class="p-3 text-right">
              <div class="inline-flex gap-1">
                <Button
                  v-if="canAdjust"
                  variant="ghost"
                  size="icon"
                  :data-testid="`adjust-stock-${product.id}`"
                  title="Adjust stock"
                  aria-label="Adjust stock"
                  @click="emit('adjust', product)"
                >
                  <PackagePlus class="w-4 h-4" />
                </Button>
                <Button
                  v-if="canEdit"
                  variant="ghost"
                  size="icon"
                  :data-testid="`edit-product-${product.id}`"
                  title="Edit product"
                  aria-label="Edit product"
                  @click="emit('edit', product)"
                >
                  <Pencil class="w-4 h-4" />
                </Button>
                <Button
                  v-if="canDelete"
                  variant="ghost"
                  size="icon"
                  :data-testid="`delete-product-${product.id}`"
                  title="Delete product"
                  aria-label="Delete product"
                  @click="emit('delete', product)"
                >
                  <Trash2 class="w-4 h-4 text-destructive" />
                </Button>
              </div>
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
      item-label="items"
      @page-change="emit('page-change', $event)"
      @page-size-change="emit('page-size-change', $event)"
    />
  </Card>
</template>

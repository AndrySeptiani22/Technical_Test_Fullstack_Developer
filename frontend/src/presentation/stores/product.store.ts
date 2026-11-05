import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { useQuery } from "@tanstack/vue-query";
import {
  adjustStock,
  createProduct,
  deleteProduct,
  filterProducts,
  updateProduct,
} from "@/application/use-cases/product.use-case";
import type { ListFilter } from "@/domain/repositories";
import type { Product } from "@/domain/entities";

export const useProductStore = defineStore("products", () => {
  const page = ref(1);
  const pageSize = ref<number | "all">(10);
  const search = ref("");
  const sortBy = ref("productName");
  const sortOrder = ref<"ASC" | "DESC">("ASC");
  const filters = ref<ListFilter[]>([]);

  const query = useQuery({
    queryKey: ["products", page, pageSize, search, sortBy, sortOrder, filters],
    queryFn: () =>
      filterProducts({
        page: page.value,
        limit: pageSize.value,
        search: search.value,
        sort_by: sortBy.value,
        sort_order: sortOrder.value,
        filters: filters.value,
      }),
  });

  function toggleSort(field: string) {
    if (sortBy.value === field)
      sortOrder.value = sortOrder.value === "ASC" ? "DESC" : "ASC";
    else {
      sortBy.value = field;
      sortOrder.value = "ASC";
    }
  }

  return {
    page,
    pageSize,
    search,
    sortBy,
    sortOrder,
    filters,
    items: computed(() => query.data.value?.data ?? []),
    meta: computed(() => query.data.value?.meta),
    isLoading: computed(() => query.isLoading.value),
    toggleSort,
    createProduct,
    updateProduct: (id: string, payload: Partial<Product>) =>
      updateProduct(id, payload),
    deleteProduct,
    adjustStock,
  };
});

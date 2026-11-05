import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { useQuery } from "@tanstack/vue-query";
import { filterOrders } from "@/application/use-cases/order.use-case";
import type { ListFilter } from "@/domain/repositories";

export const useOrderStore = defineStore("orders", () => {
  const page = ref(1);
  const pageSize = ref<number | "all">(10);
  const search = ref("");
  const sortBy = ref("orderDate");
  const sortOrder = ref<"ASC" | "DESC">("DESC");
  const filters = ref<ListFilter[]>([]);

  const query = useQuery({
    queryKey: ["orders", page, pageSize, search, sortBy, sortOrder, filters],
    queryFn: () =>
      filterOrders({
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
  };
});

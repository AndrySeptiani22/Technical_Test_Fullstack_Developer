import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { useQuery } from "@tanstack/vue-query";
import {
  createCustomer,
  deleteCustomer,
  filterCustomers,
  updateCustomer,
} from "@/application/use-cases/customer.use-case";
import type { Customer } from "@/domain/entities";
import type { ListFilter } from "@/domain/repositories";

export const useCustomerStore = defineStore("customers", () => {
  const page = ref(1);
  const pageSize = ref<number | "all">(10);
  const search = ref("");
  const sortBy = ref("customerName");
  const sortOrder = ref<"ASC" | "DESC">("ASC");
  const filters = ref<ListFilter[]>([]);

  const query = useQuery({
    queryKey: ["customers", page, pageSize, search, sortBy, sortOrder, filters],
    queryFn: () =>
      filterCustomers({
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
    createCustomer: (payload: Partial<Customer>) =>
      createCustomer(payload),
    updateCustomer: (id: string, payload: Partial<Customer>) =>
      updateCustomer(id, payload),
    deleteCustomer,
    toggleSort,
  };
});

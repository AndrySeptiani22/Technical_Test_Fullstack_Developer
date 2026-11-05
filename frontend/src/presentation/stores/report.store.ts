import { computed, ref, watch } from "vue";
import { defineStore } from "pinia";
import { useQuery } from "@tanstack/vue-query";
import {
  salesReport,
  topProductsReport,
} from "@/application/use-cases/report.use-case";
import { nDaysAgoISO, todayISO } from "@/presentation/lib/utils";
import { reportDateRangeSchema } from "@/application/validation/request-schemas";
import { fieldErrors } from "@/presentation/lib/form-validation";

export const useReportStore = defineStore("reports", () => {
  const from = ref(nDaysAgoISO(30));
  const to = ref(todayISO());
  const groupBy = ref<"day" | "month">("day");
  const topProductsPage = ref(1);
  const topProductsSearch = ref("");
  const topProductsPageSize = 10;
  const dateRange = computed(() =>
    reportDateRangeSchema.safeParse({ from: from.value, to: to.value }),
  );
  const dateRangeErrors = computed(() =>
    dateRange.value.success ? {} : fieldErrors(dateRange.value.error),
  );
  const validDateRange = computed(() => dateRange.value.success);

  const salesQuery = useQuery({
    queryKey: ["sales", from, to, groupBy],
    enabled: validDateRange,
    queryFn: async () =>
      (await salesReport(from.value, to.value, groupBy.value)).data || [],
  });
  const topProductsQuery = useQuery({
    queryKey: ["top-products", from, to],
    enabled: validDateRange,
    queryFn: async () =>
      (await topProductsReport(from.value, to.value, 100)).data || [],
  });

  const topProducts = computed(() => topProductsQuery.data.value ?? []);
  const filteredTopProducts = computed(() => {
    const search = topProductsSearch.value.trim().toLocaleLowerCase();
    if (!search) return topProducts.value;
    return topProducts.value.filter(
      (product) =>
        product.product_name.toLocaleLowerCase().includes(search) ||
        product.product_code.toLocaleLowerCase().includes(search),
    );
  });
  const topProductsTotalPages = computed(() =>
    Math.max(
      1,
      Math.ceil(filteredTopProducts.value.length / topProductsPageSize),
    ),
  );
  const visibleTopProducts = computed(() => {
    const start = (topProductsPage.value - 1) * topProductsPageSize;
    return filteredTopProducts.value.slice(start, start + topProductsPageSize);
  });

  watch([from, to, topProductsSearch], () => {
    topProductsPage.value = 1;
  });

  return {
    from,
    to,
    groupBy,
    dateRangeErrors,
    sales: computed(() =>
      validDateRange.value ? (salesQuery.data.value ?? []) : [],
    ),
    topProducts: computed(() =>
      validDateRange.value ? topProducts.value : [],
    ),
    topProductsSearch,
    filteredTopProducts,
    visibleTopProducts,
    topProductsPage,
    topProductsTotalPages,
  };
});

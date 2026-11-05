import { computed } from "vue";
import { defineStore } from "pinia";
import { useQuery } from "@tanstack/vue-query";
import { dashboardSummary } from "@/application/use-cases/report.use-case";

export const useDashboardStore = defineStore("dashboard", () => {
  const query = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: async () => (await dashboardSummary()).data,
  });

  return {
    summary: computed(() => query.data.value),
    isLoading: computed(() => query.isLoading.value),
  };
});

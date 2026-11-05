<script setup lang="ts">
import { computed } from "vue";
import type { PaginationMeta } from "@/domain/entities";
import Button from "./button.vue";

const props = defineProps<{
  meta: PaginationMeta;
  page: number;
  pageSize: number | "all";
  itemLabel?: string;
}>();

const emit = defineEmits<{
  (event: "page-change", page: number): void;
  (event: "page-size-change", pageSize: number | "all"): void;
}>();

const totalPages = computed(() => Math.max(1, props.meta.total_pages));
const pageItems = computed<Array<number | "ellipsis">>(() => {
  const total = totalPages.value;
  if (total <= 7)
    return Array.from({ length: total }, (_, index) => index + 1);

  const current = props.page;
  let start = Math.max(2, Math.min(current - 1, total - 2));
  let end = Math.min(total - 1, start + 2);
  start = Math.max(2, end - 2);

  return [
    1,
    ...(start > 2 ? (["ellipsis"] as const) : []),
    ...Array.from({ length: end - start + 1 }, (_, index) => start + index),
    ...(end < total - 1 ? (["ellipsis"] as const) : []),
    total,
  ];
});
</script>

<template>
  <div
    class="flex flex-wrap items-center justify-between gap-3 border-t border-border p-3 text-sm"
  >
    <div class="text-muted-foreground">
      Page {{ page }} of {{ totalPages }} · {{ meta.total }}
      {{ itemLabel || "items" }}
    </div>
    <div class="flex flex-wrap items-center gap-3">
      <label class="flex items-center gap-2 text-muted-foreground">
        <span>Rows per page</span>
        <select
          :value="pageSize"
          class="h-8 rounded-md border border-input bg-card px-2 text-foreground"
          aria-label="Rows per page"
          @change="
            emit(
              'page-size-change',
              ($event.target as HTMLSelectElement).value === 'all'
                ? 'all'
                : Number(($event.target as HTMLSelectElement).value),
            )
          "
        >
          <option :value="5">5</option>
          <option :value="10">10</option>
          <option :value="20">20</option>
          <option value="all">All</option>
        </select>
      </label>
      <nav class="flex items-center gap-1" aria-label="Grid pages">
        <Button
          variant="outline"
          size="sm"
          :disabled="page <= 1"
          aria-label="Previous page"
          @click="emit('page-change', page - 1)"
        >
          Prev
        </Button>
        <template v-for="(pageItem, index) in pageItems" :key="`${pageItem}-${index}`">
          <span
            v-if="pageItem === 'ellipsis'"
            class="px-1 text-muted-foreground"
            aria-hidden="true"
            >…</span
          >
          <Button
            v-else
            variant="outline"
            size="sm"
            :aria-label="`Page ${pageItem}`"
            :aria-current="pageItem === page ? 'page' : undefined"
            :class="pageItem === page ? 'bg-muted font-semibold' : ''"
            @click="emit('page-change', pageItem)"
          >
            {{ pageItem }}
          </Button>
        </template>
        <Button
          variant="outline"
          size="sm"
          :disabled="page >= totalPages"
          aria-label="Next page"
          @click="emit('page-change', page + 1)"
        >
          Next
        </Button>
      </nav>
    </div>
  </div>
</template>

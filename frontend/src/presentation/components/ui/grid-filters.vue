<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  type CSSProperties,
} from "vue";
import type { ListFilter } from "@/domain/repositories";
import Button from "./button.vue";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowUpDown,
  Circle,
  CircleSlash,
  CircleX,
  Equal,
  ListFilter as FilterIcon,
  Search,
  SearchX,
} from "lucide-vue-next";
import type { Component } from "vue";

export interface GridFilterField {
  key: string;
  label: string;
  kind: "text" | "number" | "date";
  sortBy?: string;
  align?: "left" | "right";
  options?: { value: string; label: string; icon?: Component }[];
}

const props = defineProps<{
  modelValue: ListFilter[];
  fields: GridFilterField[];
  actionColumn?: boolean;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}>();

const emit = defineEmits<{
  (event: "update:modelValue", filters: ListFilter[]): void;
  (event: "sort", field: string): void;
}>();

type Operator = ListFilter["operator"];
const operators: { value: Operator; label: string }[] = [
  { value: "equals", label: "Equals" },
  { value: "not_equals", label: "Not equal" },
  { value: "contains", label: "Contains" },
  { value: "not_contains", label: "Does not contain" },
  { value: "starts_with", label: "Starts with" },
  { value: "ends_with", label: "Ends with" },
  { value: "greater_than", label: "Greater than" },
  { value: "greater_or_equal", label: "Greater than or equal" },
  { value: "less_than", label: "Less than" },
  { value: "less_or_equal", label: "Less than or equal" },
  { value: "is_empty", label: "Is empty" },
  { value: "is_not_empty", label: "Is not empty" },
];

const drafts = ref<
  Record<string, { operator: Operator; value: string; values: string[] }>
>({});
const openField = ref<string | null>(null);
const activeField = computed(
  () => props.fields.find((field) => field.key === openField.value) ?? null,
);
const operatorButton = ref<HTMLElement | null>(null);
const operatorMenu = ref<HTMLElement | null>(null);
const menuPosition = ref<CSSProperties>({ left: "0px", top: "0px" });
let applyTimer: ReturnType<typeof setTimeout> | undefined;

function updateMenuPosition() {
  const field = props.fields.find((item) => item.key === openField.value);
  if (!field || !operatorButton.value) return;

  const rect = operatorButton.value.getBoundingClientRect();
  const menuWidth = Math.min(224, window.innerWidth - 16);
  const menuItemCount = field.options
    ? field.options.length + 1
    : availableOperators(field).length;
  const menuHeight = Math.min(
    menuItemCount * 36 + 8,
    440,
    window.innerHeight - 16,
  );
  const left = Math.min(
    Math.max(8, rect.left),
    window.innerWidth - menuWidth - 8,
  );
  const top =
    rect.bottom + menuHeight + 8 <= window.innerHeight
      ? rect.bottom + 4
      : Math.max(8, rect.top - menuHeight - 4);

  menuPosition.value = {
    left: `${left}px`,
    top: `${top}px`,
    width: `${menuWidth}px`,
    maxHeight: `calc(100vh - 16px)`,
  };
}

function handleDocumentPointerDown(event: PointerEvent) {
  const target = event.target;
  if (!(target instanceof Node)) return;
  if (
    operatorButton.value?.contains(target) ||
    operatorMenu.value?.contains(target)
  )
    return;
  openField.value = null;
}

function handleViewportChange() {
  if (openField.value) updateMenuPosition();
}

onMounted(() => {
  document.addEventListener("pointerdown", handleDocumentPointerDown);
  window.addEventListener("resize", handleViewportChange);
  window.addEventListener("scroll", handleViewportChange, true);
});

onBeforeUnmount(() => {
  if (applyTimer) clearTimeout(applyTimer);
  document.removeEventListener("pointerdown", handleDocumentPointerDown);
  window.removeEventListener("resize", handleViewportChange);
  window.removeEventListener("scroll", handleViewportChange, true);
});

function defaultOperator(field: GridFilterField): Operator {
  return field.kind === "text" ? "contains" : "equals";
}

watch(
  () => [props.fields, props.modelValue] as const,
  ([fields, filters]) => {
    const next: Record<
      string,
      { operator: Operator; value: string; values: string[] }
    > = {};
    for (const field of fields) {
      const current = filters.find((filter) => filter.field === field.key);
      next[field.key] = {
        operator:
          current?.operator ??
          drafts.value[field.key]?.operator ??
          defaultOperator(field),
        value: current?.value ?? drafts.value[field.key]?.value ?? "",
        values: current?.values ?? drafts.value[field.key]?.values ?? [],
      };
    }
    drafts.value = next;
  },
  { immediate: true, deep: true },
);

function availableOperators(
  field: GridFilterField,
): { value: Operator; label: string }[] {
  return operators.filter(({ value }) => {
    if (value === "is_empty" || value === "is_not_empty") return true;
    if (field.kind === "text")
      return ![
        "greater_than",
        "greater_or_equal",
        "less_than",
        "less_or_equal",
      ].includes(value);
    return !["contains", "not_contains", "starts_with", "ends_with"].includes(
      value,
    );
  });
}

function needsValue(operator: Operator) {
  return operator !== "is_empty" && operator !== "is_not_empty";
}

function apply() {
  if (applyTimer) clearTimeout(applyTimer);
  applyTimer = undefined;
  emit("update:modelValue", buildFilters());
  openField.value = null;
}

function buildFilters(): ListFilter[] {
  const filters: ListFilter[] = [];
  for (const field of props.fields) {
    const draft = drafts.value[field.key];
    if (!draft) continue;
    if (field.options) {
      if (draft.values.length)
        filters.push({
          field: field.key,
          operator: "in",
          values: draft.values,
        });
      continue;
    }
    if (needsValue(draft.operator) && !draft.value.trim()) continue;
    filters.push({
      field: field.key,
      operator: draft.operator,
      ...(needsValue(draft.operator) ? { value: draft.value.trim() } : {}),
    });
  }
  return filters;
}

function updateOption(fieldKey: string, value: string, checked: boolean) {
  const draft = drafts.value[fieldKey];
  if (!draft) return;
  draft.values = checked
    ? [...new Set([...draft.values, value])]
    : draft.values.filter((selected) => selected !== value);
  if (applyTimer) clearTimeout(applyTimer);
  emit("update:modelValue", buildFilters());
}

function selectAllOptions(fieldKey: string) {
  const draft = drafts.value[fieldKey];
  if (!draft) return;
  draft.values = [];
  if (applyTimer) clearTimeout(applyTimer);
  emit("update:modelValue", buildFilters());
}

function scheduleApply() {
  if (applyTimer) clearTimeout(applyTimer);
  applyTimer = setTimeout(apply, 300);
}

function updateFilterValue(fieldKey: string, event: Event) {
  const input = event.currentTarget;
  const draft = drafts.value[fieldKey];
  if (!(input instanceof HTMLInputElement) || !draft) return;
  draft.value = input.value;
  scheduleApply();
}

function resetFilters() {
  if (applyTimer) clearTimeout(applyTimer);
  applyTimer = undefined;
  drafts.value = Object.fromEntries(
    props.fields.map((field) => [
      field.key,
      { operator: defaultOperator(field), value: "", values: [] },
    ]),
  );
  emit("update:modelValue", []);
  openField.value = null;
}

function selectOperator(field: GridFilterField, operator: Operator) {
  const draft = drafts.value[field.key];
  if (!draft) return;
  draft.operator = operator;
  if (!needsValue(operator)) draft.value = "";
  openField.value = null;
  apply();
}

function toggleOperatorMenu(field: GridFilterField, event: MouseEvent) {
  if (openField.value === field.key) {
    openField.value = null;
    return;
  }
  operatorButton.value = event.currentTarget as HTMLElement;
  openField.value = field.key;
  updateMenuPosition();
}

function operatorLabel(field: GridFilterField) {
  return (
    operators.find(({ value }) => value === drafts.value[field.key]?.operator)
      ?.label ?? "Choose operator"
  );
}

function selectedOptionsLabel(field: GridFilterField) {
  const selected = drafts.value[field.key]?.values ?? [];
  if (!selected.length) return "All";
  return `${selected.length} selected`;
}

function operatorIcon(operator: Operator) {
  if (operator === "equals") return Equal;
  if (operator === "not_equals") return CircleX;
  if (operator === "contains") return Search;
  if (operator === "not_contains") return SearchX;
  if (operator === "starts_with") return ArrowRight;
  if (operator === "ends_with") return ArrowLeft;
  if (operator === "greater_than" || operator === "greater_or_equal")
    return ArrowUp;
  if (operator === "less_than" || operator === "less_or_equal")
    return ArrowDown;
  if (operator === "is_empty") return Circle;
  if (operator === "is_not_empty") return CircleSlash;
  return FilterIcon;
}
</script>

<template>
  <tr>
    <th
      v-for="field in fields"
      :key="field.key"
      class="min-w-40 p-3 text-center"
    >
      <button
        v-if="field.sortBy"
        type="button"
        class="inline-flex items-center justify-center gap-1 hover:text-foreground"
        :aria-label="`Sort by ${field.label}`"
        @click="emit('sort', field.sortBy)"
      >
        <span>{{ field.label }}</span>
        <component
          :is="
            sortBy === field.sortBy
              ? sortOrder === 'DESC'
                ? ArrowDown
                : ArrowUp
              : ArrowUpDown
          "
          class="h-3.5 w-3.5"
          aria-hidden="true"
        />
      </button>
      <span v-else>{{ field.label }}</span>
    </th>
    <th v-if="actionColumn !== false" class="p-3 text-center">Actions</th>
  </tr>
  <tr class="border-t border-border bg-muted/30 align-top">
    <th
      v-for="field in fields"
      :key="field.key"
      class="min-w-40 p-2 font-normal"
      :class="field.align === 'right' ? 'text-right' : 'text-left'"
    >
      <div
        class="flex items-center gap-1.5"
        :class="field.align === 'right' ? 'justify-end' : 'justify-start'"
      >
        <Button
          v-if="field.options"
          type="button"
          variant="outline"
          size="sm"
          class="h-8 w-full justify-between font-normal"
          :aria-label="`${field.label} filter: ${selectedOptionsLabel(field)}`"
          :aria-expanded="openField === field.key"
          @click="toggleOperatorMenu(field, $event)"
        >
          <span>{{ selectedOptionsLabel(field) }}</span>
          <FilterIcon class="h-4 w-4" aria-hidden="true" />
        </Button>
        <template v-else>
          <div class="relative shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              class="h-8 w-8"
              :aria-label="`${field.label} filter: ${operatorLabel(field)}`"
              :aria-expanded="openField === field.key"
              :title="operatorLabel(field)"
              @click="toggleOperatorMenu(field, $event)"
            >
              <component
                :is="
                  operatorIcon(
                    drafts[field.key]?.operator ?? defaultOperator(field),
                  )
                "
                class="w-4 h-4"
              />
            </Button>
          </div>
          <input
            v-if="
              needsValue(drafts[field.key]?.operator ?? defaultOperator(field))
            "
            :value="drafts[field.key].value"
            :type="field.kind"
            :placeholder="operatorLabel(field)"
            :aria-label="`${field.label} filter value`"
            maxlength="200"
            class="h-8 min-w-0 w-full rounded-md border border-input bg-card px-2 text-sm text-foreground"
            @input="updateFilterValue(field.key, $event)"
            @keydown.enter.prevent="apply"
          />
          <span
            v-else
            class="h-8 flex min-w-0 flex-1 items-center text-xs text-muted-foreground"
          >
            {{ operatorLabel(field) }}
          </span>
        </template>
      </div>
    </th>
    <th v-if="actionColumn !== false" class="p-2 text-center align-middle">
      <button
        type="button"
        class="inline-flex items-center justify-center gap-1.5 text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        @click="resetFilters"
      >
        <FilterIcon class="h-3.5 w-3.5" aria-hidden="true" />
        Reset
      </button>
    </th>
  </tr>
  <Teleport to="body">
    <div
      v-if="activeField"
      ref="operatorMenu"
      class="fixed z-[100] overflow-y-auto rounded-md border border-border bg-card p-1 text-foreground shadow-lg"
      :style="menuPosition"
      role="menu"
    >
      <template v-if="activeField.options">
        <label
          class="flex cursor-pointer items-center gap-2 rounded px-3 py-2 text-sm hover:bg-muted"
        >
          <input
            type="checkbox"
            :checked="drafts[activeField.key]?.values.length === 0"
            @change="selectAllOptions(activeField.key)"
          />
          All
        </label>
        <label
          v-for="option in activeField.options"
          :key="option.value"
          class="flex cursor-pointer items-center gap-2 rounded px-3 py-2 text-sm hover:bg-muted"
        >
          <component
            v-if="option.icon"
            :is="option.icon"
            class="h-4 w-4"
            aria-hidden="true"
          />
          <input
            type="checkbox"
            :checked="drafts[activeField.key]?.values.includes(option.value)"
            @change="
              updateOption(
                activeField.key,
                option.value,
                ($event.target as HTMLInputElement).checked,
              )
            "
          />
          {{ option.label }}
        </label>
      </template>
      <button
        v-else
        v-for="operator in availableOperators(activeField)"
        :key="operator.value"
        type="button"
        class="block w-full rounded px-3 py-2 text-left text-sm hover:bg-muted"
        role="menuitem"
        @click="selectOperator(activeField, operator.value)"
      >
        {{ operator.label }}
      </button>
    </div>
  </Teleport>
</template>

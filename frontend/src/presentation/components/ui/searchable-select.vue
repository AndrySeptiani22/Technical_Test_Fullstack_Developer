<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { Search } from "lucide-vue-next";

export interface SearchableSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

const props = defineProps<{
  modelValue: string;
  options: SearchableSelectOption[];
  placeholder?: string;
  accessibleLabel: string;
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: string): void;
}>();

const root = ref<HTMLElement | null>(null);
const open = ref(false);
const search = ref("");
const selectedOption = computed(() =>
  props.options.find((option) => option.value === props.modelValue),
);
const filteredOptions = computed(() => {
  const term = search.value.trim().toLocaleLowerCase();
  return term
    ? props.options.filter((option) =>
        option.label.toLocaleLowerCase().includes(term),
      )
    : props.options;
});

function handleDocumentPointerDown(event: PointerEvent) {
  const target = event.target;
  if (target instanceof Node && !root.value?.contains(target))
    open.value = false;
}

onMounted(() =>
  document.addEventListener("pointerdown", handleDocumentPointerDown),
);
onBeforeUnmount(() =>
  document.removeEventListener("pointerdown", handleDocumentPointerDown),
);

function toggle() {
  open.value = !open.value;
  if (open.value) search.value = "";
}

function selectOption(option: SearchableSelectOption) {
  if (option.disabled) return;
  emit("update:modelValue", option.value);
  open.value = false;
}
</script>

<template>
  <div ref="root" class="relative mt-1.5">
    <button
      type="button"
      class="h-10 w-full rounded-md border border-input bg-card px-3 text-left text-sm"
      :aria-label="accessibleLabel"
      :aria-expanded="open"
      aria-haspopup="listbox"
      @click="toggle"
    >
      <span
        :class="selectedOption ? 'text-foreground' : 'text-muted-foreground'"
      >
        {{ selectedOption?.label ?? placeholder ?? "Select…" }}
      </span>
    </button>
    <div
      v-if="open"
      class="absolute z-30 mt-1 w-full overflow-hidden rounded-md border border-border bg-card shadow-lg"
    >
      <div class="relative border-b border-border p-2">
        <Search
          class="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          v-model="search"
          type="search"
          :aria-label="`Search ${accessibleLabel.toLocaleLowerCase()}`"
          placeholder="Type to search…"
          class="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm"
          @keydown.esc="open = false"
        />
      </div>
      <div class="max-h-60 overflow-y-auto p-1" role="listbox">
        <button
          v-for="option in filteredOptions"
          :key="option.value"
          type="button"
          role="option"
          :aria-selected="option.value === modelValue"
          :disabled="option.disabled"
          class="block w-full rounded px-3 py-2 text-left text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          @click="selectOption(option)"
        >
          {{ option.label }}
        </button>
        <p
          v-if="filteredOptions.length === 0"
          class="px-3 py-4 text-center text-sm text-muted-foreground"
        >
          No matching options.
        </p>
      </div>
    </div>
  </div>
</template>

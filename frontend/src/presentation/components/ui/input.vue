<script setup lang="ts">
import { computed, useAttrs } from "vue";
import { cn } from "@/presentation/lib/utils";

defineOptions({ inheritAttrs: false });
const props = defineProps<{
  modelValue?: string | number | null;
  type?: string;
}>();
const emit = defineEmits<{ (e: "update:modelValue", v: string): void }>();
const attrs = useAttrs();

const cls = computed(() =>
  cn(
    "h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm placeholder:text-muted-foreground focus-ring disabled:opacity-50 transition-colors",
    attrs.class as string,
  ),
);
</script>

<template>
  <input
    :type="type || 'text'"
    :class="cls"
    :value="modelValue ?? ''"
    v-bind="{ ...$attrs, class: undefined }"
    @input="
      emit('update:modelValue', ($event.target as HTMLInputElement).value)
    "
  />
</template>

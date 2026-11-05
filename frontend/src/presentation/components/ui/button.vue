<script setup lang="ts">
import { computed } from "vue";
import { cn } from "@/presentation/lib/utils";

const props = withDefaults(
  defineProps<{
    variant?:
      | "default"
      | "outline"
      | "ghost"
      | "destructive"
      | "secondary"
      | "accent";
    size?: "sm" | "md" | "lg" | "icon";
    type?: "button" | "submit" | "reset";
    disabled?: boolean;
    loading?: boolean;
  }>(),
  { variant: "default", size: "md", type: "button" },
);

const classes = computed(() =>
  cn(
    "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-all focus-ring disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]",
    {
      default:
        "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
      outline:
        "border border-border bg-transparent hover:bg-muted text-foreground",
      ghost: "hover:bg-muted text-foreground",
      destructive:
        "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      accent: "bg-accent text-accent-foreground hover:bg-accent/90 shadow-sm",
    }[props.variant],
    {
      sm: "h-8 px-3 text-xs",
      md: "h-10 px-4 text-sm",
      lg: "h-11 px-6 text-base",
      icon: "h-9 w-9",
    }[props.size],
  ),
);
</script>

<template>
  <button :type="type" :disabled="disabled || loading" :class="classes">
    <span
      v-if="loading"
      class="w-4 h-4 rounded-full border-2 border-current border-r-transparent animate-spin"
    ></span>
    <slot v-else />
  </button>
</template>

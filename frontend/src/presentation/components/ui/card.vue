<script setup lang="ts">
import type { ClassValue } from "clsx";
import { cn } from "@/presentation/lib/utils";
defineProps<{ class?: ClassValue }>();
</script>

<template>
  <div
    :class="
      cn(
        'rounded-lg border border-border bg-card text-card-foreground shadow-sm',
        $props.class,
      )
    "
  >
    <slot />
  </div>
</template>

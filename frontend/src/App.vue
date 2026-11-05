<script setup lang="ts">
import { RouterView } from "vue-router";
import Toaster from "./presentation/components/ui/toaster.vue";
</script>

<template>
  <RouterView />
  <Toaster />
</template>

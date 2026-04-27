<script setup lang="ts">
defineProps<{
  label: string
}>()
</script>

<template>
  <header class="flex items-baseline justify-between mb-8">
    <h2 class="text-[1.1rem] font-semibold text-primary/60 uppercase tracking-[0.15em]">
      {{ label }}
    </h2>
    <slot name="action" />
  </header>
</template>

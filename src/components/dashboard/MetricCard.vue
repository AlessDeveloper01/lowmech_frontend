<script setup lang="ts">
defineProps<{
  value: string
  label: string
  delta?: string
  positive?: boolean
  highlight?: boolean
}>()
</script>

<template>
  <article
    class="py-8 group cursor-default"
    :class="
      highlight ? 'border-b-[2px] border-b-primary' : 'border-b border-border dark:border-dk-border'
    "
  >
    <header class="flex items-baseline gap-3 mb-2">
      <span
        class="text-[3.6rem] tracking-tight leading-none transition-colors"
        :class="[
          highlight
            ? 'font-medium text-primary'
            : 'font-light text-body dark:text-dk-body group-hover:text-primary',
        ]"
      >
        {{ value }}
      </span>
      <span
        v-if="delta"
        class="text-[1.1rem] font-semibold tracking-wide"
        :class="positive ? 'text-emerald-500' : 'text-red-400'"
      >
        {{ delta }}
      </span>
    </header>
    <span
      class="text-[1.1rem] uppercase tracking-[0.12em] font-medium transition-colors"
      :class="highlight ? 'text-primary/70' : 'text-muted dark:text-dk-muted'"
    >
      {{ label }}
    </span>
  </article>
</template>

<script setup lang="ts">
defineProps<{
  name: string
  sku: string
  stock: string
  status: 'critico' | 'bajo'
}>()

const statusLabel = {
  critico: 'Critico',
  bajo: 'Bajo',
} as const

const statusColor = {
  critico: 'text-red-500',
  bajo: 'text-amber-500',
} as const
</script>

<template>
  <article
    class="flex items-center justify-between py-4 border-b border-border/60 dark:border-dk-border/60 last:border-b-0"
  >
    <header class="flex items-center gap-4">
      <span
        class="w-1 h-8 rounded-full"
        :class="status === 'critico' ? 'bg-red-400' : 'bg-amber-400'"
      ></span>
      <hgroup>
        <p class="text-[1.3rem] font-medium text-body dark:text-dk-body">{{ name }}</p>
        <p class="text-[1rem] text-muted dark:text-dk-muted">{{ sku }}</p>
      </hgroup>
    </header>
    <footer class="flex items-center gap-5">
      <span class="text-[1.1rem] text-muted dark:text-dk-muted">{{ stock }}</span>
      <span class="text-[1rem] font-medium" :class="statusColor[status]">{{
        statusLabel[status]
      }}</span>
    </footer>
  </article>
</template>

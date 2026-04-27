<script setup lang="ts">
defineProps<{
  vehicle: string
  client: string
  status: 'proceso' | 'pendiente' | 'completado'
}>()

const statusColor = {
  proceso: 'text-blue-500',
  pendiente: 'text-amber-500',
  completado: 'text-emerald-500',
} as const

const statusLabel = {
  proceso: 'En proceso',
  pendiente: 'Pendiente',
  completado: 'Listo',
} as const
</script>

<template>
  <a
    href="#"
    class="flex items-center gap-5 py-5 border-b border-border/60 dark:border-dk-border/60 no-underline last:border-b-0 group"
  >
    <figure
      class="w-9 h-9 bg-subtle dark:bg-dk-subtle flex items-center justify-center shrink-0 text-muted dark:text-dk-muted group-hover:text-primary transition-colors"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
      >
        <path
          d="M14 16H9m10 0h3l-2-7H4l-2 7h3m4 0a2 2 0 104 0m4 0a2 2 0 104 0M5.5 9l1.5-4h10l1.5 4"
        />
      </svg>
    </figure>
    <section class="flex-1 min-w-0">
      <p class="text-[1.4rem] font-medium text-body dark:text-dk-body truncate">{{ vehicle }}</p>
      <p class="text-[1.1rem] text-muted dark:text-dk-muted">{{ client }}</p>
    </section>
    <span class="text-[1.1rem] font-medium" :class="statusColor[status]">
      {{ statusLabel[status] }}
    </span>
  </a>
</template>

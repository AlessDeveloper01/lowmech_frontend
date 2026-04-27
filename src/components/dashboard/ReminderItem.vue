<script setup lang="ts">
defineProps<{
  title: string
  description: string
  dueDate: string
}>()
</script>

<template>
  <article
    class="flex items-center gap-5 py-5 border-b border-border/60 dark:border-dk-border/60 last:border-b-0"
  >
    <section class="flex-1 min-w-0">
      <p class="text-[1.3rem] font-medium text-body dark:text-dk-body">{{ title }}</p>
      <p class="text-[1.1rem] text-muted dark:text-dk-muted truncate">{{ description }}</p>
    </section>
    <footer class="flex items-center gap-4 shrink-0">
      <time class="text-[1.1rem] text-primary font-medium">{{ dueDate }}</time>
      <button
        class="text-[1.1rem] font-medium text-primary border border-primary/30 px-4 py-1.5 cursor-pointer bg-transparent hover:bg-primary hover:text-white transition-colors"
      >
        Enviar
      </button>
    </footer>
  </article>
</template>

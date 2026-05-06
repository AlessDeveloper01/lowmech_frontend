<script setup lang="ts">
import logoImg from '@/assets/images/logo.png'

defineProps<{
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  light?: boolean
}>()
</script>

<template>
  <figure
    class="flex items-center"
    :class="{
      'gap-3': size === 'sm',
      'gap-4': size === 'md' || !size,
      'flex-col gap-5': size === 'lg',
    }"
  >
    <img
      :src="logoImg"
      alt="LowMech Systems"
      class="object-contain"
      :class="{
        'h-9': size === 'sm',
        'h-12': size === 'md' || !size,
        'h-20': size === 'lg',
      }"
    />
    <figcaption
      v-if="showText !== false"
      class="font-bold tracking-[0.08em] leading-none"
      :class="[
        light ? 'text-white' : 'text-body',
        size === 'sm' ? 'text-[1.3rem]' : size === 'lg' ? 'text-[2.2rem]' : 'text-[1.6rem]',
      ]"
    >
      LowMech
    </figcaption>
  </figure>
</template>

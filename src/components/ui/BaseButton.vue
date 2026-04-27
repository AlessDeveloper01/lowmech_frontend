<script setup lang="ts">
defineProps<{
  type?: 'button' | 'submit' | 'reset'
  variant?: 'primary' | 'outline' | 'ghost'
  fullWidth?: boolean
  loading?: boolean
  disabled?: boolean
}>()

defineEmits<{
  click: [event: MouseEvent]
}>()
</script>

<template>
  <button
    :type="type || 'button'"
    :disabled="disabled || loading"
    class="px-8 py-4 text-[1.5rem] font-semibold cursor-pointer transition-opacity duration-200 border-none hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
    :class="{
      'bg-primary text-white': variant === 'primary' || !variant,
      'bg-transparent text-primary border border-primary hover:bg-[rgba(255,107,53,0.05)]':
        variant === 'outline',
      'bg-transparent text-primary hover:bg-[rgba(255,107,53,0.05)]': variant === 'ghost',
      'w-full': fullWidth,
    }"
    @click="$emit('click', $event)"
  >
    <slot />
  </button>
</template>

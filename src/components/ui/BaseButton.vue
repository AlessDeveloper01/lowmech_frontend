<script setup lang="ts">
defineProps<{
  type?: 'button' | 'submit' | 'reset'
  variant?: 'primary' | 'outline' | 'ghost' | 'form'
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
      'bg-transparent text-primary border border-primary hover:bg-[rgba(255,107,53,0.05)]': variant === 'outline',
      'bg-transparent text-primary hover:bg-[rgba(255,107,53,0.05)]': variant === 'ghost',
      'w-full rounded-lg bg-[#00ffb4] hover:bg-[#00e6a0] py-3 text-xs font-mono font-bold text-black tracking-widest uppercase transition-all duration-200 px-0 text-[0.75rem]': variant === 'form',
      'w-full': fullWidth,
    }"
    @click="$emit('click', $event)"
  >
    <slot />
  </button>
</template>
<script setup lang="ts">
defineProps<{
  label?: string
  type?: string
  placeholder?: string
  modelValue?: string
  error?: string
  variant?: 'default' | 'form'
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <fieldset class="flex flex-col gap-2">
    <label
      v-if="label && variant !== 'form'"
      class="text-[1.3rem] font-semibold text-body"
    >
      {{ label }}
    </label>
    <label
      v-if="label && variant === 'form'"
      class="text-[10px] font-mono tracking-widest uppercase text-white/30"
    >
      {{ label }}
    </label>

    <input
      :type="type || 'text'"
      :placeholder="placeholder"
      :value="modelValue"
      class="w-full outline-none transition-all duration-200"
      :class="{
        'px-5 py-4 text-[1.5rem] text-body bg-bg border border-border focus:border-primary placeholder:text-muted': variant !== 'form',
        'border-red-500': error && variant !== 'form',
        'rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-mono text-white/80 placeholder:text-white/15 focus:border-[#00ffb4]/40 focus:bg-[#00ffb4]/[0.02]': variant === 'form',
        'border-red-500/50': error && variant === 'form',
      }"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <output v-if="error && variant !== 'form'" class="text-[1.2rem] text-red-500 font-medium">
      {{ error }}
    </output>
    <output v-if="error && variant === 'form'" class="text-[11px] font-mono text-red-400/80">
      {{ error }}
    </output>
  </fieldset>
</template>
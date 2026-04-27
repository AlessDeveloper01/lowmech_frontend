<script setup lang="ts">
defineProps<{
  label?: string
  type?: string
  placeholder?: string
  modelValue?: string
  error?: string
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <fieldset class="flex flex-col gap-2">
    <label v-if="label" class="text-[1.3rem] font-semibold text-body">
      {{ label }}
    </label>
    <input
      :type="type || 'text'"
      :placeholder="placeholder"
      :value="modelValue"
      class="w-full px-5 py-4 text-[1.5rem] text-body bg-bg border border-border outline-none transition-colors duration-200 focus:border-primary placeholder:text-muted"
      :class="{ 'border-red-500': error }"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <output v-if="error" class="text-[1.2rem] text-red-500 font-medium">
      {{ error }}
    </output>
  </fieldset>
</template>

<script setup lang="ts">
import { ref, provide, watch, onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useConfiguracionStore } from '@/stores/configuracion'

const collapsed = ref(false)
const darkMode = ref(false)

provide('sidebarCollapsed', collapsed)
provide('darkMode', darkMode)

watch(
  darkMode,
  (val) => {
    document.documentElement.classList.toggle('dark', val)
  },
  { immediate: true },
)

const cfgStore = useConfiguracionStore()
onMounted(() => {
  cfgStore.fetchConfig()
})
</script>

<template>
  <RouterView />
</template>

<script setup lang="ts">
import { inject, computed, type Ref } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import logoImg from '@/assets/images/logo.png'

const route = useRoute()
const authStore = useAuthStore()
const collapsed = inject<Ref<boolean>>('sidebarCollapsed')!

const staffNavItems = [
  { label: 'Dashboard', route: 'dashboard' },
  { label: 'Ordenes', route: 'ordenes-lista' },
  { label: 'Vehiculos', route: 'vehiculos-lista' },
  { label: 'Clientes', route: 'clientes-lista' },
  { label: 'Inventario', route: 'inventario-lista' },
  { label: 'Servicios', route: 'servicios-lista' },
  { label: 'Promociones', route: 'promociones-lista' },
  { label: 'Usuarios', route: 'usuarios-lista' },
  { label: 'Reportes', route: 'reportes' },
]

const clienteNavItems = [
  { label: 'Mis Ordenes', route: 'cliente-ordenes' },
  { label: 'Mis Carros', route: 'cliente-carros' },
]

const mecanicoNavItems = [
  { label: 'Mis Trabajos', route: 'mecanico-trabajos' },
]

const recepcionistaNavItems = [
  { label: 'Dashboard', route: 'recepcionista-dashboard' },
  { label: 'Ordenes', route: 'recepcionista-ordenes' },
  { label: 'Vehiculos', route: 'recepcionista-vehiculos' },
  { label: 'Clientes', route: 'recepcionista-clientes' },
]

const navItems = computed(() => {
  if (authStore.isCliente) return clienteNavItems
  if (authStore.isMecanico) return mecanicoNavItems
  if (authStore.rol === 'recepcionista') return recepcionistaNavItems
  return staffNavItems
})

function isActive(ruta: string): boolean {
  if (ruta === 'dashboard') return route.name === 'dashboard'
  if (ruta === 'ordenes-lista') return String(route.name).startsWith('ordenes')
  if (ruta === 'vehiculos-lista') return String(route.name).startsWith('vehiculos')
  if (ruta === 'clientes-lista') return String(route.name).startsWith('clientes')
  if (ruta === 'inventario-lista') return String(route.name).startsWith('inventario')
  if (ruta === 'servicios-lista') return String(route.name).startsWith('servicios')
  if (ruta === 'promociones-lista') return String(route.name).startsWith('promociones')
  if (ruta === 'usuarios-lista') return String(route.name).startsWith('usuarios')
  if (ruta === 'reportes') return route.name === 'reportes'
  if (ruta === 'cliente-ordenes') return route.name === 'cliente-ordenes'
  if (ruta === 'cliente-carros') return route.name === 'cliente-carros'
  if (ruta === 'mecanico-trabajos') return route.name === 'mecanico-trabajos'
  // Recepcionista
  if (ruta === 'recepcionista-dashboard') return route.name === 'recepcionista-dashboard'
  if (ruta === 'recepcionista-ordenes') return String(route.name).startsWith('recepcionista-ordenes')
  if (ruta === 'recepcionista-vehiculos') return String(route.name).startsWith('recepcionista-vehiculos')
  if (ruta === 'recepcionista-clientes') return String(route.name).startsWith('recepcionista-clientes')
  return false
}
</script>

<template>
<div
    v-if="!collapsed"
    class="fixed inset-0 z-[999] bg-black/50 hidden max-[768px]:block"
    @click="collapsed = true"
  />

  <aside
    class="fixed left-0 top-0 h-screen bg-navy flex flex-col z-[1000] transition-all duration-300 ease-out max-[768px]:w-[22rem]"
    :class="[
      collapsed ? 'w-[6.4rem] max-[768px]:-translate-x-full' : 'w-[22rem] max-[768px]:translate-x-0'
    ]"
  >
    <!-- Logo -->
    <header class="h-[6.5rem] flex items-center px-6 shrink-0">
      <img :src="logoImg" alt="LowMech" class="h-8 object-contain brightness-0 invert" />
      <span
        class="ml-4 text-[1.4rem] font-bold text-white tracking-wide transition-all duration-200 whitespace-nowrap overflow-hidden"
        :class="collapsed ? 'max-w-0 opacity-0' : 'max-w-[12rem] opacity-100'"
      >
        LowMech
      </span>
    </header>

    <!-- Nav -->
    <nav class="flex-1 py-8 flex flex-col px-3">
      <router-link
        v-for="item in navItems"
        :key="item.label"
        :to="{ name: item.route }"
        class="group relative flex items-center h-[4.2rem] px-3 text-[1.3rem] font-medium no-underline transition-all duration-200 whitespace-nowrap"
        :class="
          isActive(item.route)
            ? 'text-white bg-white/10'
            : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04]'
        "
      >
        <span
          class="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-primary transition-opacity"
          :class="isActive(item.route) ? 'opacity-100' : 'opacity-0'"
        ></span>
        <span
          class="w-8 h-8 flex items-center justify-center text-[1.1rem] font-bold shrink-0"
          :class="isActive(item.route) ? 'text-primary' : 'text-white/30'"
        >
          {{ item.label.charAt(0) }}
        </span>
        <span
          class="ml-4 transition-all duration-200 overflow-hidden"
          :class="collapsed ? 'max-w-0 opacity-0' : 'max-w-[14rem] opacity-100'"
        >
          {{ item.label }}
        </span>

        <!-- Tooltip solo cuando colapsado -->
        <span
          v-if="collapsed"
          class="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-surface text-body text-[1.2rem] font-medium rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-[2000]"
        >
          {{ item.label }}
          <span
            class="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-surface rotate-45"
          ></span>
        </span>
      </router-link>
    </nav>

    <!-- Bottom -->
    <footer class="p-3 mb-4 flex flex-col gap-1">
      <router-link
        :to="{ name: 'configuracion' }"
        class="flex items-center h-[4.2rem] px-3 text-white/30 hover:text-white/60 hover:bg-white/[0.04] text-[1.3rem] font-medium no-underline transition-all whitespace-nowrap"
      >
        <span class="w-8 h-8 flex items-center justify-center text-[1.1rem] font-bold shrink-0"
          >S</span
        >
        <span
          class="ml-4 transition-all duration-200 overflow-hidden"
          :class="collapsed ? 'max-w-0 opacity-0' : 'max-w-[14rem] opacity-100'"
          >Ajustes</span
        >
      </router-link>
      <button
        class="flex items-center h-[4.2rem] px-3 text-white/30 hover:text-white/60 hover:bg-white/[0.04] text-[1.3rem] font-medium transition-all whitespace-nowrap cursor-pointer border-none bg-transparent"
        @click="collapsed = !collapsed"
      >
        <span class="w-8 h-8 flex items-center justify-center shrink-0">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            class="transition-transform duration-300"
            :class="collapsed ? 'rotate-180' : ''"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
            />
          </svg>
        </span>
        <span
          class="ml-4 transition-all duration-200 overflow-hidden"
          :class="collapsed ? 'max-w-0 opacity-0' : 'max-w-[14rem] opacity-100'"
          >Colapsar</span
        >
      </button>
    </footer>
  </aside>
</template>

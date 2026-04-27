<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
    <AppSidebar />
    <div
      class="min-h-screen flex flex-col transition-all duration-300 ease-out max-[768px]:ml-0"
      :class="collapsed ? 'ml-[6.4rem]' : 'ml-[22rem]'"
    >
      <AppTopbar :dark-mode="darkMode" @toggle-dark="darkMode = !darkMode" />

      <main class="flex-1 p-6 md:p-10 max-w-5xl mx-auto w-full">
        <header class="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 class="text-[2.2rem] font-extrabold text-slate-800 dark:text-white tracking-tight">
              Mis Órdenes
            </h1>
            <p class="text-[1.1rem] text-slate-500 dark:text-slate-400 mt-1">
              Historial y estado de los servicios de tus vehículos
            </p>
          </div>
        </header>

        <!-- Cargando -->
        <div v-if="loading" class="flex flex-col items-center justify-center py-20 text-slate-400">
          <svg
            class="animate-spin h-10 w-10 mb-4 text-orange-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p class="text-lg font-medium">Buscando tus órdenes...</p>
        </div>

        <!-- Sin órdenes -->
        <div
          v-else-if="ordenes.length === 0"
          class="flex flex-col items-center justify-center py-24 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm"
        >
          <div
            class="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-10 w-10 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 class="text-xl font-bold text-slate-800 dark:text-white mb-2">No hay órdenes</h3>
          <p class="text-slate-500 dark:text-slate-400 text-center max-w-sm">
            Aún no tienes órdenes de servicio registradas en el sistema. Cuando ingreses un vehículo
            al taller, aparecerá aquí.
          </p>
        </div>

        <!-- Lista -->
        <div v-else class="grid grid-cols-1 gap-5">
          <article
            v-for="orden in ordenes"
            :key="orden.id"
            @click="router.push({ name: 'cliente-ordenes-detalle', params: { id: orden.id } })"
            class="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-orange-500/50 dark:hover:border-orange-500/50 rounded-2xl p-6 flex flex-col md:flex-row md:items-center gap-6 transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer"
          >
            <!-- Icono/Status Visual -->
            <div
              class="hidden md:flex items-center justify-center w-14 h-14 rounded-full bg-slate-50 dark:bg-slate-800 shrink-0 group-hover:scale-105 transition-transform duration-300"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6 text-slate-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="1.5"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                />
              </svg>
            </div>

            <div class="flex-1 space-y-3 md:space-y-0">
              <div class="flex flex-wrap items-center gap-3 mb-2">
                <span class="font-extrabold text-slate-800 dark:text-white text-lg"
                  >Orden #{{ String(orden.id).padStart(4, '0') }}</span
                >
                <span
                  class="px-3 py-1 rounded-full text-[0.75rem] font-bold uppercase tracking-wider border"
                  :class="badgeClass(orden.estado)"
                >
                  {{ labelEstado(orden.estado) }}
                </span>
              </div>

              <div
                class="flex flex-wrap items-center gap-2 text-slate-600 dark:text-slate-300 font-medium"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4 text-orange-500 shrink-0"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z"
                    clip-rule="evenodd"
                  />
                </svg>
                <span>{{
                  orden.vehiculo?.nombre ||
                  orden.vehiculo?.marca + ' ' + orden.vehiculo?.modelo ||
                  'Vehículo no especificado'
                }}</span>
                <span
                  v-if="orden.vehiculo?.placa"
                  class="text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-xs font-mono border border-slate-200 dark:border-slate-700"
                >
                  {{ orden.vehiculo.placa }}
                </span>
              </div>

              <p class="flex items-center gap-1.5 text-sm text-slate-400 mt-2 font-medium">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4 opacity-70 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Ingresado el {{ formatFecha(orden.createdAt) }}
              </p>
            </div>

            <div
              class="md:text-right shrink-0 bg-slate-50 dark:bg-slate-800/50 md:bg-transparent md:dark:bg-transparent rounded-xl p-4 md:p-0 border border-slate-100 dark:border-slate-800 md:border-none flex flex-row md:flex-col justify-between items-center md:items-end w-full md:w-auto mt-4 md:mt-0"
            >
              <p
                class="text-sm font-semibold text-slate-500 dark:text-slate-400 md:mb-1 uppercase tracking-wider"
              >
                Total a Pagar
              </p>
              <p class="text-[1.7rem] font-black text-orange-500">
                ${{ formatMonto(orden.total) }}
              </p>
            </div>
          </article>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, inject, type Ref } from 'vue'
import { api } from '@/services/api'
import { useRouter } from 'vue-router'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppTopbar from '@/components/layout/AppTopbar.vue'

const router = useRouter()
const collapsed = inject<Ref<boolean>>('sidebarCollapsed')!
const darkMode = inject<Ref<boolean>>('darkMode')!

interface OrdenMini {
  id: number
  estado: string
  total: number
  createdAt: string
  vehiculo?: { nombre: string; placa: string }
}

const ordenes = ref<OrdenMini[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    ordenes.value = await api.get<OrdenMini[]>('/ordenes/mis-ordenes')
  } finally {
    loading.value = false
  }
})

function labelEstado(estado: string) {
  const map: Record<string, string> = {
    recibido: 'Recibido',
    diagnostico: 'En diagnóstico',
    en_progreso: 'En progreso',
    esperando_piezas: 'Esperando piezas',
    completado: 'Completado',
    entregado: 'Entregado',
    cancelado: 'Cancelado',
    pagado: 'Pagado',
  }
  return map[estado] ?? estado
}

function badgeClass(estado: string) {
  const map: Record<string, string> = {
    recibido:
      'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
    diagnostico:
      'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800',
    en_progreso:
      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
    esperando_piezas:
      'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800',
    completado:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800',
    entregado:
      'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900/20 dark:text-teal-400 dark:border-teal-800',
    cancelado:
      'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800',
    pagado:
      'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/20 dark:text-sky-400 dark:border-sky-800',
  }
  return map[estado] ?? 'bg-slate-50 text-slate-600 border-slate-200'
}

function formatFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatMonto(v: number) {
  return (v ?? 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })
}
</script>

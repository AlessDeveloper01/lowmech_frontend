<script setup lang="ts">
import { ref, computed, inject, onMounted, type Ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/services/api'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppTopbar from '@/components/layout/AppTopbar.vue'

interface Orden {
  id: number
  estado: string
  prioridad: string
  vehiculo: { nombre: string; placa: string; marca: string; modelo: string; anio: string }
  cliente: { nombre: string; telefono: string; email: string }
  lineas: {
    id: number
    descripcion: string
    cantidad: number
    precioUnitario: number
    tipo: string
  }[]
  progreso: number
  notasProgreso: string
  checklistDiagnostico: boolean
  checklistReparacion: boolean
  checklistPruebas: boolean
  checklistLimpieza: boolean
  serviciosCompletados: string
  createdAt: string
  subtotal: number
  iva: number
  total: number
}

const router = useRouter()
const collapsed = inject<Ref<boolean>>('sidebarCollapsed')!
const darkMode = inject<Ref<boolean>>('darkMode')!

const ordenes = ref<Orden[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    ordenes.value = await api.get<Orden[]>('/ordenes/mis-trabajos')
  } catch (e) {
    console.error('Error:', e)
  } finally {
    loading.value = false
  }
})

function fmtFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
}

function fmtMonto(v: number) {
  return (v ?? 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })
}

const estados = [
  { valor: 'todos', label: 'Todos' },
  { valor: 'recibido', label: 'Recibido' },
  { valor: 'diagnostico', label: 'Diagnóstico' },
  { valor: 'en_progreso', label: 'En Progreso' },
  { valor: 'completado', label: 'Completado' },
]

const filtroEstado = ref('todos')

const ordenesFiltradas = computed(() => {
  if (filtroEstado.value === 'todos') return ordenes.value
  return ordenes.value.filter((o) => o.estado === filtroEstado.value)
})
</script>

<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950">
    <AppSidebar />
    <div
      class="transition-all duration-300 ease-out"
      :class="collapsed ? 'ml-[6.4rem]' : 'ml-[22rem]'"
    >
      <AppTopbar :dark-mode="darkMode" @toggle-dark="darkMode = !darkMode" />

      <main class="p-6 max-w-6xl mx-auto">
        <h1 class="text-3xl font-bold text-slate-800 dark:text-white mb-6">Mis Trabajos</h1>

        <div v-if="loading" class="text-center py-20 text-slate-400">Cargando...</div>

        <div v-else-if="ordenes.length === 0" class="text-center py-20">
          <p class="text-slate-500 text-lg">No tienes trabajos asignados.</p>
        </div>

        <div v-else>
          <!-- Filtros -->
          <div class="flex gap-2 mb-6 overflow-x-auto pb-2">
            <button
              v-for="e in estados"
              :key="e.valor"
              class="px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors"
              :class="
                filtroEstado === e.valor
                  ? 'bg-orange-500 text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-orange-400'
              "
              @click="filtroEstado = e.valor"
            >
              {{ e.label }}
            </button>
          </div>

          <!-- Lista -->
          <div class="grid gap-4">
            <div
              v-for="orden in ordenesFiltradas"
              :key="orden.id"
              @click="router.push({ name: 'mecanico-trabajos-detalle', params: { id: orden.id } })"
              class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 cursor-pointer hover:border-orange-400 transition-colors"
            >
              <div class="flex justify-between items-start mb-3">
                <div>
                  <span class="font-bold text-xl text-slate-800 dark:text-white">
                    #{{ String(orden.id).padStart(4, '0') }}
                  </span>
                  <span
                    class="ml-2 px-2 py-1 rounded text-xs font-bold"
                    :class="{
                      'bg-blue-100 text-blue-700': orden.estado === 'recibido',
                      'bg-purple-100 text-purple-700': orden.estado === 'diagnostico',
                      'bg-amber-100 text-amber-700': orden.estado === 'en_progreso',
                      'bg-green-100 text-green-700': orden.estado === 'completado',
                    }"
                  >
                    {{ orden.estado.charAt(0).toUpperCase() + orden.estado.slice(1) }}
                  </span>
                </div>
                <div class="text-right">
                  <p class="text-sm text-slate-400">Total</p>
                  <p class="text-xl font-bold text-orange-500">${{ fmtMonto(orden.total) }}</p>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p class="text-slate-400">Vehículo</p>
                  <p class="font-medium text-slate-700 dark:text-slate-200">
                    {{ orden.vehiculo?.marca }} {{ orden.vehiculo?.modelo }}
                  </p>
                  <p class="text-slate-500">{{ orden.vehiculo?.placa }}</p>
                </div>
                <div>
                  <p class="text-slate-400">Cliente</p>
                  <p class="font-medium text-slate-700 dark:text-slate-200">
                    {{ orden.cliente?.nombre }}
                  </p>
                </div>
              </div>

              <div class="mt-4">
                <div class="flex justify-between text-sm mb-1">
                  <span class="text-slate-500">Progreso</span>
                  <span class="font-medium text-orange-500">{{ orden.progreso || 0 }}%</span>
                </div>
                <div class="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-orange-500 transition-all duration-300"
                    :style="{ width: `${orden.progreso || 0}%` }"
                  />
                </div>
              </div>

              <p class="text-xs text-slate-400 mt-3">Ingreso: {{ fmtFecha(orden.createdAt) }}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

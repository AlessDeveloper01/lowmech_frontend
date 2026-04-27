<script setup lang="ts">
import { ref, computed, onMounted, inject, type Ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { api } from '@/services/api'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppTopbar from '@/components/layout/AppTopbar.vue'
import Swal from 'sweetalert2'

interface Linea {
  id: number
  descripcion: string
  cantidad: number
  precioUnitario: number
  tipo: string
}

interface Orden {
  id: number
  estado: string
  prioridad: string
  diagnostico: string
  notas: string
  vehiculo: { id: number; nombre: string; placa: string; marca: string; modelo: string; anio: string }
  cliente: { nombre: string; telefono: string }
  lineas: Linea[]
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
const route = useRoute()
const collapsed = inject<Ref<boolean>>('sidebarCollapsed')!
const darkMode = inject<Ref<boolean>>('darkMode')!

const orden = ref<Orden | null>(null)
const loading = ref(true)
const saving = ref(false)

const servicios = computed(() => orden.value?.lineas?.filter(l => l.tipo === 'servicio') ?? [])

const serviciosCompletados = computed(() => {
  if (!orden.value?.serviciosCompletados) return []
  return orden.value.serviciosCompletados.split(',').map(Number)
})

function isServicioCompletado(id: number) {
  return serviciosCompletados.value.includes(id)
}

const totalItems = computed(() => servicios.value.length + 1) // servicios + limpieza

const progresoCalculado = computed(() => {
  const serviciosOk = serviciosCompletados.value.length
  const limpiezaOk = orden.value?.checklistLimpieza ? 1 : 0
  return Math.round(((serviciosOk + limpiezaOk) / totalItems.value) * 100)
})

const estadosPasos = [
  { valor: 'recibido', label: 'Recibido' },
  { valor: 'diagnostico', label: 'Diagnóstico' },
  { valor: 'en_progreso', label: 'En Progreso' },
  { valor: 'completado', label: 'Finalizar' },
]

const estadoClase: Record<string, string> = {
  recibido: 'bg-blue-100 text-blue-700',
  diagnostico: 'bg-purple-100 text-purple-700',
  en_progreso: 'bg-amber-100 text-amber-700',
  completado: 'bg-green-100 text-green-700',
}

onMounted(async () => {
  try {
    const res = await api.get<Orden>(`/ordenes/${route.params.id}`)
    orden.value = res
  } catch (e) {
    console.error('Error:', e)
  } finally {
    loading.value = false
  }
})

function fmtMonto(v: number) {
  return (v ?? 0).toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function fmtFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

async function toggleServicio(lineaId: number) {
  if (!orden.value) return
  
  const nuevosIds = [...serviciosCompletados.value]
  if (nuevosIds.includes(lineaId)) {
    const idx = nuevosIds.indexOf(lineaId)
    nuevosIds.splice(idx, 1)
  } else {
    nuevosIds.push(lineaId)
  }
  
  const nuevoProgreso = Math.round(((nuevosIds.length + (orden.value.checklistLimpieza ? 1 : 0)) / totalItems.value) * 100)
  
  try {
    await api.put(`/ordenes/${orden.value.id}/progreso`, {
      progreso: nuevoProgreso,
      notasProgreso: orden.value.notasProgreso || '',
      checklist: {
        diagnostico: orden.value.checklistDiagnostico,
        reparacion: orden.value.checklistReparacion,
        pruebas: orden.value.checklistPruebas,
        limpieza: orden.value.checklistLimpieza,
      },
      serviciosCompletados: nuevosIds,
    })
    // Recargar
    const res = await api.get<Orden>(`/ordenes/${route.params.id}`)
    orden.value = res
  } catch (e) {
    Swal.fire('Error', (e as Error).message, 'error')
  }
}

async function toggleCheck(item: 'diagnostico' | 'reparacion' | 'pruebas' | 'limpieza') {
  if (!orden.value) return
  
  const fieldMap: Record<string, string> = {
    'diagnostico': 'checklistDiagnostico',
    'reparacion': 'checklistReparacion',
    'pruebas': 'checklistPruebas',
    'limpieza': 'checklistLimpieza',
  }
  
  const field = fieldMap[item]
  const nuevoChecklist = { ...orden.value, [field]: !orden.value[field as keyof Orden] }
  
  const nuevoProgreso = Math.round(
    ((serviciosCompletados.value.length + (nuevoChecklist.checklistLimpieza ? 1 : 0)) / totalItems.value) * 100
  )
  
  try {
    await api.put(`/ordenes/${orden.value.id}/progreso`, {
      progreso: nuevoProgreso,
      notasProgreso: orden.value.notasProgreso || '',
      checklist: {
        diagnostico: nuevoChecklist.checklistDiagnostico,
        reparacion: nuevoChecklist.checklistReparacion,
        pruebas: nuevoChecklist.checklistPruebas,
        limpieza: nuevoChecklist.checklistLimpieza,
      },
      serviciosCompletados: serviciosCompletados.value,
    })
    // Recargar
    const res = await api.get<Orden>(`/ordenes/${route.params.id}`)
    orden.value = res
  } catch (e) {
    Swal.fire('Error', (e as Error).message, 'error')
  }
}

async function cambiarEstado(estado: string) {
  if (!orden.value) return
  saving.value = true
  try {
    await api.put(`/ordenes/${orden.value.id}/estado`, { estado })
    orden.value = { ...orden.value, estado }
    Swal.fire('Estado actualizado', '', 'success')
  } catch (e) {
    Swal.fire('Error', (e as Error).message, 'error')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950">
    <AppSidebar />
    <div
      class="transition-all duration-300 ease-out"
      :class="collapsed ? 'ml-[6.4rem]' : 'ml-[22rem]'"
    >
      <AppTopbar :dark-mode="darkMode" @toggle-dark="darkMode = !darkMode" />

      <main class="p-6 max-w-4xl mx-auto">
        <button
          @click="router.push({ name: 'mecanico-trabajos' })"
          class="mb-4 flex items-center gap-2 text-slate-500 hover:text-orange-500"
        >
          ← Volver a Mis Trabajos
        </button>

        <div v-if="loading" class="text-center py-20 text-slate-400">
          Cargando...
        </div>

        <div v-else-if="!orden" class="text-center py-20 text-red-500">
          Orden no encontrada
        </div>

        <div v-else class="space-y-6">
          <!-- Header -->
          <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
            <div class="flex justify-between items-start mb-4">
              <div>
                <h1 class="text-2xl font-bold text-slate-800 dark:text-white">
                  Orden #{{ String(orden.id).padStart(4, '0') }}
                </h1>
                <span
                  class="inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium"
                  :class="estadoClase[orden.estado]"
                >
                  {{ orden.estado }}
                </span>
              </div>
              <div class="text-right">
                <p class="text-sm text-slate-400">Total</p>
                <p class="text-2xl font-bold text-orange-500">${{ fmtMonto(orden.total) }}</p>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <div>
                <p class="text-xs text-slate-400 uppercase">Vehículo</p>
                <p class="font-medium">{{ orden.vehiculo?.marca }} {{ orden.vehiculo?.modelo }}</p>
                <p class="text-sm text-slate-500">{{ orden.vehiculo?.placa }} - {{ orden.vehiculo?.anio }}</p>
              </div>
              <div>
                <p class="text-xs text-slate-400 uppercase">Cliente</p>
                <p class="font-medium">{{ orden.cliente?.nombre }}</p>
                <p class="text-sm text-slate-500">{{ orden.cliente?.telefono }}</p>
              </div>
            </div>
          </div>

          <!-- Checklist -->
          <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
            <h2 class="text-lg font-bold text-slate-800 dark:text-white mb-4">
              Checklist de Avance
            </h2>

            <!-- Progress Bar -->
            <div class="mb-6">
              <div class="flex justify-between text-sm mb-1">
                <span class="text-slate-500">Progreso total</span>
                <span class="font-bold text-orange-500">{{ progresoCalculado }}%</span>
              </div>
              <div class="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  class="h-full bg-orange-500 transition-all duration-300"
                  :style="{ width: `${progresoCalculado}%` }"
                />
              </div>
            </div>

            <!-- Servicios -->
            <div class="space-y-3 mb-4">
              <h3 class="font-semibold text-slate-700 dark:text-slate-300 mb-2">Servicios</h3>
              <div
                v-for="linea in servicios"
                :key="linea.id"
                class="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
                @click="toggleServicio(linea.id)"
              >
                <input
                  type="checkbox"
                  :checked="isServicioCompletado(linea.id)"
                  class="w-5 h-5 text-orange-500 rounded"
                  @click.stop
                />
                <div class="flex-1">
                  <p class="font-medium text-slate-700 dark:text-slate-200">
                    {{ linea.descripcion }}
                  </p>
                  <p class="text-sm text-slate-500">
                    Cant: {{ linea.cantidad }} - ${{ fmtMonto(linea.precioUnitario) }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Limpieza -->
            <div class="space-y-3">
              <h3 class="font-semibold text-slate-700 dark:text-slate-300 mb-2">Finalización</h3>
              <label class="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700">
                <input
                  type="checkbox"
                  :checked="orden.checklistLimpieza"
                  @change="toggleCheck('limpieza')"
                  class="w-5 h-5 text-orange-500 rounded"
                />
                <div class="flex-1">
                  <p class="font-medium text-slate-700 dark:text-slate-200">✨ Limpieza</p>
                  <p class="text-sm text-slate-500">Limpieza interior y exterior</p>
                </div>
              </label>
            </div>
          </div>

          <!-- Estado -->
          <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
            <h2 class="text-lg font-bold text-slate-800 dark:text-white mb-4">
              Cambiar Estado
            </h2>

            <div class="flex flex-wrap gap-2">
              <button
                v-for="e in estadosPasos"
                :key="e.valor"
                @click="cambiarEstado(e.valor)"
                :disabled="saving || orden.estado === e.valor"
                class="px-4 py-2 rounded-lg font-medium transition-colors"
                :class="
                  orden.estado === e.valor
                    ? 'bg-orange-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-orange-100 dark:hover:bg-orange-900'
                "
              >
                {{ e.label }}
              </button>
            </div>
          </div>

          <!-- Servicios Asignados -->
          <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
            <h2 class="text-lg font-bold text-slate-800 dark:text-white mb-4">
              Servicios Asignados
            </h2>

            <div class="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
              <table class="w-full text-left">
                <thead class="bg-slate-50 dark:bg-slate-800 text-slate-500 text-sm">
                  <tr>
                    <th class="px-4 py-3">Concepto</th>
                    <th class="px-4 py-3 text-center">Cant.</th>
                    <th class="px-4 py-3 text-right">Precio</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr v-for="linea in orden.lineas" :key="linea.id">
                    <td class="px-4 py-3">
                      <span
                        class="text-xs px-2 py-0.5 rounded uppercase"
                        :class="linea.tipo === 'servicio' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'"
                      >
                        {{ linea.tipo }}
                      </span>
                      <span class="ml-2">{{ linea.descripcion }}</span>
                    </td>
                    <td class="px-4 py-3 text-center">{{ linea.cantidad }}</td>
                    <td class="px-4 py-3 text-right">${{ fmtMonto(linea.precioUnitario) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Diagnóstico -->
          <div v-if="orden.diagnostico" class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
            <h2 class="text-lg font-bold text-slate-800 dark:text-white mb-4">
              Diagnóstico
            </h2>
            <p class="text-slate-600 dark:text-slate-300">{{ orden.diagnostico }}</p>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

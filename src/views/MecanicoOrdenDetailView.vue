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
  imagenUrl?: string
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

const modalImagenVisible = ref(false)
const imagenUrlPendiente = ref('')
const estadoPendiente = ref('')
const estadosFinales = ['completado', 'entregado', 'finalizado']

async function handleImagenEstadoChange(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onloadend = async () => {
    const base64 = reader.result as string
    try {
      const { url } = await api.post<{ url: string }>('/ordenes/upload', { imagen: base64 })
      imagenUrlPendiente.value = url
    } catch (err: any) {
      const msg = err?.message || 'No se pudo subir la imagen'
      Swal.fire({ title: 'Error', text: msg, icon: 'error' })
    }
  }
  reader.readAsDataURL(file)
}

function quitarImagenEstado() {
  imagenUrlPendiente.value = ''
}

async function confirmarEstadoConImagen() {
  if (!orden.value || !estadoPendiente.value) return
  if (!imagenUrlPendiente.value) {
    Swal.fire({ title: 'Imagen requerida', text: 'Sube una imagen para finalizar la orden.', icon: 'warning' })
    return
  }
  modalImagenVisible.value = false
  saving.value = true
  try {
    await api.put(`/ordenes/${orden.value.id}/estado`, { estado: estadoPendiente.value, imagenUrl: imagenUrlPendiente.value })
    orden.value = { ...orden.value, estado: estadoPendiente.value }
    Swal.fire('Estado actualizado', '', 'success')
  } catch (e) {
    Swal.fire('Error', (e as Error).message, 'error')
  } finally {
    saving.value = false
  }
  estadoPendiente.value = ''
  imagenUrlPendiente.value = ''
}

async function cambiarEstado(estado: string) {
  if (!orden.value) return

  if (estadosFinales.includes(estado) && !orden.value.imagenUrl) {
    estadoPendiente.value = estado
    imagenUrlPendiente.value = ''
    modalImagenVisible.value = true
    return
  }

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

      <!-- Modal de imagen requerida al finalizar -->
      <Teleport to="body">
        <Transition name="imagen-modal">
          <div
            v-if="modalImagenVisible"
            class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            @click.self="modalImagenVisible = false"
          >
            <article class="w-full max-w-[40rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-8 rounded-2xl">
              <header class="flex items-center justify-between mb-6">
                <div>
                  <h2 class="text-2xl font-bold text-slate-800 dark:text-white">Imagen requerida</h2>
                  <p class="text-sm text-slate-500 mt-0.5">Sube una imagen para finalizar la orden</p>
                </div>
                <button class="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-transparent border-none cursor-pointer" @click="modalImagenVisible = false">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </header>

              <div class="mb-6">
                <div v-if="imagenUrlPendiente" class="flex flex-col gap-3">
                  <img :src="imagenUrlPendiente" alt="Preview" class="w-full h-48 object-contain rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950" />
                  <button type="button" class="text-sm font-medium text-red-500 bg-transparent border-none cursor-pointer hover:opacity-70 text-left" @click="quitarImagenEstado">Quitar imagen</button>
                </div>
                <label v-else class="flex flex-col items-center justify-center gap-2 w-full h-32 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg cursor-pointer hover:border-orange-500 transition-colors">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-slate-400">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span class="text-sm text-slate-500">Haz clic para subir imagen</span>
                  <input type="file" accept="image/*" class="hidden" @change="handleImagenEstadoChange" />
                </label>
              </div>

              <button
                class="w-full py-3 text-lg font-semibold text-white bg-orange-500 border-none cursor-pointer hover:bg-orange-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed rounded-lg"
                :disabled="!imagenUrlPendiente"
                @click="confirmarEstadoConImagen"
              >
                Confirmar y finalizar
              </button>
            </article>
          </div>
        </Transition>
      </Teleport>
    </div>
  </div>
</template>

<style scoped>
.imagen-modal-enter-active,
.imagen-modal-leave-active {
  transition: opacity 0.2s ease;
}
.imagen-modal-enter-active article,
.imagen-modal-leave-active article {
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.imagen-modal-enter-from,
.imagen-modal-leave-to {
  opacity: 0;
}
.imagen-modal-enter-from article,
.imagen-modal-leave-to article {
  transform: scale(0.97) translateY(10px);
  opacity: 0;
}
</style>

<script setup lang="ts">
import { ref, computed, onMounted, inject, type Ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { api } from '@/services/api'
import { usePagosStore } from '@/stores/pagos'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppTopbar from '@/components/layout/AppTopbar.vue'
import Swal from 'sweetalert2'

interface Linea {
  descripcion: string
  cantidad: number
  precioUnitario: number
  total: number
  tipo: string
}

interface OrdenCliente {
  id: number
  estado: string
  total: string | number
  subtotal: string | number
  iva: string | number
  createdAt: string
  fechaOperativo?: string
  diagnostico?: string
  notas?: string
  vehiculo?: { nombre: string; placa: string; marca: string; modelo: string; anio: string }
  lineas: Linea[]
}

const router = useRouter()
const route = useRoute()
const collapsed = inject<Ref<boolean>>('sidebarCollapsed')!
const darkMode = inject<Ref<boolean>>('darkMode')!

const orden = ref<OrdenCliente | null>(null)
const loading = ref(true)
const pagosStore = usePagosStore()

const puedePagar = computed(() => {
  if (!orden.value) return false
  const estadosNoPagados = ['recibido', 'diagnostico', 'en_progreso', 'esperando_piezas', 'completado', 'entregado']
  return estadosNoPagados.includes(orden.value.estado)
})

const puedeMarcarOperativo = computed(() => {
  if (!orden.value) return false
  return (orden.value.estado === 'entregado' || orden.value.estado === 'pagado') && !orden.value.fechaOperativo
})

const marcarLoading = ref(false)

async function marcarVehiculoOperativo() {
  if (!puedeMarcarOperativo.value) return
  marcarLoading.value = true
  try {
    await api.put(`/ordenes/${orden.value.id}/marcar-operativo`)
    const res = await api.get(`/ordenes/${route.params.id}`)
    orden.value = res
  } catch (e) {
    Swal.fire('Error', (e as Error).message, 'error')
  } finally {
    marcarLoading.value = false
  }
}

onMounted(async () => {
  try {
    const res = await api.get<OrdenCliente>(`/ordenes/${route.params.id}`)
    orden.value = res
  } catch (error) {
    console.error('Error al cargar la orden', error)
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
    operativo: 'Operativo',
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
    operativo:
      'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
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

function formatMonto(v: string | number) {
  return (Number(v) ?? 0).toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

async function pagarConTarjeta() {
  if (!orden.value || !puedePagar.value) return

  const { isConfirmed } = await Swal.fire({
    title: 'Pagar con Tarjeta',
    html: `
      <div class="text-left space-y-4">
        <div>
          <label class="block text-sm text-slate-600 mb-1">Total a pagar</label>
          <p class="text-2xl font-bold text-orange-500">$${formatMonto(orden.value.total)}</p>
        </div>
        <p class="text-sm text-slate-500">Serásredirectdo a Stripe para completar el pago</p>
      </div>
    `,
    confirmButtonText: 'Continuar al Pago',
    cancelButtonText: 'Cancelar',
    showCancelButton: true,
  })

  if (isConfirmed) {
    try {
      const lineas = orden.value.lineas.map((l) => ({
        descripcion: l.descripcion,
        cantidad: l.cantidad,
        precioUnitario: l.precioUnitario,
        tipo: l.tipo,
      }))

      pagosStore.setPendiente({
        total: Number(orden.value.total),
        clienteId: 0,
        vehiculoId: 0,
        lineas,
        ordenId: orden.value.id,
      })

      router.push({ name: 'checkout' })
    } catch (e) {
      Swal.fire('Error', (e as Error).message, 'error')
    }
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
    <AppSidebar />
    <div
      class="min-h-screen flex flex-col transition-all duration-300 ease-out max-[768px]:ml-0"
      :class="collapsed ? 'ml-[6.4rem]' : 'ml-[22rem]'"
    >
      <AppTopbar :dark-mode="darkMode" @toggle-dark="darkMode = !darkMode" />

      <main class="flex-1 p-6 md:p-10 max-w-4xl mx-auto w-full">
        <!-- Back and Header -->
        <button
          @click="router.push({ name: 'cliente-ordenes' })"
          class="mb-6 flex items-center gap-2 text-slate-500 hover:text-orange-500 transition-colors font-medium"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z"
              clip-rule="evenodd"
            />
          </svg>
          Volver a Mis Órdenes
        </button>

        <div v-if="loading" class="py-20 text-center text-slate-400">
          Cargando detalles de orden...
        </div>

        <div v-else-if="!orden" class="py-20 text-center text-red-500">
          Orden no encontrada o sin permisos.
        </div>

        <div v-else class="space-y-8">
          <!-- Summary Card -->
          <div
            class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm"
          >
            <div
              class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800"
            >
              <div>
                <h1
                  class="text-3xl font-black text-slate-800 dark:text-white flex items-center gap-3"
                >
                  Orden #{{ String(orden.id).padStart(4, '0') }}
                  <span
                    class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border"
                    :class="badgeClass(orden.estado)"
                  >
                    {{ labelEstado(orden.estado) }}
                  </span>
                  <button
                    v-if="puedeMarcarOperativo"
                    @click="marcarVehiculoOperativo"
                    :disabled="marcarLoading"
                    class="ml-2 px-4 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-full transition-colors"
                  >
                    {{ marcarLoading ? '...' : 'Confirmar Entrega' }}
                  </button>
                </h1>
                <p class="text-slate-500 mt-2 font-medium">
                  Ingresado el {{ formatFecha(orden.createdAt) }}
                </p>
              </div>
              <div class="text-left md:text-right flex flex-col items-end gap-3">
                <div>
                  <p class="text-sm text-slate-400 font-semibold uppercase tracking-wider mb-1">
                    Total del Servicio
                  </p>
                  <p class="text-4xl font-black text-orange-500">${{ formatMonto(orden.total) }}</p>
                </div>
                <button
                  v-if="puedePagar"
                  @click="pagarConTarjeta"
                  class="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold rounded-2xl shadow-lg shadow-orange-500/30 transition-all duration-300 flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                    <path d="M12 2.252A8.014 8.014 0 0120 10a8.014 8.014 0 01-8 8 8.014 8.014 0 01-8-8 8.014 8.014 0 018-8z" />
                  </svg>
                  Pagar con Tarjeta
                </button>
                <span
                  v-else-if="orden.estado === 'pagado' && !orden.fechaOperativo"
                  class="px-4 py-2 bg-sky-100 text-sky-700 font-bold rounded-full text-sm"
                >
                  ✓ Pagado
                </span>
                <span
                  v-else-if="orden.fechaOperativo"
                  class="px-4 py-2 bg-green-100 text-green-700 font-bold rounded-full text-sm"
                >
                  ✓ Operativo
                </span>
              </div>
            </div>

            <!-- Vehicle Info -->
            <div
              class="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-800/40 p-6 rounded-2xl border border-slate-100 dark:border-slate-800"
            >
              <div>
                <p class="text-xs text-slate-400 font-bold uppercase mb-1 tracking-wider">
                  Vehículo
                </p>
                <p class="text-lg font-bold text-slate-800 dark:text-slate-200">
                  {{
                    orden.vehiculo?.nombre ||
                    orden.vehiculo?.marca + ' ' + orden.vehiculo?.modelo ||
                    'No especificado'
                  }}
                </p>
                <p class="text-slate-500">
                  {{ orden.vehiculo?.marca }} {{ orden.vehiculo?.modelo }}
                  {{ orden.vehiculo?.anio }}
                </p>
              </div>
              <div>
                <p class="text-xs text-slate-400 font-bold uppercase mb-1 tracking-wider">Placas</p>
                <p class="font-mono text-lg font-bold text-slate-700 dark:text-slate-300 uppercase">
                  {{ orden.vehiculo?.placa || 'N/A' }}
                </p>
              </div>
            </div>
          </div>

          <!-- Diagnóstico (Solo si existe) -->
          <div
            v-if="orden.diagnostico"
            class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm"
          >
            <h2
              class="text-lg font-extrabold text-slate-800 dark:text-white mb-4 flex items-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6 text-orange-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              Reporte / Diagnóstico
            </h2>
            <div
              class="bg-amber-50 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-800/50 p-6 rounded-2xl"
            >
              <p class="text-slate-700 dark:text-slate-300 leading-relaxed">
                {{ orden.diagnostico }}
              </p>
              <p
                v-if="orden.notas"
                class="text-slate-500 dark:text-slate-400 mt-4 text-sm mt-3 pt-3 border-t border-amber-200/50 dark:border-amber-800/50"
              >
                <span class="font-bold">Notas:</span> {{ orden.notas }}
              </p>
            </div>
          </div>

          <!-- Servicios y Piezas -->
          <div
            class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm"
          >
            <h2 class="text-lg font-extrabold text-slate-800 dark:text-white mb-6">
              Detalle de Cargos
            </h2>

            <div class="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table class="w-full text-left">
                <thead
                  class="bg-slate-50 dark:bg-slate-800 text-slate-500 text-xs uppercase font-bold tracking-wider"
                >
                  <tr>
                    <th class="px-6 py-4">Concepto</th>
                    <th class="px-6 py-4 text-center">Cant.</th>
                    <th class="px-6 py-4 text-right">Precio Un.</th>
                    <th class="px-6 py-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody
                  class="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300"
                >
                  <tr v-if="orden.lineas.length === 0">
                    <td colspan="4" class="px-6 py-8 text-center text-slate-400">
                      Sin detalles registrados en la orden aún.
                    </td>
                  </tr>
                  <tr
                    v-for="(linea, i) in orden.lineas"
                    :key="i"
                    class="hover:bg-slate-50/50 dark:hover:bg-slate-800/20"
                  >
                    <td class="px-6 py-4">
                      <div class="flex items-center gap-2">
                        <span
                          class="px-2 py-0.5 text-[0.65rem] font-bold uppercase rounded"
                          :class="
                            linea.tipo === 'servicio'
                              ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30'
                              : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30'
                          "
                        >
                          {{ linea.tipo }}
                        </span>
                        <span class="font-medium">{{ linea.descripcion }}</span>
                      </div>
                    </td>
                    <td class="px-6 py-4 text-center font-medium">{{ linea.cantidad }}</td>
                    <td class="px-6 py-4 text-right">${{ formatMonto(linea.precioUnitario) }}</td>
                    <td class="px-6 py-4 text-right font-bold text-slate-900 dark:text-white">
                      ${{ formatMonto(linea.cantidad * linea.precioUnitario) }}
                    </td>
                  </tr>
                </tbody>
                <tfoot
                  class="bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700"
                >
                  <tr>
                    <td
                      colspan="3"
                      class="px-6 py-4 text-right text-sm font-bold text-slate-500 uppercase"
                    >
                      Subtotal
                    </td>
                    <td class="px-6 py-4 text-right font-bold text-slate-900 dark:text-white">
                      ${{ formatMonto(orden.subtotal) }}
                    </td>
                  </tr>
                  <tr>
                    <td
                      colspan="3"
                      class="px-6 py-3 text-right text-sm font-bold text-slate-500 uppercase"
                    >
                      Iva
                    </td>
                    <td class="px-6 py-3 text-right font-bold text-slate-900 dark:text-white">
                      ${{ formatMonto(orden.iva) }}
                    </td>
                  </tr>
                  <tr>
                    <td
                      colspan="3"
                      class="px-6 py-5 text-right font-black text-slate-900 dark:text-white uppercase tracking-wider text-base"
                    >
                      Total Final
                    </td>
                    <td class="px-6 py-5 text-right font-black text-orange-500 text-xl">
                      ${{ formatMonto(orden.total) }}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

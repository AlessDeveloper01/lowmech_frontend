<script setup lang="ts">
import { ref, computed, inject, onMounted, type Ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useVehiculosStore, type Vehiculo, type EstadoVehiculo } from '@/stores/vehiculos'
import { useOrdenesStore, calcularTotal } from '@/stores/ordenes'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppTopbar from '@/components/layout/AppTopbar.vue'
import Swal from 'sweetalert2'

const router = useRouter()
const route = useRoute()
const vehStore = useVehiculosStore()
const ordStore = useOrdenesStore()

const routePrefix = computed(() => {
  if (String(route.name).startsWith('recepcionista')) return 'recepcionista-'
  return ''
})

const vehiculosListRoute = computed(() =>
  String(route.name).startsWith('recepcionista') ? 'recepcionista-vehiculos' : 'vehiculos-lista'
)
const ordenesCrearRoute = computed(() => `${routePrefix.value}ordenes-crear`)
const ordenesDetalleRoute = computed(() => `${routePrefix.value}ordenes-detalle`)
const vehiculosEditarRoute = computed(() => `${routePrefix.value}vehiculos-editar`)

const collapsed = inject<Ref<boolean>>('sidebarCollapsed')!
const darkMode = inject<Ref<boolean>>('darkMode')!

const vehiculo = ref<Vehiculo | null>(null)
const cargando = ref(true)

const ordenesDelVehiculo = computed(() => {
  if (!vehiculo.value) return []
  return ordStore.ordenes.filter(
    (o) =>
      o.vehiculoId === vehiculo.value!.id ||
      o.vehiculo?.placa === vehiculo.value!.placa
  )
})

const estadoConfig: Record<EstadoVehiculo, { label: string; clase: string }> = {
  en_taller: {
    label: 'En taller',
    clase: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
  },
  disponible: {
    label: 'Disponible',
    clase: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  },
  en_espera: {
    label: 'En espera',
    clase: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  },
}

async function confirmarEliminar() {
  if (!vehiculo.value) return
  const result = await Swal.fire({
    title: '¿Eliminar vehículo?',
    text: `"${vehiculo.value.nombre}" será eliminado permanentemente.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
  })
  if (!result.isConfirmed) return
  try {
    await vehStore.eliminar(vehiculo.value.id)
    await Swal.fire({
      title: 'Eliminado',
      text: 'El vehículo fue eliminado.',
      icon: 'success',
      timer: 1500,
      showConfirmButton: false,
    })
    router.push({ name: vehiculosListRoute })
  } catch (e) {
    Swal.fire({ title: 'Error', text: (e as Error).message, icon: 'error' })
  }
}

function fmt(n: number): string {
  return n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function obtenerLineasDeOrden(orden: any): any[] {
  if (Array.isArray(orden.lineas) && orden.lineas.length > 0) return orden.lineas
  if (Array.isArray(orden.servicios) && orden.servicios.length > 0) return orden.servicios
  return orden.lineas || []
}

function totalOrden(orden: any): number {
  const lineas = obtenerLineasDeOrden(orden)
  return lineas.reduce((sum: number, l: any) => sum + (l.cantidad || 0) * (l.precioUnitario || 0), 0)
}

// Configuración de estados de orden para el historial
const ordenEstadoConfig: Record<string, { label: string; clase: string }> = {
  recibido: { label: 'Recibido', clase: 'bg-slate-50 text-slate-700 dark:bg-slate-950/40 dark:text-slate-400' },
  diagnostico: { label: 'Diagnóstico', clase: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400' },
  en_proceso: { label: 'En proceso', clase: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400' },
  completado: { label: 'Completado', clase: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' },
  entregado: { label: 'Entregado', clase: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' },
  cancelado: { label: 'Cancelado', clase: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400' },
  pendiente: { label: 'Pago pendiente', clase: 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400' },
  pagado: { label: 'Pagado', clase: 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400' },
}

function getOrdenEstado(estado: string) {
  return ordenEstadoConfig[estado] || { label: estado, clase: 'bg-gray-100 text-gray-600' }
}

onMounted(async () => {
  cargando.value = true
  try {
    const [v] = await Promise.all([
      vehStore.fetchVehiculo(Number(route.params.id)),
      ordStore.fetchOrdenes(),
    ])
    vehiculo.value = v
  } catch (e) {
    console.error('Error cargando detalle de vehículo:', e)
  } finally {
    cargando.value = false
  }
})
</script>

<template>
  <div class="min-h-screen bg-bg dark:bg-dk-bg transition-colors duration-300">
    <AppSidebar />
    <div
      class="min-h-screen flex flex-col transition-all duration-300 ease-out max-[768px]:ml-0"
      :class="collapsed ? 'ml-[6.4rem]' : 'ml-[22rem]'"
    >
      <AppTopbar :dark-mode="darkMode" @toggle-dark="darkMode = !darkMode" />

      <!-- Loading -->
      <div v-if="cargando" class="flex-1 flex items-center justify-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>

      <main v-else-if="vehiculo" class="flex-1 px-12 py-10 max-[768px]:px-5 max-[768px]:py-6">
        <!-- Header -->
        <header
          class="flex items-center justify-between mb-10 max-[768px]:flex-col max-[768px]:items-start max-[768px]:gap-4"
        >
          <section class="flex items-center gap-4">
            <button
              class="w-9 h-9 flex items-center justify-center text-muted dark:text-dk-muted hover:text-body dark:hover:text-dk-body cursor-pointer border-none bg-transparent transition-colors"
              @click="router.push({ name: vehiculosListRoute })"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
              >
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1
              class="text-[2.4rem] font-light text-body dark:text-dk-body tracking-[-0.02em] leading-none"
            >
              {{ vehiculo.nombre }}
            </h1>
            <span
              class="text-[1.1rem] font-medium px-3 py-1 rounded-full"
              :class="estadoConfig[vehiculo.estado].clase"
              >{{ estadoConfig[vehiculo.estado].label }}</span
            >
          </section>
          <nav class="flex items-center gap-3">
            <button
              class="px-5 py-2.5 text-[1.2rem] font-medium text-primary border border-primary/30 bg-transparent cursor-pointer hover:bg-primary hover:text-white transition-colors"
                  @click="router.push({ name: vehiculosEditarRoute, params: { id: vehiculo.id } })"
            >
              Editar
            </button>
            <button
              class="px-5 py-2.5 text-[1.2rem] font-medium text-red-500 border border-red-200 dark:border-red-900/40 bg-transparent cursor-pointer hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              @click="confirmarEliminar"
            >
              Eliminar
            </button>
            <button
              class="px-5 py-2.5 text-[1.2rem] font-semibold text-white bg-primary border-none cursor-pointer hover:bg-primary-dark transition-colors"
                  @click="router.push({ name: ordenesCrearRoute })"
            >
              + Nueva Orden
            </button>
          </nav>
        </header>

        <!-- 2 columns -->
        <section class="grid grid-cols-2 gap-10 max-[1200px]:grid-cols-1">
          <!-- Left -->
          <section class="flex flex-col gap-10">
            <!-- Info vehiculo -->
            <section
              class="bg-surface dark:bg-dk-surface border border-border dark:border-dk-border"
            >
              <header class="px-8 py-6 border-b border-border dark:border-dk-border">
                <h2 class="text-[1.5rem] font-bold text-body dark:text-dk-body">
                  Informacion del Vehiculo
                </h2>
              </header>
              <dl class="p-8 grid grid-cols-2 gap-6">
                <p>
                  <dt
                    class="text-[1.1rem] text-muted dark:text-dk-muted uppercase tracking-wider mb-1"
                  >
                    Marca
                  </dt>
                  <dd class="text-[1.4rem] font-medium text-body dark:text-dk-body">
                    {{ vehiculo.marca }}
                  </dd>
                </p>
                <p>
                  <dt
                    class="text-[1.1rem] text-muted dark:text-dk-muted uppercase tracking-wider mb-1"
                  >
                    Modelo
                  </dt>
                  <dd class="text-[1.4rem] font-medium text-body dark:text-dk-body">
                    {{ vehiculo.modelo }}
                  </dd>
                </p>
                <p>
                  <dt
                    class="text-[1.1rem] text-muted dark:text-dk-muted uppercase tracking-wider mb-1"
                  >
                    Anio
                  </dt>
                  <dd class="text-[1.4rem] font-medium text-body dark:text-dk-body">
                    {{ vehiculo.anio }}
                  </dd>
                </p>
                <p>
                  <dt
                    class="text-[1.1rem] text-muted dark:text-dk-muted uppercase tracking-wider mb-1"
                  >
                    Placas
                  </dt>
                  <dd class="text-[1.4rem] font-medium text-body dark:text-dk-body">
                    {{ vehiculo.placa }}
                  </dd>
                </p>
                <p>
                  <dt
                    class="text-[1.1rem] text-muted dark:text-dk-muted uppercase tracking-wider mb-1"
                  >
                    Color
                  </dt>
                  <dd class="text-[1.4rem] font-medium text-body dark:text-dk-body">
                    {{ vehiculo.color || '—' }}
                  </dd>
                </p>
                <p>
                  <dt
                    class="text-[1.1rem] text-muted dark:text-dk-muted uppercase tracking-wider mb-1"
                  >
                    VIN
                  </dt>
                  <dd class="text-[1.4rem] font-medium text-body dark:text-dk-body">
                    {{ vehiculo.vin || '—' }}
                  </dd>
                </p>
                <p>
                  <dt
                    class="text-[1.1rem] text-muted dark:text-dk-muted uppercase tracking-wider mb-1"
                  >
                    Kilometraje
                  </dt>
                  <dd class="text-[1.4rem] font-medium text-body dark:text-dk-body">
                    {{ vehiculo.kilometraje.toLocaleString() }} km
                  </dd>
                </p>
                <p>
                  <dt
                    class="text-[1.1rem] text-muted dark:text-dk-muted uppercase tracking-wider mb-1"
                  >
                    Combustible
                  </dt>
                  <dd class="text-[1.4rem] font-medium text-body dark:text-dk-body">
                    {{ vehiculo.combustible }}
                  </dd>
                </p>
              </dl>
            </section>

            <!-- Cliente -->
            <section
              class="bg-surface dark:bg-dk-surface border border-border dark:border-dk-border"
            >
              <header class="px-8 py-6 border-b border-border dark:border-dk-border">
                <h2 class="text-[1.5rem] font-bold text-body dark:text-dk-body">
                  Cliente Propietario
                </h2>
              </header>
              <article class="p-8">
                <figure
                  class="flex items-center gap-5 mb-6 pb-6 border-b border-border dark:border-dk-border"
                >
                  <span
                    class="w-14 h-14 rounded-full bg-primary text-white flex items-center justify-center text-[1.4rem] font-semibold shrink-0"
                  >
                    {{
                      vehiculo.clienteNombre
                        .split(' ')
                        .map((w) => w.charAt(0))
                        .slice(0, 2)
                        .join('')
                    }}
                  </span>
                  <figcaption>
                    <p class="text-[1.6rem] font-semibold text-body dark:text-dk-body">
                      {{ vehiculo.clienteNombre }}
                    </p>
                  </figcaption>
                </figure>
                <dl class="grid grid-cols-2 gap-6">
                  <p>
                    <dt
                      class="text-[1.1rem] text-muted dark:text-dk-muted uppercase tracking-wider mb-1"
                    >
                      Telefono
                    </dt>
                    <dd class="text-[1.4rem] font-medium text-body dark:text-dk-body">
                      {{ vehiculo.clienteTelefono }}
                    </dd>
                  </p>
                  <p>
                    <dt
                      class="text-[1.1rem] text-muted dark:text-dk-muted uppercase tracking-wider mb-1"
                    >
                      Email
                    </dt>
                    <dd class="text-[1.4rem] font-medium text-body dark:text-dk-body">
                      {{ vehiculo.clienteEmail }}
                    </dd>
                  </p>
                </dl>
              </article>
            </section>

            <!-- Notas -->
            <aside
              v-if="vehiculo.notas"
              class="bg-surface dark:bg-dk-surface border border-border dark:border-dk-border"
            >
              <header class="px-8 py-6 border-b border-border dark:border-dk-border">
                <h2 class="text-[1.5rem] font-bold text-body dark:text-dk-body">Notas</h2>
              </header>
              <p class="p-8 text-[1.4rem] text-body dark:text-dk-body leading-relaxed">
                {{ vehiculo.notas }}
              </p>
            </aside>

            <!-- Historial de ordenes -->
            <section
              class="bg-surface dark:bg-dk-surface border border-border dark:border-dk-border"
            >
              <header class="px-8 py-6 border-b border-border dark:border-dk-border">
                <h2 class="text-[1.5rem] font-bold text-body dark:text-dk-body">
                  Historial de Servicios
                </h2>
              </header>
              <article v-if="ordenesDelVehiculo.length === 0" class="p-8 py-8 text-center">
                <p class="text-[1.3rem] text-muted dark:text-dk-muted">Sin servicios registrados</p>
              </article>
              <section v-else class="p-8 flex flex-col gap-4">
                <article
                  v-for="orden in ordenesDelVehiculo"
                  :key="orden.id"
                  class="flex gap-6 p-6 bg-surface dark:bg-dk-surface border border-border/60 dark:border-dk-border/60 rounded-xl hover:shadow-md transition-all cursor-pointer"
                  @click="router.push({ name: ordenesDetalleRoute, params: { id: orden.id } })"
                >
                  <time class="flex flex-col items-center justify-center w-[5.5rem] h-[5.5rem] bg-bg dark:bg-dk-bg border border-border dark:border-dk-border shrink-0">
                    <span class="text-[1.8rem] font-bold text-body dark:text-dk-body leading-none">{{ orden.fechaIngreso.split('-')[2] }}</span>
                    <span class="text-[1rem] font-semibold text-muted dark:text-dk-muted uppercase">{{ new Date(orden.fechaIngreso).toLocaleDateString('es-MX', { month: 'short' }) }}</span>
                  </time>
                  <section class="flex-1">
                    <p class="text-[1.4rem] font-semibold text-body dark:text-dk-body mb-1">{{ orden.diagnostico || 'Servicio' }}</p>
                    <p class="text-[1.2rem] text-muted dark:text-dk-muted mb-3">Orden #{{ orden.id }} — {{ orden.mecanico?.nombre || 'Sin asignar' }}</p>
                    <footer class="flex items-center justify-between">
                      <span class="text-[1.2rem] font-medium px-3 py-1 rounded-full" :class="getOrdenEstado(orden.estado).clase">{{ getOrdenEstado(orden.estado).label }}</span>
                      <span class="text-[1.4rem] font-bold text-primary">${{ fmt(totalOrden(orden)) }}</span>
                    </footer>
                  </section>
                </article>
              </section>
             </section>
           </section>
          
          <!-- Right -->
          <aside class="flex flex-col gap-10">
            <!-- Quick stats -->
            <section
              class="bg-surface dark:bg-dk-surface border border-border dark:border-dk-border"
            >
              <header class="px-8 py-6 border-b border-border dark:border-dk-border">
                <h2 class="text-[1.5rem] font-bold text-body dark:text-dk-body">Resumen</h2>
              </header>
               <dl class="p-8 grid grid-cols-2 gap-4">
                 <p class="py-4 px-4 bg-bg dark:bg-dk-bg rounded-xl border border-border/60 dark:border-dk-border/60">
                   <dt
                     class="text-[1.1rem] text-muted dark:text-dk-muted uppercase tracking-wider mb-1"
                   >
                     Total servicios
                   </dt>
                   <dd class="text-[2.4rem] font-light text-body dark:text-dk-body">
                     {{ ordenesDelVehiculo.length }}
                   </dd>
                 </p>
                 <p class="py-4 px-4 bg-bg dark:bg-dk-bg rounded-xl border border-border/60 dark:border-dk-border/60">
                   <dt
                     class="text-[1.1rem] text-muted dark:text-dk-muted uppercase tracking-wider mb-1"
                   >
                     Completados
                   </dt>
                   <dd class="text-[2.4rem] font-light text-emerald-500">
                     {{ ordenesDelVehiculo.filter((o) => o.estado === 'completado').length }}
                   </dd>
                 </p>
                 <p class="py-4 px-4 bg-bg dark:bg-dk-bg rounded-xl border border-border/60 dark:border-dk-border/60">
                   <dt
                     class="text-[1.1rem] text-muted dark:text-dk-muted uppercase tracking-wider mb-1"
                   >
                     Total gastado
                   </dt>
                   <dd class="text-[2.4rem] font-light text-primary">
                     ${{
                       fmt(
                         ordenesDelVehiculo
                           .filter((o) => o.estado === 'completado')
                           .reduce((s, o) => s + totalOrden(o), 0),
                       )
                     }}
                   </dd>
                 </p>
                 <p class="py-4 px-4 bg-bg dark:bg-dk-bg rounded-xl border border-border/60 dark:border-dk-border/60">
                   <dt
                     class="text-[1.1rem] text-muted dark:text-dk-muted uppercase tracking-wider mb-1"
                   >
                     Kilometraje
                   </dt>
                   <dd class="text-[2.4rem] font-light text-body dark:text-dk-body">
                     {{ vehiculo.kilometraje.toLocaleString() }}
                     <span class="text-[1.2rem]">km</span>
                   </dd>
                 </p>
               </dl>
            </section>

            <!-- Próximos mantenimientos -->
            <section
              class="bg-surface dark:bg-dk-surface border border-border dark:border-dk-border"
            >
              <header class="px-8 py-6 border-b border-border dark:border-dk-border">
                <h2 class="text-[1.5rem] font-bold text-body dark:text-dk-body">
                  Proximos Mantenimientos
                </h2>
              </header>
              <dl class="p-8 flex flex-col gap-3">
                <p
                  class="flex justify-between items-center py-4 border-b border-border/60 dark:border-dk-border/60"
                >
                  <dt class="text-[1.3rem] font-medium text-body dark:text-dk-body">
                    Cambio de aceite
                  </dt>
                  <dd class="text-[1.2rem] font-semibold text-primary">
                    {{ (vehiculo.kilometraje + 5000).toLocaleString() }} km
                  </dd>
                </p>
                <p
                  class="flex justify-between items-center py-4 border-b border-border/60 dark:border-dk-border/60"
                >
                  <dt class="text-[1.3rem] font-medium text-body dark:text-dk-body">Afinacion</dt>
                  <dd class="text-[1.2rem] font-semibold text-muted dark:text-dk-muted">
                    {{ (vehiculo.kilometraje + 10000).toLocaleString() }} km
                  </dd>
                </p>
                <p class="flex justify-between items-center py-4">
                  <dt class="text-[1.3rem] font-medium text-body dark:text-dk-body">
                    Revision de frenos
                  </dt>
                  <dd class="text-[1.2rem] font-semibold text-muted dark:text-dk-muted">
                    {{ (vehiculo.kilometraje + 15000).toLocaleString() }} km
                  </dd>
                </p>
              </dl>
            </section>

            <!-- Acciones -->
            <section
              class="bg-surface dark:bg-dk-surface border border-border dark:border-dk-border"
            >
              <header class="px-8 py-6 border-b border-border dark:border-dk-border">
                <h2 class="text-[1.5rem] font-bold text-body dark:text-dk-body">
                  Acciones Rapidas
                </h2>
              </header>
              <nav class="p-8 flex flex-col gap-3">
                <button
                  class="flex items-center gap-3 w-full px-5 py-4 text-left bg-bg dark:bg-dk-bg border border-border dark:border-dk-border cursor-pointer hover:border-primary transition-colors"
                  @click="router.push({ name: ordenesCrearRoute })"
                >
                  <span
                    class="w-7 h-7 bg-primary/10 text-primary flex items-center justify-center text-[1.4rem] font-light leading-none"
                  >
                    +
                  </span>
                  <span class="text-[1.3rem] font-medium text-body dark:text-dk-body"
                    >Crear nueva orden</span>
                </button>
                <button
                  class="flex items-center gap-3 w-full px-5 py-4 text-left bg-bg dark:bg-dk-bg border border-border dark:border-dk-border cursor-pointer hover:border-primary transition-colors"
                  @click="router.push({ name: vehiculosEditarRoute, params: { id: vehiculo.id } })"
                >
                  <span
                    class="w-7 h-7 bg-primary/10 text-primary flex items-center justify-center text-[1.4rem] font-light leading-none"
                  >
                    ✎
                  </span>
                  <span class="text-[1.3rem] font-medium text-body dark:text-dk-body"
                    >Editar vehiculo</span>
                </button>
              </nav>
            </section>
          </aside>
        </section>
      </main>

      <main v-else class="flex-1 px-12 py-10 flex items-center justify-center">
        <article class="text-center">
          <p class="text-[1.6rem] text-muted dark:text-dk-muted mb-4">Vehiculo no encontrado</p>
          <button
            class="text-[1.3rem] font-medium text-primary cursor-pointer border-none bg-transparent"
            @click="router.push({ name: vehiculosListRoute })"
          >
            Volver a vehiculos
          </button>
        </article>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject, computed, onMounted, type Ref } from 'vue'
import { useRouter } from 'vue-router'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppTopbar from '@/components/layout/AppTopbar.vue'
import MetricCard from '@/components/dashboard/MetricCard.vue'
import SectionHeader from '@/components/dashboard/SectionHeader.vue'
import VehicleCard from '@/components/dashboard/VehicleCard.vue'
import OrderItem from '@/components/dashboard/OrderItem.vue'
import ReminderItem from '@/components/dashboard/ReminderItem.vue'
import PartItem from '@/components/dashboard/PartItem.vue'
import { useOrdenesStore, calcularTotal } from '@/stores/ordenes'
import { useVehiculosStore, type EstadoVehiculo } from '@/stores/vehiculos'
import { useClientesStore } from '@/stores/clientes'
import { useInventarioStore, getEstadoStock } from '@/stores/inventario'

const router = useRouter()
const ordStore = useOrdenesStore()
const vehStore = useVehiculosStore()
const cliStore = useClientesStore()
const invStore = useInventarioStore()

const collapsed = inject<Ref<boolean>>('sidebarCollapsed')!
const darkMode = inject<Ref<boolean>>('darkMode')!

onMounted(async () => {
  await Promise.all([
    ordStore.fetchOrdenes(),
    vehStore.fetchVehiculos(),
    cliStore.fetchClientes(),
    invStore.fetchItems(),
  ])
})

// Metrics from real data
const metrics = computed(() => [
  {
    value: String(vehStore.vehiculosEnTaller),
    label: 'Vehiculos en taller',
    delta: '',
    positive: true,
    highlight: true,
  },
  {
    value: String(
      ordStore.ordenes.filter((o) => !['completado', 'entregado', 'cancelado'].includes(o.estado))
        .length,
    ),
    label: 'Ordenes activas',
    delta: '',
    positive: true,
    highlight: false,
  },
  {
    value: String(cliStore.totalClientes),
    label: 'Clientes',
    delta: '',
    positive: true,
    highlight: false,
  },
  {
    value: `$${(ordStore.ingresosTotales / 1000).toFixed(1)}k`,
    label: 'Ingresos',
    delta: '',
    positive: true,
    highlight: true,
  },
  {
    value: String(invStore.itemsCriticos + invStore.itemsBajos),
    label: 'Refacciones bajas',
    delta: '',
    positive: false,
    highlight: false,
  },
])

// Vehiculos en taller (from store)
const vehiculosEnTaller = computed(() =>
  vehStore.vehiculos.filter((v) => v.estado === 'en_taller').slice(0, 6),
)

const mapVehEstado: Record<EstadoVehiculo, 'proceso' | 'pendiente' | 'completado'> = {
  en_taller: 'proceso',
  disponible: 'completado',
  en_espera: 'pendiente',
}

// Ultimas ordenes (from store)
const ultimasOrdenes = computed(() => ordStore.ordenes.slice(0, 4))

const mapEstado: Record<string, 'proceso' | 'pendiente' | 'completado'> = {
  recibido: 'pendiente',
  en_progreso: 'proceso',
  diagnostico: 'proceso',
  esperando_piezas: 'pendiente',
  completado: 'completado',
  entregado: 'completado',
  cancelado: 'pendiente',
  pagado: 'completado',
}

// Recordatorios: ordenes pendientes y en proceso como "proximas"
const recordatorios = computed(() =>
  ordStore.ordenes
    .filter((o) =>
      ['recibido', 'en_progreso', 'diagnostico', 'esperando_piezas'].includes(o.estado),
    )
    .slice(0, 3)
    .map((o) => ({
      title: o.vehiculo?.nombre ?? `Orden #${o.id}`,
      description: `${o.cliente?.nombre ?? 'Cliente'} — ${o.diagnostico || 'Servicio pendiente'}`,
      dueDate: o.fechaPromesa || o.fechaIngreso,
    })),
)

// Inventario critico/bajo (from store)
const itemsBajos = computed(() =>
  invStore.items
    .filter((i) => getEstadoStock(i) !== 'normal')
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 6)
    .map((i) => ({
      name: i.nombre,
      sku: i.sku,
      stock: `${i.stock} ${i.unidad}`,
      status: getEstadoStock(i) === 'critico' ? ('critico' as const) : ('bajo' as const),
    })),
)

// Quick actions with real routes
const quickActions = [
  { label: 'Nueva orden', route: 'ordenes-crear' },
  { label: 'Nuevo cliente', route: 'clientes-crear' },
  { label: 'Registrar vehiculo', route: 'vehiculos-crear' },
  { label: 'Nuevo articulo', route: 'inventario-crear' },
]
</script>

<template>
  <div class="min-h-screen bg-bg dark:bg-dk-bg transition-colors duration-300">
    <AppSidebar />
    <div
      class="min-h-screen flex flex-col transition-all duration-300 ease-out max-[768px]:ml-0"
      :class="collapsed ? 'ml-[6.4rem]' : 'ml-[22rem]'"
    >
      <AppTopbar :dark-mode="darkMode" @toggle-dark="darkMode = !darkMode" />

      <main class="flex-1 px-12 py-10 max-[768px]:px-5 max-[768px]:py-6">
        <!-- Hero -->
        <header
          class="mb-14 flex items-end justify-between max-[768px]:flex-col max-[768px]:items-start max-[768px]:gap-4"
        >
          <hgroup>
            <h1
              class="text-[4rem] font-extralight text-body dark:text-dk-body tracking-[-0.03em] leading-none mb-2 max-[768px]:text-[2.8rem]"
            >
              Dashboard
            </h1>
            <p class="text-[1.3rem] text-muted dark:text-dk-muted">Resumen general del taller</p>
          </hgroup>
          <button
            class="flex items-center gap-2 px-6 py-3 text-[1.3rem] font-semibold text-white bg-primary border-none cursor-pointer hover:bg-primary-dark transition-colors"
            @click="router.push({ name: 'ordenes-crear' })"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nueva Orden
          </button>
        </header>

        <!-- Metrics -->
        <section
          class="grid grid-cols-5 gap-0 mb-14 max-[1200px]:grid-cols-3 max-[768px]:grid-cols-2 max-[480px]:grid-cols-1"
        >
          <MetricCard
            v-for="m in metrics"
            :key="m.label"
            :value="m.value"
            :label="m.label"
            :delta="m.delta"
            :positive="m.positive"
            :highlight="m.highlight"
          />
        </section>

        <!-- Main layout -->
        <section class="grid grid-cols-[1fr_36rem] gap-14 max-[1200px]:grid-cols-1">
          <!-- Left -->
          <section>
            <!-- Vehiculos en taller -->
            <section class="mb-14">
              <SectionHeader label="Vehiculos en taller">
                <template #action>
                  <router-link
                    :to="{ name: 'vehiculos-lista' }"
                    class="text-[1.1rem] font-semibold text-primary no-underline hover:opacity-70 transition-opacity"
                    >Ver todos</router-link
                  >
                </template>
              </SectionHeader>
              <VehicleCard
                v-for="v in vehiculosEnTaller"
                :key="v.id"
                :vehicle="v.nombre"
                :client="v.clienteNombre"
                :status="mapVehEstado[v.estado]"
              />
              <p
                v-if="vehiculosEnTaller.length === 0"
                class="py-8 text-center text-[1.3rem] text-muted dark:text-dk-muted"
              >
                No hay vehiculos en taller
              </p>
            </section>

            <section class="grid grid-cols-2 gap-12 max-[768px]:grid-cols-1">
              <!-- Ordenes -->
              <section>
                <SectionHeader label="Ordenes recientes">
                  <template #action>
                    <router-link
                      :to="{ name: 'ordenes-lista' }"
                      class="text-[1.1rem] font-semibold text-primary no-underline hover:opacity-70 transition-opacity"
                      >Ver todas</router-link
                    >
                  </template>
                </SectionHeader>
                <OrderItem
                  v-for="o in ultimasOrdenes"
                  :key="o.id"
                  :id="o.id"
                  :title="o.vehiculo?.nombre ?? `Orden #${o.id}`"
                  :subtitle="o.diagnostico || o.lineas.map((l) => l.descripcion).join(', ')"
                  :mechanic="o.mecanico?.nombre ?? 'Sin asignar'"
                  :time="o.fechaIngreso"
                  :status="mapEstado[o.estado] ?? 'pendiente'"
                />
                <p v-if="ultimasOrdenes.length === 0" class="py-8 text-center">
                  <span class="text-[1.3rem] text-muted dark:text-dk-muted">
                    No hay ordenes registradas
                  </span>
                  <router-link
                    :to="{ name: 'ordenes-crear' }"
                    class="text-[1.3rem] font-medium text-primary no-underline mt-2 inline-block"
                    >Crear primera orden</router-link
                  >
                </p>
              </section>

              <!-- Recordatorios (ordenes pendientes) -->
              <section>
                <SectionHeader label="Proximos servicios">
                  <template #action>
                    <router-link
                      :to="{ name: 'ordenes-lista' }"
                      class="text-[1.1rem] font-semibold text-primary no-underline hover:opacity-70 transition-opacity"
                      >Ver todas</router-link
                    >
                  </template>
                </SectionHeader>
                <ReminderItem
                  v-for="r in recordatorios"
                  :key="r.title + r.dueDate"
                  :title="r.title"
                  :description="r.description"
                  :due-date="r.dueDate"
                />
                <p
                  v-if="recordatorios.length === 0"
                  class="py-8 text-center text-[1.3rem] text-muted dark:text-dk-muted"
                >
                  Todo al dia
                </p>
              </section>
            </section>
          </section>

          <!-- Right -->
          <aside>
            <!-- Inventario bajo -->
            <section class="mb-14">
              <SectionHeader label="Refacciones por pedir">
                <template #action>
                  <router-link
                    :to="{ name: 'inventario-lista' }"
                    class="text-[1.1rem] font-semibold text-primary no-underline hover:opacity-70 transition-opacity"
                    >Inventario</router-link
                  >
                </template>
              </SectionHeader>
              <PartItem
                v-for="p in itemsBajos"
                :key="p.sku"
                :name="p.name"
                :sku="p.sku"
                :stock="p.stock"
                :status="p.status"
              />
              <p
                v-if="itemsBajos.length === 0"
                class="py-8 text-center text-[1.3rem] text-muted dark:text-dk-muted"
              >
                Stock en niveles normales
              </p>
            </section>

            <!-- Accesos rapidos -->
            <section>
              <SectionHeader label="Accesos rapidos" />
              <nav class="flex flex-col gap-2">
                <router-link
                  v-for="action in quickActions"
                  :key="action.route"
                  :to="{ name: action.route }"
                  class="flex items-center gap-3 py-3 text-[1.3rem] font-medium text-body/50 dark:text-dk-body/40 no-underline hover:text-primary dark:hover:text-primary transition-colors"
                >
                  <span
                    class="w-7 h-7 bg-primary/10 text-primary flex items-center justify-center text-[1.4rem] font-light leading-none"
                    >+</span
                  >
                  {{ action.label }}
                </router-link>
              </nav>
            </section>
          </aside>
        </section>
      </main>
    </div>
  </div>
</template>

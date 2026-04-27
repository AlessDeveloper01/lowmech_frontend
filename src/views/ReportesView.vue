<script setup lang="ts">
import { inject, computed, type Ref } from 'vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppTopbar from '@/components/layout/AppTopbar.vue'
import { useOrdenesStore, calcularTotal, type EstadoOrden } from '@/stores/ordenes'
import { useVehiculosStore, type EstadoVehiculo } from '@/stores/vehiculos'
import { useClientesStore } from '@/stores/clientes'
import { useInventarioStore, getEstadoStock } from '@/stores/inventario'

const collapsed = inject<Ref<boolean>>('sidebarCollapsed')!
const darkMode = inject<Ref<boolean>>('darkMode')!

const ordStore = useOrdenesStore()
const vehStore = useVehiculosStore()
const cliStore = useClientesStore()
const invStore = useInventarioStore()

function fmt(n: number): string {
  return n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// Ordenes por estado
const ordenesPorEstado = computed(() => {
  const estados: Record<EstadoOrden, number> = {
    pendiente: 0,
    en_proceso: 0,
    completado: 0,
    cancelado: 0,
  }
  ordStore.ordenes.forEach((o) => {
    estados[o.estado]++
  })
  return estados
})

const totalOrdenes = computed(() => ordStore.ordenes.length)

// Vehiculos por estado
const vehiculosPorEstado = computed(() => {
  const estados: Record<EstadoVehiculo, number> = { en_taller: 0, disponible: 0, en_espera: 0 }
  vehStore.vehiculos.forEach((v) => {
    estados[v.estado]++
  })
  return estados
})

// Ingresos
const ingresosCompletados = computed(() =>
  ordStore.ordenes
    .filter((o) => o.estado === 'completado')
    .reduce((s, o) => s + calcularTotal(o.servicios), 0),
)
const ingresosPendientes = computed(() =>
  ordStore.ordenes
    .filter((o) => o.estado === 'en_proceso' || o.estado === 'pendiente')
    .reduce((s, o) => s + calcularTotal(o.servicios), 0),
)

// Top clientes por gasto
const topClientes = computed(() => {
  const mapa = new Map<string, number>()
  ordStore.ordenes
    .filter((o) => o.estado === 'completado')
    .forEach((o) => {
      mapa.set(o.clienteNombre, (mapa.get(o.clienteNombre) ?? 0) + calcularTotal(o.servicios))
    })
  return [...mapa.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
})

// Inventario por categoria
const inventarioPorCategoria = computed(() => {
  const mapa = new Map<string, { items: number; stock: number; valor: number }>()
  invStore.items.forEach((i) => {
    const actual = mapa.get(i.categoria) ?? { items: 0, stock: 0, valor: 0 }
    mapa.set(i.categoria, {
      items: actual.items + 1,
      stock: actual.stock + i.stock,
      valor: actual.valor + i.stock * i.precioCompra,
    })
  })
  return [...mapa.entries()].sort((a, b) => b[1].valor - a[1].valor)
})

// Inventario critico
const inventarioCritico = computed(() =>
  invStore.items.filter((i) => getEstadoStock(i) === 'critico'),
)

// Marcas mas frecuentes
const marcasFrecuentes = computed(() => {
  const mapa = new Map<string, number>()
  vehStore.vehiculos.forEach((v) => {
    mapa.set(v.marca, (mapa.get(v.marca) ?? 0) + 1)
  })
  return [...mapa.entries()].sort((a, b) => b[1] - a[1])
})

function barWidth(valor: number, max: number): string {
  return max > 0 ? `${(valor / max) * 100}%` : '0%'
}
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
        <header class="mb-14">
          <h1
            class="text-[3.2rem] font-extralight text-body dark:text-dk-body tracking-[-0.03em] leading-none mb-2"
          >
            Reportes
          </h1>
          <p class="text-[1.3rem] text-muted dark:text-dk-muted">Analisis general del negocio</p>
        </header>

        <!-- Top: resumen general -->
        <section
          class="grid grid-cols-4 gap-6 mb-14 max-[992px]:grid-cols-2 max-[480px]:grid-cols-1"
        >
          <article
            class="bg-surface dark:bg-dk-surface border border-border dark:border-dk-border p-8"
          >
            <p class="text-[1.1rem] text-muted dark:text-dk-muted uppercase tracking-wider mb-2">
              Ingresos cobrados
            </p>
            <p class="text-[2.4rem] font-light text-primary">${{ fmt(ingresosCompletados) }}</p>
          </article>
          <article
            class="bg-surface dark:bg-dk-surface border border-border dark:border-dk-border p-8"
          >
            <p class="text-[1.1rem] text-muted dark:text-dk-muted uppercase tracking-wider mb-2">
              Ingresos pendientes
            </p>
            <p class="text-[2.4rem] font-light text-amber-500">${{ fmt(ingresosPendientes) }}</p>
          </article>
          <article
            class="bg-surface dark:bg-dk-surface border border-border dark:border-dk-border p-8"
          >
            <p class="text-[1.1rem] text-muted dark:text-dk-muted uppercase tracking-wider mb-2">
              Valor inventario
            </p>
            <p class="text-[2.4rem] font-light text-body dark:text-dk-body">
              ${{ fmt(invStore.valorInventario) }}
            </p>
          </article>
          <article
            class="bg-surface dark:bg-dk-surface border border-border dark:border-dk-border p-8"
          >
            <p class="text-[1.1rem] text-muted dark:text-dk-muted uppercase tracking-wider mb-2">
              Total clientes
            </p>
            <p class="text-[2.4rem] font-light text-body dark:text-dk-body">
              {{ cliStore.totalClientes }}
            </p>
          </article>
        </section>

        <section class="grid grid-cols-2 gap-10 max-[1200px]:grid-cols-1">
          <!-- Ordenes por estado -->
          <article
            class="bg-surface dark:bg-dk-surface border border-border dark:border-dk-border p-8"
          >
            <h2 class="text-[1.5rem] font-bold text-body dark:text-dk-body mb-6">
              Ordenes por Estado
            </h2>
            <figure class="flex flex-col gap-5">
              <article v-for="(count, estado) in ordenesPorEstado" :key="estado">
                <header class="flex items-center justify-between mb-2">
                  <span class="text-[1.3rem] font-medium text-body dark:text-dk-body capitalize">{{
                    estado === 'en_proceso' ? 'En proceso' : estado
                  }}</span>
                  <span class="text-[1.3rem] font-semibold text-body dark:text-dk-body">{{
                    count
                  }}</span>
                </header>
                <progress
                  :value="count"
                  :max="totalOrdenes"
                  class="w-full h-2 [&::-webkit-progress-bar]:bg-bg [&::-webkit-progress-bar]:dark:bg-dk-bg [&::-webkit-progress-bar]:border [&::-webkit-progress-bar]:border-border [&::-webkit-progress-bar]:dark:border-dk-border"
                  :class="{
                    '[&::-webkit-progress-value]:bg-amber-400 [&::-moz-progress-bar]:bg-amber-400':
                      estado === 'pendiente',
                    '[&::-webkit-progress-value]:bg-blue-400 [&::-moz-progress-bar]:bg-blue-400':
                      estado === 'en_proceso',
                    '[&::-webkit-progress-value]:bg-emerald-400 [&::-moz-progress-bar]:bg-emerald-400':
                      estado === 'completado',
                    '[&::-webkit-progress-value]:bg-red-400 [&::-moz-progress-bar]:bg-red-400':
                      estado === 'cancelado',
                  }"
                ></progress>
              </article>
            </figure>
          </article>

          <!-- Vehiculos por estado -->
          <article
            class="bg-surface dark:bg-dk-surface border border-border dark:border-dk-border p-8"
          >
            <h2 class="text-[1.5rem] font-bold text-body dark:text-dk-body mb-6">
              Vehiculos por Estado
            </h2>
            <figure class="flex flex-col gap-5">
              <article v-for="(count, estado) in vehiculosPorEstado" :key="estado">
                <header class="flex items-center justify-between mb-2">
                  <span class="text-[1.3rem] font-medium text-body dark:text-dk-body">{{
                    estado === 'en_taller'
                      ? 'En taller'
                      : estado === 'en_espera'
                        ? 'En espera'
                        : 'Disponible'
                  }}</span>
                  <span class="text-[1.3rem] font-semibold text-body dark:text-dk-body">{{
                    count
                  }}</span>
                </header>
                <meter
                  class="h-2 w-full bg-bg dark:bg-dk-bg border border-border dark:border-dk-border overflow-hidden block"
                  :value="count"
                  :max="vehStore.totalVehiculos"
                >
                  <span
                    class="h-full block transition-all duration-500"
                    :class="{
                      'bg-blue-400': estado === 'en_taller',
                      'bg-emerald-400': estado === 'disponible',
                      'bg-amber-400': estado === 'en_espera',
                    }"
                    :style="{ width: barWidth(count, vehStore.totalVehiculos) }"
                  ></span>
                </meter>
              </article>
            </figure>
          </article>

          <!-- Top clientes -->
          <article
            class="bg-surface dark:bg-dk-surface border border-border dark:border-dk-border p-8"
          >
            <h2 class="text-[1.5rem] font-bold text-body dark:text-dk-body mb-6">
              Top Clientes por Gasto
            </h2>
            <section v-if="topClientes.length === 0" class="py-8 text-center">
              <p class="text-[1.3rem] text-muted dark:text-dk-muted">Sin datos de clientes</p>
            </section>
            <section v-else class="flex flex-col gap-4">
              <article
                v-for="(cliente, i) in topClientes"
                :key="cliente[0]"
                class="flex items-center gap-4"
              >
                <span
                  class="w-8 h-8 flex items-center justify-center text-[1.1rem] font-bold shrink-0"
                  :class="i === 0 ? 'text-primary' : 'text-muted dark:text-dk-muted'"
                  >{{ i + 1 }}</span
                >
                <header class="flex-1">
                  <p class="text-[1.3rem] font-medium text-body dark:text-dk-body">
                    {{ cliente[0] }}
                  </p>
                </header>
                <span
                  class="text-[1.3rem] font-semibold"
                  :class="i === 0 ? 'text-primary' : 'text-body dark:text-dk-body'"
                  >${{ fmt(cliente[1]) }}</span
                >
              </article>
            </section>
          </article>

          <!-- Inventario por categoria -->
          <article
            class="bg-surface dark:bg-dk-surface border border-border dark:border-dk-border p-8"
          >
            <h2 class="text-[1.5rem] font-bold text-body dark:text-dk-body mb-6">
              Inventario por Categoria
            </h2>
            <section class="flex flex-col gap-4">
              <article
                v-for="cat in inventarioPorCategoria"
                :key="cat[0]"
                class="flex items-center gap-4 py-3 border-b border-border/60 dark:border-dk-border/60 last:border-b-0"
              >
                <header class="flex-1">
                  <p class="text-[1.3rem] font-medium text-body dark:text-dk-body">{{ cat[0] }}</p>
                  <p class="text-[1.1rem] text-muted dark:text-dk-muted">
                    {{ cat[1].items }} articulos — {{ cat[1].stock }} en stock
                  </p>
                </header>
                <span class="text-[1.3rem] font-semibold text-body dark:text-dk-body"
                  >${{ fmt(cat[1].valor) }}</span
                >
              </article>
            </section>
          </article>

          <!-- Marcas -->
          <article
            class="bg-surface dark:bg-dk-surface border border-border dark:border-dk-border p-8"
          >
            <h2 class="text-[1.5rem] font-bold text-body dark:text-dk-body mb-6">
              Vehiculos por Marca
            </h2>
            <figure class="flex flex-col gap-4">
              <article
                v-for="marca in marcasFrecuentes"
                :key="marca[0]"
                class="flex items-center gap-4"
              >
                <section class="flex-1">
                  <header class="flex items-center justify-between mb-2">
                    <span class="text-[1.3rem] font-medium text-body dark:text-dk-body">{{
                      marca[0]
                    }}</span>
                    <span class="text-[1.2rem] text-muted dark:text-dk-muted">{{ marca[1] }}</span>
                  </header>
                  <meter
                    class="h-1.5 w-full bg-bg dark:bg-dk-bg border border-border dark:border-dk-border overflow-hidden block"
                    :value="marca[1]"
                    :max="marcasFrecuentes[0]?.[1] ?? 1"
                  >
                    <span
                      class="h-full block bg-primary/60 transition-all duration-500"
                      :style="{ width: barWidth(marca[1], marcasFrecuentes[0]?.[1] ?? 1) }"
                    ></span>
                  </meter>
                </section>
              </article>
            </figure>
          </article>

          <!-- Inventario critico -->
          <article
            class="bg-surface dark:bg-dk-surface border border-border dark:border-dk-border p-8"
          >
            <h2 class="text-[1.5rem] font-bold text-body dark:text-dk-body mb-6">Stock Critico</h2>
            <section v-if="inventarioCritico.length === 0" class="py-8 text-center">
              <p class="text-[1.3rem] text-emerald-500">Todo en niveles aceptables</p>
            </section>
            <section v-else class="flex flex-col gap-4">
              <article
                v-for="item in inventarioCritico"
                :key="item.id"
                class="flex items-center gap-4 py-3 border-b border-border/60 dark:border-dk-border/60 last:border-b-0"
              >
                <span class="w-1 h-8 rounded-full bg-red-400 shrink-0"></span>
                <header class="flex-1">
                  <p class="text-[1.3rem] font-medium text-body dark:text-dk-body">
                    {{ item.nombre }}
                  </p>
                  <p class="text-[1.1rem] text-muted dark:text-dk-muted">{{ item.sku }}</p>
                </header>
                <footer class="text-right">
                  <p class="text-[1.4rem] font-semibold text-red-500">
                    {{ item.stock }} {{ item.unidad }}
                  </p>
                  <p class="text-[1rem] text-muted dark:text-dk-muted">
                    Min: {{ item.stockMinimo }}
                  </p>
                </footer>
              </article>
            </section>
          </article>
        </section>
      </main>
    </div>
  </div>
</template>

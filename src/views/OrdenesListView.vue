<script setup lang="ts">
import { ref, computed, inject, onMounted, type Ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useOrdenesStore, calcularTotal, type Orden } from '@/stores/ordenes'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppTopbar from '@/components/layout/AppTopbar.vue'
import Swal from 'sweetalert2'

const router = useRouter()
const route = useRoute()
const store = useOrdenesStore()

const routePrefix = computed(() => {
  if (String(route.name).startsWith('recepcionista')) return 'recepcionista-'
  return ''
})

const collapsed = inject<Ref<boolean>>('sidebarCollapsed')!
const darkMode = inject<Ref<boolean>>('darkMode')!

const busqueda = ref('')
const filtroEstado = ref<string>('todos')

const ordenesFiltradas = computed(() => {
  let lista = store.ordenes
  if (filtroEstado.value !== 'todos') {
    lista = lista.filter((o) => o.estado === filtroEstado.value)
  }
  if (busqueda.value.trim()) {
    const q = busqueda.value.toLowerCase()
    lista = lista.filter(
      (o) =>
        (o.vehiculo?.nombre ?? '').toLowerCase().includes(q) ||
        (o.cliente?.nombre ?? '').toLowerCase().includes(q) ||
        (o.vehiculo?.placa ?? '').toLowerCase().includes(q) ||
        String(o.id).includes(q),
    )
  }
  return lista
})

type EstadoKey =
  | 'recibido'
  | 'diagnostico'
  | 'en_proceso'
  | 'completado'
  | 'entregado'
  | 'operativo'
  | 'pagado'
  | 'cancelado'
const estadoConfig: Record<EstadoKey, { label: string; clase: string }> = {
  recibido: {
    label: 'Recibido',
    clase: 'bg-slate-50 text-slate-700 dark:bg-slate-950/40 dark:text-slate-400',
  },
  diagnostico: {
    label: 'Diagnostico',
    clase: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400',
  },
  en_proceso: {
    label: 'En proceso',
    clase: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400',
  },
  completado: {
    label: 'Completado',
    clase: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  },
  entregado: {
    label: 'Entregado',
    clase: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  },
  operativo: {
    label: 'Operativo',
    clase: 'bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400',
  },
  pagado: {
    label: 'Pagado',
    clase: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400',
  },
  cancelado: {
    label: 'Cancelado',
    clase: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400',
  },
}

function getEstado(orden: Orden) {
  return (
    estadoConfig[orden.estado as EstadoKey] ?? {
      label: orden.estado,
      clase: 'bg-gray-100 text-gray-600',
    }
  )
}

function getTotal(orden: Orden): number {
  const sub = calcularTotal(orden.lineas ?? [], orden.descuento)
  return sub
}

async function confirmarEliminar(id: number) {
  const result = await Swal.fire({
    title: '¿Eliminar orden?',
    text: `La orden #${id} será eliminada permanentemente.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
  })
  if (!result.isConfirmed) return
  await store.eliminar(id)
  Swal.fire({
    title: 'Eliminado',
    text: 'La orden fue eliminada.',
    icon: 'success',
    timer: 1500,
    showConfirmButton: false,
  })
}

onMounted(() => store.fetchOrdenes())
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
        <!-- Header -->
        <header
          class="flex items-end justify-between mb-10 max-[768px]:flex-col max-[768px]:items-start max-[768px]:gap-4"
        >
          <section>
            <h1
              class="text-[3.2rem] font-extralight text-body dark:text-dk-body tracking-[-0.03em] leading-none mb-2"
            >
              Ordenes
            </h1>
            <p class="text-[1.3rem] text-muted dark:text-dk-muted">
              {{ store.ordenes.length }} ordenes registradas
            </p>
          </section>
          <button
            class="flex items-center gap-2 px-6 py-3 text-[1.3rem] font-semibold text-white bg-primary border-none cursor-pointer hover:bg-primary-dark transition-colors"
            @click="router.push({ name: `${routePrefix}ordenes-crear` })"
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

        <!-- Filtros -->
        <nav class="flex items-center gap-4 mb-8 max-[768px]:flex-col max-[768px]:items-stretch">
          <search
            class="flex items-center gap-3 px-4 py-3 bg-surface dark:bg-dk-surface border border-border dark:border-dk-border flex-1 max-w-[32rem] max-[768px]:max-w-none"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              class="text-muted dark:text-dk-muted shrink-0"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              v-model="busqueda"
              type="text"
              placeholder="Buscar por vehiculo, cliente, placa..."
              class="flex-1 text-[1.3rem] text-body dark:text-dk-body bg-transparent border-none outline-none placeholder:text-muted dark:placeholder:text-dk-muted"
            />
          </search>
          <section class="flex items-center gap-2 flex-wrap">
            <button
              v-for="filtro in [
                'todos',
                'recibido',
                'diagnostico',
                'en_proceso',
                'completado',
                'entregado',
                'operativo',
                'pagado',
                'cancelado',
              ] as const"
              :key="filtro"
              class="px-4 py-2.5 text-[1.2rem] font-medium border-none cursor-pointer transition-colors"
              :class="
                filtroEstado === filtro
                  ? 'bg-primary text-white'
                  : 'bg-surface dark:bg-dk-surface text-muted dark:text-dk-muted border border-border dark:border-dk-border hover:text-body dark:hover:text-dk-body'
              "
              @click="filtroEstado = filtro"
            >
              {{
                filtro === 'todos' ? 'Todos' : (estadoConfig[filtro as EstadoKey]?.label ?? filtro)
              }}
            </button>
          </section>
        </nav>

        <!-- Tabla -->
        <section
          class="bg-surface dark:bg-dk-surface border border-border dark:border-dk-border overflow-hidden"
        >
          <header
            class="grid grid-cols-[1fr_1fr_1fr_10rem_10rem_8rem_6rem] gap-4 px-6 py-4 border-b border-border dark:border-dk-border max-[1200px]:hidden"
          >
            <span
              class="text-[1.1rem] font-semibold text-muted dark:text-dk-muted uppercase tracking-wider"
              >Orden</span
            >
            <span
              class="text-[1.1rem] font-semibold text-muted dark:text-dk-muted uppercase tracking-wider"
              >Vehiculo</span
            >
            <span
              class="text-[1.1rem] font-semibold text-muted dark:text-dk-muted uppercase tracking-wider"
              >Cliente</span
            >
            <span
              class="text-[1.1rem] font-semibold text-muted dark:text-dk-muted uppercase tracking-wider"
              >Mecanico</span
            >
            <span
              class="text-[1.1rem] font-semibold text-muted dark:text-dk-muted uppercase tracking-wider"
              >Estado</span
            >
            <span
              class="text-[1.1rem] font-semibold text-muted dark:text-dk-muted uppercase tracking-wider text-right"
              >Costo</span
            >
            <span
              class="text-[1.1rem] font-semibold text-muted dark:text-dk-muted uppercase tracking-wider text-right"
              >Acciones</span
            >
          </header>

          <article
            v-for="orden in ordenesFiltradas"
            :key="orden.id"
            class="grid grid-cols-[1fr_1fr_1fr_10rem_10rem_8rem_6rem] gap-4 px-6 py-5 border-b border-border/60 dark:border-dk-border/60 last:border-b-0 items-center hover:bg-bg dark:hover:bg-dk-bg transition-colors cursor-pointer max-[1200px]:grid-cols-1 max-[1200px]:gap-2"
            @click="router.push({ name: `${routePrefix}ordenes-detalle`, params: { id: orden.id } })"
          >
            <section>
              <span class="text-[1.1rem] text-muted dark:text-dk-muted font-medium"
                >#{{ orden.id }}</span
              >
              <p class="text-[1.2rem] text-muted dark:text-dk-muted mt-0.5">
                <time :datetime="orden.fechaIngreso">{{ orden.fechaIngreso }}</time>
              </p>
            </section>
            <section>
              <p class="text-[1.3rem] font-medium text-body dark:text-dk-body">
                {{ orden.vehiculo?.nombre ?? '—' }}
              </p>
              <p class="text-[1.1rem] text-muted dark:text-dk-muted">
                {{ orden.vehiculo?.placa ?? '' }}
              </p>
            </section>
            <span class="text-[1.3rem] text-body dark:text-dk-body">{{
              orden.cliente?.nombre ?? '—'
            }}</span>
            <span class="text-[1.2rem] text-muted dark:text-dk-muted">{{
              orden.mecanico ? orden.mecanico.nombre + ' ' + orden.mecanico.apellido : 'Sin asignar'
            }}</span>
            <span
              class="text-[1.1rem] font-medium px-3 py-1 rounded-full w-fit"
              :class="getEstado(orden).clase"
              >{{ getEstado(orden).label }}</span
            >
            <span class="text-[1.3rem] font-medium text-body dark:text-dk-body text-right"
              >${{ getTotal(orden).toLocaleString('es-MX', { minimumFractionDigits: 2 }) }}</span
            >
            <nav class="flex items-center justify-end gap-2" @click.stop>
              <button
                class="w-8 h-8 flex items-center justify-center text-muted dark:text-dk-muted hover:text-primary cursor-pointer border-none bg-transparent transition-colors"
                title="Editar"
                @click="router.push({ name: `${routePrefix}ordenes-editar`, params: { id: orden.id } })"
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
              <button
                class="w-8 h-8 flex items-center justify-center text-muted dark:text-dk-muted hover:text-red-500 cursor-pointer border-none bg-transparent transition-colors"
                title="Eliminar"
                @click="confirmarEliminar(orden.id)"
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </nav>
          </article>

          <section v-if="ordenesFiltradas.length === 0" class="px-6 py-16 text-center">
            <p class="text-[1.4rem] text-muted dark:text-dk-muted">No se encontraron ordenes</p>
          </section>
        </section>
      </main>
    </div>
  </div>
</template>

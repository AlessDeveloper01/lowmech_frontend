<script setup lang="ts">
import { ref, computed, inject, onMounted, type Ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useVehiculosStore, type EstadoVehiculo } from '@/stores/vehiculos'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppTopbar from '@/components/layout/AppTopbar.vue'
import Swal from 'sweetalert2'

const router = useRouter()
const route = useRoute()
const store = useVehiculosStore()

const routePrefix = computed(() => {
  if (String(route.name).startsWith('recepcionista')) return 'recepcionista-'
  return ''
})

const collapsed = inject<Ref<boolean>>('sidebarCollapsed')!
const darkMode = inject<Ref<boolean>>('darkMode')!

const busqueda = ref('')
const filtroEstado = ref<EstadoVehiculo | 'todos'>('todos')

onMounted(async () => {
  try {
    await store.fetchVehiculos()
  } catch (e) {
    console.error('Error cargando vehículos:', e)
  }
})

const vehiculosFiltrados = computed(() => {
  let lista = store.vehiculos
  if (filtroEstado.value !== 'todos') {
    lista = lista.filter((v) => v.estado === filtroEstado.value)
  }
  if (busqueda.value.trim()) {
    const q = busqueda.value.toLowerCase()
    lista = lista.filter(
      (v) =>
        v.nombre.toLowerCase().includes(q) ||
        v.placa.toLowerCase().includes(q) ||
        v.clienteNombre.toLowerCase().includes(q) ||
        v.marca.toLowerCase().includes(q),
    )
  }
  return lista
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

async function confirmarEliminar(id: number, nombre: string) {
  const result = await Swal.fire({
    title: '¿Eliminar vehículo?',
    text: `"${nombre}" será eliminado permanentemente.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
  })
  if (!result.isConfirmed) return
  const ok = await store.eliminar(id)
  if (ok) {
    Swal.fire({
      title: 'Eliminado',
      text: 'El vehículo fue eliminado.',
      icon: 'success',
      timer: 1500,
      showConfirmButton: false,
    })
  } else {
    Swal.fire({
      title: 'Error',
      text: store.error ?? 'No se pudo eliminar el vehículo.',
      icon: 'error',
    })
  }
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
        <header
          class="flex items-end justify-between mb-10 max-[768px]:flex-col max-[768px]:items-start max-[768px]:gap-4"
        >
          <section>
            <h1
              class="text-[3.2rem] font-extralight text-body dark:text-dk-body tracking-[-0.03em] leading-none mb-2"
            >
              Vehiculos
            </h1>
            <p class="text-[1.3rem] text-muted dark:text-dk-muted">
              {{ store.totalVehiculos }} vehiculos registrados
            </p>
          </section>
          <button
            class="flex items-center gap-2 px-6 py-3 text-[1.3rem] font-semibold text-white bg-primary border-none cursor-pointer hover:bg-primary-dark transition-colors"
            @click="router.push({ name: `${routePrefix}vehiculos-crear` })"
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
            Nuevo Vehiculo
          </button>
        </header>

        <!-- Filtros -->
        <nav class="flex items-center gap-4 mb-8 max-[768px]:flex-col max-[768px]:items-stretch">
          <label
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
              placeholder="Buscar por nombre, placa, cliente..."
              class="flex-1 text-[1.3rem] text-body dark:text-dk-body bg-transparent border-none outline-none placeholder:text-muted dark:placeholder:text-dk-muted"
            />
          </label>
          <button
            v-for="filtro in ['todos', 'en_taller', 'disponible', 'en_espera'] as const"
            :key="filtro"
            class="px-4 py-2.5 text-[1.2rem] font-medium border-none cursor-pointer transition-colors"
            :class="
              filtroEstado === filtro
                ? 'bg-primary text-white'
                : 'bg-surface dark:bg-dk-surface text-muted dark:text-dk-muted border border-border dark:border-dk-border hover:text-body dark:hover:text-dk-body'
            "
            @click="filtroEstado = filtro"
          >
            {{ filtro === 'todos' ? 'Todos' : estadoConfig[filtro].label }}
          </button>
        </nav>

        <!-- Grid -->
        <section v-if="store.loading" class="py-16 text-center">
          <p class="text-[1.4rem] text-muted dark:text-dk-muted">Cargando vehiculos...</p>
        </section>

        <section v-else class="grid grid-cols-[repeat(auto-fill,minmax(30rem,1fr))] gap-6">
          <article
            v-for="v in vehiculosFiltrados"
            :key="v.id"
            class="bg-surface dark:bg-dk-surface border border-border dark:border-dk-border p-7 hover:shadow-sm transition-shadow cursor-pointer group"
            @click="router.push({ name: `${routePrefix}vehiculos-detalle`, params: { id: v.id } })"
          >
            <header class="flex items-start justify-between mb-4">
              <section>
                <p class="text-[1.5rem] font-semibold text-body dark:text-dk-body">
                  {{ v.nombre }}
                </p>
                <p class="text-[1.2rem] text-muted dark:text-dk-muted">{{ v.placa }}</p>
              </section>
              <span
                class="text-[1rem] font-medium px-2.5 py-1 rounded-full"
                :class="estadoConfig[v.estado].clase"
                >{{ estadoConfig[v.estado].label }}</span
              >
            </header>
            <section
              class="flex items-center gap-4 mb-4 text-[1.2rem] text-muted dark:text-dk-muted"
            >
              <span>{{ v.marca }}</span>
              <span class="w-1 h-1 rounded-full bg-border dark:bg-dk-border"></span>
              <span>{{ v.anio }}</span>
              <span class="w-1 h-1 rounded-full bg-border dark:bg-dk-border"></span>
              <span>{{ v.kilometraje.toLocaleString() }} km</span>
            </section>
            <footer
              class="flex items-center justify-between pt-4 border-t border-border/60 dark:border-dk-border/60"
            >
              <span class="text-[1.2rem] text-muted dark:text-dk-muted">{{ v.clienteNombre }}</span>
              <span class="flex items-center gap-2" @click.stop>
                <button
                  class="w-7 h-7 flex items-center justify-center text-muted dark:text-dk-muted hover:text-primary cursor-pointer border-none bg-transparent transition-colors"
                  title="Editar"
                  @click="router.push({ name: `${routePrefix}vehiculos-editar`, params: { id: v.id } })"
                >
                  <svg
                    width="14"
                    height="14"
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
                  class="w-7 h-7 flex items-center justify-center text-muted dark:text-dk-muted hover:text-red-500 cursor-pointer border-none bg-transparent transition-colors"
                  title="Eliminar"
                  @click="confirmarEliminar(v.id, v.nombre)"
                >
                  <svg
                    width="14"
                    height="14"
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
              </span>
            </footer>
          </article>
        </section>

        <section v-if="vehiculosFiltrados.length === 0" class="py-16 text-center">
          <p class="text-[1.4rem] text-muted dark:text-dk-muted">No se encontraron vehiculos</p>
        </section>
      </main>
    </div>
  </div>
</template>

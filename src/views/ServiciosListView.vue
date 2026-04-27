<script setup lang="ts">
import { ref, computed, inject, onMounted, type Ref } from 'vue'
import { useRouter } from 'vue-router'
import { useServiciosStore } from '@/stores/servicios'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppTopbar from '@/components/layout/AppTopbar.vue'
import Swal from 'sweetalert2'

const router = useRouter()
const store = useServiciosStore()

const collapsed = inject<Ref<boolean>>('sidebarCollapsed')!
const darkMode = inject<Ref<boolean>>('darkMode')!

const busqueda = ref('')
const filtroCategoria = ref('todos')
const filtroEstado = ref<'todos' | 'activo' | 'inactivo'>('todos')

const serviciosFiltrados = computed(() => {
  let lista = store.servicios
  if (filtroEstado.value === 'activo') lista = lista.filter((s) => s.activo)
  if (filtroEstado.value === 'inactivo') lista = lista.filter((s) => !s.activo)
  if (filtroCategoria.value !== 'todos')
    lista = lista.filter((s) => s.categoria === filtroCategoria.value)
  if (busqueda.value.trim()) {
    const q = busqueda.value.toLowerCase()
    lista = lista.filter(
      (s) =>
        s.nombre.toLowerCase().includes(q) ||
        s.descripcion.toLowerCase().includes(q) ||
        s.categoria.toLowerCase().includes(q),
    )
  }
  return lista
})

async function confirmarEliminar(id: number, nombre: string) {
  const result = await Swal.fire({
    title: '¿Eliminar servicio?',
    text: `"${nombre}" será eliminado permanentemente.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
  })
  if (!result.isConfirmed) return
  try {
    await store.eliminar(id)
    Swal.fire({
      title: 'Eliminado',
      text: 'El servicio fue eliminado.',
      icon: 'success',
      timer: 1500,
      showConfirmButton: false,
    })
  } catch (e) {
    Swal.fire({ title: 'Error', text: (e as Error).message, icon: 'error' })
  }
}

function fmt(n: number): string {
  return n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

onMounted(() => {
  store.fetchServicios()
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
      <div v-if="store.loading" class="flex-1 flex items-center justify-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>

      <main v-else class="flex-1 px-12 py-10 max-[768px]:px-5 max-[768px]:py-6">
        <header
          class="flex items-end justify-between mb-10 max-[768px]:flex-col max-[768px]:items-start max-[768px]:gap-4"
        >
          <section>
            <h1
              class="text-[3.2rem] font-extralight text-body dark:text-dk-body tracking-[-0.03em] leading-none mb-2"
            >
              Servicios
            </h1>
            <p class="text-[1.3rem] text-muted dark:text-dk-muted">
              {{ store.totalServicios }} servicios — {{ store.serviciosActivos }} activos
            </p>
          </section>
          <button
            class="flex items-center gap-2 px-6 py-3 text-[1.3rem] font-semibold text-white bg-primary border-none cursor-pointer hover:bg-primary-dark transition-colors"
            @click="router.push({ name: 'servicios-crear' })"
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
            Nuevo Servicio
          </button>
        </header>

        <!-- Filtros -->
        <nav class="flex items-center gap-4 mb-8 flex-wrap">
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
            placeholder="Buscar por nombre, descripcion..."
            class="flex-1 text-[1.3rem] text-body dark:text-dk-body bg-surface dark:bg-dk-surface border border-border dark:border-dk-border px-4 py-3 outline-none placeholder:text-muted dark:placeholder:text-dk-muted max-w-[32rem]"
          />
          <button
            v-for="f in ['todos', 'activo', 'inactivo'] as const"
            :key="f"
            class="px-4 py-2.5 text-[1.2rem] font-medium border-none cursor-pointer transition-colors"
            :class="
              filtroEstado === f
                ? 'bg-primary text-white'
                : 'bg-surface dark:bg-dk-surface text-muted dark:text-dk-muted border border-border dark:border-dk-border hover:text-body dark:hover:text-dk-body'
            "
            @click="filtroEstado = f"
          >
            {{ f === 'todos' ? 'Todos' : f === 'activo' ? 'Activos' : 'Inactivos' }}
          </button>
          <select
            v-model="filtroCategoria"
            class="px-4 py-2.5 text-[1.2rem] font-medium text-body dark:text-dk-body bg-surface dark:bg-dk-surface border border-border dark:border-dk-border outline-none cursor-pointer"
          >
            <option value="todos">Todas categorias</option>
            <option v-for="cat in store.categorias" :key="cat" :value="cat">{{ cat }}</option>
          </select>
        </nav>

        <!-- Tabla -->
        <section
          class="bg-surface dark:bg-dk-surface border border-border dark:border-dk-border overflow-x-auto"
        >
          <table class="w-full min-w-[80rem]">
            <thead class="border-b border-border dark:border-dk-border">
              <tr class="grid grid-cols-[2fr_1fr_8rem_10rem_10rem_10rem_6rem] gap-4 px-6 py-4">
                <th
                  class="text-[1.1rem] font-semibold text-muted dark:text-dk-muted uppercase tracking-wider text-left"
                >
                  Servicio
                </th>
                <th
                  class="text-[1.1rem] font-semibold text-muted dark:text-dk-muted uppercase tracking-wider text-left"
                >
                  Categoria
                </th>
                <th
                  class="text-[1.1rem] font-semibold text-muted dark:text-dk-muted uppercase tracking-wider text-left"
                >
                  Items
                </th>
                <th
                  class="text-[1.1rem] font-semibold text-muted dark:text-dk-muted uppercase tracking-wider text-right"
                >
                  Mano Obra
                </th>
                <th
                  class="text-[1.1rem] font-semibold text-muted dark:text-dk-muted uppercase tracking-wider text-right"
                >
                  Materiales
                </th>
                <th
                  class="text-[1.1rem] font-semibold text-muted dark:text-dk-muted uppercase tracking-wider text-right"
                >
                  Total
                </th>
                <th
                  class="text-[1.1rem] font-semibold text-muted dark:text-dk-muted uppercase tracking-wider text-center"
                >
                  Estado
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="s in serviciosFiltrados"
                :key="s.id"
                class="grid grid-cols-[2fr_1fr_8rem_10rem_10rem_10rem_6rem] gap-4 px-6 py-5 border-b border-border/50 dark:border-dk-border/50 cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors items-center"
                @click="router.push({ name: 'servicios-detalle', params: { id: s.id } })"
              >
                <td>
                  <p
                    class="text-[1.35rem] font-medium text-body dark:text-dk-body leading-none mb-1"
                  >
                    {{ s.nombre }}
                  </p>
                  <p class="text-[1.15rem] text-muted dark:text-dk-muted">
                    {{ s.descripcion || '—' }}
                  </p>
                </td>
                <td class="text-[1.3rem] text-body dark:text-dk-body">{{ s.categoria || '—' }}</td>
                <td class="text-[1.3rem] text-body dark:text-dk-body">
                  {{ s.items?.length ?? 0 }}
                </td>
                <td class="text-[1.3rem] text-body dark:text-dk-body text-right font-mono">
                  ${{ fmt(s.precioManoObra) }}
                </td>
                <td class="text-[1.3rem] text-body dark:text-dk-body text-right font-mono">
                  ${{ fmt(store.costoMateriales(s)) }}
                </td>
                <td
                  class="text-[1.3rem] text-body dark:text-dk-body text-right font-mono font-semibold"
                >
                  ${{ fmt(store.costoTotal(s)) }}
                </td>
                <td class="flex justify-center">
                  <span
                    class="text-[1.1rem] font-medium px-3 py-1 rounded-full"
                    :class="
                      s.activo
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                        : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
                    "
                    >{{ s.activo ? 'Activo' : 'Inactivo' }}</span
                  >
                </td>
              </tr>
              <tr v-if="serviciosFiltrados.length === 0">
                <td colspan="7" class="px-6 py-16 text-center">
                  <p class="text-[1.4rem] text-muted dark:text-dk-muted">
                    No se encontraron servicios
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      </main>
    </div>
  </div>
</template>

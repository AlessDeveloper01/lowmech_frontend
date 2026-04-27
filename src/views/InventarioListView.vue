<script setup lang="ts">
import { ref, computed, inject, onMounted, type Ref } from 'vue'
import { useRouter } from 'vue-router'
import { useInventarioStore, getEstadoStock, type EstadoStock } from '@/stores/inventario'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppTopbar from '@/components/layout/AppTopbar.vue'
import Swal from 'sweetalert2'

const router = useRouter()
const store = useInventarioStore()

const collapsed = inject<Ref<boolean>>('sidebarCollapsed')!
const darkMode = inject<Ref<boolean>>('darkMode')!

const busqueda = ref('')
const filtroEstado = ref<EstadoStock | 'todos'>('todos')
const filtroCategoria = ref('todos')

const itemsFiltrados = computed(() => {
  let lista = store.items
  if (filtroEstado.value !== 'todos') {
    lista = lista.filter((i) => getEstadoStock(i) === filtroEstado.value)
  }
  if (filtroCategoria.value !== 'todos') {
    lista = lista.filter((i) => i.categoria === filtroCategoria.value)
  }
  if (busqueda.value.trim()) {
    const q = busqueda.value.toLowerCase()
    lista = lista.filter(
      (i) =>
        i.nombre.toLowerCase().includes(q) ||
        i.sku.toLowerCase().includes(q) ||
        i.proveedor.toLowerCase().includes(q),
    )
  }
  return lista
})

const estadoConfig: Record<EstadoStock, { label: string; clase: string }> = {
  critico: {
    label: 'Critico',
    clase: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400',
  },
  bajo: {
    label: 'Bajo',
    clase: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
  },
  normal: {
    label: 'Normal',
    clase: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  },
}

async function confirmarEliminar(id: number, nombre: string) {
  const result = await Swal.fire({
    title: '¿Eliminar artículo?',
    text: `"${nombre}" será eliminado del inventario permanentemente.`,
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
      text: 'El artículo fue eliminado.',
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
  store.fetchItems()
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
              Inventario
            </h1>
            <p class="text-[1.3rem] text-muted dark:text-dk-muted">
              {{ store.totalItems }} articulos — {{ store.itemsCriticos }} criticos,
              {{ store.itemsBajos }} bajos
            </p>
          </section>
          <button
            class="flex items-center gap-2 px-6 py-3 text-[1.3rem] font-semibold text-white bg-primary border-none cursor-pointer hover:bg-primary-dark transition-colors"
            @click="router.push({ name: 'inventario-crear' })"
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
            Nuevo Articulo
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
            placeholder="Buscar por nombre, SKU, proveedor..."
            class="flex-1 text-[1.3rem] text-body dark:text-dk-body bg-surface dark:bg-dk-surface border border-border dark:border-dk-border px-4 py-3 outline-none placeholder:text-muted dark:placeholder:text-dk-muted max-w-[32rem]"
          />
          <button
            v-for="f in ['todos', 'critico', 'bajo', 'normal'] as const"
            :key="f"
            class="px-4 py-2.5 text-[1.2rem] font-medium border-none cursor-pointer transition-colors"
            :class="
              filtroEstado === f
                ? 'bg-primary text-white'
                : 'bg-surface dark:bg-dk-surface text-muted dark:text-dk-muted border border-border dark:border-dk-border hover:text-body dark:hover:text-dk-body'
            "
            @click="filtroEstado = f"
          >
            {{ f === 'todos' ? 'Todos' : estadoConfig[f].label }}
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
              <tr class="grid grid-cols-[2fr_10rem_1fr_8rem_8rem_10rem_8rem_6rem] gap-4 px-6 py-4">
                <th
                  class="text-[1.1rem] font-semibold text-muted dark:text-dk-muted uppercase tracking-wider text-left"
                >
                  Articulo
                </th>
                <th
                  class="text-[1.1rem] font-semibold text-muted dark:text-dk-muted uppercase tracking-wider text-left"
                >
                  SKU
                </th>
                <th
                  class="text-[1.1rem] font-semibold text-muted dark:text-dk-muted uppercase tracking-wider text-left"
                >
                  Categoria
                </th>
                <th
                  class="text-[1.1rem] font-semibold text-muted dark:text-dk-muted uppercase tracking-wider text-right"
                >
                  Stock
                </th>
                <th
                  class="text-[1.1rem] font-semibold text-muted dark:text-dk-muted uppercase tracking-wider text-right"
                >
                  Precio
                </th>
                <th
                  class="text-[1.1rem] font-semibold text-muted dark:text-dk-muted uppercase tracking-wider text-left"
                >
                  Estado
                </th>
                <th
                  class="text-[1.1rem] font-semibold text-muted dark:text-dk-muted uppercase tracking-wider text-left"
                >
                  Proveedor
                </th>
                <th
                  class="text-[1.1rem] font-semibold text-muted dark:text-dk-muted uppercase tracking-wider text-right"
                >
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="item in itemsFiltrados"
                :key="item.id"
                class="grid grid-cols-[2fr_10rem_1fr_8rem_8rem_10rem_8rem_6rem] gap-4 px-6 py-5 border-b border-border/60 dark:border-dk-border/60 last:border-b-0 items-center hover:bg-bg dark:hover:bg-dk-bg transition-colors cursor-pointer"
                @click="router.push({ name: 'inventario-detalle', params: { id: item.id } })"
              >
                <td>
                  <p class="text-[1.3rem] font-medium text-body dark:text-dk-body">
                    {{ item.nombre }}
                  </p>
                  <p class="text-[1.1rem] text-muted dark:text-dk-muted">{{ item.ubicacion }}</p>
                </td>
                <td class="text-[1.2rem] text-muted dark:text-dk-muted font-mono">
                  {{ item.sku }}
                </td>
                <td class="text-[1.2rem] text-body dark:text-dk-body">{{ item.categoria }}</td>
                <td class="text-right">
                  <span
                    class="text-[1.3rem] font-semibold"
                    :class="
                      getEstadoStock(item) === 'critico'
                        ? 'text-red-500'
                        : getEstadoStock(item) === 'bajo'
                          ? 'text-amber-500'
                          : 'text-body dark:text-dk-body'
                    "
                    >{{ item.stock }}</span
                  >
                  <span class="text-[1.1rem] text-muted dark:text-dk-muted">
                    / {{ item.stockMinimo }} {{ item.unidad }}</span
                  >
                </td>
                <td class="text-[1.3rem] font-medium text-body dark:text-dk-body text-right">
                  ${{ fmt(item.precioVenta) }}
                </td>
                <td>
                  <span
                    class="text-[1rem] font-medium px-2.5 py-1 rounded-full w-fit"
                    :class="estadoConfig[getEstadoStock(item)].clase"
                    >{{ estadoConfig[getEstadoStock(item)].label }}</span
                  >
                </td>
                <td class="text-[1.2rem] text-muted dark:text-dk-muted truncate">
                  {{ item.proveedor }}
                </td>
                <td class="flex items-center justify-end gap-2" @click.stop>
                  <button
                    class="w-7 h-7 flex items-center justify-center text-muted dark:text-dk-muted hover:text-primary cursor-pointer border-none bg-transparent transition-colors"
                    title="Editar"
                    @click="router.push({ name: 'inventario-editar', params: { id: item.id } })"
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
                    @click="confirmarEliminar(item.id, item.nombre)"
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
                </td>
              </tr>
            </tbody>
          </table>

          <section v-if="itemsFiltrados.length === 0" class="px-6 py-16 text-center">
            <p class="text-[1.4rem] text-muted dark:text-dk-muted">No se encontraron articulos</p>
          </section>
        </section>
      </main>
    </div>
  </div>
</template>

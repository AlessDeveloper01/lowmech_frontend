<script setup lang="ts">
import { ref, computed, inject, onMounted, type Ref } from 'vue'
import { useRouter } from 'vue-router'
import { usePromocionesStore, type Promocion } from '@/stores/promociones'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppTopbar from '@/components/layout/AppTopbar.vue'
import Swal from 'sweetalert2'

const router = useRouter()
const store = usePromocionesStore()

const collapsed = inject<Ref<boolean>>('sidebarCollapsed')!
const darkMode = inject<Ref<boolean>>('darkMode')!

const busqueda = ref('')
const filtroEstado = ref<'todos' | 'activa' | 'inactiva'>('todos')

const promocionesFiltradas = computed(() => {
  let lista = store.promociones
  if (filtroEstado.value === 'activa') lista = lista.filter((p) => p.activa)
  if (filtroEstado.value === 'inactiva') lista = lista.filter((p) => !p.activa)
  if (busqueda.value.trim()) {
    const q = busqueda.value.toLowerCase()
    lista = lista.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        (p.codigo ?? '').toLowerCase().includes(q) ||
        (p.descripcion ?? '').toLowerCase().includes(q),
    )
  }
  return lista
})

function tipoLabel(p: Promocion): string {
  if (p.tipo === 'porcentaje') return (p.valor ?? 0) + '%'
  if (p.tipo === 'gratis') return 'Gratis'
  return '$' + Number(p.valor ?? 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })
}

async function confirmarEliminar(id: number, nombre: string) {
  const result = await Swal.fire({
    title: '¿Eliminar promocion?',
    text: `"${nombre}" será eliminada permanentemente.`,
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
    text: 'La promocion fue eliminada.',
    icon: 'success',
    timer: 1500,
    showConfirmButton: false,
  })
}

onMounted(() => store.fetchPromociones())
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
              Promociones
            </h1>
            <p class="text-[1.3rem] text-muted dark:text-dk-muted">
              {{ store.promociones.length }} promociones registradas
            </p>
          </section>
          <button
            class="flex items-center gap-2 px-6 py-3 text-[1.3rem] font-semibold text-white bg-primary border-none cursor-pointer hover:bg-primary-dark transition-colors"
            @click="router.push({ name: 'promociones-crear' })"
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
            Nueva Promocion
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
              placeholder="Buscar por nombre, codigo..."
              class="flex-1 text-[1.3rem] text-body dark:text-dk-body bg-transparent border-none outline-none placeholder:text-muted dark:placeholder:text-dk-muted"
            />
          </search>
          <section class="flex items-center gap-2">
            <button
              v-for="f in ['todos', 'activa', 'inactiva'] as const"
              :key="f"
              class="px-4 py-2.5 text-[1.2rem] font-medium border-none cursor-pointer transition-colors"
              :class="
                filtroEstado === f
                  ? 'bg-primary text-white'
                  : 'bg-surface dark:bg-dk-surface text-muted dark:text-dk-muted border border-border dark:border-dk-border hover:text-body dark:hover:text-dk-body'
              "
              @click="filtroEstado = f"
            >
              {{ f === 'todos' ? 'Todos' : f === 'activa' ? 'Activas' : 'Inactivas' }}
            </button>
          </section>
        </nav>

        <!-- Tabla -->
        <section
          class="bg-surface dark:bg-dk-surface border border-border dark:border-dk-border overflow-hidden"
        >
          <header
            class="grid grid-cols-[1fr_10rem_10rem_8rem_10rem_6rem] gap-4 px-6 py-4 border-b border-border dark:border-dk-border max-[1200px]:hidden"
          >
            <span
              class="text-[1.1rem] font-semibold text-muted dark:text-dk-muted uppercase tracking-wider"
              >Promocion</span
            >
            <span
              class="text-[1.1rem] font-semibold text-muted dark:text-dk-muted uppercase tracking-wider"
              >Codigo</span
            >
            <span
              class="text-[1.1rem] font-semibold text-muted dark:text-dk-muted uppercase tracking-wider"
              >Descuento</span
            >
            <span
              class="text-[1.1rem] font-semibold text-muted dark:text-dk-muted uppercase tracking-wider"
              >Estado</span
            >
            <span
              class="text-[1.1rem] font-semibold text-muted dark:text-dk-muted uppercase tracking-wider"
              >Vigencia</span
            >
            <span
              class="text-[1.1rem] font-semibold text-muted dark:text-dk-muted uppercase tracking-wider text-right"
              >Acciones</span
            >
          </header>

          <article
            v-for="promo in promocionesFiltradas"
            :key="promo.id"
            class="grid grid-cols-[1fr_10rem_10rem_8rem_10rem_6rem] gap-4 px-6 py-5 border-b border-border/60 dark:border-dk-border/60 last:border-b-0 items-center hover:bg-bg dark:hover:bg-dk-bg transition-colors cursor-pointer max-[1200px]:grid-cols-1 max-[1200px]:gap-2"
            @click="router.push({ name: 'promociones-detalle', params: { id: promo.id } })"
          >
            <section>
              <p class="text-[1.3rem] font-medium text-body dark:text-dk-body">
                {{ promo.nombre }}
              </p>
              <p class="text-[1.1rem] text-muted dark:text-dk-muted mt-0.5">
                {{ promo.descripcion ?? '' }}
              </p>
            </section>
            <span class="text-[1.2rem] font-mono text-body dark:text-dk-body">{{
              promo.codigo ?? '—'
            }}</span>
            <span
              class="text-[1.3rem] font-bold"
              :class="promo.tipo === 'porcentaje' ? 'text-primary' : 'text-emerald-500'"
              >{{ tipoLabel(promo) }}</span
            >
            <span
              class="text-[1.1rem] font-medium px-3 py-1 rounded-full w-fit"
              :class="
                promo.activa
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                  : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400'
              "
              >{{ promo.activa ? 'Activa' : 'Inactiva' }}</span
            >
            <span class="text-[1.1rem] text-muted dark:text-dk-muted"
              >{{ promo.fechaInicio ?? '' }} — {{ promo.fechaFin ?? '' }}</span
            >
            <nav class="flex items-center justify-end gap-2" @click.stop>
              <button
                class="w-8 h-8 flex items-center justify-center text-muted dark:text-dk-muted hover:text-primary cursor-pointer border-none bg-transparent transition-colors"
                title="Editar"
                @click="router.push({ name: 'promociones-editar', params: { id: promo.id } })"
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
                @click="confirmarEliminar(promo.id, promo.nombre)"
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

          <section v-if="store.loading" class="px-6 py-16 text-center">
            <p class="text-[1.4rem] text-muted dark:text-dk-muted">Cargando promociones...</p>
          </section>
          <section v-else-if="store.error" class="px-6 py-16 text-center">
            <p class="text-[1.4rem] text-red-500">Error: {{ store.error }}</p>
            <button
              class="mt-4 px-6 py-2 text-[1.3rem] text-white bg-primary border-none cursor-pointer"
              @click="store.fetchPromociones()"
            >
              Reintentar
            </button>
          </section>
          <section v-else-if="promocionesFiltradas.length === 0" class="px-6 py-16 text-center">
            <p class="text-[1.4rem] text-muted dark:text-dk-muted">No se encontraron promociones</p>
          </section>
        </section>
      </main>
    </div>
  </div>
</template>

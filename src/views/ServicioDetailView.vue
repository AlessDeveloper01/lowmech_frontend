<script setup lang="ts">
import { ref, inject, onMounted, type Ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useServiciosStore, type Servicio } from '@/stores/servicios'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppTopbar from '@/components/layout/AppTopbar.vue'
import Swal from 'sweetalert2'

const router = useRouter()
const route = useRoute()
const store = useServiciosStore()

const collapsed = inject<Ref<boolean>>('sidebarCollapsed')!
const darkMode = inject<Ref<boolean>>('darkMode')!

const servicio = ref<Servicio | null>(null)
const cargando = ref(true)

async function confirmarEliminar() {
  if (!servicio.value) return
  const result = await Swal.fire({
    title: '¿Eliminar servicio?',
    text: `"${servicio.value.nombre}" será eliminado permanentemente.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
  })
  if (!result.isConfirmed) return
  try {
    await store.eliminar(servicio.value.id)
    await Swal.fire({
      title: 'Eliminado',
      text: 'El servicio fue eliminado.',
      icon: 'success',
      timer: 1500,
      showConfirmButton: false,
    })
    router.push({ name: 'servicios-lista' })
  } catch (e) {
    Swal.fire({ title: 'Error', text: (e as Error).message, icon: 'error' })
  }
}

function fmt(n: number): string {
  return n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

onMounted(async () => {
  servicio.value = await store.fetchServicio(Number(route.params.id))
  cargando.value = false
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

      <main v-else-if="servicio" class="flex-1 px-12 py-10 max-[768px]:px-5 max-[768px]:py-6">
        <header
          class="flex items-center justify-between mb-10 max-[768px]:flex-col max-[768px]:items-start max-[768px]:gap-4"
        >
          <section class="flex items-center gap-4">
            <button
              class="w-9 h-9 flex items-center justify-center text-muted dark:text-dk-muted hover:text-body dark:hover:text-dk-body cursor-pointer border-none bg-transparent transition-colors"
              @click="router.push({ name: 'servicios-lista' })"
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
            <hgroup>
              <h1
                class="text-[2.4rem] font-light text-body dark:text-dk-body tracking-[-0.02em] leading-none"
              >
                {{ servicio.nombre }}
              </h1>
              <p class="text-[1.2rem] text-muted dark:text-dk-muted">
                {{ servicio.categoria || 'Sin categoria' }} — {{ servicio.duracionMinutos }} min
              </p>
            </hgroup>
            <span
              class="text-[1.1rem] font-medium px-3 py-1 rounded-full"
              :class="
                servicio.activo
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                  : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
              "
              >{{ servicio.activo ? 'Activo' : 'Inactivo' }}</span
            >
          </section>
          <nav class="flex items-center gap-3">
            <button
              class="px-5 py-2.5 text-[1.2rem] font-medium text-primary border border-primary/30 bg-transparent cursor-pointer hover:bg-primary hover:text-white transition-colors"
              @click="router.push({ name: 'servicios-editar', params: { id: servicio.id } })"
            >
              Editar
            </button>
            <button
              class="px-5 py-2.5 text-[1.2rem] font-medium text-red-500 border border-red-200 dark:border-red-900/40 bg-transparent cursor-pointer hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              @click="confirmarEliminar"
            >
              Eliminar
            </button>
          </nav>
        </header>

        <article class="grid grid-cols-2 gap-10 max-[1200px]:grid-cols-1">
          <!-- Left -->
          <section class="flex flex-col gap-10">
            <!-- Info -->
            <section
              class="bg-surface dark:bg-dk-surface border border-border dark:border-dk-border"
            >
              <header class="px-8 py-6 border-b border-border dark:border-dk-border">
                <h2 class="text-[1.5rem] font-bold text-body dark:text-dk-body">Informacion</h2>
              </header>
              <section class="p-8">
                <dl class="grid grid-cols-2 gap-6">
                  <section>
                    <dt
                      class="text-[1.1rem] text-muted dark:text-dk-muted uppercase tracking-wider mb-1"
                    >
                      Categoria
                    </dt>
                    <dd class="text-[1.4rem] font-medium text-body dark:text-dk-body">
                      {{ servicio.categoria || '—' }}
                    </dd>
                  </section>
                  <section>
                    <dt
                      class="text-[1.1rem] text-muted dark:text-dk-muted uppercase tracking-wider mb-1"
                    >
                      Duracion
                    </dt>
                    <dd class="text-[1.4rem] font-medium text-body dark:text-dk-body">
                      {{ servicio.duracionMinutos }} minutos
                    </dd>
                  </section>
                  <section class="col-span-2">
                    <dt
                      class="text-[1.1rem] text-muted dark:text-dk-muted uppercase tracking-wider mb-1"
                    >
                      Descripcion
                    </dt>
                    <dd class="text-[1.4rem] text-body dark:text-dk-body">
                      {{ servicio.descripcion || '—' }}
                    </dd>
                  </section>
                  <section class="col-span-2">
                    <dt
                      class="text-[1.1rem] text-muted dark:text-dk-muted uppercase tracking-wider mb-1"
                    >
                      Notas
                    </dt>
                    <dd class="text-[1.4rem] text-body dark:text-dk-body">
                      {{ servicio.notas || '—' }}
                    </dd>
                  </section>
                </dl>
              </section>
            </section>

            <!-- Articulos del paquete -->
            <section
              class="bg-surface dark:bg-dk-surface border border-border dark:border-dk-border"
            >
              <header class="px-8 py-6 border-b border-border dark:border-dk-border">
                <h2 class="text-[1.5rem] font-bold text-body dark:text-dk-body">
                  Articulos del Paquete ({{ servicio.items?.length ?? 0 }})
                </h2>
              </header>
              <section v-if="servicio.items && servicio.items.length > 0" class="overflow-x-auto">
                <table class="w-full">
                  <thead class="border-b border-border dark:border-dk-border">
                    <tr class="grid grid-cols-[2fr_8rem_10rem_10rem] gap-4 px-8 py-4">
                      <th
                        class="text-[1.1rem] font-semibold text-muted dark:text-dk-muted uppercase tracking-wider text-left"
                      >
                        Articulo
                      </th>
                      <th
                        class="text-[1.1rem] font-semibold text-muted dark:text-dk-muted uppercase tracking-wider text-center"
                      >
                        Cantidad
                      </th>
                      <th
                        class="text-[1.1rem] font-semibold text-muted dark:text-dk-muted uppercase tracking-wider text-right"
                      >
                        P. Unitario
                      </th>
                      <th
                        class="text-[1.1rem] font-semibold text-muted dark:text-dk-muted uppercase tracking-wider text-right"
                      >
                        Subtotal
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="item in servicio.items"
                      :key="item.id"
                      class="grid grid-cols-[2fr_8rem_10rem_10rem] gap-4 px-8 py-4 border-b border-border/30 dark:border-dk-border/30 items-center"
                    >
                      <td>
                        <p class="text-[1.3rem] font-medium text-body dark:text-dk-body">
                          {{ item.articulo?.nombre ?? 'Articulo eliminado' }}
                        </p>
                        <p class="text-[1.1rem] text-muted dark:text-dk-muted">
                          {{ item.articulo?.sku ?? '' }} — {{ item.articulo?.categoria ?? '' }}
                        </p>
                      </td>
                      <td class="text-[1.3rem] text-body dark:text-dk-body text-center">
                        {{ item.cantidad }}
                      </td>
                      <td class="text-[1.3rem] text-body dark:text-dk-body text-right font-mono">
                        ${{ fmt(item.articulo?.precioVenta ?? 0) }}
                      </td>
                      <td
                        class="text-[1.3rem] text-body dark:text-dk-body text-right font-mono font-semibold"
                      >
                        ${{ fmt((item.articulo?.precioVenta ?? 0) * item.cantidad) }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </section>
              <p v-else class="px-8 py-10 text-[1.3rem] text-muted dark:text-dk-muted text-center">
                Este servicio no tiene articulos asignados
              </p>
            </section>
          </section>

          <!-- Right - Costos -->
          <section class="flex flex-col gap-10">
            <section
              class="bg-surface dark:bg-dk-surface border border-border dark:border-dk-border"
            >
              <header class="px-8 py-6 border-b border-border dark:border-dk-border">
                <h2 class="text-[1.5rem] font-bold text-body dark:text-dk-body">Costos</h2>
              </header>
              <section class="p-8">
                <dl class="flex flex-col gap-5">
                  <section class="flex justify-between">
                    <dt class="text-[1.3rem] text-muted dark:text-dk-muted">Mano de Obra</dt>
                    <dd class="text-[1.4rem] font-mono text-body dark:text-dk-body">
                      ${{ fmt(servicio.precioManoObra) }}
                    </dd>
                  </section>
                  <section class="flex justify-between">
                    <dt class="text-[1.3rem] text-muted dark:text-dk-muted">Materiales</dt>
                    <dd class="text-[1.4rem] font-mono text-body dark:text-dk-body">
                      ${{ fmt(store.costoMateriales(servicio)) }}
                    </dd>
                  </section>
                  <hr class="border-border dark:border-dk-border" />
                  <section class="flex justify-between">
                    <dt class="text-[1.6rem] font-bold text-body dark:text-dk-body">Total</dt>
                    <dd class="text-[1.8rem] font-bold font-mono text-primary">
                      ${{ fmt(store.costoTotal(servicio)) }}
                    </dd>
                  </section>
                </dl>
              </section>
            </section>

            <section
              class="bg-surface dark:bg-dk-surface border border-border dark:border-dk-border"
            >
              <header class="px-8 py-6 border-b border-border dark:border-dk-border">
                <h2 class="text-[1.5rem] font-bold text-body dark:text-dk-body">Detalles</h2>
              </header>
              <section class="p-8">
                <dl class="flex flex-col gap-5">
                  <section>
                    <dt
                      class="text-[1.1rem] text-muted dark:text-dk-muted uppercase tracking-wider mb-1"
                    >
                      Creado
                    </dt>
                    <dd class="text-[1.3rem] text-body dark:text-dk-body">
                      {{
                        new Date(servicio.createdAt).toLocaleDateString('es-MX', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      }}
                    </dd>
                  </section>
                  <section>
                    <dt
                      class="text-[1.1rem] text-muted dark:text-dk-muted uppercase tracking-wider mb-1"
                    >
                      Actualizado
                    </dt>
                    <dd class="text-[1.3rem] text-body dark:text-dk-body">
                      {{
                        new Date(servicio.updatedAt).toLocaleDateString('es-MX', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      }}
                    </dd>
                  </section>
                </dl>
              </section>
            </section>
          </section>
        </article>
      </main>

      <!-- Not found -->
      <main v-else class="flex-1 flex items-center justify-center">
        <section class="text-center">
          <p class="text-[1.6rem] text-muted dark:text-dk-muted mb-4">Servicio no encontrado</p>
          <button
            class="px-6 py-3 text-[1.3rem] font-medium text-primary border border-primary/30 bg-transparent cursor-pointer hover:bg-primary hover:text-white transition-colors"
            @click="router.push({ name: 'servicios-lista' })"
          >
            Volver a Servicios
          </button>
        </section>
      </main>
    </div>
  </div>
</template>

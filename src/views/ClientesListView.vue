<script setup lang="ts">
import { ref, computed, inject, onMounted, type Ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useClientesStore, type Cliente } from '@/stores/clientes'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppTopbar from '@/components/layout/AppTopbar.vue'
import Swal from 'sweetalert2'

const router = useRouter()
const route = useRoute()
const store = useClientesStore()

const collapsed = inject<Ref<boolean>>('sidebarCollapsed')!
const darkMode = inject<Ref<boolean>>('darkMode')!

const busqueda = ref('')

// Determinar el prefijo de ruta según el rol actual
const routePrefix = computed(() => {
  if (String(route.name).startsWith('recepcionista')) return 'recepcionista-'
  return ''
})

const clientesFiltrados = computed(() => {
  let lista = store.clientes
  if (busqueda.value.trim()) {
    const q = busqueda.value.toLowerCase()
    lista = lista.filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.telefono.toLowerCase().includes(q),
    )
  }
  return lista
})

async function confirmarEliminar(cliente: Cliente) {
  const result = await Swal.fire({
    title: '¿Eliminar cliente?',
    text: `${cliente.nombre} será eliminado permanentemente.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
  })
  if (!result.isConfirmed) return
  const ok = await store.eliminar(cliente.id)
  if (ok) {
    Swal.fire({
      title: 'Eliminado',
      text: 'El cliente fue eliminado.',
      icon: 'success',
      timer: 1500,
      showConfirmButton: false,
    })
  } else {
    Swal.fire({ title: 'Error', text: store.error ?? 'No se pudo eliminar.', icon: 'error' })
  }
}

function fmtFecha(fecha: string): string {
  if (!fecha) return '--'
  const d = new Date(fecha)
  if (isNaN(d.getTime())) return '--'
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

onMounted(() => store.fetchClientes())
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
              Clientes
            </h1>
            <p class="text-[1.3rem] text-muted dark:text-dk-muted">
              {{ store.clientes.length }} clientes registrados
            </p>
          </section>
          <button
            class="flex items-center gap-2 px-6 py-3 text-[1.3rem] font-semibold text-white bg-primary border-none cursor-pointer hover:bg-primary-dark transition-colors"
            @click="router.push({ name: `${routePrefix}clientes-crear` })"
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
            Nuevo Cliente
          </button>
        </header>

        <!-- Búsqueda -->
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
              placeholder="Buscar por nombre, email, telefono..."
              class="flex-1 text-[1.3rem] text-body dark:text-dk-body bg-transparent border-none outline-none placeholder:text-muted dark:placeholder:text-dk-muted"
            />
          </search>
        </nav>

        <!-- Tabla -->
        <section
          class="bg-surface dark:bg-dk-surface border border-border dark:border-dk-border overflow-hidden"
        >
          <header
            class="grid grid-cols-[1fr_1fr_1fr_12rem_8rem] gap-4 px-6 py-4 border-b border-border dark:border-dk-border max-[1200px]:hidden"
          >
            <span
              class="text-[1.1rem] font-semibold text-muted dark:text-dk-muted uppercase tracking-wider"
              >Nombre</span
            >
            <span
              class="text-[1.1rem] font-semibold text-muted dark:text-dk-muted uppercase tracking-wider"
              >Email</span
            >
            <span
              class="text-[1.1rem] font-semibold text-muted dark:text-dk-muted uppercase tracking-wider"
              >Telefono</span
            >
            <span
              class="text-[1.1rem] font-semibold text-muted dark:text-dk-muted uppercase tracking-wider"
              >Registro</span
            >
            <span
              class="text-[1.1rem] font-semibold text-muted dark:text-dk-muted uppercase tracking-wider text-right"
              >Acciones</span
            >
          </header>

          <article
            v-for="cliente in clientesFiltrados"
            :key="cliente.id"
            class="grid grid-cols-[1fr_1fr_1fr_12rem_8rem] gap-4 px-6 py-5 border-b border-border/60 dark:border-dk-border/60 last:border-b-0 items-center hover:bg-bg dark:hover:bg-dk-bg transition-colors cursor-pointer max-[1200px]:grid-cols-1 max-[1200px]:gap-2"
            @click="router.push({ name: `${routePrefix}clientes-detalle`, params: { id: cliente.id } })"
          >
            <section>
              <p class="text-[1.3rem] font-medium text-body dark:text-dk-body">
                {{ cliente.nombre }}
              </p>
              <p class="text-[1.1rem] text-muted dark:text-dk-muted mt-0.5">
                ID: {{ cliente.id }}
              </p>
            </section>
            <span class="text-[1.3rem] text-body dark:text-dk-body">{{ cliente.email }}</span>
            <span class="text-[1.3rem] text-body dark:text-dk-body">{{ cliente.telefono }}</span>
            <span class="text-[1.2rem] text-muted dark:text-dk-muted">{{
              fmtFecha(cliente.createdAt)
            }}</span>
            <nav class="flex items-center justify-end gap-2" @click.stop>
              <button
                class="w-8 h-8 flex items-center justify-center text-muted dark:text-dk-muted hover:text-primary cursor-pointer border-none bg-transparent transition-colors"
                title="Editar"
                @click="
                  router.push({ name: `${routePrefix}clientes-editar`, params: { id: cliente.id } })
                "
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
                @click="confirmarEliminar(cliente)"
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

          <section v-if="clientesFiltrados.length === 0" class="px-6 py-16 text-center">
            <p class="text-[1.4rem] text-muted dark:text-dk-muted">No se encontraron clientes</p>
          </section>
        </section>
      </main>
    </div>
  </div>
</template>

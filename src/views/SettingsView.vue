<script setup lang="ts">
import { inject, ref, computed, onMounted, type Ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useOrdenesStore } from '@/stores/ordenes'
import { useVehiculosStore } from '@/stores/vehiculos'
import { useClientesStore } from '@/stores/clientes'
import { useInventarioStore } from '@/stores/inventario'
import { useConfiguracionStore } from '@/stores/configuracion'
import { api } from '@/services/api'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppTopbar from '@/components/layout/AppTopbar.vue'
import Swal from 'sweetalert2'

const router = useRouter()
const auth = useAuthStore()
const collapsed = inject<Ref<boolean>>('sidebarCollapsed')!
const darkMode = inject<Ref<boolean>>('darkMode')!

const ordStore = useOrdenesStore()
const vehStore = useVehiculosStore()
const cliStore = useClientesStore()
const invStore = useInventarioStore()
const cfgStore = useConfiguracionStore()

// Formulario local sincronizado con el store
const form = ref({
  tallerNombre: '',
  tallerDireccion: '',
  tallerTelefono: '',
  tallerEmail: '',
  iva: 16,
  moneda: 'MXN',
})

onMounted(async () => {
  await cfgStore.fetchConfig()
  // Sincronizar form con store
  form.value = { ...cfgStore.config }
  // Cargar conteos
  await Promise.all([
    ordStore.fetchOrdenes?.(),
    vehStore.fetchVehiculos?.(),
    cliStore.fetchClientes?.(),
    invStore.fetchItems?.(),
  ]).catch(() => {})
})

async function guardar() {
  try {
    await cfgStore.guardar({ ...form.value })
    Swal.fire({
      title: 'Guardado',
      text: 'La configuracion se guardó correctamente.',
      icon: 'success',
      timer: 1500,
      showConfirmButton: false,
    })
  } catch {
    Swal.fire({ title: 'Error', text: 'No se pudo guardar.', icon: 'error' })
  }
}

const datosSistema = computed(() => [
  { label: 'Ordenes', tipo: 'ordenes', count: ordStore.totalOrdenes ?? 0 },
  { label: 'Vehiculos', tipo: 'vehiculos', count: vehStore.totalVehiculos ?? 0 },
  { label: 'Clientes', tipo: 'clientes', count: cliStore.totalClientes ?? 0 },
  { label: 'Inventario', tipo: 'inventario', count: invStore.totalItems ?? 0 },
])

async function limpiarDatos(tipo: string, label: string) {
  const result = await Swal.fire({
    title: '¿Eliminar datos?',
    text: `Esto eliminará TODOS los registros de ${label}. Esta acción no se puede deshacer.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
  })
  if (!result.isConfirmed) return
  try {
    await api.delete(`/configuracion/reset/${tipo}`)
    // Refrescar el store correspondiente
    if (tipo === 'ordenes') await ordStore.fetchOrdenes?.()
    if (tipo === 'vehiculos') await vehStore.fetchVehiculos?.()
    if (tipo === 'clientes') await cliStore.fetchClientes?.()
    if (tipo === 'inventario') await invStore.fetchItems?.()
    Swal.fire({
      title: 'Eliminado',
      text: `Datos de ${label} eliminados.`,
      icon: 'success',
      timer: 1500,
      showConfirmButton: false,
    })
  } catch {
    Swal.fire({ title: 'Error', text: 'No se pudo eliminar los datos.', icon: 'error' })
  }
}

async function limpiarTodo() {
  const result = await Swal.fire({
    title: '¿Eliminar TODO?',
    text: 'Esto eliminará TODOS los datos del sistema. Esta acción no se puede deshacer.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Sí, eliminar todo',
    cancelButtonText: 'Cancelar',
  })
  if (!result.isConfirmed) return
  try {
    await api.delete('/configuracion/reset/todo')
    await Promise.all([
      ordStore.fetchOrdenes?.(),
      vehStore.fetchVehiculos?.(),
      cliStore.fetchClientes?.(),
      invStore.fetchItems?.(),
    ]).catch(() => {})
    Swal.fire({
      title: 'Hecho',
      text: 'Todos los datos fueron eliminados.',
      icon: 'success',
      timer: 1800,
      showConfirmButton: false,
    })
  } catch {
    Swal.fire({ title: 'Error', text: 'No se pudo completar la operación.', icon: 'error' })
  }
}

function cerrarSesion() {
  auth.logout()
  router.push({ name: 'login' })
}

const inputClass =
  'px-4 py-3 text-[1.4rem] text-body dark:text-dk-body bg-surface dark:bg-dk-surface border border-border dark:border-dk-border outline-none focus:border-primary transition-colors'
</script>

<template>
  <main class="min-h-screen bg-bg dark:bg-dk-bg transition-colors duration-300">
    <AppSidebar />
    <section
      class="min-h-screen flex flex-col transition-all duration-300 ease-out max-[768px]:ml-0"
      :class="collapsed ? 'ml-[6.4rem]' : 'ml-[22rem]'"
    >
      <AppTopbar :dark-mode="darkMode" @toggle-dark="darkMode = !darkMode" />

      <article class="flex-1 px-12 py-10 max-[768px]:px-5 max-[768px]:py-6">
        <header class="mb-14">
          <h1
            class="text-[3.2rem] font-extralight text-body dark:text-dk-body tracking-[-0.03em] leading-none mb-2"
          >
            Configuracion
          </h1>
          <p class="text-[1.3rem] text-muted dark:text-dk-muted">Ajustes del sistema</p>
        </header>

        <section class="grid grid-cols-[1fr_30rem] gap-10 max-[1200px]:grid-cols-1">
          <!-- Left -->
          <article class="flex flex-col gap-10">
            <!-- Datos del taller -->
            <section
              class="bg-surface dark:bg-dk-surface border border-border dark:border-dk-border p-10"
            >
              <h2 class="text-[1.6rem] font-bold text-body dark:text-dk-body mb-8">
                Datos del Taller
              </h2>
              <form class="grid grid-cols-2 gap-6 max-[480px]:grid-cols-1">
                <fieldset class="flex flex-col gap-1.5 col-span-2 max-[480px]:col-span-1">
                  <label class="text-[1.2rem] font-medium text-body dark:text-dk-body"
                    >Nombre del taller</label
                  >
                  <input v-model="form.tallerNombre" type="text" :class="inputClass" />
                </fieldset>
                <fieldset class="flex flex-col gap-1.5 col-span-2 max-[480px]:col-span-1">
                  <label class="text-[1.2rem] font-medium text-body dark:text-dk-body"
                    >Direccion</label
                  >
                  <input v-model="form.tallerDireccion" type="text" :class="inputClass" />
                </fieldset>
                <fieldset class="flex flex-col gap-1.5">
                  <label class="text-[1.2rem] font-medium text-body dark:text-dk-body"
                    >Telefono</label
                  >
                  <input v-model="form.tallerTelefono" type="text" :class="inputClass" />
                </fieldset>
                <fieldset class="flex flex-col gap-1.5">
                  <label class="text-[1.2rem] font-medium text-body dark:text-dk-body">Email</label>
                  <input v-model="form.tallerEmail" type="email" :class="inputClass" />
                </fieldset>
              </form>
            </section>

            <!-- Facturacion -->
            <section
              class="bg-surface dark:bg-dk-surface border border-border dark:border-dk-border p-10"
            >
              <h2 class="text-[1.6rem] font-bold text-body dark:text-dk-body mb-8">Facturacion</h2>
              <form class="grid grid-cols-2 gap-6 max-[480px]:grid-cols-1">
                <fieldset class="flex flex-col gap-1.5">
                  <label class="text-[1.2rem] font-medium text-body dark:text-dk-body"
                    >IVA (%)</label
                  >
                  <input
                    v-model.number="form.iva"
                    type="number"
                    min="0"
                    max="100"
                    :class="inputClass"
                  />
                </fieldset>
                <fieldset class="flex flex-col gap-1.5">
                  <label class="text-[1.2rem] font-medium text-body dark:text-dk-body"
                    >Moneda</label
                  >
                  <select v-model="form.moneda" :class="inputClass">
                    <option value="MXN">MXN - Peso Mexicano</option>
                    <option value="USD">USD - Dolar</option>
                    <option value="EUR">EUR - Euro</option>
                  </select>
                </fieldset>
              </form>
            </section>

            <!-- Tema -->
            <section
              class="bg-surface dark:bg-dk-surface border border-border dark:border-dk-border p-10"
            >
              <h2 class="text-[1.6rem] font-bold text-body dark:text-dk-body mb-8">Apariencia</h2>
              <article class="flex items-center justify-between">
                <header>
                  <p class="text-[1.4rem] font-medium text-body dark:text-dk-body">Modo oscuro</p>
                  <p class="text-[1.2rem] text-muted dark:text-dk-muted">
                    Cambiar entre tema claro y oscuro
                  </p>
                </header>
                <button
                  class="relative w-[4.6rem] h-[2.4rem] rounded-full cursor-pointer border-none transition-colors duration-300"
                  :class="darkMode ? 'bg-primary' : 'bg-border dark:bg-dk-border'"
                  @click="darkMode = !darkMode"
                >
                  <span
                    class="absolute top-[0.3rem] w-[1.8rem] h-[1.8rem] rounded-full bg-white shadow-sm transition-all duration-300"
                    :class="darkMode ? 'left-[2.5rem]' : 'left-[0.3rem]'"
                  ></span>
                </button>
              </article>
            </section>

            <!-- Guardar -->
            <footer class="flex items-center gap-4">
              <button
                class="px-8 py-3 text-[1.3rem] font-semibold text-white bg-primary border-none cursor-pointer hover:bg-primary-dark transition-colors"
                :disabled="cfgStore.guardando"
                @click="guardar"
              >
                {{ cfgStore.guardando ? 'Guardando...' : 'Guardar Cambios' }}
              </button>
            </footer>
          </article>

          <!-- Right: datos y sistema -->
          <aside class="flex flex-col gap-10">
            <!-- Usuario -->
            <section
              class="bg-surface dark:bg-dk-surface border border-border dark:border-dk-border p-8"
            >
              <h3 class="text-[1.4rem] font-bold text-body dark:text-dk-body mb-5">Sesion</h3>
              <article
                class="flex items-center gap-4 mb-5 pb-5 border-b border-border dark:border-dk-border"
              >
                <span
                  class="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center text-[1.4rem] font-semibold shrink-0"
                >
                  {{
                    auth.user?.username
                      ?.split(' ')
                      .map((w) => w.charAt(0))
                      .slice(0, 2)
                      .join('') ?? 'U'
                  }}
                </span>
                <header>
                  <p class="text-[1.3rem] font-semibold text-body dark:text-dk-body">
                    {{ auth.user?.username }}
                  </p>
                  <p class="text-[1.1rem] text-muted dark:text-dk-muted">{{ auth.user?.email }}</p>
                </header>
              </article>
              <button
                class="w-full px-4 py-3 text-[1.3rem] font-medium text-red-500 bg-transparent border border-red-200 dark:border-red-900/40 cursor-pointer hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                @click="cerrarSesion"
              >
                Cerrar Sesion
              </button>
            </section>

            <!-- Almacenamiento -->
            <section
              class="bg-surface dark:bg-dk-surface border border-border dark:border-dk-border p-8"
            >
              <h3 class="text-[1.4rem] font-bold text-body dark:text-dk-body mb-5">
                Base de datos
              </h3>
              <ul class="flex flex-col gap-4">
                <li
                  v-for="info in datosSistema"
                  :key="info.tipo"
                  class="flex items-center justify-between py-3 border-b border-border/60 dark:border-dk-border/60 last:border-b-0"
                >
                  <article>
                    <p class="text-[1.2rem] font-medium text-body dark:text-dk-body">
                      {{ info.label }}
                    </p>
                    <p class="text-[1rem] text-muted dark:text-dk-muted">
                      {{ info.count }} registros
                    </p>
                  </article>
                  <button
                    class="text-[1.1rem] font-medium text-red-500 bg-transparent border-none cursor-pointer hover:opacity-70 transition-opacity"
                    @click="limpiarDatos(info.tipo, info.label)"
                  >
                    Limpiar
                  </button>
                </li>
              </ul>
            </section>

            <!-- Zona peligrosa -->
            <section
              class="bg-surface dark:bg-dk-surface border border-red-200 dark:border-red-900/40 p-8"
            >
              <h3 class="text-[1.4rem] font-bold text-red-500 mb-5">Zona Peligrosa</h3>
              <p class="text-[1.2rem] text-muted dark:text-dk-muted mb-5">
                Esta accion eliminara todos los datos del sistema de forma permanente.
              </p>
              <button
                class="w-full px-4 py-3 text-[1.3rem] font-semibold text-white bg-red-500 border-none cursor-pointer hover:bg-red-600 transition-colors"
                @click="limpiarTodo"
              >
                Eliminar Todos los Datos
              </button>
            </section>

            <!-- Info sistema -->
            <section
              class="bg-surface dark:bg-dk-surface border border-border dark:border-dk-border p-8"
            >
              <h3 class="text-[1.4rem] font-bold text-body dark:text-dk-body mb-5">Sistema</h3>
              <dl class="flex flex-col gap-3">
                <article class="flex justify-between">
                  <dt class="text-[1.2rem] text-muted dark:text-dk-muted">Version</dt>
                  <dd class="text-[1.2rem] font-medium text-body dark:text-dk-body">1.0.0</dd>
                </article>
                <article class="flex justify-between">
                  <dt class="text-[1.2rem] text-muted dark:text-dk-muted">Framework</dt>
                  <dd class="text-[1.2rem] font-medium text-body dark:text-dk-body">
                    Vue 3 + TypeScript
                  </dd>
                </article>
                <article class="flex justify-between">
                  <dt class="text-[1.2rem] text-muted dark:text-dk-muted">Almacen</dt>
                  <dd class="text-[1.2rem] font-medium text-body dark:text-dk-body">
                    SQLite (NestJS Backend)
                  </dd>
                </article>
              </dl>
            </section>
          </aside>
        </section>
      </article>
    </section>
  </main>
</template>

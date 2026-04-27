<script setup lang="ts">
import { ref, computed, inject, onMounted, type Ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useClientesStore, type Cliente } from '@/stores/clientes'
import { useVehiculosStore } from '@/stores/vehiculos'
import { useOrdenesStore, calcularTotal, type Orden, type OrdenLinea } from '@/stores/ordenes'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppTopbar from '@/components/layout/AppTopbar.vue'
import Swal from 'sweetalert2'

const router = useRouter()
const route = useRoute()
const cliStore = useClientesStore()
const vehStore = useVehiculosStore()
const ordStore = useOrdenesStore()

// Determinar prefijo de ruta según el rol
const routePrefix = computed(() => {
  if (String(route.name).startsWith('recepcionista')) return 'recepcionista-'
  return ''
})

const clientesListRoute = computed(() =>
  String(route.name).startsWith('recepcionista') ? 'recepcionista-clientes' : 'clientes-lista'
)
const vehiculosDetalleRoute = computed(() => `${routePrefix.value}vehiculos-detalle`)
const ordenesDetalleRoute = computed(() => `${routePrefix.value}ordenes-detalle`)
const ordenesCrearRoute = computed(() => `${routePrefix.value}ordenes-crear`)
const vehiculosCrearRoute = computed(() => `${routePrefix.value}vehiculos-crear`)
const clientesEditarRoute = computed(() => `${routePrefix.value}clientes-editar`)

const collapsed = inject<Ref<boolean>>('sidebarCollapsed')!
const darkMode = inject<Ref<boolean>>('darkMode')!

const cliente = ref<Cliente | null>(null)
const cargando = ref(true)

onMounted(async () => {
  cargando.value = true
  const clienteId = Number(route.params.id)
  const [c] = await Promise.all([
    cliStore.fetchCliente(clienteId),
    vehStore.fetchVehiculos(),
    ordStore.fetchOrdenes(),
  ])
  cliente.value = c
  cargando.value = false
})

function normalizarTexto(valor?: string | null): string {
  return (valor ?? '').trim().toLowerCase()
}

const vehiculosDelCliente = computed(() => {
  if (!cliente.value) return []
  const nombre = normalizarTexto(cliente.value.nombre)
  const email = normalizarTexto(cliente.value.email)
  const telefono = normalizarTexto(cliente.value.telefono)

  return vehStore.vehiculos.filter((v) => {
    const nombreVehiculo = normalizarTexto(v.clienteNombre)
    const emailVehiculo = normalizarTexto(v.clienteEmail)
    const telefonoVehiculo = normalizarTexto(v.clienteTelefono)

    return (
      (email && emailVehiculo === email) ||
      (telefono && telefonoVehiculo === telefono) ||
      (nombre && nombreVehiculo === nombre)
    )
  })
})

const ordenesDelCliente = computed(() => {
  if (!cliente.value) return []
  const clienteId = cliente.value.id
  const nombre = normalizarTexto(cliente.value.nombre)
  const email = normalizarTexto(cliente.value.email)

  return ordStore.ordenes.filter((o) => {
    const orden = o as Orden & { clienteNombre?: string; clienteEmail?: string }
    const idDirecto = orden.clienteId === clienteId
    const idRelacionado = orden.cliente?.id === clienteId
    const nombreLegacy = normalizarTexto(orden.clienteNombre) === nombre
    const nombreRelacionado = normalizarTexto(orden.cliente?.nombre) === nombre
    const emailLegacy = normalizarTexto(orden.clienteEmail) === email
    const emailRelacionado = normalizarTexto(orden.cliente?.email) === email

    return (
      idDirecto ||
      idRelacionado ||
      (nombre && (nombreLegacy || nombreRelacionado)) ||
      (email && (emailLegacy || emailRelacionado))
    )
  })
})

function obtenerLineasDeOrden(orden: Orden): OrdenLinea[] {
  const ordenLegacy = orden as Orden & { servicios?: OrdenLinea[] }
  if (Array.isArray(orden.lineas)) return orden.lineas
  if (Array.isArray(ordenLegacy.servicios)) return ordenLegacy.servicios
  return []
}

function nombreVehiculoOrden(orden: Orden): string {
  const ordenLegacy = orden as Orden & { vehiculoNombre?: string }
  return orden.vehiculo?.nombre ?? ordenLegacy.vehiculoNombre ?? `Orden #${orden.id}`
}

function totalOrden(orden: Orden): number {
  const lineas = obtenerLineasDeOrden(orden)
  return calcularTotal(lineas, orden.descuento ?? 0)
}

function resumenLineasOrden(orden: Orden): string {
  const lineas = obtenerLineasDeOrden(orden)
  if (lineas.length === 0) return `Orden #${orden.id}`

  return lineas.map((linea) => `${linea.descripcion} x${linea.cantidad}`).join(' · ')
}

function diaFecha(fecha?: string): string {
  if (!fecha) return '--'
  const [anio, mes, dia] = fecha.split('-')
  if (!anio || !mes || !dia) return '--'
  return dia
}

function mesFecha(fecha?: string): string {
  if (!fecha) return '---'
  const parsed = new Date(fecha)
  if (Number.isNaN(parsed.getTime())) return '---'
  return parsed.toLocaleDateString('es-MX', { month: 'short' })
}

const totalGastado = computed(() =>
  ordenesDelCliente.value
    .filter((o) => ['completado', 'entregado'].includes(o.estado))
    .reduce((s, o) => s + totalOrden(o), 0),
)

async function confirmarEliminar() {
  if (!cliente.value) return
  const result = await Swal.fire({
    title: '¿Eliminar cliente?',
    text: `"${cliente.value.nombre}" será eliminado permanentemente.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
  })
  if (!result.isConfirmed) return
  const ok = await cliStore.eliminar(cliente.value.id)
  if (ok) {
    await Swal.fire({
      title: 'Eliminado',
      text: 'El cliente fue eliminado.',
      icon: 'success',
      timer: 1500,
      showConfirmButton: false,
    })
    router.push({ name: 'clientes-lista' })
  } else {
    Swal.fire({ title: 'Error', text: cliStore.error ?? 'No se pudo eliminar.', icon: 'error' })
  }
}

function fmt(n: number): string {
  return n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
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

      <main v-if="cliente" class="flex-1 px-12 py-10 max-[768px]:px-5 max-[768px]:py-6">
        <!-- Page Header -->
        <header
          class="flex items-center justify-between mb-10 max-[768px]:flex-col max-[768px]:items-start max-[768px]:gap-4"
        >
          <nav class="flex items-center gap-4">
              <button
                class="w-9 h-9 flex items-center justify-center text-muted dark:text-dk-muted hover:text-body dark:hover:text-dk-body cursor-pointer border-none bg-transparent transition-colors"
                @click="router.push({ name: clientesListRoute })"
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
            <section class="flex items-center gap-4">
              <span
                class="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center text-[1.4rem] font-semibold shrink-0"
                >{{
                  cliente.nombre
                    .split(' ')
                    .map((w) => w.charAt(0))
                    .slice(0, 2)
                    .join('')
                }}</span
              >
              <hgroup>
                <h1
                  class="text-[2.4rem] font-light text-body dark:text-dk-body tracking-[-0.02em] leading-none"
                >
                  {{ cliente.nombre }}
                </h1>
                <p class="text-[1.2rem] text-muted dark:text-dk-muted">{{ cliente.id }}</p>
              </hgroup>
            </section>
          </nav>
          <nav class="flex items-center gap-3">
              <button
                class="px-5 py-2.5 text-[1.2rem] font-medium text-primary border border-primary/30 bg-transparent cursor-pointer hover:bg-primary hover:text-white transition-colors"
                @click="router.push({ name: clientesEditarRoute, params: { id: cliente.id } })"
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

        <!-- 2 columns layout -->
        <section class="grid grid-cols-2 gap-10 max-[1200px]:grid-cols-1">
          <!-- Primary content -->
          <section class="flex flex-col gap-10">
            <!-- Client Information -->
            <section
              class="bg-surface dark:bg-dk-surface border border-border dark:border-dk-border"
            >
              <header class="px-8 py-6 border-b border-border dark:border-dk-border">
                <h2 class="text-[1.5rem] font-bold text-body dark:text-dk-body">
                  Informacion del Cliente
                </h2>
              </header>
              <dl class="p-8 grid grid-cols-2 gap-6">
                <p>
                  <dt
                    class="text-[1.1rem] text-muted dark:text-dk-muted uppercase tracking-wider mb-1"
                  >
                    Telefono
                  </dt>
                  <dd class="text-[1.4rem] font-medium text-body dark:text-dk-body">
                    {{ cliente.telefono }}
                  </dd>
                </p>
                <p>
                  <dt
                    class="text-[1.1rem] text-muted dark:text-dk-muted uppercase tracking-wider mb-1"
                  >
                    Email
                  </dt>
                  <dd class="text-[1.4rem] font-medium text-body dark:text-dk-body">
                    {{ cliente.email }}
                  </dd>
                </p>
                <p class="col-span-2">
                  <dt
                    class="text-[1.1rem] text-muted dark:text-dk-muted uppercase tracking-wider mb-1"
                  >
                    Direccion
                  </dt>
                  <dd class="text-[1.4rem] font-medium text-body dark:text-dk-body">
                    {{ cliente.direccion || '—' }}
                  </dd>
                </p>
                <p>
                  <dt
                    class="text-[1.1rem] text-muted dark:text-dk-muted uppercase tracking-wider mb-1"
                  >
                    RFC
                  </dt>
                  <dd class="text-[1.4rem] font-medium text-body dark:text-dk-body">
                    {{ cliente.rfc || '—' }}
                  </dd>
                </p>
              </dl>
            </section>

            <!-- Client Notes -->
            <section
              v-if="cliente.notas"
              class="bg-surface dark:bg-dk-surface border border-border dark:border-dk-border"
            >
              <header class="px-8 py-6 border-b border-border dark:border-dk-border">
                <h2 class="text-[1.5rem] font-bold text-body dark:text-dk-body">Notas</h2>
              </header>
              <article class="p-8">
                <p class="text-[1.4rem] text-body dark:text-dk-body leading-relaxed">
                  {{ cliente.notas }}
                </p>
              </article>
            </section>

            <!-- Client Vehicles -->
            <section
              class="bg-surface dark:bg-dk-surface border border-border dark:border-dk-border"
            >
              <header class="px-8 py-6 border-b border-border dark:border-dk-border">
                <h2 class="text-[1.5rem] font-bold text-body dark:text-dk-body">Vehiculos</h2>
              </header>
              <section class="p-8">
                <p
                  v-if="vehiculosDelCliente.length === 0"
                  class="py-8 text-center text-[1.3rem] text-muted dark:text-dk-muted"
                >
                  Sin vehiculos registrados
                </p>
                <ul v-else class="flex flex-col gap-3">
                  <li v-for="v in vehiculosDelCliente" :key="v.id">
                    <article
                      class="flex items-center gap-5 py-4 border-b border-border/60 dark:border-dk-border/60 last:border-b-0 cursor-pointer hover:bg-bg dark:hover:bg-dk-bg -mx-4 px-4 transition-colors"
                      @click="router.push({ name: vehiculosDetalleRoute, params: { id: v.id } })"
                    >
                      <figure
                        class="w-10 h-10 bg-subtle dark:bg-dk-subtle flex items-center justify-center shrink-0 text-muted dark:text-dk-muted"
                      >
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="1.5"
                        >
                          <path
                            d="M14 16H9m10 0h3l-2-7H4l-2 7h3m4 0a2 2 0 104 0m4 0a2 2 0 104 0M5.5 9l1.5-4h10l1.5 4"
                          />
                        </svg>
                      </figure>
                      <section class="flex-1">
                        <p class="text-[1.3rem] font-medium text-body dark:text-dk-body">
                          {{ v.nombre }}
                        </p>
                        <p class="text-[1.1rem] text-muted dark:text-dk-muted">
                          {{ v.placa }} — {{ v.kilometraje.toLocaleString() }} km
                        </p>
                      </section>
                      <span
                        class="text-[1.1rem] font-medium px-2.5 py-1 rounded-full"
                        :class="
                          v.estado === 'en_taller'
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
                            : v.estado === 'disponible'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                        "
                      >
                        {{
                          v.estado === 'en_taller'
                            ? 'En taller'
                            : v.estado === 'disponible'
                              ? 'Disponible'
                              : 'En espera'
                        }}
                      </span>
                    </article>
                  </li>
                </ul>
              </section>
            </section>

            <!-- Service History -->
            <section
              class="bg-surface dark:bg-dk-surface border border-border dark:border-dk-border"
            >
              <header class="px-8 py-6 border-b border-border dark:border-dk-border">
                <h2 class="text-[1.5rem] font-bold text-body dark:text-dk-body">
                  Historial de Servicios
                </h2>
              </header>
              <section class="p-8">
                <p
                  v-if="ordenesDelCliente.length === 0"
                  class="py-8 text-center text-[1.3rem] text-muted dark:text-dk-muted"
                >
                  Sin servicios registrados
                </p>
                <ul v-else class="flex flex-col">
                  <li v-for="o in ordenesDelCliente" :key="o.id">
                    <article
                      class="flex gap-6 py-5 border-b border-border/60 dark:border-dk-border/60 last:border-b-0 cursor-pointer hover:bg-bg dark:hover:bg-dk-bg -mx-4 px-4 transition-colors"
                      @click="router.push({ name: ordenesDetalleRoute, params: { id: o.id } })"
                    >
                      <time
                        class="flex flex-col items-center justify-center w-[4.8rem] h-[4.8rem] bg-bg dark:bg-dk-bg border border-border dark:border-dk-border shrink-0"
                      >
                        <span
                          class="text-[1.6rem] font-bold text-body dark:text-dk-body leading-none"
                          >{{ diaFecha(o.fechaIngreso) }}</span
                        >
                        <span
                          class="text-[1rem] font-semibold text-muted dark:text-dk-muted uppercase"
                          >{{ mesFecha(o.fechaIngreso) }}</span
                        >
                      </time>
                      <section class="flex-1">
                        <p class="text-[1.3rem] font-semibold text-body dark:text-dk-body mb-1">
                          {{ nombreVehiculoOrden(o) }}
                        </p>
                        <p class="text-[1.1rem] text-muted dark:text-dk-muted">
                          {{ resumenLineasOrden(o) }}
                        </p>
                      </section>
                      <data
                        class="text-[1.2rem] font-bold text-body dark:text-dk-body"
                        :value="totalOrden(o)"
                        >${{ fmt(totalOrden(o)) }}</data
                      >
                    </article>
                  </li>
                </ul>
              </section>
            </section>
          </section>

          <!-- Sidebar: Summary & Actions -->
          <aside class="flex flex-col gap-10">
            <!-- Summary Stats -->
            <section
              class="bg-surface dark:bg-dk-surface border border-border dark:border-dk-border"
            >
              <header class="px-8 py-6 border-b border-border dark:border-dk-border">
                <h2 class="text-[1.5rem] font-bold text-body dark:text-dk-body">Resumen</h2>
              </header>
              <dl class="p-8 grid grid-cols-2 gap-6">
                <p class="py-4 border-b border-border/60 dark:border-dk-border/60">
                  <dt
                    class="text-[1.1rem] text-muted dark:text-dk-muted uppercase tracking-wider mb-1"
                  >
                    Vehiculos
                  </dt>
                  <dd class="text-[2rem] font-light text-body dark:text-dk-body">
                    {{ vehiculosDelCliente.length }}
                  </dd>
                </p>
                <p class="py-4 border-b border-border/60 dark:border-dk-border/60">
                  <dt
                    class="text-[1.1rem] text-muted dark:text-dk-muted uppercase tracking-wider mb-1"
                  >
                    Servicios
                  </dt>
                  <dd class="text-[2rem] font-light text-body dark:text-dk-body">
                    {{ ordenesDelCliente.length }}
                  </dd>
                </p>
                <p class="py-4">
                  <dt
                    class="text-[1.1rem] text-muted dark:text-dk-muted uppercase tracking-wider mb-1"
                  >
                    Total gastado
                  </dt>
                  <dd class="text-[2rem] font-light text-primary">${{ fmt(totalGastado) }}</dd>
                </p>
              </dl>
            </section>

            <!-- Quick Actions -->
            <section
              class="bg-surface dark:bg-dk-surface border border-border dark:border-dk-border"
            >
              <header class="px-8 py-6 border-b border-border dark:border-dk-border">
                <h2 class="text-[1.5rem] font-bold text-body dark:text-dk-body">
                  Acciones Rapidas
                </h2>
              </header>
              <nav class="p-8 flex flex-col gap-3">
                <button
                  class="flex items-center gap-3 w-full px-5 py-4 text-left bg-bg dark:bg-dk-bg border border-border dark:border-dk-border cursor-pointer hover:border-primary transition-colors"
                  @click="
                    router.push({ name: ordenesCrearRoute, query: { clienteId: String(cliente.id) } })
                  "
                >
                  <span
                    class="w-7 h-7 bg-primary/10 text-primary flex items-center justify-center text-[1.4rem] font-light leading-none"
                    >+</span
                  >
                  <span class="text-[1.3rem] font-medium text-body dark:text-dk-body"
                    >Crear nueva orden</span
                  >
                </button>
                <button
                  class="flex items-center gap-3 w-full px-5 py-4 text-left bg-bg dark:bg-dk-bg border border-border dark:border-dk-border cursor-pointer hover:border-primary transition-colors"
                  @click="
                    router.push({
                      name: vehiculosCrearRoute,
                      query: { clienteId: String(cliente.id) },
                    })
                  "
                >
                  <span
                    class="w-7 h-7 bg-primary/10 text-primary flex items-center justify-center text-[1.4rem] font-light leading-none"
                    >+</span
                  >
                  <span class="text-[1.3rem] font-medium text-body dark:text-dk-body"
                    >Registrar vehiculo</span
                  >
                </button>
                <button
                  class="flex items-center gap-3 w-full px-5 py-4 text-left bg-bg dark:bg-dk-bg border border-border dark:border-dk-border cursor-pointer hover:border-primary transition-colors"
                  @click="router.push({ name: clientesEditarRoute, params: { id: cliente.id } })"
                >
                  <span
                    class="w-7 h-7 bg-primary/10 text-primary flex items-center justify-center text-[1.4rem] font-light leading-none"
                    >✎</span
                  >
                  <span class="text-[1.3rem] font-medium text-body dark:text-dk-body"
                    >Editar cliente</span
                  >
                </button>
              </nav>
            </section>
          </aside>
        </section>
      </main>

      <main v-else class="flex-1 px-12 py-10 flex items-center justify-center">
        <article class="text-center">
          <p class="text-[1.6rem] text-muted dark:text-dk-muted mb-4">Cliente no encontrado</p>
          <button
            class="text-[1.3rem] font-medium text-primary cursor-pointer border-none bg-transparent"
            @click="router.push({ name: 'clientes-lista' })"
          >
            Volver a clientes
          </button>
        </article>
      </main>
    </div>
  </div>
</template>

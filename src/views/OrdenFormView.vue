<script setup lang="ts">
import { ref, computed, inject, onMounted, watch, type Ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  useOrdenesStore,
  calcularSubtotal,
  calcularIVA,
  calcularTotal,
  ivaGlobal,
  type OrdenLinea,
} from '@/stores/ordenes'
import { useVehiculosStore } from '@/stores/vehiculos'
import { useClientesStore } from '@/stores/clientes'
import { useServiciosStore, type Servicio } from '@/stores/servicios'
import { useInventarioStore } from '@/stores/inventario'
import { usePromocionesStore, type Promocion } from '@/stores/promociones'
import { usePagosStore } from '@/stores/pagos'
import { api } from '@/services/api'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppTopbar from '@/components/layout/AppTopbar.vue'
import PagoModal from '@/components/PagoModal.vue'
import Swal from 'sweetalert2'

const router = useRouter()
const route = useRoute()
const store = useOrdenesStore()
const vehStore = useVehiculosStore()
const cliStore = useClientesStore()
const svcStore = useServiciosStore()
const invStore = useInventarioStore()
const promoStore = usePromocionesStore()
const pagosStore = usePagosStore()

const routePrefix = computed(() => {
  if (String(route.name).startsWith('recepcionista')) return 'recepcionista-'
  return ''
})
const ordenesListRoute = computed(() =>
  String(route.name).startsWith('recepcionista') ? 'recepcionista-ordenes' : 'ordenes-lista'
)
const ordenesDetalleRoute = computed(() => `${routePrefix.value}ordenes-detalle`)

const collapsed = inject<Ref<boolean>>('sidebarCollapsed')!
const darkMode = inject<Ref<boolean>>('darkMode')!

const esEdicion = computed(() => !!route.params.id)
const titulo = computed(() => (esEdicion.value ? 'Editar Orden' : 'Nueva Orden de Servicio'))

interface MecanicoOption {
  id: number
  nombre: string
  apellido: string
}
const mecanicos = ref<MecanicoOption[]>([])

const form = ref({
  clienteId: null as number | null,
  vehiculoId: null as number | null,
  mecanicoId: null as number | null,
  lineas: [] as OrdenLinea[],
  diagnostico: '',
  notas: '',
  fechaIngreso: new Date().toISOString().split('T')[0] ?? '',
  fechaPromesa: '',
  prioridad: 'media',
  estado: 'recibido',
  anticipo: 0,
  descuento: 0,
  promocionId: null as number | null,
  imagenUrl: '',
})

const imagenPreview = computed(() => form.value.imagenUrl || '')

async function handleImagenChange(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onloadend = async () => {
    const base64 = reader.result as string
    try {
      const { url } = await api.post<{ url: string }>('/ordenes/upload', { imagen: base64 })
      form.value.imagenUrl = url
    } catch {
      Swal.fire({ title: 'Error', text: 'No se pudo subir la imagen', icon: 'error' })
    }
  }
  reader.readAsDataURL(file)
}

function quitarImagen() {
  form.value.imagenUrl = ''
}

const errores = ref<Record<string, string>>({})
const promocionAplicada = ref<Promocion | null>(null)
const codigoCupon = ref('')

// Datos derivados del cliente/vehiculo seleccionados
const clienteInfo = computed(() => cliStore.clientes.find((c) => c.id === form.value.clienteId))
const vehiculoInfo = computed(() => vehStore.vehiculos.find((v) => v.id === form.value.vehiculoId))
const promocionesActivas = ref<Promocion[]>([])

// Solo vehiculos del cliente seleccionado
const vehiculosFiltrados = computed(() => {
  if (!form.value.clienteId || !clienteInfo.value) return []
  return vehStore.vehiculos.filter(
    (v) => v.clienteNombre.toLowerCase() === (clienteInfo.value?.nombre ?? '').toLowerCase(),
  )
})

// Al cambiar cliente, limpiar vehiculo
const cargandoEdicion = ref(false)
watch(
  () => form.value.clienteId,
  () => {
    if (cargandoEdicion.value) return
    form.value.vehiculoId = null
  },
)

// Servicios del backend con precio total calculado
const serviciosDisponibles = computed(() =>
  svcStore.servicios
    .filter((s) => s.activo)
    .map((s) => ({
      ...s,
      costoTotal: svcStore.costoTotal(s),
    })),
)

function agregarServicioDesdeBackend(servicio: Servicio) {
  const costoTotal = svcStore.costoTotal(servicio)
  form.value.lineas.push({
    tipo: 'servicio',
    servicioId: servicio.id,
    descripcion: servicio.nombre,
    cantidad: 1,
    precioUnitario: costoTotal,
  })
}

function agregarRefaccionDesdeInventario(articulo: any) {
  form.value.lineas.push({
    tipo: 'refaccion',
    articuloId: articulo.id,
    descripcion: articulo.nombre,
    cantidad: 1,
    precioUnitario: articulo.precioVenta,
  })
}

function agregarLineaManual() {
  form.value.lineas.push({ tipo: 'servicio', descripcion: '', cantidad: 1, precioUnitario: 0 })
}

function eliminarLinea(idx: number) {
  form.value.lineas.splice(idx, 1)
}

function aplicarPromocion(promo: Promocion) {
  promocionAplicada.value = promo
  form.value.promocionId = promo.id
  if (promo.tipo === 'porcentaje') {
    form.value.descuento = Math.round(subtotal.value * (promo.valor / 100) * 100) / 100
  } else {
    form.value.descuento = promo.valor
  }
}

function quitarPromocion() {
  promocionAplicada.value = null
  form.value.promocionId = null
  form.value.descuento = 0
}

function buscarCupon() {
  if (!codigoCupon.value.trim()) return
  const promo = promocionesActivas.value.find(
    (p) => p.codigo.toLowerCase() === codigoCupon.value.trim().toLowerCase(),
  )
  if (promo) {
    aplicarPromocion(promo)
    Swal.fire({
      title: 'Cupon aplicado',
      text: promo.nombre,
      icon: 'success',
      timer: 1500,
      showConfirmButton: false,
    })
  } else {
    Swal.fire({
      title: 'Cupon invalido',
      text: 'El codigo no es valido o ha expirado',
      icon: 'error',
      timer: 2000,
      showConfirmButton: false,
    })
  }
}

const subtotal = computed(() => calcularSubtotal(form.value.lineas))
const descuentoMonto = computed(() => form.value.descuento)
const subtotalConDescuento = computed(() => Math.max(0, subtotal.value - descuentoMonto.value))
const iva = computed(() => subtotalConDescuento.value * (ivaGlobal.value / 100))
const total = computed(() => subtotalConDescuento.value + iva.value)
const saldoPendiente = computed(() => Math.max(0, total.value - form.value.anticipo))

// ─── Modal de pago ──────────────────────────────────────────────────────────
const modalPagoVisible = ref(false)

const ordenPayloadActual = computed(() => ({
  clienteId: form.value.clienteId!,
  vehiculoId: form.value.vehiculoId,
  mecanicoId: form.value.mecanicoId,
  diagnostico: form.value.diagnostico,
  notas: form.value.notas,
  fechaIngreso: form.value.fechaIngreso,
  fechaPromesa: form.value.fechaPromesa,
  prioridad: form.value.prioridad,
  descuento: form.value.descuento,
  promocionId: form.value.promocionId,
  imagenUrl: form.value.imagenUrl,
  lineas: form.value.lineas
    .filter((l) => l.descripcion.trim())
    .map((l) => ({
      tipo: l.tipo,
      servicioId: l.servicioId,
      articuloId: l.articuloId,
      descripcion: l.descripcion,
      cantidad: l.cantidad,
      precioUnitario: l.precioUnitario,
    })),
}))

function validar(): boolean {
  errores.value = {}
  if (!form.value.clienteId) errores.value.clienteId = 'Selecciona un cliente'
  if (!form.value.vehiculoId) errores.value.vehiculoId = 'Selecciona un vehiculo'
  if (form.value.lineas.length === 0 || form.value.lineas.every((l) => !l.descripcion.trim()))
    errores.value.lineas = 'Agrega al menos un servicio o refaccion'
  return Object.keys(errores.value).length === 0
}

async function guardar() {
  if (!validar()) return

  // Para nuevas órdenes mostramos el modal de cobro
  if (!esEdicion.value) {
    modalPagoVisible.value = true
    return
  }

  // Para edición: guardar directo
  const datos = {
    clienteId: form.value.clienteId!,
    vehiculoId: form.value.vehiculoId,
    mecanicoId: form.value.mecanicoId,
    diagnostico: form.value.diagnostico,
    notas: form.value.notas,
    fechaIngreso: form.value.fechaIngreso,
    fechaPromesa: form.value.fechaPromesa,
    prioridad: form.value.prioridad,
    estado: form.value.estado,
    anticipo: form.value.anticipo,
    descuento: form.value.descuento,
    promocionId: form.value.promocionId,
    imagenUrl: form.value.imagenUrl,
    lineas: form.value.lineas
      .filter((l) => l.descripcion.trim())
      .map((l) => ({
        tipo: l.tipo,
        servicioId: l.servicioId,
        articuloId: l.articuloId,
        descripcion: l.descripcion,
        cantidad: l.cantidad,
        precioUnitario: l.precioUnitario,
      })),
  }
  const ok = await store.actualizar(Number(route.params.id), datos)
  if (!ok) {
    Swal.fire({ title: 'Error', text: store.error ?? 'No se pudo guardar la orden', icon: 'error' })
    return
  }
  await Swal.fire({
    title: 'Orden actualizada',
    text: 'Los cambios fueron guardados.',
    icon: 'success',
    timer: 1500,
    showConfirmButton: false,
  })
   router.push({ name: ordenesListRoute })
}

function alCrearOrden(orden: any) {
  router.push({ name: ordenesDetalleRoute, params: { id: orden.id } })
}

onMounted(async () => {
  await Promise.all([
    cliStore.fetchClientes(),
    vehStore.fetchVehiculos(),
    svcStore.fetchServicios(),
    invStore.fetchItems(),
  ])

  // Cargar mecanicos
  try {
    const users = await api.get<any[]>('/users')
    mecanicos.value = users
      .filter((u: any) => u.rol === 'mecanico')
      .map((u: any) => ({ id: u.id, nombre: u.nombre, apellido: u.apellido }))
  } catch {
    /* ignore */
  }

  // Cargar promociones activas
  try {
    promocionesActivas.value = await promoStore.fetchActivas()
  } catch {
    /* ignore */
  }

  if (!esEdicion.value) {
    const clienteId = Number(route.query.clienteId)
    if (!Number.isNaN(clienteId) && clienteId > 0) {
      const clienteExiste = cliStore.clientes.some((c) => c.id === clienteId)
      if (clienteExiste) {
        form.value.clienteId = clienteId
      }
    }
  }

  // Si es edicion, cargar data
  if (esEdicion.value) {
    cargandoEdicion.value = true
    const orden = await store.fetchOrden(Number(route.params.id))
    if (orden) {
      form.value = {
        clienteId: orden.clienteId,
        vehiculoId: orden.vehiculoId,
        mecanicoId: orden.mecanicoId,
        lineas: (orden.lineas || []).map((l) => ({
          tipo: l.tipo,
          servicioId: l.servicioId,
          articuloId: l.articuloId,
          descripcion: l.descripcion,
          cantidad: l.cantidad,
          precioUnitario: l.precioUnitario,
        })),
        diagnostico: orden.diagnostico,
        notas: orden.notas,
        fechaIngreso: orden.fechaIngreso,
        fechaPromesa: orden.fechaPromesa,
        prioridad: orden.prioridad,
        estado: orden.estado,
        anticipo: orden.anticipo,
        descuento: orden.descuento,
        promocionId: orden.promocionId,
        imagenUrl: orden.imagenUrl || '',
      }
      if (orden.promocion) promocionAplicada.value = orden.promocion
    }
    cargandoEdicion.value = false
  }
})

function fmt(n: number): string {
  return n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
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
        <!-- Header -->
        <header
          class="flex items-start justify-between mb-10 max-[768px]:flex-col max-[768px]:gap-6"
        >
          <hgroup>
            <h1
              class="text-[2.8rem] font-light text-body dark:text-dk-body tracking-[-0.03em] leading-tight"
            >
              {{ titulo }}
            </h1>
            <p class="text-[1.3rem] text-muted dark:text-dk-muted mt-1">
              Completa los campos para registrar una nueva orden
            </p>
          </hgroup>
          <nav class="flex gap-4 max-[768px]:flex-col max-[768px]:w-full">
            <button
              class="px-8 py-3 text-[1.3rem] font-semibold text-muted dark:text-dk-muted bg-transparent border border-border dark:border-dk-border cursor-pointer hover:text-body dark:hover:text-dk-body transition-colors"
              @click="router.back()"
            >
              Cancelar
            </button>
            <button
              class="px-8 py-3 text-[1.3rem] font-semibold text-white bg-primary border-none cursor-pointer hover:bg-primary-dark transition-colors"
              @click="guardar"
            >
              {{ esEdicion ? 'Guardar Cambios' : 'Guardar Orden' }}
            </button>
          </nav>
        </header>

        <!-- 3-column layout -->
        <section
          class="grid grid-cols-[1fr_28rem_24rem] gap-10 items-start max-[1200px]:grid-cols-[1fr_28rem] max-[900px]:grid-cols-1"
        >
          <!-- FORM -->
          <form class="flex flex-col gap-8" @submit.prevent="guardar">
            <!-- Cliente -->
            <section
              class="bg-surface dark:bg-dk-surface border border-border dark:border-dk-border p-10"
            >
              <header class="flex items-center justify-between mb-8">
                <h2 class="text-[1.6rem] font-bold text-body dark:text-dk-body">
                  Informacion del Cliente
                </h2>
              </header>
              <fieldset class="grid grid-cols-2 gap-6 max-[480px]:grid-cols-1 border-0 p-0 m-0">
                <p class="flex flex-col gap-1.5 col-span-2 max-[480px]:col-span-1">
                  <label class="text-[1.2rem] font-medium text-body dark:text-dk-body"
                    >Cliente</label
                  >
                  <select
                    v-model="form.clienteId"
                    class="px-4 py-3 text-[1.4rem] text-body dark:text-dk-body bg-bg dark:bg-dk-bg border border-border dark:border-dk-border outline-none focus:border-primary transition-colors"
                    :class="{ 'border-red-500': errores.clienteId }"
                  >
                    <option :value="null">Seleccionar cliente...</option>
                    <option v-for="c in cliStore.clientes" :key="c.id" :value="c.id">
                      {{ c.nombre }}
                    </option>
                  </select>
                  <span v-if="errores.clienteId" class="text-[1.1rem] text-red-500">{{
                    errores.clienteId
                  }}</span>
                </p>
                <p class="flex flex-col gap-1.5">
                  <label class="text-[1.2rem] font-medium text-body dark:text-dk-body"
                    >Telefono</label
                  >
                  <input
                    :value="clienteInfo?.telefono ?? ''"
                    type="tel"
                    readonly
                    class="px-4 py-3 text-[1.4rem] text-body dark:text-dk-body bg-bg dark:bg-dk-bg border border-border dark:border-dk-border outline-none cursor-not-allowed opacity-70"
                  />
                </p>
                <p class="flex flex-col gap-1.5">
                  <label class="text-[1.2rem] font-medium text-body dark:text-dk-body"
                    >Correo Electronico</label
                  >
                  <input
                    :value="clienteInfo?.email ?? ''"
                    type="email"
                    readonly
                    class="px-4 py-3 text-[1.4rem] text-body dark:text-dk-body bg-bg dark:bg-dk-bg border border-border dark:border-dk-border outline-none cursor-not-allowed opacity-70"
                  />
                </p>
              </fieldset>
            </section>

            <!-- Vehiculo -->
            <section
              class="bg-surface dark:bg-dk-surface border border-border dark:border-dk-border p-10"
            >
              <header class="flex items-center justify-between mb-8">
                <h2 class="text-[1.6rem] font-bold text-body dark:text-dk-body">
                  Informacion del Vehiculo
                </h2>
              </header>
              <fieldset class="grid grid-cols-2 gap-6 max-[480px]:grid-cols-1 border-0 p-0 m-0">
                <p class="flex flex-col gap-1.5 col-span-2 max-[480px]:col-span-1">
                  <label class="text-[1.2rem] font-medium text-body dark:text-dk-body"
                    >Vehiculo</label
                  >
                  <select
                    v-model="form.vehiculoId"
                    class="px-4 py-3 text-[1.4rem] text-body dark:text-dk-body bg-bg dark:bg-dk-bg border border-border dark:border-dk-border outline-none focus:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    :class="{ 'border-red-500': errores.vehiculoId }"
                    :disabled="!form.clienteId"
                  >
                    <option :value="null">
                      {{
                        form.clienteId ? 'Seleccionar vehiculo...' : 'Primero selecciona un cliente'
                      }}
                    </option>
                    <option v-for="v in vehiculosFiltrados" :key="v.id" :value="v.id">
                      {{ v.nombre }} — {{ v.placa }}
                    </option>
                  </select>
                  <span v-if="errores.vehiculoId" class="text-[1.1rem] text-red-500">{{
                    errores.vehiculoId
                  }}</span>
                </p>
                <p class="flex flex-col gap-1.5">
                  <label class="text-[1.2rem] font-medium text-body dark:text-dk-body"
                    >Placas</label
                  >
                  <input
                    :value="vehiculoInfo?.placa ?? ''"
                    type="text"
                    readonly
                    class="px-4 py-3 text-[1.4rem] text-body dark:text-dk-body bg-bg dark:bg-dk-bg border border-border dark:border-dk-border outline-none cursor-not-allowed opacity-70"
                  />
                </p>
                <p class="flex flex-col gap-1.5">
                  <label class="text-[1.2rem] font-medium text-body dark:text-dk-body">Marca</label>
                  <input
                    :value="vehiculoInfo?.marca ?? ''"
                    type="text"
                    readonly
                    class="px-4 py-3 text-[1.4rem] text-body dark:text-dk-body bg-bg dark:bg-dk-bg border border-border dark:border-dk-border outline-none cursor-not-allowed opacity-70"
                  />
                </p>
                <p class="flex flex-col gap-1.5">
                  <label class="text-[1.2rem] font-medium text-body dark:text-dk-body"
                    >Modelo</label
                  >
                  <input
                    :value="vehiculoInfo?.modelo ?? ''"
                    type="text"
                    readonly
                    class="px-4 py-3 text-[1.4rem] text-body dark:text-dk-body bg-bg dark:bg-dk-bg border border-border dark:border-dk-border outline-none cursor-not-allowed opacity-70"
                  />
                </p>
                <p class="flex flex-col gap-1.5">
                  <label class="text-[1.2rem] font-medium text-body dark:text-dk-body">Anio</label>
                  <input
                    :value="vehiculoInfo?.anio ?? ''"
                    type="text"
                    readonly
                    class="px-4 py-3 text-[1.4rem] text-body dark:text-dk-body bg-bg dark:bg-dk-bg border border-border dark:border-dk-border outline-none cursor-not-allowed opacity-70"
                  />
                </p>
              </fieldset>
            </section>

            <!-- Servicios y Refacciones -->
            <section
              class="bg-surface dark:bg-dk-surface border border-border dark:border-dk-border p-10"
            >
              <header class="flex items-center justify-between mb-8">
                <h2 class="text-[1.6rem] font-bold text-body dark:text-dk-body">
                  Servicios y Refacciones
                </h2>
                <button
                  type="button"
                  class="text-[1.3rem] font-semibold text-primary bg-transparent border-none cursor-pointer hover:opacity-70 transition-opacity"
                  @click="agregarLineaManual"
                >
                  + Agregar Manual
                </button>
              </header>

              <!-- Selectors para agregar desde backend -->
              <div class="grid grid-cols-2 gap-4 mb-6 max-[480px]:grid-cols-1">
                <div class="flex flex-col gap-1.5">
                  <label class="text-[1.2rem] font-medium text-body dark:text-dk-body"
                    >Agregar Servicio</label
                  >
                  <select
                    class="px-4 py-3 text-[1.3rem] text-body dark:text-dk-body bg-bg dark:bg-dk-bg border border-border dark:border-dk-border outline-none focus:border-primary transition-colors"
                    @change="
                      (e: any) => {
                        const s = serviciosDisponibles.find((x) => x.id === Number(e.target.value))
                        if (s) {
                          agregarServicioDesdeBackend(s)
                          e.target.value = ''
                        }
                      }
                    "
                  >
                    <option value="">Seleccionar servicio...</option>
                    <option v-for="s in serviciosDisponibles" :key="s.id" :value="s.id">
                      {{ s.nombre }} — ${{ fmt(s.costoTotal) }}
                    </option>
                  </select>
                </div>
                <div class="flex flex-col gap-1.5">
                  <label class="text-[1.2rem] font-medium text-body dark:text-dk-body"
                    >Agregar Refaccion</label
                  >
                  <select
                    class="px-4 py-3 text-[1.3rem] text-body dark:text-dk-body bg-bg dark:bg-dk-bg border border-border dark:border-dk-border outline-none focus:border-primary transition-colors"
                    @change="
                      (e: any) => {
                        const a = invStore.items.find((x) => x.id === Number(e.target.value))
                        if (a) {
                          agregarRefaccionDesdeInventario(a)
                          e.target.value = ''
                        }
                      }
                    "
                  >
                    <option value="">Seleccionar refaccion...</option>
                    <option v-for="a in invStore.items" :key="a.id" :value="a.id">
                      {{ a.nombre }} — ${{ fmt(a.precioVenta) }} (Stock: {{ a.stock }})
                    </option>
                  </select>
                </div>
              </div>

              <p v-if="errores.lineas" class="text-[1.1rem] text-red-500 mb-4">
                {{ errores.lineas }}
              </p>
              <section class="overflow-x-auto -mx-10 px-10">
                <table class="w-full border-collapse min-w-[56rem]">
                  <thead>
                    <tr class="border-b border-border dark:border-dk-border">
                      <th
                        class="px-4 py-3 text-[1.1rem] font-semibold text-muted dark:text-dk-muted text-left uppercase tracking-wider"
                      >
                        Tipo
                      </th>
                      <th
                        class="px-4 py-3 text-[1.1rem] font-semibold text-muted dark:text-dk-muted text-left uppercase tracking-wider"
                      >
                        Descripcion
                      </th>
                      <th
                        class="px-4 py-3 text-[1.1rem] font-semibold text-muted dark:text-dk-muted text-left uppercase tracking-wider w-20"
                      >
                        Cant.
                      </th>
                      <th
                        class="px-4 py-3 text-[1.1rem] font-semibold text-muted dark:text-dk-muted text-left uppercase tracking-wider w-28"
                      >
                        Precio
                      </th>
                      <th
                        class="px-4 py-3 text-[1.1rem] font-semibold text-muted dark:text-dk-muted text-left uppercase tracking-wider w-28"
                      >
                        Total
                      </th>
                      <th class="w-12"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(l, i) in form.lineas"
                      :key="i"
                      class="border-b border-border/50 dark:border-dk-border/50 hover:bg-bg dark:hover:bg-dk-bg transition-colors"
                    >
                      <td class="p-3">
                        <select
                          v-model="l.tipo"
                          class="w-full px-3 py-2.5 text-[1.3rem] text-body dark:text-dk-body bg-surface dark:bg-dk-surface border border-border dark:border-dk-border outline-none focus:border-primary transition-colors"
                        >
                          <option value="servicio">Servicio</option>
                          <option value="refaccion">Refaccion</option>
                        </select>
                      </td>
                      <td class="p-3">
                        <input
                          v-model="l.descripcion"
                          type="text"
                          placeholder="Descripcion"
                          class="w-full px-3 py-2.5 text-[1.3rem] text-body dark:text-dk-body bg-surface dark:bg-dk-surface border border-border dark:border-dk-border outline-none focus:border-primary transition-colors placeholder:text-muted dark:placeholder:text-dk-muted"
                        />
                      </td>
                      <td class="p-3">
                        <input
                          v-model.number="l.cantidad"
                          type="number"
                          min="1"
                          class="w-full px-3 py-2.5 text-[1.3rem] text-body dark:text-dk-body bg-surface dark:bg-dk-surface border border-border dark:border-dk-border outline-none focus:border-primary transition-colors"
                        />
                      </td>
                      <td class="p-3">
                        <input
                          v-model.number="l.precioUnitario"
                          type="number"
                          min="0"
                          step="0.01"
                          class="w-full px-3 py-2.5 text-[1.3rem] text-body dark:text-dk-body bg-surface dark:bg-dk-surface border border-border dark:border-dk-border outline-none focus:border-primary transition-colors"
                        />
                      </td>
                      <td class="p-3 text-[1.4rem] font-bold text-body dark:text-dk-body">
                        ${{ fmt(l.cantidad * l.precioUnitario) }}
                      </td>
                      <td class="p-3 text-center">
                        <button
                          type="button"
                          title="Eliminar"
                          class="w-8 h-8 inline-flex items-center justify-center text-[2rem] text-muted dark:text-dk-muted bg-transparent border-none cursor-pointer leading-none hover:text-red-500 transition-colors"
                          @click="eliminarLinea(i)"
                        >
                          &times;
                        </button>
                      </td>
                    </tr>
                    <tr v-if="form.lineas.length === 0">
                      <td
                        colspan="6"
                        class="p-6 text-center text-[1.3rem] text-muted dark:text-dk-muted"
                      >
                        Agrega servicios o refacciones usando los selectores de arriba
                      </td>
                    </tr>
                  </tbody>
                </table>
              </section>
            </section>

            <!-- Info adicional -->
            <section
              class="bg-surface dark:bg-dk-surface border border-border dark:border-dk-border p-10"
            >
              <h2 class="text-[1.6rem] font-bold text-body dark:text-dk-body mb-8">
                Informacion Adicional
              </h2>
              <fieldset class="grid grid-cols-2 gap-6 max-[480px]:grid-cols-1 border-0 p-0 m-0">
                <p class="flex flex-col gap-1.5 col-span-2 max-[480px]:col-span-1">
                  <label class="text-[1.2rem] font-medium text-body dark:text-dk-body"
                    >Diagnostico / Motivo de Ingreso</label
                  >
                  <textarea
                    v-model="form.diagnostico"
                    rows="3"
                    placeholder="Describa el diagnostico o motivo..."
                    class="px-4 py-3 text-[1.4rem] text-body dark:text-dk-body bg-surface dark:bg-dk-surface border border-border dark:border-dk-border outline-none focus:border-primary transition-colors resize-none placeholder:text-muted dark:placeholder:text-dk-muted"
                  ></textarea>
                </p>
                <p class="flex flex-col gap-1.5 col-span-2 max-[480px]:col-span-1">
                  <label class="text-[1.2rem] font-medium text-body dark:text-dk-body"
                    >Notas Internas</label
                  >
                  <textarea
                    v-model="form.notas"
                    rows="2"
                    placeholder="Notas adicionales..."
                    class="px-4 py-3 text-[1.4rem] text-body dark:text-dk-body bg-surface dark:bg-dk-surface border border-border dark:border-dk-border outline-none focus:border-primary transition-colors resize-none placeholder:text-muted dark:placeholder:text-dk-muted"
                  ></textarea>
                </p>
                <!-- Imagen -->
                <p class="flex flex-col gap-1.5 col-span-2 max-[480px]:col-span-1">
                  <label class="text-[1.2rem] font-medium text-body dark:text-dk-body">Imagen de la Orden</label>
                  <div v-if="imagenPreview" class="flex flex-col gap-3">
                    <img
                      :src="imagenPreview"
                      alt="Orden"
                      class="w-full h-48 object-contain rounded border border-border dark:border-dk-border bg-bg dark:bg-dk-bg"
                    />
                    <button
                      type="button"
                      class="text-[1.2rem] font-medium text-red-500 bg-transparent border-none cursor-pointer hover:opacity-70 transition-opacity text-left"
                      @click="quitarImagen"
                    >
                      Quitar imagen
                    </button>
                  </div>
                  <label
                    v-else
                    class="flex flex-col items-center justify-center gap-2 w-full h-32 border-2 border-dashed border-border dark:border-dk-border rounded cursor-pointer hover:border-primary transition-colors"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-muted dark:text-dk-muted">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span class="text-[1.2rem] text-muted dark:text-dk-muted">Haz clic para subir imagen</span>
                    <input type="file" accept="image/*" class="hidden" @change="handleImagenChange" />
                  </label>
                </p>
                <p class="flex flex-col gap-1.5">
                  <label class="text-[1.2rem] font-medium text-body dark:text-dk-body"
                    >Fecha de Ingreso</label
                  >
                  <input
                    v-model="form.fechaIngreso"
                    type="date"
                    class="px-4 py-3 text-[1.4rem] text-body dark:text-dk-body bg-surface dark:bg-dk-surface border border-border dark:border-dk-border outline-none focus:border-primary transition-colors"
                  />
                </p>
                <p class="flex flex-col gap-1.5">
                  <label class="text-[1.2rem] font-medium text-body dark:text-dk-body"
                    >Fecha Promesa de Entrega</label
                  >
                  <input
                    v-model="form.fechaPromesa"
                    type="date"
                    class="px-4 py-3 text-[1.4rem] text-body dark:text-dk-body bg-surface dark:bg-dk-surface border border-border dark:border-dk-border outline-none focus:border-primary transition-colors"
                  />
                </p>
                <p class="flex flex-col gap-1.5">
                  <label class="text-[1.2rem] font-medium text-body dark:text-dk-body"
                    >Mecanico Asignado</label
                  >
                  <select
                    v-model="form.mecanicoId"
                    class="px-4 py-3 text-[1.4rem] text-body dark:text-dk-body bg-surface dark:bg-dk-surface border border-border dark:border-dk-border outline-none focus:border-primary transition-colors"
                  >
                    <option :value="null">Sin asignar</option>
                    <option v-for="m in mecanicos" :key="m.id" :value="m.id">
                      {{ m.nombre }} {{ m.apellido }}
                    </option>
                  </select>
                </p>
                <p class="flex flex-col gap-1.5">
                  <label class="text-[1.2rem] font-medium text-body dark:text-dk-body"
                    >Prioridad</label
                  >
                  <select
                    v-model="form.prioridad"
                    class="px-4 py-3 text-[1.4rem] text-body dark:text-dk-body bg-surface dark:bg-dk-surface border border-border dark:border-dk-border outline-none focus:border-primary transition-colors"
                  >
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </p>
              </fieldset>
            </section>
          </form>

          <!-- RESUMEN -->
          <aside
            class="sticky top-[calc(6.5rem+2rem)] bg-surface dark:bg-dk-surface border border-border dark:border-dk-border p-8 self-start max-[900px]:static"
          >
            <h3 class="text-[1.6rem] font-bold text-body dark:text-dk-body mb-6">
              Resumen de la Orden
            </h3>
            <p
              class="flex justify-between items-center py-4 border-b border-border dark:border-dk-border"
            >
              <span class="text-[1.3rem] text-muted dark:text-dk-muted">Subtotal</span>
              <span class="text-[1.3rem] font-semibold text-body dark:text-dk-body"
                >${{ fmt(subtotal) }}</span
              >
            </p>
            <p
              v-if="descuentoMonto > 0"
              class="flex justify-between items-center py-4 border-b border-border dark:border-dk-border"
            >
              <span class="text-[1.3rem] text-emerald-500"
                >Descuento
                <span v-if="promocionAplicada">({{ promocionAplicada.nombre }})</span></span
              >
              <span class="text-[1.3rem] font-semibold text-emerald-500"
                >-${{ fmt(descuentoMonto) }}</span
              >
            </p>
            <p
              class="flex justify-between items-center py-4 border-b border-border dark:border-dk-border"
            >
              <span class="text-[1.3rem] text-muted dark:text-dk-muted"
                >IVA ({{ ivaGlobal }}%)</span
              >
              <span class="text-[1.3rem] font-semibold text-body dark:text-dk-body"
                >${{ fmt(iva) }}</span
              >
            </p>
            <p class="flex justify-between items-center py-5">
              <span class="text-[1.5rem] font-bold text-body dark:text-dk-body">Total</span>
              <span class="text-[2rem] font-bold text-primary">${{ fmt(total) }}</span>
            </p>
            <p class="flex flex-col gap-1.5 pt-6 border-t border-border dark:border-dk-border">
              <label class="text-[1.2rem] font-medium text-body dark:text-dk-body">Anticipo</label>
              <input
                v-model.number="form.anticipo"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                class="w-full px-4 py-3 text-[1.4rem] text-body dark:text-dk-body bg-bg dark:bg-dk-bg border border-border dark:border-dk-border outline-none focus:border-primary transition-colors"
              />
            </p>
            <p class="flex justify-between items-center py-4 mt-1">
              <span class="text-[1.3rem] text-muted dark:text-dk-muted">Saldo Pendiente</span>
              <span class="text-[1.4rem] font-semibold text-primary"
                >${{ fmt(saldoPendiente) }}</span
              >
            </p>
            <button
              type="button"
              class="mt-6 w-full py-3.5 text-[1.3rem] font-semibold text-white bg-primary border-none cursor-pointer hover:bg-primary-dark transition-colors"
              @click="guardar"
            >
              {{ esEdicion ? 'Guardar Cambios' : 'Guardar Orden' }}
            </button>
          </aside>

          <!-- PROMOCIONES -->
          <aside
            class="sticky top-[calc(6.5rem+2rem)] self-start flex flex-col gap-6 max-[1200px]:hidden"
          >
            <!-- Cupon -->
            <section
              class="bg-surface dark:bg-dk-surface border border-border dark:border-dk-border p-8"
            >
              <h3 class="text-[1.4rem] font-bold text-body dark:text-dk-body mb-4">
                Codigo de Cupon
              </h3>
              <div class="flex gap-2 flex-col">
                <input
                  v-model="codigoCupon"
                  type="text"
                  placeholder="Ej: MANT20"
                  class="flex-1 px-4 py-3 text-[1.3rem] text-body dark:text-dk-body bg-bg dark:bg-dk-bg border border-border dark:border-dk-border outline-none focus:border-primary transition-colors placeholder:text-muted"
                />
                <button
                  type="button"
                  class="px-6 py-3 text-[1.3rem] font-semibold text-white bg-primary border-none cursor-pointer hover:bg-primary-dark transition-colors"
                  @click="buscarCupon"
                >
                  Aplicar
                </button>
              </div>
              <div
                v-if="promocionAplicada"
                class="mt-3 flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-3"
              >
                <span class="text-[1.2rem] text-emerald-700 dark:text-emerald-300"
                  >{{ promocionAplicada.nombre }} aplicada</span
                >
                <button
                  type="button"
                  class="text-[1.1rem] font-semibold text-red-500 border-none bg-transparent cursor-pointer"
                  @click="quitarPromocion"
                >
                  Quitar
                </button>
              </div>
            </section>

            <!-- Promociones activas -->
            <section
              class="bg-surface dark:bg-dk-surface border border-border dark:border-dk-border p-8"
            >
              <header class="flex items-center justify-between mb-6">
                <h3 class="text-[1.6rem] font-bold text-body dark:text-dk-body">Promociones</h3>
                <span
                  class="text-[1rem] font-semibold text-primary uppercase tracking-wider bg-primary/8 px-3 py-1 rounded-full"
                  >Activas</span
                >
              </header>
              <p
                v-if="promocionesActivas.length === 0"
                class="text-[1.2rem] text-muted dark:text-dk-muted"
              >
                No hay promociones activas
              </p>
              <article
                v-for="promo in promocionesActivas"
                :key="promo.id"
                class="border border-border dark:border-dk-border bg-bg dark:bg-dk-bg p-5 mb-3 relative overflow-hidden cursor-pointer hover:border-primary transition-colors"
                :class="{
                  'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20':
                    promocionAplicada?.id === promo.id,
                }"
              >
                <span
                  class="absolute top-0 left-0 w-full h-[3px]"
                  :class="promo.tipo === 'porcentaje' ? 'bg-primary' : 'bg-emerald-500'"
                ></span>
                <header class="flex items-start justify-between gap-3 mb-2">
                  <p class="text-[1.3rem] font-bold text-body dark:text-dk-body leading-snug">
                    {{ promo.nombre }}
                  </p>
                  <span
                    class="shrink-0 text-[1.6rem] font-black"
                    :class="promo.tipo === 'porcentaje' ? 'text-primary' : 'text-emerald-500'"
                  >
                    {{ promo.tipo === 'porcentaje' ? promo.valor + '%' : '$' + promo.valor }}
                  </span>
                </header>
                <p class="text-[1.1rem] text-muted dark:text-dk-muted mb-2">
                  {{ promo.descripcion }}
                </p>
                <p
                  v-if="promo.condiciones"
                  class="text-[1rem] text-muted dark:text-dk-muted italic mb-3"
                >
                  {{ promo.condiciones }}
                </p>
                <footer class="flex items-center justify-between">
                  <time class="text-[1rem] text-muted dark:text-dk-muted"
                    >{{ promo.codigo ? 'Codigo: ' + promo.codigo : '' }} | Vence
                    {{ promo.fechaFin }}</time
                  >
                  <button
                    v-if="promocionAplicada?.id !== promo.id"
                    type="button"
                    class="text-[1.1rem] font-semibold text-primary border-none bg-transparent cursor-pointer hover:opacity-70"
                    @click="aplicarPromocion(promo)"
                  >
                    Aplicar
                  </button>
                  <button
                    v-else
                    type="button"
                    class="text-[1.1rem] font-semibold text-red-500 border-none bg-transparent cursor-pointer hover:opacity-70"
                    @click="quitarPromocion"
                  >
                    Quitar
                  </button>
                </footer>
              </article>
            </section>

            <!-- Servicios rapidos -->
            <section
              class="bg-surface dark:bg-dk-surface border border-border dark:border-dk-border p-8"
            >
              <h3 class="text-[1.4rem] font-bold text-body dark:text-dk-body mb-5">
                Servicios Rapidos
              </h3>
              <nav class="flex flex-col gap-2">
                <button
                  v-for="s in serviciosDisponibles"
                  :key="s.id"
                  type="button"
                  class="flex items-center justify-between w-full px-4 py-3 text-left bg-bg dark:bg-dk-bg border border-border dark:border-dk-border hover:border-primary dark:hover:border-primary transition-colors cursor-pointer"
                  @click="agregarServicioDesdeBackend(s)"
                >
                  <span class="text-[1.2rem] font-medium text-body dark:text-dk-body">{{
                    s.nombre
                  }}</span>
                  <span class="text-[1.2rem] font-bold text-primary">${{ fmt(s.costoTotal) }}</span>
                </button>
              </nav>
            </section>
          </aside>
        </section>
      </article>
    </section>

    <!-- Modal de cobro (nueva orden) -->
    <PagoModal
      :visible="modalPagoVisible"
      :total="total"
      :anticipo="form.anticipo"
      :lineas="form.lineas"
      :orden-payload="ordenPayloadActual"
      @close="modalPagoVisible = false"
      @creada="alCrearOrden"
    />
  </main>
</template>

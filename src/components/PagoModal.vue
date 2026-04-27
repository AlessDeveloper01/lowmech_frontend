<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useOrdenesStore, type OrdenLinea } from '@/stores/ordenes'
import { usePagosStore } from '@/stores/pagos'
import { api } from '@/services/api'
import Swal from 'sweetalert2'
import { Banknote, CreditCard, Clock, X, CheckCircle, AlertTriangle, ArrowRight, Printer } from 'lucide-vue-next'

const props = defineProps<{
  visible: boolean
  /** Total de la orden (con IVA y descuento aplicado) */
  total: number
  /** Anticipo ya registrado en la orden */
  anticipo: number
  /** Líneas para saber qué se está cobrando */
  lineas: OrdenLinea[]
  /** Payload completo para CREAR una nueva orden (modo nueva orden) */
  ordenPayload?: Record<string, any>
  /** ID de orden existente (modo cobro de orden ya creada) */
  ordenId?: number
}>()

const emit = defineEmits<{
  close: []
  /** Orden recién creada */
  creada: [orden: any]
  /** Orden existente actualizada */
  actualizada: [orden: any]
}>()

const router = useRouter()
const ordenesStore = useOrdenesStore()
const pagosStore = usePagosStore()

type Tab = 'efectivo' | 'stripe' | 'pendiente'
const tabActivo = ref<Tab>('efectivo')
const procesando = ref(false)
const montoRecibido = ref(0)

// ─── Cómputos financieros ────────────────────────────────────────────────────
const saldoACobrar = computed(() => Math.max(0, props.total - props.anticipo))
const cambio = computed(() => montoRecibido.value - saldoACobrar.value)
const pagoCompleto = computed(
  () => saldoACobrar.value <= 0 || montoRecibido.value >= saldoACobrar.value,
)

// Reinicia el modal cada vez que se abre
watch(
  () => props.visible,
  (v) => {
    if (v) {
      tabActivo.value = 'efectivo'
      montoRecibido.value = saldoACobrar.value // monto exacto como default
    }
  },
)

const tabs = [
  { id: 'efectivo' as Tab, icon: Banknote, label: 'Efectivo' },
  { id: 'stripe' as Tab, icon: CreditCard, label: 'Tarjeta (Stripe)' },
  { id: 'pendiente' as Tab, icon: Clock, label: 'Pago pendiente' },
]

function fmt(n: number) {
  return n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// ─── Efectivo ────────────────────────────────────────────────────────────────
async function confirmarEfectivo() {
  if (saldoACobrar.value > 0 && montoRecibido.value < 0) return
  procesando.value = true
  try {
    const recibidoAhora = saldoACobrar.value <= 0 ? 0 : Math.max(0, montoRecibido.value)
    const nuevoAnticipo = props.anticipo + Math.min(recibidoAhora, saldoACobrar.value)
    const estadoFinal = nuevoAnticipo >= props.total || saldoACobrar.value <= 0 ? 'pagado' : 'recibido'

    let orden: any
    if (props.ordenId) {
      orden = await api.put<any>(`/ordenes/${props.ordenId}/pagar-efectivo`, {
        anticipo: nuevoAnticipo,
        estado: estadoFinal,
      })
      emit('actualizada', orden)
    } else {
      const payload = { ...props.ordenPayload, anticipo: nuevoAnticipo, estado: estadoFinal }
      orden = await ordenesStore.crear(payload as any)
      if (!orden) throw new Error(ordenesStore.error ?? 'Error al crear la orden')
      emit('creada', orden)
    }

    emit('close')

    await Swal.fire({
      title: '¡Pago registrado!',
      html: `
        <div style="text-align:center;line-height:1.6">
          ${
            cambio.value > 0
              ? `<p style="font-size:1.5rem;font-weight:600;color:#16a34a;margin:6px 0">
                  Cambio a dar: <strong>$${fmt(cambio.value)}</strong>
                </p>`
              : ''
          }
          ${
            !pagoCompleto.value
              ? `<p style="font-size:1.2rem;color:#d97706;margin:6px 0">
                  Pago parcial — saldo pendiente: <strong>$${fmt(saldoACobrar.value - recibidoAhora)}</strong>
                </p>`
              : ''
          }
        </div>`,
      icon: 'success',
      showCancelButton: true,
      confirmButtonText: '🖨️ Descargar ticket PDF',
      cancelButtonText: 'Cerrar',
      confirmButtonColor: '#f97316',
    }).then((r) => {
      if (r.isConfirmed) pagosStore.guardarTicketPDF(orden.id)
    })
  } catch (e: any) {
    Swal.fire({ title: 'Error', text: e.message, icon: 'error' })
  } finally {
    procesando.value = false
  }
}

// ─── Stripe ──────────────────────────────────────────────────────────────────
function irAStripe() {
  if (saldoACobrar.value <= 0) {
    Swal.fire({ title: 'Sin saldo', text: 'No hay saldo pendiente por cobrar.', icon: 'info' })
    return
  }

  const lineasFiltradas = props.lineas
    .filter((l) => l.descripcion?.trim())
    .map((l) => ({
      tipo: l.tipo,
      servicioId: l.servicioId,
      articuloId: l.articuloId,
      descripcion: l.descripcion,
      cantidad: l.cantidad,
      precioUnitario: l.precioUnitario,
    }))

  if (props.ordenId) {
    // Orden existente: cobrar saldo restante y actualizar
    pagosStore.setPendiente({
      ordenId: props.ordenId,
      lineas: lineasFiltradas,
      total: Math.round(saldoACobrar.value * 100) / 100,
    } as any)
  } else {
    // Orden nueva: pago completo, se crea al confirmar
    pagosStore.setPendiente({
      ...props.ordenPayload,
      lineas: lineasFiltradas,
      total: Math.round(props.total * 100) / 100,
      estado: 'pagado',
    } as any)
  }

  emit('close')
  router.push({ name: 'checkout' })
}

// ─── Pendiente ───────────────────────────────────────────────────────────────
async function confirmarPendiente() {
  procesando.value = true
  try {
    let orden: any
    if (props.ordenId) {
      // Orden existente: marcar completado sin cobrar aún
      orden = await api.put<any>(`/ordenes/${props.ordenId}/estado`, { estado: 'completado' })
      emit('actualizada', orden)
    } else {
      // Orden nueva con estado pendiente
      const payload = { ...props.ordenPayload, estado: 'pendiente' }
      orden = await ordenesStore.crear(payload as any)
      if (!orden) throw new Error(ordenesStore.error ?? 'Error al crear la orden')
      emit('creada', orden)
    }

    emit('close')
    Swal.fire({
      title: props.ordenId ? 'Estado actualizado' : 'Orden creada',
      text: 'Registrada con pago pendiente.',
      icon: 'success',
      timer: 1400,
      showConfirmButton: false,
    })
  } catch (e: any) {
    Swal.fire({ title: 'Error', text: e.message, icon: 'error' })
  } finally {
    procesando.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="pago-modal">
      <div
        v-if="visible"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        @click.self="emit('close')"
      >
        <article
          class="w-full max-w-[54rem] max-h-[90vh] overflow-y-auto bg-surface dark:bg-dk-surface border border-border dark:border-dk-border shadow-2xl"
        >
          <!-- Header -->
          <header
            class="flex items-center justify-between px-8 py-6 border-b border-border dark:border-dk-border"
          >
            <div>
              <h2 class="text-[2rem] font-light text-body dark:text-dk-body tracking-tight">
                Cobro de la orden
              </h2>
              <p class="text-[1.2rem] text-muted dark:text-dk-muted mt-0.5">
                Selecciona la forma de pago
              </p>
            </div>
            <button
              class="w-9 h-9 flex items-center justify-center text-muted dark:text-dk-muted hover:text-body dark:hover:text-dk-body bg-transparent border-none cursor-pointer transition-colors"
              @click="emit('close')"
            >
              <X :size="18" />
            </button>
          </header>

          <!-- Resumen de montos -->
          <section
            class="px-8 py-5 bg-bg dark:bg-dk-bg border-b border-border dark:border-dk-border"
          >
            <dl class="flex gap-10 flex-wrap">
              <div>
                <dt class="text-[1.1rem] text-muted dark:text-dk-muted mb-0.5">Total orden</dt>
                <dd class="text-[1.8rem] font-bold text-body dark:text-dk-body">${{ fmt(total) }}</dd>
              </div>
              <div v-if="anticipo > 0">
                <dt class="text-[1.1rem] text-muted dark:text-dk-muted mb-0.5">Anticipo</dt>
                <dd class="text-[1.8rem] font-bold text-primary">${{ fmt(anticipo) }}</dd>
              </div>
              <div>
                <dt class="text-[1.1rem] text-muted dark:text-dk-muted mb-0.5">Saldo a cobrar</dt>
                <dd
                  class="text-[1.8rem] font-bold"
                  :class="saldoACobrar > 0 ? 'text-amber-500' : 'text-green-500'"
                >
                  ${{ fmt(saldoACobrar) }}
                </dd>
              </div>
            </dl>
          </section>

          <!-- Tabs -->
          <nav class="flex border-b border-border dark:border-dk-border">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              class="flex-1 px-4 py-4 text-[1.3rem] font-medium cursor-pointer border-none bg-transparent transition-colors border-b-2 flex items-center justify-center gap-2"
              :class="
                tabActivo === tab.id
                  ? 'text-primary border-primary'
                  : 'text-muted dark:text-dk-muted border-transparent hover:text-body dark:hover:text-dk-body'
              "
              @click="tabActivo = tab.id"
            >
              <component :is="tab.icon" :size="16" />
              {{ tab.label }}
            </button>
          </nav>

          <!-- ── Tab: Efectivo ─────────────────────────────────────────────── -->
          <section v-if="tabActivo === 'efectivo'" class="px-8 py-7 flex flex-col gap-6">
            <!-- Ya está cubierto con anticipo -->
            <div v-if="saldoACobrar <= 0" class="text-center py-4">
              <div class="flex justify-center mb-2 text-green-600 dark:text-green-400">
                <CheckCircle :size="40" />
              </div>
              <p class="text-[1.5rem] text-green-600 dark:text-green-400 font-semibold">
                Cubierto con anticipo
              </p>
              <p class="text-[1.2rem] text-muted dark:text-dk-muted mt-1">
                El total ya fue cubierto. Confirma para
                {{ ordenId ? 'actualizar la orden.' : 'crear la orden.' }}
              </p>
            </div>

            <template v-else>
              <!-- Entrada de monto recibido -->
              <p class="flex flex-col gap-1.5">
                <label class="text-[1.3rem] font-medium text-body dark:text-dk-body">
                  Monto recibido del cliente
                </label>
                <div class="relative">
                  <span
                    class="absolute left-4 top-1/2 -translate-y-1/2 text-[1.4rem] font-semibold text-muted dark:text-dk-muted"
                    >$</span
                  >
                  <input
                    v-model.number="montoRecibido"
                    type="number"
                    min="0"
                    step="0.01"
                    class="w-full pl-8 pr-4 py-3 text-[1.6rem] font-semibold text-body dark:text-dk-body bg-bg dark:bg-dk-bg border border-border dark:border-dk-border outline-none focus:border-primary transition-colors"
                  />
                </div>
              </p>

              <!-- Panel de cambio / saldo -->
              <div
                class="p-5 border-2 transition-colors"
                :class="
                  cambio > 0
                    ? 'border-green-400 bg-green-50 dark:bg-green-950/20'
                    : cambio === 0
                      ? 'border-green-300 bg-green-50/50 dark:bg-green-950/10'
                      : 'border-amber-400 bg-amber-50 dark:bg-amber-950/20'
                "
              >
                <!-- Cambio a dar -->
                <div v-if="cambio > 0" class="text-center">
                  <div class="flex justify-center mb-1 text-green-600 dark:text-green-400">
                    <CheckCircle :size="28" />
                  </div>
                  <p class="text-[1.2rem] font-medium text-green-700 dark:text-green-400">
                    Cambio a dar
                  </p>
                  <p class="text-[3.2rem] font-black text-green-600 dark:text-green-400">
                    ${{ fmt(cambio) }}
                  </p>
                </div>
                <!-- Monto exacto -->
                <div v-else-if="cambio === 0" class="text-center">
                  <div class="flex justify-center mb-1 text-green-600 dark:text-green-400">
                    <CheckCircle :size="28" />
                  </div>
                  <p class="text-[1.4rem] font-semibold text-green-600 dark:text-green-400">
                    Monto exacto
                  </p>
                </div>
                <!-- Pago parcial -->
                <div v-else class="text-center">
                  <div class="flex justify-center mb-1 text-amber-600 dark:text-amber-400">
                    <AlertTriangle :size="28" />
                  </div>
                  <p class="text-[1.2rem] font-medium text-amber-700 dark:text-amber-400">
                    Pago parcial — queda pendiente
                  </p>
                  <p class="text-[2.8rem] font-black text-amber-600 dark:text-amber-400">
                    ${{ fmt(-cambio) }}
                  </p>
                  <p class="text-[1.1rem] text-muted dark:text-dk-muted mt-1">
                    Se registrará como anticipo y la orden quedará con saldo pendiente
                  </p>
                </div>
              </div>
            </template>

            <button
              class="w-full py-4 text-[1.4rem] font-semibold text-white bg-primary border-none cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              :disabled="procesando || (saldoACobrar > 0 && montoRecibido < 0)"
              @click="confirmarEfectivo"
            >
              {{
                procesando
                  ? 'Procesando...'
                  : saldoACobrar <= 0
                    ? 'Confirmar (ya pagado con anticipo)'
                    : pagoCompleto
                      ? 'Confirmar pago completo'
                      : 'Registrar pago parcial'
              }}
            </button>
          </section>

          <!-- ── Tab: Stripe ────────────────────────────────────────────────── -->
          <section v-if="tabActivo === 'stripe'" class="px-8 py-7 flex flex-col gap-6 items-center">
            <div
              class="w-full p-6 border border-border dark:border-dk-border bg-bg dark:bg-dk-bg text-center"
            >
              <div class="flex justify-center mb-4 text-muted dark:text-dk-muted">
                <CreditCard :size="48" stroke-width="1.5" />
              </div>
              <p class="text-[1.4rem] font-semibold text-body dark:text-dk-body mb-2">
                Pago seguro con Stripe
              </p>
              <p class="text-[1.3rem] text-muted dark:text-dk-muted mb-1">
                Se cobrarán:
                <strong class="text-primary text-[1.5rem]">${{ fmt(saldoACobrar) }}</strong>
              </p>
              <p class="text-[1.1rem] text-muted dark:text-dk-muted">
                Serás redirigido al formulario de pago con tarjeta.
                {{
                  ordenId
                    ? 'La orden existente se actualizará al confirmar el pago.'
                    : 'La orden se creará al confirmar el pago.'
                }}
              </p>
            </div>

            <button
              v-if="saldoACobrar > 0"
              class="w-full py-4 text-[1.4rem] font-semibold text-white bg-primary border-none cursor-pointer hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              @click="irAStripe"
            >
              Ir a pagar con tarjeta
              <ArrowRight :size="18" />
            </button>
            <p v-else class="text-[1.4rem] text-green-600 dark:text-green-400 font-semibold flex items-center gap-2">
              <CheckCircle :size="20" />
              Sin saldo pendiente
            </p>
          </section>

          <!-- ── Tab: Pendiente ─────────────────────────────────────────────── -->
          <section v-if="tabActivo === 'pendiente'" class="px-8 py-7 flex flex-col gap-6">
            <div
              class="p-6 border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/20"
            >
              <p class="flex items-center gap-2 text-[1.4rem] font-semibold text-amber-700 dark:text-amber-400 mb-2">
                <Clock :size="20" />
                Pago pendiente
              </p>
              <p class="text-[1.3rem] text-amber-600 dark:text-amber-300 leading-relaxed">
                {{
                  ordenId
                    ? 'La orden se marcará como completada. El cobro queda pendiente para después.'
                    : 'La orden se creará con estado "Pendiente". Podrás cobrar desde el detalle de la orden.'
                }}
              </p>
              <p v-if="anticipo > 0" class="text-[1.2rem] text-muted dark:text-dk-muted mt-3">
                Anticipo registrado: <strong>${{ fmt(anticipo) }}</strong> —
                Saldo por cobrar: <strong>${{ fmt(saldoACobrar) }}</strong>
              </p>
            </div>

            <button
              class="w-full py-4 text-[1.4rem] font-semibold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/30 border border-amber-400 cursor-pointer hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors disabled:opacity-40"
              :disabled="procesando"
              @click="confirmarPendiente"
            >
              {{
                procesando
                  ? 'Procesando...'
                  : ordenId
                    ? 'Marcar completado (cobrar después)'
                    : 'Crear orden con pago pendiente'
              }}
            </button>
          </section>
        </article>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.pago-modal-enter-active,
.pago-modal-leave-active {
  transition: opacity 0.2s ease;
}
.pago-modal-enter-active article,
.pago-modal-leave-active article {
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.pago-modal-enter-from,
.pago-modal-leave-to {
  opacity: 0;
}
.pago-modal-enter-from article,
.pago-modal-leave-to article {
  transform: scale(0.97) translateY(10px);
  opacity: 0;
}
</style>

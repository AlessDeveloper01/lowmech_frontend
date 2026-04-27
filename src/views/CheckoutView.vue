<script setup lang="ts">
import { ref, computed, onMounted, inject, type Ref } from 'vue'
import { useRouter } from 'vue-router'
import { usePagosStore } from '@/stores/pagos'
import {
  loadStripe,
  type Stripe,
  type StripeElements,
  type StripePaymentElement,
} from '@stripe/stripe-js'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppTopbar from '@/components/layout/AppTopbar.vue'
import Swal from 'sweetalert2'

const router = useRouter()
const pagosStore = usePagosStore()

const collapsed = inject<Ref<boolean>>('sidebarCollapsed')!
const darkMode = inject<Ref<boolean>>('darkMode')!

const stripe = ref<Stripe | null>(null)
const elements = ref<StripeElements | null>(null)
const paymentEl = ref<StripePaymentElement | null>(null)

const cargando = ref(true)
const procesandoPago = ref(false)
const mensajeError = ref<string | null>(null)

const pendiente = computed(() => pagosStore.pendiente)

const subtotal = computed(() => {
  if (!pendiente.value?.lineas) return 0
  return pendiente.value.lineas.reduce((s, l) => s + (l.cantidad ?? 1) * (l.precioUnitario ?? 0), 0)
})
const descuento = computed(() => pendiente.value?.descuento ?? 0)
const subConDesc = computed(() => Math.max(0, subtotal.value - descuento.value))
const iva = computed(() => subConDesc.value * 0.16)
const total = computed(() => subConDesc.value + iva.value)

function fmt(n: number) {
  return n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

onMounted(async () => {
  if (!pendiente.value) {
    await Swal.fire({
      title: 'Sin datos de pago',
      text: 'Debes crear una orden y proceder al pago desde el formulario.',
      icon: 'warning',
    })
    router.replace({ name: 'cliente-ordenes' })
    return
  }

  const pk = import.meta.env.VITE_STRIPE_PUBLIC_KEY as string | undefined
  if (!pk || pk.includes('TU_CLAVE')) {
    mensajeError.value = 'Falta configurar VITE_STRIPE_PUBLIC_KEY en el archivo .env del frontend'
    cargando.value = false
    return
  }

  try {
    stripe.value = await loadStripe(pk)
    if (!stripe.value) throw new Error('No se pudo cargar Stripe')

    // Crear el PaymentIntent en el backend
    const intent = await pagosStore.crearIntent(pendiente.value)
    if (!intent) throw new Error(pagosStore.error ?? 'No se pudo iniciar el pago')

    elements.value = stripe.value.elements({
      clientSecret: intent.clientSecret,
      appearance: {
        theme: darkMode.value ? 'night' : 'stripe',
        variables: { colorPrimary: '#f97316' },
      },
      locale: 'es',
    })

    paymentEl.value = elements.value.create('payment', {
      layout: { type: 'tabs', defaultCollapsed: false },
    })
    paymentEl.value.mount('#stripe-payment-element')
    cargando.value = false
  } catch (e) {
    mensajeError.value = (e as Error).message
    cargando.value = false
  }
})

async function pagar() {
  if (!stripe.value || !elements.value) return
  procesandoPago.value = true
  mensajeError.value = null

  const { error, paymentIntent } = await stripe.value.confirmPayment({
    elements: elements.value,
    redirect: 'if_required',
  })

  if (error) {
    mensajeError.value = error.message ?? 'Error al procesar el pago'
    procesandoPago.value = false
    return
  }

  if (paymentIntent?.status === 'succeeded') {
    const resp = await pagosStore.confirmar(paymentIntent.id)
    if (!resp) {
      mensajeError.value = pagosStore.error ?? 'El pago se realizó pero no se creó la orden'
      procesandoPago.value = false
      return
    }
    router.replace({ name: 'pago-exitoso', params: { id: resp.orden.id } })
  } else {
    mensajeError.value = `Estado inesperado: ${paymentIntent?.status}`
    procesandoPago.value = false
  }
}

function cancelar() {
  pagosStore.setPendiente(null)
  router.back()
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
        <header class="mb-10">
          <h1
            class="text-[2.8rem] font-light text-body dark:text-dk-body tracking-[-0.03em] leading-tight"
          >
            Pago con tarjeta
          </h1>
          <p class="text-[1.3rem] text-muted dark:text-dk-muted mt-1">
            Pago seguro procesado por Stripe
          </p>
        </header>

        <section class="grid grid-cols-[1fr_38rem] gap-10 items-start max-[900px]:grid-cols-1">
          <!-- Formulario Stripe -->
          <div
            class="bg-surface dark:bg-dk-surface border border-border dark:border-dk-border p-10"
          >
            <h2 class="text-[1.6rem] font-bold text-body dark:text-dk-body mb-6">
              Datos de la tarjeta
            </h2>

            <div v-if="cargando" class="text-center py-10 text-muted dark:text-dk-muted">
              Cargando formulario de pago...
            </div>

            <div
              v-if="mensajeError"
              class="bg-red-100 dark:bg-red-900/30 border border-red-500 text-red-700 dark:text-red-300 p-4 text-[1.3rem] mb-6"
            >
              {{ mensajeError }}
            </div>

            <div id="stripe-payment-element" v-show="!cargando && !mensajeError"></div>

            <div
              class="mt-8 p-4 bg-bg dark:bg-dk-bg border border-border dark:border-dk-border text-[1.2rem] text-muted dark:text-dk-muted"
            >
              <strong>Tarjeta de prueba Stripe:</strong> 4242 4242 4242 4242 — cualquier fecha
              futura, cualquier CVC.
            </div>

            <nav class="flex gap-4 mt-8">
              <button
                type="button"
                class="px-8 py-3 text-[1.3rem] font-semibold text-muted dark:text-dk-muted bg-transparent border border-border dark:border-dk-border cursor-pointer hover:text-body dark:hover:text-dk-body transition-colors"
                :disabled="procesandoPago"
                @click="cancelar"
              >
                Cancelar
              </button>
              <button
                type="button"
                class="flex-1 px-8 py-3 text-[1.3rem] font-semibold text-white bg-primary border-none cursor-pointer hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                :disabled="procesandoPago || cargando || !!mensajeError"
                @click="pagar"
              >
                {{ procesandoPago ? 'Procesando...' : `Pagar $${fmt(total)}` }}
              </button>
            </nav>
          </div>

          <!-- Resumen -->
          <aside
            class="bg-surface dark:bg-dk-surface border border-border dark:border-dk-border p-10"
          >
            <h2 class="text-[1.6rem] font-bold text-body dark:text-dk-body mb-6">
              Resumen de la orden
            </h2>
            <ul v-if="pendiente" class="flex flex-col gap-3 mb-6 max-h-80 overflow-y-auto">
              <li
                v-for="(l, i) in pendiente.lineas"
                :key="i"
                class="flex justify-between text-[1.3rem] text-body dark:text-dk-body border-b border-border dark:border-dk-border pb-2"
              >
                <span>{{ l.descripcion }} ({{ l.cantidad }})</span>
                <span class="font-semibold">${{ fmt(l.cantidad * l.precioUnitario) }}</span>
              </li>
            </ul>

            <dl class="flex flex-col gap-2 text-[1.3rem] text-body dark:text-dk-body">
              <div class="flex justify-between">
                <dt>Subtotal</dt>
                <dd>${{ fmt(subtotal) }}</dd>
              </div>
              <div v-if="descuento > 0" class="flex justify-between text-green-600">
                <dt>Descuento</dt>
                <dd>-${{ fmt(descuento) }}</dd>
              </div>
              <div class="flex justify-between">
                <dt>IVA 16%</dt>
                <dd>${{ fmt(iva) }}</dd>
              </div>
              <div
                class="flex justify-between text-[1.8rem] font-bold pt-3 mt-2 border-t border-border dark:border-dk-border"
              >
                <dt>Total</dt>
                <dd>${{ fmt(total) }}</dd>
              </div>
            </dl>
          </aside>
        </section>
      </article>
    </section>
  </main>
</template>

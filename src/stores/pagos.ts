import { ref } from 'vue'
import { defineStore } from 'pinia'
import { api } from '@/services/api'
import type { OrdenInput, Orden } from './ordenes'

/**
 * Store de pagos. Gestiona:
 *  - El carrito/payload de la orden pendiente de pagar
 *  - La comunicación con Stripe vía backend (crear-intent y confirmar)
 *  - La descarga del ticket PDF
 */

export interface PagoPendiente extends OrdenInput {
  total: number
  /** Si está presente, actualiza la orden existente en lugar de crear una nueva */
  ordenId?: number
}

export interface IntentResp {
  clientSecret: string
  paymentIntentId: string
  amount: number
  currency: string
}

export interface ConfirmResp {
  orden: Orden
  pago: {
    id: number
    estado: string
    metodo: string
    monto: number
    brand?: string
    last4?: string
  }
}

const PENDING_KEY = 'lowmech_pago_pendiente'

export const usePagosStore = defineStore('pagos', () => {
  const pendiente = ref<PagoPendiente | null>(
    (() => {
      const raw = sessionStorage.getItem(PENDING_KEY)
      return raw ? (JSON.parse(raw) as PagoPendiente) : null
    })(),
  )
  const clientSecret = ref<string | null>(null)
  const paymentIntentId = ref<string | null>(null)
  const procesando = ref(false)
  const error = ref<string | null>(null)

  function setPendiente(p: PagoPendiente | null) {
    pendiente.value = p
    if (p) sessionStorage.setItem(PENDING_KEY, JSON.stringify(p))
    else sessionStorage.removeItem(PENDING_KEY)
  }

  async function crearIntent(datos: PagoPendiente): Promise<IntentResp | null> {
    procesando.value = true
    error.value = null
    try {
      const resp = await api.post<IntentResp>('/pagos/crear-intent', datos)
      clientSecret.value = resp.clientSecret
      paymentIntentId.value = resp.paymentIntentId
      setPendiente(datos)
      return resp
    } catch (e) {
      error.value = (e as Error).message
      return null
    } finally {
      procesando.value = false
    }
  }

  async function confirmar(intentId: string): Promise<ConfirmResp | null> {
    procesando.value = true
    error.value = null
    try {
      const resp = await api.post<ConfirmResp>('/pagos/confirmar', {
        paymentIntentId: intentId,
      })
      setPendiente(null)
      clientSecret.value = null
      paymentIntentId.value = null
      return resp
    } catch (e) {
      error.value = (e as Error).message
      return null
    } finally {
      procesando.value = false
    }
  }

  /** Descarga el ticket PDF como blob con el token JWT. */
  async function descargarTicket(ordenId: number): Promise<Blob | null> {
    try {
      const token = api.getToken()
      const base = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'
      const res = await fetch(`${base}/pagos/ticket/${ordenId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      return await res.blob()
    } catch (e) {
      error.value = (e as Error).message
      return null
    }
  }

  async function imprimirTicket(ordenId: number) {
    const blob = await descargarTicket(ordenId)
    if (!blob) return
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
  }

  async function guardarTicketPDF(ordenId: number, filename?: string) {
    const blob = await descargarTicket(ordenId)
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename ?? `ticket-${ordenId}.pdf`
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 2000)
  }

  return {
    pendiente,
    clientSecret,
    paymentIntentId,
    procesando,
    error,
    setPendiente,
    crearIntent,
    confirmar,
    descargarTicket,
    imprimirTicket,
    guardarTicketPDF,
  }
})

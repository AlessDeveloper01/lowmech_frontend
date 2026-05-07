import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { api } from '@/services/api'

/** IVA global (0-100). Se actualiza desde useConfiguracionStore al cargar la app. */
export const ivaGlobal = ref(16)

export interface OrdenLinea {
  id?: number
  tipo: 'servicio' | 'refaccion'
  servicioId?: number
  articuloId?: number
  descripcion: string
  cantidad: number
  precioUnitario: number
}

export interface Orden {
  id: number
  clienteId: number
  vehiculoId: number | null
  mecanicoId: number | null
  diagnostico: string
  notas: string
  fechaIngreso: string
  fechaPromesa: string
  prioridad: string
  estado: string
  anticipo: number
  descuento: number
  promocionId: number | null
  fechaFin: string
  lineas: OrdenLinea[]
  cliente: any
  vehiculo: any
  mecanico: any
  promocion: any
  imagenUrl?: string
  createdAt: string
  updatedAt: string
}

export interface OrdenInput {
  clienteId?: number
  vehiculoId?: number | null
  mecanicoId?: number | null
  diagnostico?: string
  notas?: string
  fechaIngreso?: string
  fechaPromesa?: string
  prioridad?: string
  estado?: string
  anticipo?: number
  descuento?: number
  promocionId?: number | null
  lineas?: Omit<OrdenLinea, 'id'>[]
  imagenUrl?: string
}

export const useOrdenesStore = defineStore('ordenes', () => {
  const ordenes = ref<Orden[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const totalOrdenes = computed(() => ordenes.value.length)
  const ordenesPendientes = computed(
    () => ordenes.value.filter((o) => o.estado === 'recibido').length,
  )
  const ordenesEnProceso = computed(
    () =>
      ordenes.value.filter((o) =>
        ['en_progreso', 'diagnostico', 'esperando_piezas'].includes(o.estado),
      ).length,
  )
  const ordenesCompletadas = computed(
    () => ordenes.value.filter((o) => ['completado', 'entregado'].includes(o.estado)).length,
  )
  const ingresosTotales = computed(() =>
    ordenes.value
      .filter((o) => ['completado', 'entregado'].includes(o.estado))
      .reduce((sum, o) => sum + calcularTotal(o.lineas, o.descuento), 0),
  )

  async function fetchOrdenes() {
    loading.value = true
    error.value = null
    try {
      ordenes.value = await api.get<Orden[]>('/ordenes')
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  async function fetchOrden(id: number): Promise<Orden | null> {
    try {
      return await api.get<Orden>(`/ordenes/${id}`)
    } catch (e) {
      error.value = (e as Error).message
      return null
    }
  }

  async function crear(datos: OrdenInput): Promise<Orden | null> {
    error.value = null
    try {
      const nueva = await api.post<Orden>('/ordenes', datos)
      ordenes.value.unshift(nueva)
      return nueva
    } catch (e) {
      error.value = (e as Error).message
      return null
    }
  }

  async function actualizar(id: number, datos: Partial<OrdenInput>): Promise<Orden | null> {
    error.value = null
    try {
      const updated = await api.put<Orden>(`/ordenes/${id}`, datos)
      const idx = ordenes.value.findIndex((o) => o.id === id)
      if (idx !== -1) ordenes.value[idx] = updated
      return updated
    } catch (e) {
      error.value = (e as Error).message
      return null
    }
  }

  async function cambiarEstado(id: number, estado: string, imagenUrl?: string): Promise<Orden | null> {
    error.value = null
    try {
      const payload: Record<string, unknown> = { estado }
      if (imagenUrl) payload.imagenUrl = imagenUrl
      const updated = await api.put<Orden>(`/ordenes/${id}/estado`, payload)
      const idx = ordenes.value.findIndex((o) => o.id === id)
      if (idx !== -1) ordenes.value[idx] = updated
      return updated
    } catch (e) {
      error.value = (e as Error).message
      return null
    }
  }

  async function eliminar(id: number): Promise<boolean> {
    error.value = null
    try {
      await api.delete(`/ordenes/${id}`)
      ordenes.value = ordenes.value.filter((o) => o.id !== id)
      return true
    } catch (e) {
      error.value = (e as Error).message
      return false
    }
  }

  return {
    ordenes,
    loading,
    error,
    totalOrdenes,
    ordenesPendientes,
    ordenesEnProceso,
    ordenesCompletadas,
    ingresosTotales,
    fetchOrdenes,
    fetchOrden,
    crear,
    actualizar,
    eliminar,
    cambiarEstado,
  }
})

export function calcularSubtotal(lineas: OrdenLinea[]): number {
  return lineas.reduce((sum, l) => sum + l.cantidad * l.precioUnitario, 0)
}

/** ivaRate: valor de 0 a 100 (ej. 16 = 16%). Por defecto usa la configuración del sistema o 16. */
export function calcularIVA(
  lineas: OrdenLinea[],
  descuento = 0,
  ivaRate = ivaGlobal.value,
): number {
  return (calcularSubtotal(lineas) - descuento) * (ivaRate / 100)
}

export function calcularTotal(
  lineas: OrdenLinea[],
  descuento = 0,
  ivaRate = ivaGlobal.value,
): number {
  const sub = calcularSubtotal(lineas) - descuento
  return sub + sub * (ivaRate / 100)
}

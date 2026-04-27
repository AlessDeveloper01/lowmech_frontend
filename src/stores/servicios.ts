import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { api } from '@/services/api'
import type { ItemInventario } from './inventario'

export interface ServicioItem {
  id: number
  articuloId: number
  cantidad: number
  articulo: ItemInventario
}

export interface Servicio {
  id: number
  nombre: string
  descripcion: string
  categoria: string
  precioManoObra: number
  duracionMinutos: number
  activo: boolean
  notas: string
  items: ServicioItem[]
  createdAt: string
  updatedAt: string
}

export interface ServicioItemInput {
  articuloId: number
  cantidad: number
}

export interface ServicioInput {
  nombre: string
  descripcion?: string
  categoria?: string
  precioManoObra?: number
  duracionMinutos?: number
  activo?: boolean
  notas?: string
  items?: ServicioItemInput[]
}

export const useServiciosStore = defineStore('servicios', () => {
  const servicios = ref<Servicio[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const totalServicios = computed(() => servicios.value.length)
  const serviciosActivos = computed(() => servicios.value.filter((s) => s.activo).length)
  const categorias = computed(() =>
    [...new Set(servicios.value.map((s) => s.categoria).filter(Boolean))].sort(),
  )

  function costoMateriales(s: Servicio): number {
    return s.items.reduce((sum, i) => sum + (i.articulo?.precioVenta ?? 0) * i.cantidad, 0)
  }

  function costoTotal(s: Servicio): number {
    return s.precioManoObra + costoMateriales(s)
  }

  async function fetchServicios() {
    loading.value = true
    error.value = null
    try {
      servicios.value = await api.get<Servicio[]>('/servicios')
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  async function fetchServicio(id: number): Promise<Servicio | null> {
    try {
      return await api.get<Servicio>(`/servicios/${id}`)
    } catch (e) {
      error.value = (e as Error).message
      return null
    }
  }

  async function crear(datos: ServicioInput): Promise<Servicio | null> {
    error.value = null
    try {
      const nuevo = await api.post<Servicio>('/servicios', datos)
      servicios.value.unshift(nuevo)
      return nuevo
    } catch (e) {
      error.value = (e as Error).message
      return null
    }
  }

  async function actualizar(id: number, datos: Partial<ServicioInput>): Promise<Servicio | null> {
    error.value = null
    try {
      const updated = await api.put<Servicio>(`/servicios/${id}`, datos)
      const idx = servicios.value.findIndex((s) => s.id === id)
      if (idx !== -1) servicios.value[idx] = updated
      return updated
    } catch (e) {
      error.value = (e as Error).message
      return null
    }
  }

  async function eliminar(id: number): Promise<boolean> {
    error.value = null
    try {
      await api.delete(`/servicios/${id}`)
      servicios.value = servicios.value.filter((s) => s.id !== id)
      return true
    } catch (e) {
      error.value = (e as Error).message
      return false
    }
  }

  return {
    servicios,
    loading,
    error,
    totalServicios,
    serviciosActivos,
    categorias,
    costoMateriales,
    costoTotal,
    fetchServicios,
    fetchServicio,
    crear,
    actualizar,
    eliminar,
  }
})

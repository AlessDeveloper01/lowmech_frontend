import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { api } from '@/services/api'

export interface Promocion {
  id: number
  nombre: string
  descripcion: string
  tipo: string
  valor: number
  codigo: string
  fechaInicio: string
  fechaFin: string
  activa: boolean
  usosMaximos: number
  usosActuales: number
  condiciones: string
  createdAt: string
  updatedAt: string
}

export interface PromocionInput {
  nombre: string
  descripcion?: string
  tipo?: string
  valor?: number
  codigo?: string
  fechaInicio?: string
  fechaFin?: string
  activa?: boolean
  usosMaximos?: number
  condiciones?: string
}

export const usePromocionesStore = defineStore('promociones', () => {
  const promociones = ref<Promocion[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const totalPromociones = computed(() => promociones.value.length)
  const promocionesActivas = computed(() => promociones.value.filter((p) => p.activa).length)

  async function fetchPromociones() {
    loading.value = true
    error.value = null
    try {
      promociones.value = await api.get<Promocion[]>('/promociones')
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  async function fetchActivas() {
    try {
      return await api.get<Promocion[]>('/promociones/activas')
    } catch (e) {
      error.value = (e as Error).message
      return []
    }
  }

  async function fetchPromocion(id: number): Promise<Promocion | null> {
    try {
      return await api.get<Promocion>(`/promociones/${id}`)
    } catch (e) {
      error.value = (e as Error).message
      return null
    }
  }

  async function crear(datos: PromocionInput): Promise<Promocion | null> {
    error.value = null
    try {
      const nuevo = await api.post<Promocion>('/promociones', datos)
      promociones.value.unshift(nuevo)
      return nuevo
    } catch (e) {
      error.value = (e as Error).message
      return null
    }
  }

  async function actualizar(id: number, datos: Partial<PromocionInput>): Promise<Promocion | null> {
    error.value = null
    try {
      const updated = await api.put<Promocion>(`/promociones/${id}`, datos)
      const idx = promociones.value.findIndex((p) => p.id === id)
      if (idx !== -1) promociones.value[idx] = updated
      return updated
    } catch (e) {
      error.value = (e as Error).message
      return null
    }
  }

  async function eliminar(id: number): Promise<boolean> {
    error.value = null
    try {
      await api.delete(`/promociones/${id}`)
      promociones.value = promociones.value.filter((p) => p.id !== id)
      return true
    } catch (e) {
      error.value = (e as Error).message
      return false
    }
  }

  return {
    promociones,
    loading,
    error,
    totalPromociones,
    promocionesActivas,
    fetchPromociones,
    fetchActivas,
    fetchPromocion,
    crear,
    actualizar,
    eliminar,
  }
})

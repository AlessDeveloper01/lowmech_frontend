import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { api } from '@/services/api'

export type EstadoVehiculo = 'en_taller' | 'disponible' | 'en_espera'

export interface Vehiculo {
  id: number
  nombre: string
  marca: string
  modelo: string
  anio: string
  placa: string
  color: string
  vin: string
  kilometraje: number
  combustible: string
  clienteNombre: string
  clienteTelefono: string
  clienteEmail: string
  estado: EstadoVehiculo
  notas: string
  createdAt: string
  updatedAt: string
}

export interface CreateVehiculoPayload {
  nombre: string
  marca: string
  modelo: string
  anio?: string
  placa: string
  color?: string
  vin?: string
  kilometraje?: number
  combustible?: string
  clienteNombre: string
  clienteTelefono?: string
  clienteEmail?: string
  estado?: EstadoVehiculo
  notas?: string
}

export interface UpdateVehiculoPayload {
  nombre?: string
  marca?: string
  modelo?: string
  anio?: string
  placa?: string
  color?: string
  vin?: string
  kilometraje?: number
  combustible?: string
  clienteNombre?: string
  clienteTelefono?: string
  clienteEmail?: string
  estado?: EstadoVehiculo
  notas?: string
}

export const useVehiculosStore = defineStore('vehiculos', () => {
  const vehiculos = ref<Vehiculo[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const totalVehiculos = computed(() => vehiculos.value.length)
  const vehiculosEnTaller = computed(
    () => vehiculos.value.filter((v) => v.estado === 'en_taller').length,
  )
  const vehiculosDisponibles = computed(
    () => vehiculos.value.filter((v) => v.estado === 'disponible').length,
  )

  async function fetchVehiculos() {
    loading.value = true
    error.value = null
    try {
      vehiculos.value = await api.get<Vehiculo[]>('/vehiculos')
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  async function fetchVehiculo(id: number): Promise<Vehiculo | null> {
    try {
      return await api.get<Vehiculo>(`/vehiculos/${id}`)
    } catch (e) {
      error.value = (e as Error).message
      return null
    }
  }

  function obtenerPorId(id: number): Vehiculo | undefined {
    return vehiculos.value.find((v) => v.id === id)
  }

  async function crear(datos: CreateVehiculoPayload): Promise<Vehiculo | null> {
    try {
      const nuevo = await api.post<Vehiculo>('/vehiculos', datos)
      vehiculos.value.unshift(nuevo)
      return nuevo
    } catch (e) {
      error.value = (e as Error).message
      return null
    }
  }

  async function actualizar(id: number, datos: UpdateVehiculoPayload): Promise<Vehiculo | null> {
    try {
      const updated = await api.put<Vehiculo>(`/vehiculos/${id}`, datos)
      const idx = vehiculos.value.findIndex((v) => v.id === id)
      if (idx !== -1) vehiculos.value[idx] = updated
      return updated
    } catch (e) {
      error.value = (e as Error).message
      return null
    }
  }

  async function eliminar(id: number): Promise<boolean> {
    try {
      await api.delete(`/vehiculos/${id}`)
      vehiculos.value = vehiculos.value.filter((v) => v.id !== id)
      return true
    } catch (e) {
      error.value = (e as Error).message
      return false
    }
  }

  return {
    vehiculos,
    loading,
    error,
    totalVehiculos,
    vehiculosEnTaller,
    vehiculosDisponibles,
    fetchVehiculos,
    fetchVehiculo,
    obtenerPorId,
    crear,
    actualizar,
    eliminar,
  }
})

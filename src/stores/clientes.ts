import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { api } from '@/services/api'

export interface Cliente {
  id: number
  nombre: string
  telefono: string
  email: string
  direccion: string
  rfc: string
  notas: string
  createdAt: string
  updatedAt: string
}

export interface CreateClientePayload {
  nombre: string
  telefono: string
  email: string
  direccion?: string
  rfc?: string
  notas?: string
}

export interface UpdateClientePayload {
  nombre?: string
  telefono?: string
  email?: string
  direccion?: string
  rfc?: string
  notas?: string
}

export const useClientesStore = defineStore('clientes', () => {
  const clientes = ref<Cliente[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const totalClientes = computed(() => clientes.value.length)

  async function fetchClientes() {
    loading.value = true
    error.value = null
    try {
      clientes.value = await api.get<Cliente[]>('/clientes')
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  async function fetchCliente(id: number): Promise<Cliente | null> {
    try {
      return await api.get<Cliente>(`/clientes/${id}`)
    } catch (e) {
      error.value = (e as Error).message
      return null
    }
  }

  function obtenerPorId(id: number): Cliente | undefined {
    return clientes.value.find((c) => c.id === id)
  }

  function obtenerPorNombre(nombre: string): Cliente | undefined {
    return clientes.value.find((c) => c.nombre === nombre)
  }

  async function crear(datos: CreateClientePayload): Promise<Cliente | null> {
    try {
      const nuevo = await api.post<Cliente>('/clientes', datos)
      clientes.value.unshift(nuevo)
      return nuevo
    } catch (e) {
      error.value = (e as Error).message
      return null
    }
  }

  async function actualizar(id: number, datos: UpdateClientePayload): Promise<Cliente | null> {
    try {
      const updated = await api.put<Cliente>(`/clientes/${id}`, datos)
      const idx = clientes.value.findIndex((c) => c.id === id)
      if (idx !== -1) clientes.value[idx] = updated
      return updated
    } catch (e) {
      error.value = (e as Error).message
      return null
    }
  }

  async function eliminar(id: number): Promise<boolean> {
    try {
      await api.delete(`/clientes/${id}`)
      clientes.value = clientes.value.filter((c) => c.id !== id)
      return true
    } catch (e) {
      error.value = (e as Error).message
      return false
    }
  }

  return {
    clientes,
    loading,
    error,
    totalClientes,
    fetchClientes,
    fetchCliente,
    obtenerPorId,
    obtenerPorNombre,
    crear,
    actualizar,
    eliminar,
  }
})

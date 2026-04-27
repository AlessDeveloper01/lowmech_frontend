import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { api } from '@/services/api'

export type EstadoStock = 'critico' | 'bajo' | 'normal'

export interface ItemInventario {
  id: number
  nombre: string
  sku: string
  categoria: string
  stock: number
  stockMinimo: number
  unidad: string
  precioCompra: number
  precioVenta: number
  proveedor: string
  ubicacion: string
  notas: string
  createdAt: string
  updatedAt: string
}

type ItemInput = Omit<ItemInventario, 'id' | 'createdAt' | 'updatedAt'>

export function getEstadoStock(item: ItemInventario): EstadoStock {
  if (item.stock <= item.stockMinimo * 0.3) return 'critico'
  if (item.stock <= item.stockMinimo) return 'bajo'
  return 'normal'
}

export const useInventarioStore = defineStore('inventario', () => {
  const items = ref<ItemInventario[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const totalItems = computed(() => items.value.length)
  const itemsCriticos = computed(
    () => items.value.filter((i) => getEstadoStock(i) === 'critico').length,
  )
  const itemsBajos = computed(() => items.value.filter((i) => getEstadoStock(i) === 'bajo').length)
  const valorInventario = computed(() =>
    items.value.reduce((s, i) => s + i.stock * i.precioCompra, 0),
  )

  const categorias = computed(() => [...new Set(items.value.map((i) => i.categoria))].sort())

  async function fetchItems() {
    loading.value = true
    error.value = null
    try {
      items.value = await api.get<ItemInventario[]>('/inventario')
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  async function fetchItem(id: number): Promise<ItemInventario | null> {
    try {
      return await api.get<ItemInventario>(`/inventario/${id}`)
    } catch (e) {
      error.value = (e as Error).message
      return null
    }
  }

  function obtenerPorId(id: number): ItemInventario | undefined {
    return items.value.find((i) => i.id === id)
  }

  async function crear(datos: ItemInput): Promise<ItemInventario | null> {
    error.value = null
    try {
      const nuevo = await api.post<ItemInventario>('/inventario', datos)
      items.value.unshift(nuevo)
      return nuevo
    } catch (e) {
      error.value = (e as Error).message
      return null
    }
  }

  async function actualizar(id: number, datos: Partial<ItemInput>): Promise<ItemInventario | null> {
    error.value = null
    try {
      const updated = await api.put<ItemInventario>(`/inventario/${id}`, datos)
      const idx = items.value.findIndex((i) => i.id === id)
      if (idx !== -1) items.value[idx] = updated
      return updated
    } catch (e) {
      error.value = (e as Error).message
      return null
    }
  }

  async function eliminar(id: number): Promise<boolean> {
    error.value = null
    try {
      await api.delete(`/inventario/${id}`)
      items.value = items.value.filter((i) => i.id !== id)
      return true
    } catch (e) {
      error.value = (e as Error).message
      return false
    }
  }

  async function ajustarStock(id: number, cantidad: number): Promise<ItemInventario | null> {
    error.value = null
    try {
      const updated = await api.request<ItemInventario>('PATCH', `/inventario/${id}/stock`, {
        cantidad,
      })
      const idx = items.value.findIndex((i) => i.id === id)
      if (idx !== -1) items.value[idx] = updated
      return updated
    } catch (e) {
      error.value = (e as Error).message
      return null
    }
  }

  return {
    items,
    loading,
    error,
    totalItems,
    itemsCriticos,
    itemsBajos,
    valorInventario,
    categorias,
    fetchItems,
    fetchItem,
    obtenerPorId,
    crear,
    actualizar,
    eliminar,
    ajustarStock,
  }
})

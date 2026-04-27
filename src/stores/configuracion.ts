import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/services/api'
import { ivaGlobal } from '@/stores/ordenes'

export interface ConfiguracionData {
  tallerNombre: string
  tallerDireccion: string
  tallerTelefono: string
  tallerEmail: string
  iva: number
  moneda: string
}

const DEFAULTS: ConfiguracionData = {
  tallerNombre: 'LowMech Systems',
  tallerDireccion: 'Av. Principal #123, Col. Centro',
  tallerTelefono: '555-000-0000',
  tallerEmail: 'admin@lowmech.com',
  iva: 16,
  moneda: 'MXN',
}

export const useConfiguracionStore = defineStore('configuracion', () => {
  const config = ref<ConfiguracionData>({ ...DEFAULTS })
  const cargando = ref(false)
  const guardando = ref(false)

  async function fetchConfig() {
    try {
      cargando.value = true
      const data = await api.get<ConfiguracionData>('/configuracion')
      config.value = data
      ivaGlobal.value = data.iva // sincronizar IVA global para calcularTotal/calcularIVA
    } catch {
      // Si falla, conservar defaults
    } finally {
      cargando.value = false
    }
  }

  async function guardar(data: Partial<ConfiguracionData>) {
    try {
      guardando.value = true
      const actualizado = await api.put<ConfiguracionData>('/configuracion', data)
      config.value = actualizado
      ivaGlobal.value = actualizado.iva // actualizar IVA global al guardar
    } finally {
      guardando.value = false
    }
  }

  return { config, cargando, guardando, fetchConfig, guardar }
})

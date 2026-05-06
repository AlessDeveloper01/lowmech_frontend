import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { api } from '@/services/api'
import { authClient } from '@/services/betterAuth'

const STORAGE_KEY = 'lowmech_auth'

interface AuthUser {
  id: number
  username: string
  nombre: string
  apellido: string
  email: string
  rol: string
}

interface LoginResponse {
  access_token: string
  user: AuthUser
}

function cargarUsuario(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as AuthUser
  } catch {
    // ignore
  }
  return null
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(cargarUsuario())
  const isAuthenticated = computed(() => !!user.value)
  const isCliente = computed(() => user.value?.rol === 'cliente')
  const isMecanico = computed(() => user.value?.rol === 'mecanico')
  const isRecepcionista = computed(() => user.value?.rol === 'recepcionista')
  const rol = computed(() => user.value?.rol ?? '')

  async function login(
    username: string,
    password: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const data = await api.post<LoginResponse>('/auth/login', { username, password })
      api.setToken(data.access_token)
      user.value = data.user
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user))
      return { success: true }
    } catch (e) {
      return { success: false, error: (e as Error).message }
    }
  }

  /** Intercambia sesión Better Auth por JWT interno */
  async function clienteExchange(): Promise<{ success: boolean; error?: string }> {
    try {
      const data = await api.post<LoginResponse>('/auth/cliente/exchange', {})
      api.setToken(data.access_token)
      user.value = data.user
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user))
      return { success: true }
    } catch (e) {
      return { success: false, error: (e as Error).message }
    }
  }

  async function logout() {
    if (isCliente.value) {
      await authClient.signOut().catch(() => {})
    }
    user.value = null
    api.setToken(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  return {
    user,
    isAuthenticated,
    isCliente,
    isMecanico,
    isRecepcionista,
    rol,
    login,
    clienteExchange,
    logout,
  }
})

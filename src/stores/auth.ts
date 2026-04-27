import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { api } from '@/services/api'

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

  /** Verifica si el email existe y si ya tiene contraseña */
  async function clienteCheck(email: string): Promise<{ needsPassword: boolean }> {
    return api.post<{ needsPassword: boolean }>('/auth/cliente/check', { email })
  }

  /** Primer acceso: establece contraseña y autentica */
  async function clienteSetPassword(
    email: string,
    password: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const data = await api.post<LoginResponse>('/auth/cliente/set-password', { email, password })
      api.setToken(data.access_token)
      user.value = data.user
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user))
      return { success: true }
    } catch (e) {
      return { success: false, error: (e as Error).message }
    }
  }

  /** Login de cliente con email + contraseña */
  async function clienteLogin(
    email: string,
    password: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const data = await api.post<LoginResponse>('/auth/cliente/login', { email, password })
      api.setToken(data.access_token)
      user.value = data.user
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user))
      return { success: true }
    } catch (e) {
      return { success: false, error: (e as Error).message }
    }
  }

  function logout() {
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
    clienteCheck,
    clienteSetPassword,
    clienteLogin,
    logout,
  }
})

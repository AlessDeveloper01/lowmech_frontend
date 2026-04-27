import { ref } from 'vue'
import { defineStore } from 'pinia'
import { api } from '@/services/api'

export interface User {
  id: number
  username: string
  nombre: string
  apellido: string
  email: string
  rol: 'admin' | 'mecanico' | 'recepcionista'
  activo: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateUserPayload {
  username: string
  password: string
  nombre: string
  apellido: string
  email: string
  rol?: string
}

export interface UpdateUserPayload {
  username?: string
  password?: string
  nombre?: string
  apellido?: string
  email?: string
  rol?: string
  activo?: boolean
}

export const useUsersStore = defineStore('users', () => {
  const users = ref<User[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchUsers() {
    loading.value = true
    error.value = null
    try {
      users.value = await api.get<User[]>('/users')
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  async function fetchUser(id: number): Promise<User | null> {
    try {
      return await api.get<User>(`/users/${id}`)
    } catch (e) {
      error.value = (e as Error).message
      return null
    }
  }

  async function createUser(payload: CreateUserPayload): Promise<User | null> {
    try {
      const user = await api.post<User>('/users', payload)
      users.value.push(user)
      return user
    } catch (e) {
      error.value = (e as Error).message
      return null
    }
  }

  async function updateUser(id: number, payload: UpdateUserPayload): Promise<User | null> {
    try {
      const updated = await api.put<User>(`/users/${id}`, payload)
      const idx = users.value.findIndex((u) => u.id === id)
      if (idx !== -1) users.value[idx] = updated
      return updated
    } catch (e) {
      error.value = (e as Error).message
      return null
    }
  }

  async function deleteUser(id: number): Promise<boolean> {
    try {
      await api.delete(`/users/${id}`)
      users.value = users.value.filter((u) => u.id !== id)
      return true
    } catch (e) {
      error.value = (e as Error).message
      return false
    }
  }

  return { users, loading, error, fetchUsers, fetchUser, createUser, updateUser, deleteUser }
})

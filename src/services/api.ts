const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'

class ApiService {
  private token: string | null = null

  constructor() {
    this.token = localStorage.getItem('lowmech_token')
  }

  setToken(token: string | null) {
    this.token = token
    if (token) {
      localStorage.setItem('lowmech_token', token)
    } else {
      localStorage.removeItem('lowmech_token')
    }
  }

  getToken(): string | null {
    return this.token
  }

  private headers(extra: Record<string, string> = {}): Record<string, string> {
    const h: Record<string, string> = {
      'Content-Type': 'application/json',
      ...extra,
    }
    if (this.token) {
      h['Authorization'] = `Bearer ${this.token}`
    }
    return h
  }

  async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: this.headers(),
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include',
    })

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Error de conexión' }))
      throw new Error(error.message ?? `Error ${res.status}`)
    }

    if (res.status === 204) return undefined as T
    return res.json()
  }

  get<T>(path: string) {
    return this.request<T>('GET', path)
  }

  post<T>(path: string, body: unknown) {
    return this.request<T>('POST', path, body)
  }

  put<T>(path: string, body: unknown) {
    return this.request<T>('PUT', path, body)
  }

  patch<T>(path: string, body: unknown) {
    return this.request<T>('PATCH', path, body)
  }

  delete<T>(path: string) {
    return this.request<T>('DELETE', path)
  }
}

export const api = new ApiService()

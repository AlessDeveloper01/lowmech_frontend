import { createAuthClient } from 'better-auth/client'

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL?.replace('/api', '') ?? 'http://localhost:3000',
  basePath: '/api/cliente-auth',
  fetchOptions: {
    credentials: 'include',
  },
})

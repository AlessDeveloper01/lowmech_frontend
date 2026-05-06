<script setup lang="ts">
import { ref, onMounted } from 'vue'
import LogoBrand from '@/components/login/LogoBrand.vue'
import LoginForm from '@/components/login/LoginForm.vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { authClient } from '@/services/betterAuth'

const authStore = useAuthStore()
const router = useRouter()

const tab = ref<'staff' | 'cliente'>('staff')
const clienteSubTab = ref<'login' | 'register'>('login')

const clienteName = ref('')
const clienteEmail = ref('')
const clientePassword = ref('')
const clienteConfirm = ref('')
const clienteLoading = ref(false)
const clienteError = ref('')

onMounted(async () => {
  const { data: session } = await authClient.getSession()
  if (session) {
    const result = await authStore.clienteExchange()
    if (result.success) {
      router.push({ name: 'cliente-ordenes' })
    }
  }
})

async function handleClienteLogin() {
  clienteError.value = ''
  clienteLoading.value = true
  const { error } = await authClient.signIn.email({
    email: clienteEmail.value,
    password: clientePassword.value,
  })
  if (error) {
    clienteLoading.value = false
    clienteError.value = error.message || 'Error al iniciar sesión'
    return
  }
  const result = await authStore.clienteExchange()
  clienteLoading.value = false
  if (result.success) {
    router.push({ name: 'cliente-ordenes' })
  } else {
    clienteError.value = result.error || 'Error al obtener sesión'
  }
}

async function handleClienteRegister() {
  clienteError.value = ''
  if (clientePassword.value !== clienteConfirm.value) {
    clienteError.value = 'Las contraseñas no coinciden'
    return
  }
  if (clientePassword.value.length < 8) {
    clienteError.value = 'La contraseña debe tener al menos 8 caracteres'
    return
  }
  clienteLoading.value = true
  const { error } = await authClient.signUp.email({
    name: clienteName.value,
    email: clienteEmail.value,
    password: clientePassword.value,
  })
  if (error) {
    clienteLoading.value = false
    clienteError.value = error.message || 'Error al registrarse'
    return
  }
  const result = await authStore.clienteExchange()
  clienteLoading.value = false
  if (result.success) {
    router.push({ name: 'cliente-ordenes' })
  } else {
    clienteError.value = result.error || 'Error al obtener sesión'
  }
}

async function signInWithGoogle() {
  clienteError.value = ''
  clienteLoading.value = true
  const { error } = await authClient.signIn.social({
    provider: 'google',
    callbackURL: `${window.location.origin}${import.meta.env.BASE_URL}cliente/mis-ordenes`,
  })
  if (error) {
    clienteLoading.value = false
    clienteError.value = error.message || 'Error al iniciar con Google'
  }
}

function resetCliente() {
  clienteSubTab.value = 'login'
  clienteName.value = ''
  clienteEmail.value = ''
  clientePassword.value = ''
  clienteConfirm.value = ''
  clienteError.value = ''
}
</script>

<template>
  <main class="min-h-screen flex bg-bg">
    <!-- Lado izquierdo: branding limpio -->
    <aside
      class="hidden lg:flex flex-col justify-between w-[40%] bg-navy p-14 text-white"
    >
      <header>
        <LogoBrand size="lg" light />
      </header>

      <section class="space-y-5">
        <h1 class="text-[2.6rem] font-bold leading-tight">
          Sistema de Gestión<br />para Talleres Mecánicos
        </h1>
        <p class="text-white/60 text-[1.4rem] leading-relaxed max-w-[30rem]">
          Administra órdenes, vehículos, inventario y clientes desde un solo lugar.
        </p>
      </section>

      <footer class="text-white/30 text-[1.2rem]">
        LowMech Systems
      </footer>
    </aside>

    <!-- Lado derecho: formularios -->
    <section class="flex-1 flex items-center justify-center p-8 md:p-16">
      <article class="w-full max-w-[44rem]">
        <!-- Logo mobile -->
        <header class="lg:hidden mb-10">
          <LogoBrand size="md" />
        </header>

        <!-- Tabs staff / cliente -->
        <nav class="flex mb-10 border-b border-border">
          <button
            @click="tab = 'staff'"
            class="px-6 py-3 text-sm font-semibold transition-colors relative"
            :class="tab === 'staff' ? 'text-primary' : 'text-muted hover:text-text'"
          >
            Personal
            <span
              v-if="tab === 'staff'"
              class="absolute bottom-0 left-0 w-full h-0.5 bg-primary"
            />
          </button>
          <button
            @click="tab = 'cliente'; resetCliente()"
            class="px-6 py-3 text-sm font-semibold transition-colors relative"
            :class="tab === 'cliente' ? 'text-primary' : 'text-muted hover:text-text'"
          >
            Portal Clientes
            <span
              v-if="tab === 'cliente'"
              class="absolute bottom-0 left-0 w-full h-0.5 bg-primary"
            />
          </button>
        </nav>

        <!-- Staff login -->
        <LoginForm v-if="tab === 'staff'" />

        <!-- Cliente login / registro -->
        <div v-else class="flex flex-col gap-6">
          <div class="flex gap-3">
            <button
              @click="clienteSubTab = 'login'"
              class="px-5 py-2 text-sm font-medium rounded-lg transition-colors"
              :class="clienteSubTab === 'login' ? 'bg-primary text-white' : 'bg-subtle text-muted hover:text-text'"
            >
              Iniciar sesión
            </button>
            <button
              @click="clienteSubTab = 'register'"
              class="px-5 py-2 text-sm font-medium rounded-lg transition-colors"
              :class="clienteSubTab === 'register' ? 'bg-primary text-white' : 'bg-subtle text-muted hover:text-text'"
            >
              Crear cuenta
            </button>
          </div>

          <!-- Google login -->
          <button
            type="button"
            @click="signInWithGoogle"
            :disabled="clienteLoading"
            class="w-full flex items-center justify-center gap-3 rounded-lg border border-border bg-surface hover:bg-subtle disabled:opacity-50 py-3 text-sm font-medium text-text transition-colors"
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continuar con Google
          </button>

          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <span class="w-full border-t border-border" />
            </div>
            <div class="relative flex justify-center text-xs">
              <span class="bg-bg px-3 text-muted">o con correo</span>
            </div>
          </div>

          <!-- Login cliente -->
          <form
            v-if="clienteSubTab === 'login'"
            @submit.prevent="handleClienteLogin"
            class="flex flex-col gap-5"
          >
            <div>
              <label class="block text-sm font-medium text-text mb-1.5">Correo electrónico</label>
              <input
                v-model="clienteEmail"
                type="email"
                required
                placeholder="tu@correo.com"
                class="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-text mb-1.5">Contraseña</label>
              <input
                v-model="clientePassword"
                type="password"
                required
                placeholder="••••••••"
                class="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>
            <p v-if="clienteError" class="text-sm text-red-500">{{ clienteError }}</p>
            <button
              type="submit"
              :disabled="clienteLoading"
              class="w-full rounded-lg bg-primary hover:bg-primary-dark disabled:opacity-50 py-3 text-sm font-semibold text-white transition-colors"
            >
              {{ clienteLoading ? 'Entrando...' : 'Ingresar' }}
            </button>
          </form>

          <!-- Registro cliente -->
          <form
            v-else
            @submit.prevent="handleClienteRegister"
            class="flex flex-col gap-5"
          >
            <div>
              <label class="block text-sm font-medium text-text mb-1.5">Nombre completo</label>
              <input
                v-model="clienteName"
                type="text"
                required
                placeholder="Juan Pérez"
                class="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-text mb-1.5">Correo electrónico</label>
              <input
                v-model="clienteEmail"
                type="email"
                required
                placeholder="tu@correo.com"
                class="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-text mb-1.5">Contraseña</label>
              <input
                v-model="clientePassword"
                type="password"
                required
                placeholder="Mínimo 8 caracteres"
                class="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-text mb-1.5">Confirmar contraseña</label>
              <input
                v-model="clienteConfirm"
                type="password"
                required
                placeholder="Repite tu contraseña"
                class="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>
            <p v-if="clienteError" class="text-sm text-red-500">{{ clienteError }}</p>
            <button
              type="submit"
              :disabled="clienteLoading"
              class="w-full rounded-lg bg-primary hover:bg-primary-dark disabled:opacity-50 py-3 text-sm font-semibold text-white transition-colors"
            >
              {{ clienteLoading ? 'Creando cuenta...' : 'Registrarme' }}
            </button>
          </form>
        </div>
      </article>
    </section>
  </main>
</template>

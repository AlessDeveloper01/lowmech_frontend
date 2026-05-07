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
  <main class="min-h-screen flex bg-[#080808] overflow-hidden relative">

    <!-- Grid background -->
    <div class="absolute inset-0 pointer-events-none" style="
      background-image:
        linear-gradient(rgba(0,255,180,0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0,255,180,0.03) 1px, transparent 1px);
      background-size: 40px 40px;
    "/>

    <!-- Glow top-left -->
    <div class="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full pointer-events-none"
      style="background: radial-gradient(circle, rgba(0,255,180,0.07) 0%, transparent 70%)"/>

    <!-- Lado izquierdo -->
    <aside class="hidden lg:flex flex-col justify-between w-[42%] p-16 relative border-r border-white/5">
      <!-- Scan line animada -->
      <div class="absolute inset-0 pointer-events-none overflow-hidden">
        <div class="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00ffb4]/40 to-transparent"
          style="animation: scanline 6s linear infinite; top: 0"/>
      </div>

      <header class="flex items-center gap-3">
        <LogoBrand size="lg" light />
      </header>

      <section class="space-y-6">
        <div class="flex items-center gap-2 mb-4">
          <span class="w-2 h-2 rounded-full bg-[#00ffb4] animate-pulse"/>
          <span class="text-[#00ffb4] text-xs font-mono tracking-[0.2em] uppercase">Sistema activo</span>
        </div>
        <h1 class="text-5xl font-mono font-bold leading-[1.1] text-white tracking-tight">
          Gestión<br/>
          <span style="color: #00ffb4">Mecánica</span><br/>
          Avanzada
        </h1>
        <p class="text-white/35 text-sm font-mono leading-relaxed max-w-xs">
          Órdenes · Vehículos · Inventario · Clientes<br/>
          Centralizado. Preciso. Eficiente.
        </p>
      </section>

      <footer class="font-mono text-[10px] text-white/20 tracking-[0.3em] uppercase">
        LowMech Systems — v2.0
      </footer>
    </aside>

    <!-- Lado derecho -->
    <section class="flex-1 flex items-center justify-center p-8 md:p-16 relative">

      <!-- Glow derecho -->
      <div class="absolute top-1/2 right-0 -translate-y-1/2 w-64 h-64 pointer-events-none"
        style="background: radial-gradient(circle, rgba(0,255,180,0.05) 0%, transparent 70%)"/>

      <article class="w-full max-w-[420px] relative">

        <!-- Logo mobile -->
        <header class="lg:hidden mb-10">
          <LogoBrand size="md" />
        </header>

        <!-- Corner decorators -->
        <div class="absolute -top-3 -left-3 w-6 h-6 border-t border-l border-[#00ffb4]/40"/>
        <div class="absolute -top-3 -right-3 w-6 h-6 border-t border-r border-[#00ffb4]/40"/>
        <div class="absolute -bottom-3 -left-3 w-6 h-6 border-b border-l border-[#00ffb4]/40"/>
        <div class="absolute -bottom-3 -right-3 w-6 h-6 border-b border-r border-[#00ffb4]/40"/>

        <!-- Tabs -->
        <nav class="flex mb-8 gap-1 p-1 rounded-lg bg-white/[0.03] border border-white/[0.06]">
          <button
            @click="tab = 'staff'"
            class="flex-1 px-4 py-2.5 text-xs font-mono font-semibold tracking-widest uppercase transition-all duration-200 rounded-md"
            :class="tab === 'staff'
              ? 'bg-[#00ffb4] text-black'
              : 'text-white/30 hover:text-white/60'"
          >
            Personal
          </button>
          <button
            @click="tab = 'cliente'; resetCliente()"
            class="flex-1 px-4 py-2.5 text-xs font-mono font-semibold tracking-widest uppercase transition-all duration-200 rounded-md"
            :class="tab === 'cliente'
              ? 'bg-[#00ffb4] text-black'
              : 'text-white/30 hover:text-white/60'"
          >
            Clientes
          </button>
        </nav>

        <!-- Staff login -->
        <LoginForm v-if="tab === 'staff'" />

        <!-- Cliente -->
        <div v-else class="flex flex-col gap-5">

          <!-- Sub-tabs -->
          <div class="flex gap-2">
            <button
              @click="clienteSubTab = 'login'"
              class="px-4 py-1.5 text-[11px] font-mono tracking-widest uppercase rounded border transition-all"
              :class="clienteSubTab === 'login'
                ? 'border-[#00ffb4]/60 text-[#00ffb4] bg-[#00ffb4]/5'
                : 'border-white/10 text-white/30 hover:text-white/50'"
            >
              Acceder
            </button>
            <button
              @click="clienteSubTab = 'register'"
              class="px-4 py-1.5 text-[11px] font-mono tracking-widest uppercase rounded border transition-all"
              :class="clienteSubTab === 'register'
                ? 'border-[#00ffb4]/60 text-[#00ffb4] bg-[#00ffb4]/5'
                : 'border-white/10 text-white/30 hover:text-white/50'"
            >
              Registro
            </button>
          </div>

          <!-- Google -->
          <button
            type="button"
            @click="signInWithGoogle"
            :disabled="clienteLoading"
            class="w-full flex items-center justify-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20 disabled:opacity-30 py-3 text-xs font-mono text-white/60 tracking-widest uppercase transition-all duration-200"
          >
            <svg class="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar con Google
          </button>

          <!-- Divider -->
          <div class="relative flex items-center gap-3">
            <div class="flex-1 h-px bg-white/[0.06]"/>
            <span class="text-[10px] font-mono text-white/20 tracking-widest uppercase">o</span>
            <div class="flex-1 h-px bg-white/[0.06]"/>
          </div>

          <!-- Login cliente -->
          <form
            v-if="clienteSubTab === 'login'"
            @submit.prevent="handleClienteLogin"
            class="flex flex-col gap-4"
          >
            <div class="flex flex-col gap-1.5">
              <label class="text-[10px] font-mono tracking-widest uppercase text-white/30">Correo electrónico</label>
              <input
                v-model="clienteEmail"
                type="email"
                required
                placeholder="tu@correo.com"
                class="w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-mono text-white/80 placeholder-white/15 focus:outline-none focus:border-[#00ffb4]/40 focus:bg-[#00ffb4]/[0.02] transition-all duration-200"
              />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-[10px] font-mono tracking-widest uppercase text-white/30">Contraseña</label>
              <input
                v-model="clientePassword"
                type="password"
                required
                placeholder="••••••••"
                class="w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-mono text-white/80 placeholder-white/15 focus:outline-none focus:border-[#00ffb4]/40 focus:bg-[#00ffb4]/[0.02] transition-all duration-200"
              />
            </div>
            <div class="flex justify-end">
              <RouterLink
                :to="{ name: 'forgot-password', query: { type: 'cliente' } }"
                class="text-[11px] font-mono text-[#00ffb4]/60 no-underline hover:text-[#00ffb4] transition-colors tracking-wide"
              >
                ¿Olvidaste tu contraseña?
              </RouterLink>
            </div>
            <p v-if="clienteError" class="text-xs font-mono text-red-400/80">{{ clienteError }}</p>
            <button
              type="submit"
              :disabled="clienteLoading"
              class="w-full rounded-lg bg-[#00ffb4] hover:bg-[#00e6a0] disabled:opacity-30 py-3 text-xs font-mono font-bold text-black tracking-widest uppercase transition-all duration-200"
            >
              {{ clienteLoading ? '...' : 'Ingresar' }}
            </button>
          </form>

          <!-- Registro cliente -->
          <form
            v-else
            @submit.prevent="handleClienteRegister"
            class="flex flex-col gap-4"
          >
            <div class="flex flex-col gap-1.5">
              <label class="text-[10px] font-mono tracking-widest uppercase text-white/30">Nombre completo</label>
              <input
                v-model="clienteName"
                type="text"
                required
                placeholder="Juan Pérez"
                class="w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-mono text-white/80 placeholder-white/15 focus:outline-none focus:border-[#00ffb4]/40 focus:bg-[#00ffb4]/[0.02] transition-all duration-200"
              />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-[10px] font-mono tracking-widest uppercase text-white/30">Correo electrónico</label>
              <input
                v-model="clienteEmail"
                type="email"
                required
                placeholder="tu@correo.com"
                class="w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-mono text-white/80 placeholder-white/15 focus:outline-none focus:border-[#00ffb4]/40 focus:bg-[#00ffb4]/[0.02] transition-all duration-200"
              />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-[10px] font-mono tracking-widest uppercase text-white/30">Contraseña</label>
              <input
                v-model="clientePassword"
                type="password"
                required
                placeholder="Mínimo 8 caracteres"
                class="w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-mono text-white/80 placeholder-white/15 focus:outline-none focus:border-[#00ffb4]/40 focus:bg-[#00ffb4]/[0.02] transition-all duration-200"
              />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-[10px] font-mono tracking-widest uppercase text-white/30">Confirmar contraseña</label>
              <input
                v-model="clienteConfirm"
                type="password"
                required
                placeholder="Repite tu contraseña"
                class="w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-mono text-white/80 placeholder-white/15 focus:outline-none focus:border-[#00ffb4]/40 focus:bg-[#00ffb4]/[0.02] transition-all duration-200"
              />
            </div>
            <p v-if="clienteError" class="text-xs font-mono text-red-400/80">{{ clienteError }}</p>
            <button
              type="submit"
              :disabled="clienteLoading"
              class="w-full rounded-lg bg-[#00ffb4] hover:bg-[#00e6a0] disabled:opacity-30 py-3 text-xs font-mono font-bold text-black tracking-widest uppercase transition-all duration-200"
            >
              {{ clienteLoading ? '...' : 'Registrarme' }}
            </button>
          </form>
        </div>
      </article>
    </section>
  </main>
</template>

<style scoped>
@keyframes scanline {
  0%   { top: -2px; opacity: 0; }
  10%  { opacity: 1; }
  90%  { opacity: 1; }
  100% { top: 100%; opacity: 0; }
}
</style>
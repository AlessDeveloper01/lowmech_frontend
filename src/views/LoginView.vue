<script setup lang="ts">
import { ref } from 'vue'
import LogoBrand from '@/components/login/LogoBrand.vue'
import LoginForm from '@/components/login/LoginForm.vue'
import SetPasswordModal from '@/components/login/SetPasswordModal.vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

// Tabs: 'staff' | 'cliente'
const tab = ref<'staff' | 'cliente'>('staff')

// Estado del login de cliente
const clienteEmail = ref('')
const clientePassword = ref('')
const clienteStep = ref<'email' | 'password'>('email') // 'email' = sólo email, 'password' = ya tiene contraseña
const showSetPasswordModal = ref(false)
const clienteLoading = ref(false)
const clienteError = ref('')

async function handleClienteEmail() {
  clienteError.value = ''
  if (!clienteEmail.value) return
  clienteLoading.value = true
  try {
    const res = await authStore.clienteCheck(clienteEmail.value)
    if (res.needsPassword) {
      // Primer acceso: abrir modal para crear contraseña
      showSetPasswordModal.value = true
    } else {
      // Ya tiene contraseña: mostrar campo de contraseña
      clienteStep.value = 'password'
    }
  } catch (e: any) {
    clienteError.value = e?.message ?? 'Correo no registrado'
  } finally {
    clienteLoading.value = false
  }
}

async function handleClienteLogin() {
  clienteError.value = ''
  clienteLoading.value = true
  const result = await authStore.clienteLogin(clienteEmail.value, clientePassword.value)
  clienteLoading.value = false
  if (result.success) {
    router.push({ name: 'cliente-ordenes' })
  } else {
    clienteError.value = result.error ?? 'Credenciales inválidas'
  }
}

function resetCliente() {
  clienteStep.value = 'email'
  clienteEmail.value = ''
  clientePassword.value = ''
  clienteError.value = ''
  showSetPasswordModal.value = false
}
</script>

<template>
  <main class="min-h-screen flex">
    <!-- Lado izquierdo: branding -->
    <aside
      class="hidden lg:flex flex-col items-center justify-center w-[45%] bg-navy relative overflow-hidden"
    >
      <!-- Decoración de fondo - spans puros para layout decorativo sin significado semántico -->
      <aside class="absolute inset-0 opacity-10" aria-hidden="true">
        <span
          class="absolute top-[-10%] right-[-10%] w-[40rem] h-[40rem] rounded-full bg-primary block"
        ></span>
        <span
          class="absolute bottom-[-15%] left-[-5%] w-[30rem] h-[30rem] rounded-full bg-primary block"
        ></span>
      </aside>

      <section class="relative z-10 flex flex-col items-center gap-10 px-12">
        <header>
          <LogoBrand size="lg" />
        </header>

        <hgroup class="flex flex-col items-center gap-4 text-center">
          <h1 class="text-[2.2rem] font-bold text-white leading-tight">
            Sistema de Gestión<br />para Talleres Mecánicos
          </h1>
          <p class="text-[1.5rem] text-white/70 max-w-[36rem] leading-relaxed">
            Administra órdenes de trabajo, vehículos, inventario y clientes desde un solo lugar.
          </p>
        </hgroup>

        <!-- Features -->
        <section
          class="flex flex-col gap-4 w-full max-w-[36rem] mt-4"
          aria-label="Características principales"
        >
          <article class="flex items-center gap-4 text-white/80">
            <span
              class="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[1.4rem] shrink-0"
              aria-hidden="true"
              >✓</span
            >
            <span class="text-[1.4rem]">Control de órdenes en tiempo real</span>
          </article>
          <article class="flex items-center gap-4 text-white/80">
            <span
              class="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[1.4rem] shrink-0"
              aria-hidden="true"
              >✓</span
            >
            <span class="text-[1.4rem]">Gestión de inventario de refacciones</span>
          </article>
          <article class="flex items-center gap-4 text-white/80">
            <span
              class="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[1.4rem] shrink-0"
              aria-hidden="true"
              >✓</span
            >
            <span class="text-[1.4rem]">Recordatorios automáticos a clientes</span>
          </article>
        </section>
      </section>
    </aside>

    <!-- Lado derecho: formulario -->
    <section class="flex-1 flex items-center justify-center p-12 bg-bg">
      <article class="w-full max-w-[42rem]">
        <!-- Logo visible solo en móvil -->
        <header class="lg:hidden mb-12">
          <LogoBrand size="md" />
        </header>

        <!-- Tabs -->
        <div class="flex rounded-xl overflow-hidden border border-border mb-8">
          <button
            @click="tab = 'staff'"
            :class="[
              'flex-1 py-2.5 text-sm font-semibold transition-colors',
              tab === 'staff'
                ? 'bg-primary text-white'
                : 'bg-white dark:bg-neutral-900 text-muted hover:text-text',
            ]"
          >
            Personal
          </button>
          <button
            @click="tab = 'cliente'; resetCliente()"
            :class="[
              'flex-1 py-2.5 text-sm font-semibold transition-colors',
              tab === 'cliente'
                ? 'bg-primary text-white'
                : 'bg-white dark:bg-neutral-900 text-muted hover:text-text',
            ]"
          >
            Portal Clientes
          </button>
        </div>

        <!-- Login personal (staff / admin) -->
        <LoginForm v-if="tab === 'staff'" />

        <!-- Login clientes -->
        <div v-else class="flex flex-col gap-5">
          <hgroup class="mb-2">
            <h2 class="text-[2rem] font-bold text-text">Acceso de Clientes</h2>
            <p class="text-muted text-[1.3rem]">Consulta tus vehículos y órdenes de servicio.</p>
          </hgroup>

          <!-- Paso 1: ingresar email -->
          <form
            v-if="clienteStep === 'email'"
            @submit.prevent="handleClienteEmail"
            class="flex flex-col gap-4"
          >
            <div>
              <label class="block text-sm font-medium text-text mb-1">Correo electrónico</label>
              <input
                v-model="clienteEmail"
                type="email"
                placeholder="tu@correo.com"
                required
                class="w-full rounded-lg border border-border bg-white dark:bg-neutral-900 px-4 py-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <p v-if="clienteError" class="text-sm text-red-500">{{ clienteError }}</p>
            <button
              type="submit"
              :disabled="clienteLoading"
              class="w-full rounded-lg bg-primary hover:bg-orange-600 disabled:opacity-50 py-2.5 text-sm font-semibold text-white transition-colors"
            >
              {{ clienteLoading ? 'Verificando...' : 'Continuar' }}
            </button>
          </form>

          <!-- Paso 2: ingresar contraseña (ya la tiene) -->
          <form
            v-else-if="clienteStep === 'password'"
            @submit.prevent="handleClienteLogin"
            class="flex flex-col gap-4"
          >
            <p class="text-sm text-muted">
              Accediendo como <span class="font-semibold text-text">{{ clienteEmail }}</span>
              <button
                type="button"
                @click="resetCliente"
                class="ml-2 text-primary text-xs underline"
              >
                Cambiar
              </button>
            </p>
            <div>
              <label class="block text-sm font-medium text-text mb-1">Contraseña</label>
              <input
                v-model="clientePassword"
                type="password"
                placeholder="Tu contraseña"
                required
                class="w-full rounded-lg border border-border bg-white dark:bg-neutral-900 px-4 py-2.5 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <p v-if="clienteError" class="text-sm text-red-500">{{ clienteError }}</p>
            <button
              type="submit"
              :disabled="clienteLoading"
              class="w-full rounded-lg bg-primary hover:bg-orange-600 disabled:opacity-50 py-2.5 text-sm font-semibold text-white transition-colors"
            >
              {{ clienteLoading ? 'Entrando...' : 'Ingresar' }}
            </button>
          </form>
        </div>

        <footer class="mt-12 pt-8 border-t border-border text-center">
          <p class="text-[1.3rem] text-muted">
            ¿No tienes una cuenta?
            <a
              href="#"
              class="font-semibold text-primary no-underline hover:opacity-70 transition-opacity"
            >
              Contacta al administrador
            </a>
          </p>
        </footer>
      </article>
    </section>

    <!-- Modal para primer acceso: crear contraseña -->
    <SetPasswordModal
      v-if="showSetPasswordModal"
      :email="clienteEmail"
      @close="showSetPasswordModal = false"
    />
  </main>
</template>

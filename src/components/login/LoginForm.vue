<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import Swal from 'sweetalert2'

const router = useRouter()
const auth = useAuthStore()

const username = ref('')
const password = ref('')
const rememberMe = ref(false)
const errors = ref<Record<string, string>>({})
const serverError = ref('')
const loading = ref(false)

function validate(): boolean {
  errors.value = {}
  serverError.value = ''

  if (!username.value) {
    errors.value.username = 'El usuario es obligatorio'
  } else if (username.value.length < 4) {
    errors.value.username = 'Mínimo 4 caracteres'
  }

  if (!password.value) {
    errors.value.password = 'La contraseña es obligatoria'
  } else if (password.value.length < 6) {
    errors.value.password = 'Mínimo 6 caracteres'
  }

  return Object.keys(errors.value).length === 0
}

async function handleSubmit() {
  if (!validate()) return

  loading.value = true
  const result = await auth.login(username.value, password.value)
  loading.value = false

  if (result.success) {
    await Swal.fire({
      title: '¡Bienvenido!',
      text: `Sesión iniciada correctamente.`,
      icon: 'success',
      timer: 1500,
      showConfirmButton: false,
    })
    router.push({ name: 'dashboard' })
  } else {
    serverError.value = result.error ?? 'Error al iniciar sesión'
  }
}
</script>

<template>
  <form class="w-full flex flex-col gap-6" @submit.prevent="handleSubmit">

    <header class="flex flex-col gap-1.5">
      <h2 class="text-2xl font-mono font-bold text-white tracking-tight">Acceso Personal</h2>
      <p class="text-[11px] font-mono text-white/30 tracking-widest uppercase">Ingresa tus credenciales de sistema</p>
    </header>

    <!-- Server error -->
    <section
      v-if="serverError"
      class="px-4 py-3 rounded-lg border border-red-500/20 bg-red-500/5 text-xs font-mono text-red-400/80"
    >
      {{ serverError }}
    </section>

    <section class="flex flex-col gap-4">
      <!-- Usuario -->
      <div class="flex flex-col gap-1.5">
        <label class="text-[10px] font-mono tracking-widest uppercase text-white/30">Usuario</label>
        <BaseInput
          v-model="username"
          type="text"
          placeholder="admin"
          :error="errors.username"
          class="w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-mono text-white/80 placeholder-white/15 focus:outline-none focus:border-[#00ffb4]/40 focus:bg-[#00ffb4]/[0.02] transition-all duration-200"
          variant="form"
        />
      </div>

      <!-- Contraseña -->
      <div class="flex flex-col gap-1.5">
        <label class="text-[10px] font-mono tracking-widest uppercase text-white/30">Contraseña</label>
        <BaseInput
          v-model="password"
          type="password"
          placeholder="••••••••"
          :error="errors.password"
          class="w-full rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-mono text-white/80 placeholder-white/15 focus:outline-none focus:border-[#00ffb4]/40 focus:bg-[#00ffb4]/[0.02] transition-all duration-200"
          variant="form"
        />
      </div>
    </section>

    <footer class="flex items-center justify-between">
      <label class="flex items-center gap-2.5 cursor-pointer group justify-center">
        <div class=" shrink-0">
          <input
            v-model="rememberMe"
            type="checkbox"
            class="peer appearance-none w-4 h-4 rounded border border-white/15 bg-white/[0.03] checked:bg-[#00ffb4] checked:border-[#00ffb4] transition-all duration-200 cursor-pointer"
          />
          <svg
            class="absolute inset-0 w-4 h-4 text-black opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity duration-200 p-0.5"
            viewBox="0 0 16 16" fill="none"
          >
            <path d="M3 8l3.5 3.5L13 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <span class="text-[11px] font-mono text-white/30 group-hover:text-white/50 tracking-wide transition-colors">Recordarme</span>
      </label>

      <RouterLink
        :to="{ name: 'forgot-password', query: { type: 'staff' } }"
        class="text-[11px] font-mono text-[#00ffb4]/60 no-underline hover:text-[#00ffb4] transition-colors tracking-wide"
      >
        ¿Olvidaste tu contraseña?
      </RouterLink>
    </footer>

    <BaseButton
      type="submit"
      variant="form"
      :full-width="true"
      :loading="loading"
      class="w-full rounded-lg bg-[#00ffb4] hover:bg-[#00e6a0] disabled:opacity-30 py-3 text-xs font-mono font-bold text-black tracking-widest uppercase transition-all duration-200"
    >
      {{ loading ? '...' : 'Iniciar Sesión' }}
    </BaseButton>

  </form>
</template>
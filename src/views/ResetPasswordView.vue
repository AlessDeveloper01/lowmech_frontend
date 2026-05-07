<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { authClient } from '@/services/betterAuth'
import { api } from '@/services/api'

const route = useRoute()
const router = useRouter()

const token = ref('')
const password = ref('')
const confirm = ref('')
const loading = ref(false)
const error = ref('')
const success = ref(false)

onMounted(() => {
  token.value = (route.query.token as string) || ''
})

async function handleSubmit() {
  error.value = ''

  if (password.value.length < 8) {
    error.value = 'La contraseña debe tener al menos 8 caracteres'
    return
  }
  if (password.value !== confirm.value) {
    error.value = 'Las contraseñas no coinciden'
    return
  }

  loading.value = true

  try {
    if (token.value) {
      try {
        await api.post('/auth/reset-password', {
          token: token.value,
          password: password.value,
        })
        success.value = true
        return
      } catch (staffErr: any) {
        const msg = staffErr?.message || ''
        if (!msg.includes('inválido') && !msg.includes('expirado') && !msg.includes('Token')) {
          throw staffErr
        }
      }
    }

    const { error: baError } = await authClient.resetPassword({
      newPassword: password.value,
      token: token.value,
    })
    if (baError) throw new Error(baError.message || 'Error al restablecer contraseña')

    success.value = true
  } catch (e: any) {
    error.value = e?.message || 'Error al restablecer contraseña'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="min-h-screen flex bg-bg">
    <aside class="hidden lg:flex flex-col justify-between w-[40%] bg-navy p-14 text-white">
      <header>
        <h1 class="text-[2rem] font-bold tracking-[0.08em] text-white">LowMech</h1>
      </header>
      <section class="space-y-5">
        <h2 class="text-[2.6rem] font-bold leading-tight">
          Nueva contraseña
        </h2>
        <p class="text-white/60 text-[1.4rem] leading-relaxed max-w-[30rem]">
          Establece una contraseña segura para proteger tu cuenta.
        </p>
      </section>
      <footer class="text-white/30 text-[1.2rem]">LowMech Systems</footer>
    </aside>

    <section class="flex-1 flex items-center justify-center p-8 md:p-16">
      <article class="w-full max-w-[44rem]">
        <header class="lg:hidden mb-10">
          <h1 class="text-[2rem] font-bold tracking-[0.08em] text-body">LowMech</h1>
        </header>

        <div v-if="success" class="flex flex-col gap-4">
          <h2 class="text-[2rem] font-bold text-text">Contraseña actualizada</h2>
          <p class="text-muted text-[1.3rem] leading-relaxed">
            Tu contraseña se ha restablecido correctamente. Ahora puedes iniciar sesión.
          </p>
          <button
            @click="router.push({ name: 'login' })"
            class="w-full rounded-lg bg-primary hover:bg-primary-dark py-3 text-sm font-semibold text-white transition-colors"
          >
            Ir al inicio de sesión
          </button>
        </div>

        <form v-else @submit.prevent="handleSubmit" class="flex flex-col gap-5">
          <h2 class="text-[2rem] font-bold text-text">Restablecer contraseña</h2>

          <div>
            <label class="block text-sm font-medium text-text mb-1.5">Nueva contraseña</label>
            <input
              v-model="password"
              type="password"
              required
              placeholder="Mínimo 8 caracteres"
              class="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-text mb-1.5">Confirmar contraseña</label>
            <input
              v-model="confirm"
              type="password"
              required
              placeholder="Repite tu contraseña"
              class="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>

          <p v-if="error" class="text-sm text-red-500">{{ error }}</p>

          <button
            type="submit"
            :disabled="loading"
            class="w-full rounded-lg bg-primary hover:bg-primary-dark disabled:opacity-50 py-3 text-sm font-semibold text-white transition-colors"
          >
            {{ loading ? 'Guardando...' : 'Restablecer contraseña' }}
          </button>
        </form>
      </article>
    </section>
  </main>
</template>

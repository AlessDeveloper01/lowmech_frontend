<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { authClient } from '@/services/betterAuth'
import { api } from '@/services/api'

const route = useRoute()
const router = useRouter()

const type = ref<'staff' | 'cliente'>((route.query.type as 'staff' | 'cliente') || 'staff')
const email = ref('')
const loading = ref(false)
const error = ref('')
const success = ref(false)

onMounted(() => {
  if (route.query.email) email.value = route.query.email as string
})

async function handleSubmit() {
  error.value = ''
  loading.value = true

  try {
    if (type.value === 'cliente') {
      const { error: baError } = await authClient.forgetPassword({
        email: email.value,
        redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}reset-password`,
      })
      if (baError) throw new Error(baError.message || 'Error al enviar correo')
    } else {
      await api.post('/auth/forgot-password', { email: email.value })
    }
    success.value = true
  } catch (e: any) {
    error.value = e?.message || 'Error al enviar solicitud'
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
          Recupera tu acceso
        </h2>
        <p class="text-white/60 text-[1.4rem] leading-relaxed max-w-[30rem]">
          Te enviaremos instrucciones para restablecer tu contraseña de forma segura.
        </p>
      </section>
      <footer class="text-white/30 text-[1.2rem]">LowMech Systems</footer>
    </aside>

    <section class="flex-1 flex items-center justify-center p-8 md:p-16">
      <article class="w-full max-w-[44rem]">
        <header class="lg:hidden mb-10">
          <h1 class="text-[2rem] font-bold tracking-[0.08em] text-body">LowMech</h1>
        </header>

        <button
          @click="router.push({ name: 'login' })"
          class="text-sm text-muted hover:text-text mb-6 flex items-center gap-1 transition-colors"
        >
          <span>&larr;</span> Volver al inicio de sesión
        </button>

        <div v-if="success" class="flex flex-col gap-4">
          <h2 class="text-[2rem] font-bold text-text">Revisa tu correo</h2>
          <p class="text-muted text-[1.3rem] leading-relaxed">
            Si existe una cuenta asociada a <strong>{{ email }}</strong>, recibirás un enlace para restablecer tu contraseña.
          </p>
        </div>

        <form v-else @submit.prevent="handleSubmit" class="flex flex-col gap-6">
          <h2 class="text-[2rem] font-bold text-text">Recuperar contraseña</h2>

          <div class="flex gap-3">
            <button
              type="button"
              @click="type = 'staff'"
              class="px-5 py-2 text-sm font-medium rounded-lg transition-colors"
              :class="type === 'staff' ? 'bg-primary text-white' : 'bg-subtle text-muted hover:text-text'"
            >
              Personal
            </button>
            <button
              type="button"
              @click="type = 'cliente'"
              class="px-5 py-2 text-sm font-medium rounded-lg transition-colors"
              :class="type === 'cliente' ? 'bg-primary text-white' : 'bg-subtle text-muted hover:text-text'"
            >
              Cliente
            </button>
          </div>

          <div>
            <label class="block text-sm font-medium text-text mb-1.5">Correo electrónico</label>
            <input
              v-model="email"
              type="email"
              required
              placeholder="tu@correo.com"
              class="w-full rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>

          <p v-if="error" class="text-sm text-red-500">{{ error }}</p>

          <button
            type="submit"
            :disabled="loading"
            class="w-full rounded-lg bg-primary hover:bg-primary-dark disabled:opacity-50 py-3 text-sm font-semibold text-white transition-colors"
          >
            {{ loading ? 'Enviando...' : 'Enviar instrucciones' }}
          </button>
        </form>
      </article>
    </section>
  </main>
</template>

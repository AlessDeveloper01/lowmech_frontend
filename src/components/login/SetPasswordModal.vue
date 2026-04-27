<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
    <div class="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4">
      <h2 class="text-xl font-bold text-neutral-800 dark:text-white mb-1">Crear contraseña</h2>
      <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
        Es tu primer acceso. Establece una contraseña para futuras sesiones.
      </p>

      <form @submit.prevent="submit" class="flex flex-col gap-4">
        <div>
          <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            Nueva contraseña
          </label>
          <input
            v-model="password"
            type="password"
            placeholder="Mínimo 6 caracteres"
            minlength="6"
            required
            class="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2.5 text-sm text-neutral-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
            Confirmar contraseña
          </label>
          <input
            v-model="confirm"
            type="password"
            placeholder="Repite la contraseña"
            required
            class="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2.5 text-sm text-neutral-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <p v-if="error" class="text-sm text-red-500">{{ error }}</p>

        <button
          type="submit"
          :disabled="loading"
          class="w-full rounded-lg bg-orange-500 hover:bg-orange-600 disabled:opacity-50 py-2.5 text-sm font-semibold text-white transition-colors"
        >
          {{ loading ? 'Guardando...' : 'Guardar y entrar' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const props = defineProps<{ email: string }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const authStore = useAuthStore()
const router = useRouter()

const password = ref('')
const confirm = ref('')
const loading = ref(false)
const error = ref('')

async function submit() {
  error.value = ''
  if (password.value.length < 6) {
    error.value = 'La contraseña debe tener al menos 6 caracteres.'
    return
  }
  if (password.value !== confirm.value) {
    error.value = 'Las contraseñas no coinciden.'
    return
  }
  loading.value = true
  const result = await authStore.clienteSetPassword(props.email, password.value)
  loading.value = false
  if (result.success) {
    router.push({ name: 'cliente-ordenes' })
  } else {
    error.value = result.error ?? 'Error al guardar la contraseña.'
  }
}
</script>

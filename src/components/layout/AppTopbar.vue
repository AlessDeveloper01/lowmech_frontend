<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

defineProps<{
  darkMode: boolean
}>()

const emit = defineEmits<{
  toggleDark: []
}>()

const displayName = auth.user ? `${auth.user.nombre} ${auth.user.apellido}` : 'Usuario'
const initials = displayName
  .split(' ')
  .map((w) => w.charAt(0))
  .slice(0, 2)
  .join('')

function handleLogout() {
  auth.logout()
  router.push({ name: 'login' })
}

const today = new Date().toLocaleDateString('es-MX', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})
</script>

<template>
  <header
    class="sticky top-0 h-[6.5rem] bg-navy flex items-center justify-between px-10 z-[100] max-[768px]:px-5"
  >
    <!-- Left: date -->
    <time class="text-[1.2rem] text-white/50 capitalize" :datetime="new Date().toISOString()">
      {{ today }}
    </time>

    <!-- Right: Navigation and user controls -->
    <nav class="flex items-center gap-6">
      <!-- Dark mode toggle -->
      <button
        class="relative w-[4.6rem] h-[2.4rem] rounded-full cursor-pointer border-none transition-colors duration-300"
        :class="darkMode ? 'bg-primary' : 'bg-white/15'"
        @click="emit('toggleDark')"
        aria-label="Cambiar modo oscuro"
      >
        <span
          class="absolute top-[0.3rem] w-[1.8rem] h-[1.8rem] rounded-full bg-white flex items-center justify-center transition-all duration-300 shadow-sm"
          :class="darkMode ? 'left-[2.5rem]' : 'left-[0.3rem]'"
          aria-hidden="true"
        >
          <svg
            v-if="!darkMode"
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#f59e0b"
            stroke-width="2.5"
          >
            <circle cx="12" cy="12" r="5" />
            <path
              d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
            />
          </svg>
          <svg
            v-else
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            stroke-width="2.5"
          >
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
          </svg>
        </span>
      </button>

      <!-- Notification -->
      <button
        class="relative w-8 h-8 flex items-center justify-center cursor-pointer border-none bg-transparent text-white/50 hover:text-white transition-colors"
        aria-label="Notificaciones"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          aria-hidden="true"
        >
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
        </svg>
        <span
          class="absolute top-0 right-0 w-2 h-2 rounded-full bg-primary"
          aria-label="Notificación nueva"
        ></span>
      </button>

      <!-- Divider -->
      <span class="w-px h-7 bg-white/10" role="separator" aria-hidden="true"></span>

      <!-- User menu -->
      <section class="relative group">
        <button
          class="flex items-center gap-3 cursor-pointer border-none bg-transparent"
          aria-label="Menú de usuario"
        >
          <span class="text-[1.3rem] font-medium text-white/80 max-[768px]:hidden">{{
            displayName
          }}</span>
          <span
            class="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-[1rem] font-semibold"
            aria-hidden="true"
          >
            {{ initials }}
          </span>
        </button>

        <!-- Dropdown menu -->
        <menu
          class="absolute right-0 top-full mt-3 w-[20rem] bg-surface dark:bg-dk-surface shadow-[0_8px_40px_rgba(0,0,0,0.15)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 translate-y-1 group-hover:translate-y-0 py-3"
        >
          <header class="px-5 pb-3 mb-3 border-b border-border dark:border-dk-border">
            <p class="text-[1.3rem] font-semibold text-body dark:text-dk-body">
              {{ displayName }}
            </p>
            <p class="text-[1.1rem] text-muted dark:text-dk-muted">{{ auth.user?.email }}</p>
            <p class="text-[1.1rem] text-primary font-medium capitalize">{{ auth.user?.rol }}</p>
          </header>
          <button
            class="w-full flex items-center gap-3 px-5 py-3 text-[1.3rem] text-muted dark:text-dk-muted cursor-pointer border-none bg-transparent hover:text-red-500 hover:bg-red-50/50 dark:hover:bg-red-950/30 transition-colors text-left font-inherit"
            @click="handleLogout"
          >
            Cerrar Sesion
          </button>
        </menu>
      </section>
    </nav>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUsersStore, type User } from '@/stores/users'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppTopbar from '@/components/layout/AppTopbar.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { inject, type Ref } from 'vue'
import Swal from 'sweetalert2'

const router = useRouter()
const route = useRoute()
const usersStore = useUsersStore()
const collapsed = inject<Ref<boolean>>('sidebarCollapsed')!
const darkMode = inject<Ref<boolean>>('darkMode')!

const user = ref<User | null>(null)
const loading = ref(true)

onMounted(async () => {
  user.value = await usersStore.fetchUser(Number(route.params.id))
  loading.value = false
})

function rolLabel(rol: string) {
  const map: Record<string, string> = {
    admin: 'Administrador',
    mecanico: 'Mecánico',
    recepcionista: 'Recepcionista',
  }
  return map[rol] ?? rol
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function handleDelete() {
  if (!user.value) return
  const result = await Swal.fire({
    title: '¿Eliminar usuario?',
    text: `El usuario "${user.value.username}" será eliminado permanentemente.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
  })
  if (!result.isConfirmed) return
  const ok = await usersStore.deleteUser(user.value.id)
  if (ok) {
    await Swal.fire({
      title: 'Eliminado',
      text: 'El usuario fue eliminado.',
      icon: 'success',
      timer: 1500,
      showConfirmButton: false,
    })
    router.push({ name: 'usuarios-lista' })
  }
}
</script>

<template>
  <main class="min-h-screen bg-bg dark:bg-dk-bg transition-colors duration-300">
    <AppSidebar />
    <section
      class="min-h-screen flex flex-col transition-all duration-300 ease-out max-[768px]:ml-0"
      :class="collapsed ? 'ml-[6.4rem]' : 'ml-[22rem]'"
    >
      <AppTopbar :dark-mode="darkMode" @toggle-dark="darkMode = !darkMode" />

      <section class="flex-1 p-10 max-[768px]:p-5">
        <header class="flex items-center gap-4 mb-8">
          <button
            class="text-[1.3rem] text-muted dark:text-dk-muted cursor-pointer border-none bg-transparent hover:text-primary transition-colors"
            @click="router.push({ name: 'usuarios-lista' })"
          >
            ← Volver
          </button>
          <h1 class="text-[2rem] font-bold text-body dark:text-dk-body">Detalle de Usuario</h1>
        </header>

        <section
          v-if="loading"
          class="flex items-center justify-center py-20 text-[1.4rem] text-muted dark:text-dk-muted"
        >
          Cargando...
        </section>

        <section
          v-else-if="!user"
          class="px-5 py-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-[1.3rem] text-red-700 dark:text-red-300"
        >
          Usuario no encontrado
        </section>

        <article
          v-else
          class="bg-surface dark:bg-dk-surface border border-border dark:border-dk-border p-8 max-w-[60rem]"
        >
          <!-- User header -->
          <header
            class="flex items-center gap-6 pb-6 mb-6 border-b border-border dark:border-dk-border"
          >
            <span
              class="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center text-[2rem] font-bold shrink-0"
            >
              {{ user.nombre.charAt(0) }}{{ user.apellido.charAt(0) }}
            </span>
            <div>
              <h2 class="text-[1.8rem] font-bold text-body dark:text-dk-body">
                {{ user.nombre }} {{ user.apellido }}
              </h2>
              <p class="text-[1.3rem] text-muted dark:text-dk-muted">@{{ user.username }}</p>
            </div>
            <span
              class="ml-auto inline-block w-3 h-3 rounded-full"
              :class="user.activo ? 'bg-green-500' : 'bg-red-500'"
            ></span>
            <span
              class="text-[1.3rem] font-medium"
              :class="user.activo ? 'text-green-600' : 'text-red-600'"
            >
              {{ user.activo ? 'Activo' : 'Inactivo' }}
            </span>
          </header>

          <!-- Info grid -->
          <dl class="grid grid-cols-2 gap-6 max-[768px]:grid-cols-1">
            <div>
              <dt
                class="text-[1.2rem] font-semibold text-muted dark:text-dk-muted uppercase tracking-wide mb-1"
              >
                Email
              </dt>
              <dd class="text-[1.4rem] text-body dark:text-dk-body">{{ user.email }}</dd>
            </div>
            <div>
              <dt
                class="text-[1.2rem] font-semibold text-muted dark:text-dk-muted uppercase tracking-wide mb-1"
              >
                Rol
              </dt>
              <dd class="text-[1.4rem] text-body dark:text-dk-body capitalize">
                {{ rolLabel(user.rol) }}
              </dd>
            </div>
            <div>
              <dt
                class="text-[1.2rem] font-semibold text-muted dark:text-dk-muted uppercase tracking-wide mb-1"
              >
                Creado
              </dt>
              <dd class="text-[1.4rem] text-body dark:text-dk-body">
                {{ formatDate(user.createdAt) }}
              </dd>
            </div>
            <div>
              <dt
                class="text-[1.2rem] font-semibold text-muted dark:text-dk-muted uppercase tracking-wide mb-1"
              >
                Actualizado
              </dt>
              <dd class="text-[1.4rem] text-body dark:text-dk-body">
                {{ formatDate(user.updatedAt) }}
              </dd>
            </div>
          </dl>

          <!-- Actions -->
          <footer class="flex gap-4 mt-8 pt-6 border-t border-border dark:border-dk-border">
            <BaseButton
              variant="primary"
              @click="router.push({ name: 'usuarios-editar', params: { id: user.id } })"
            >
              Editar
            </BaseButton>
            <BaseButton variant="outline" @click="handleDelete"> Eliminar </BaseButton>
          </footer>
        </article>
      </section>
    </section>
  </main>
</template>

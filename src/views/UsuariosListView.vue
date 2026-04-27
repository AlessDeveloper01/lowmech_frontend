<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUsersStore } from '@/stores/users'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppTopbar from '@/components/layout/AppTopbar.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { inject, type Ref } from 'vue'
import Swal from 'sweetalert2'

const router = useRouter()
const usersStore = useUsersStore()
const collapsed = inject<Ref<boolean>>('sidebarCollapsed')!
const darkMode = inject<Ref<boolean>>('darkMode')!

onMounted(() => {
  usersStore.fetchUsers()
})

function rolLabel(rol: string) {
  const map: Record<string, string> = {
    admin: 'Administrador',
    mecanico: 'Mecánico',
    recepcionista: 'Recepcionista',
  }
  return map[rol] ?? rol
}

function rolColor(rol: string) {
  const map: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    mecanico: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    recepcionista: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  }
  return map[rol] ?? 'bg-gray-100 text-gray-700'
}

async function handleDelete(id: number, username: string) {
  const result = await Swal.fire({
    title: '¿Eliminar usuario?',
    text: `El usuario "${username}" será eliminado permanentemente.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6b7280',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
  })
  if (!result.isConfirmed) return
  await usersStore.deleteUser(id)
  Swal.fire({
    title: 'Eliminado',
    text: 'El usuario fue eliminado.',
    icon: 'success',
    timer: 1500,
    showConfirmButton: false,
  })
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
        <!-- Header -->
        <header class="flex items-center justify-between mb-8">
          <div>
            <h1 class="text-[2rem] font-bold text-body dark:text-dk-body">Usuarios</h1>
            <p class="text-[1.3rem] text-muted dark:text-dk-muted mt-1">
              Gestión de usuarios del sistema
            </p>
          </div>
          <BaseButton variant="primary" @click="router.push({ name: 'usuarios-crear' })">
            + Nuevo Usuario
          </BaseButton>
        </header>

        <!-- Loading -->
        <section
          v-if="usersStore.loading"
          class="flex items-center justify-center py-20 text-[1.4rem] text-muted dark:text-dk-muted"
        >
          Cargando usuarios...
        </section>

        <!-- Error -->
        <section
          v-else-if="usersStore.error"
          class="px-5 py-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-[1.3rem] text-red-700 dark:text-red-300 font-medium"
        >
          {{ usersStore.error }}
        </section>

        <!-- Table -->
        <section
          v-else
          class="bg-surface dark:bg-dk-surface border border-border dark:border-dk-border overflow-hidden"
        >
          <table class="w-full text-left">
            <thead>
              <tr class="border-b border-border dark:border-dk-border">
                <th
                  class="px-5 py-4 text-[1.2rem] font-semibold text-muted dark:text-dk-muted uppercase tracking-wide"
                >
                  Usuario
                </th>
                <th
                  class="px-5 py-4 text-[1.2rem] font-semibold text-muted dark:text-dk-muted uppercase tracking-wide"
                >
                  Nombre
                </th>
                <th
                  class="px-5 py-4 text-[1.2rem] font-semibold text-muted dark:text-dk-muted uppercase tracking-wide"
                >
                  Email
                </th>
                <th
                  class="px-5 py-4 text-[1.2rem] font-semibold text-muted dark:text-dk-muted uppercase tracking-wide"
                >
                  Rol
                </th>
                <th
                  class="px-5 py-4 text-[1.2rem] font-semibold text-muted dark:text-dk-muted uppercase tracking-wide"
                >
                  Estado
                </th>
                <th
                  class="px-5 py-4 text-[1.2rem] font-semibold text-muted dark:text-dk-muted uppercase tracking-wide text-right"
                >
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="user in usersStore.users"
                :key="user.id"
                class="border-b border-border/50 dark:border-dk-border/50 hover:bg-bg/50 dark:hover:bg-dk-bg/50 transition-colors"
              >
                <td class="px-5 py-4 text-[1.3rem] font-semibold text-body dark:text-dk-body">
                  {{ user.username }}
                </td>
                <td class="px-5 py-4 text-[1.3rem] text-body dark:text-dk-body">
                  {{ user.nombre }} {{ user.apellido }}
                </td>
                <td class="px-5 py-4 text-[1.3rem] text-muted dark:text-dk-muted">
                  {{ user.email }}
                </td>
                <td class="px-5 py-4">
                  <span
                    class="inline-block px-3 py-1 text-[1.1rem] font-semibold rounded-full"
                    :class="rolColor(user.rol)"
                  >
                    {{ rolLabel(user.rol) }}
                  </span>
                </td>
                <td class="px-5 py-4">
                  <span
                    class="inline-block w-2.5 h-2.5 rounded-full"
                    :class="user.activo ? 'bg-green-500' : 'bg-red-500'"
                  ></span>
                  <span class="ml-2 text-[1.2rem] text-muted dark:text-dk-muted">
                    {{ user.activo ? 'Activo' : 'Inactivo' }}
                  </span>
                </td>
                <td class="px-5 py-4 text-right">
                  <button
                    class="text-[1.2rem] text-primary font-medium cursor-pointer border-none bg-transparent hover:opacity-70 transition-opacity mr-4"
                    @click="router.push({ name: 'usuarios-detalle', params: { id: user.id } })"
                  >
                    Ver
                  </button>
                  <button
                    class="text-[1.2rem] text-blue-600 dark:text-blue-400 font-medium cursor-pointer border-none bg-transparent hover:opacity-70 transition-opacity mr-4"
                    @click="router.push({ name: 'usuarios-editar', params: { id: user.id } })"
                  >
                    Editar
                  </button>
                  <button
                    class="text-[1.2rem] text-red-600 dark:text-red-400 font-medium cursor-pointer border-none bg-transparent hover:opacity-70 transition-opacity"
                    @click="handleDelete(user.id, user.username)"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          <footer
            v-if="usersStore.users.length === 0"
            class="py-16 text-center text-[1.4rem] text-muted dark:text-dk-muted"
          >
            No hay usuarios registrados
          </footer>
        </section>
      </section>
    </section>
  </main>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUsersStore } from '@/stores/users'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppTopbar from '@/components/layout/AppTopbar.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { inject, type Ref } from 'vue'
import Swal from 'sweetalert2'

const router = useRouter()
const route = useRoute()
const usersStore = useUsersStore()
const collapsed = inject<Ref<boolean>>('sidebarCollapsed')!
const darkMode = inject<Ref<boolean>>('darkMode')!

const isEditing = computed(() => !!route.params.id)
const title = computed(() => (isEditing.value ? 'Editar Usuario' : 'Nuevo Usuario'))

const form = ref({
  username: '',
  nombre: '',
  apellido: '',
  email: '',
  password: '',
  rol: 'mecanico',
  activo: true,
})

const errors = ref<Record<string, string>>({})
const serverError = ref('')
const loading = ref(false)

onMounted(async () => {
  if (isEditing.value) {
    const user = await usersStore.fetchUser(Number(route.params.id))
    if (user) {
      form.value.username = user.username
      form.value.nombre = user.nombre
      form.value.apellido = user.apellido
      form.value.email = user.email
      form.value.rol = user.rol
      form.value.activo = user.activo
      form.value.password = ''
    }
  }
})

function validate(): boolean {
  errors.value = {}
  if (!form.value.username || form.value.username.length < 4)
    errors.value.username = 'Mínimo 4 caracteres'
  if (!form.value.nombre) errors.value.nombre = 'El nombre es obligatorio'
  if (!form.value.apellido) errors.value.apellido = 'El apellido es obligatorio'
  if (!form.value.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email))
    errors.value.email = 'Ingresa un email válido'
  if (!isEditing.value && (!form.value.password || form.value.password.length < 6))
    errors.value.password = 'Mínimo 6 caracteres'
  if (isEditing.value && form.value.password && form.value.password.length < 6)
    errors.value.password = 'Mínimo 6 caracteres'
  return Object.keys(errors.value).length === 0
}

async function handleSubmit() {
  if (!validate()) return
  loading.value = true
  serverError.value = ''

  try {
    if (isEditing.value) {
      const payload: Record<string, unknown> = {
        username: form.value.username,
        nombre: form.value.nombre,
        apellido: form.value.apellido,
        email: form.value.email,
        rol: form.value.rol,
        activo: form.value.activo,
      }
      if (form.value.password) payload.password = form.value.password
      const result = await usersStore.updateUser(Number(route.params.id), payload)
      if (result) {
        await Swal.fire({
          title: 'Usuario actualizado',
          text: 'Los cambios fueron guardados.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
        })
        router.push({ name: 'usuarios-lista' })
      } else serverError.value = usersStore.error ?? 'Error al actualizar'
    } else {
      const result = await usersStore.createUser({
        username: form.value.username,
        password: form.value.password,
        nombre: form.value.nombre,
        apellido: form.value.apellido,
        email: form.value.email,
        rol: form.value.rol,
      })
      if (result) {
        await Swal.fire({
          title: 'Usuario creado',
          text: 'El usuario fue creado correctamente.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false,
        })
        router.push({ name: 'usuarios-lista' })
      } else serverError.value = usersStore.error ?? 'Error al crear'
    }
  } catch (e) {
    serverError.value = (e as Error).message
  } finally {
    loading.value = false
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
          <h1 class="text-[2rem] font-bold text-body dark:text-dk-body">{{ title }}</h1>
        </header>

        <section
          v-if="serverError"
          class="px-5 py-4 mb-6 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-[1.3rem] text-red-700 dark:text-red-300 font-medium"
        >
          {{ serverError }}
        </section>

        <form
          class="bg-surface dark:bg-dk-surface border border-border dark:border-dk-border p-8 max-w-[60rem]"
          @submit.prevent="handleSubmit"
        >
          <section class="grid grid-cols-2 gap-6 max-[768px]:grid-cols-1">
            <BaseInput
              v-model="form.username"
              label="Usuario"
              placeholder="admin"
              :error="errors.username"
            />
            <BaseInput
              v-model="form.email"
              label="Email"
              type="email"
              placeholder="correo@lowmech.com"
              :error="errors.email"
            />
            <BaseInput
              v-model="form.nombre"
              label="Nombre"
              placeholder="Juan"
              :error="errors.nombre"
            />
            <BaseInput
              v-model="form.apellido"
              label="Apellido"
              placeholder="Pérez"
              :error="errors.apellido"
            />
            <BaseInput
              v-model="form.password"
              label="Contraseña"
              type="password"
              :placeholder="isEditing ? 'Dejar vacío para no cambiar' : '••••••••'"
              :error="errors.password"
            />

            <!-- Rol -->
            <fieldset class="flex flex-col gap-2">
              <label class="text-[1.3rem] font-semibold text-body dark:text-dk-body">Rol</label>
              <select
                v-model="form.rol"
                class="w-full px-5 py-4 text-[1.5rem] text-body dark:text-dk-body bg-bg dark:bg-dk-bg border border-border dark:border-dk-border outline-none focus:border-primary transition-colors"
              >
                <option value="admin">Administrador</option>
                <option value="mecanico">Mecánico</option>
                <option value="recepcionista">Recepcionista</option>
              </select>
            </fieldset>
          </section>

          <!-- Activo toggle (solo en edición) -->
          <label v-if="isEditing" class="flex items-center gap-3 mt-6 cursor-pointer">
            <input
              v-model="form.activo"
              type="checkbox"
              class="w-5 h-5 accent-primary cursor-pointer"
            />
            <span class="text-[1.3rem] font-medium text-body dark:text-dk-body">
              Usuario activo
            </span>
          </label>

          <footer class="flex gap-4 mt-8">
            <BaseButton type="submit" variant="primary" :loading="loading">
              {{ loading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear Usuario' }}
            </BaseButton>
            <BaseButton variant="outline" @click="router.push({ name: 'usuarios-lista' })">
              Cancelar
            </BaseButton>
          </footer>
        </form>
      </section>
    </section>
  </main>
</template>

<script setup lang="ts">
import { ref, computed, inject, onMounted, type Ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useClientesStore } from '@/stores/clientes'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppTopbar from '@/components/layout/AppTopbar.vue'
import Swal from 'sweetalert2'

const router = useRouter()
const route = useRoute()
const store = useClientesStore()

const routePrefix = computed(() => {
  if (String(route.name).startsWith('recepcionista')) return 'recepcionista-'
  return ''
})

const collapsed = inject<Ref<boolean>>('sidebarCollapsed')!
const darkMode = inject<Ref<boolean>>('darkMode')!

const esEdicion = computed(() => !!route.params.id)
const titulo = computed(() => (esEdicion.value ? 'Editar Cliente' : 'Nuevo Cliente'))
const guardando = ref(false)

const form = ref({
  nombre: '',
  telefono: '',
  email: '',
  direccion: '',
  rfc: '',
  notas: '',
})

const errores = ref<Record<string, string>>({})

function validar(): boolean {
  errores.value = {}
  if (!form.value.nombre.trim()) errores.value.nombre = 'Requerido'
  if (!form.value.telefono.trim()) errores.value.telefono = 'Requerido'
  if (!form.value.email.trim()) errores.value.email = 'Requerido'
  return Object.keys(errores.value).length === 0
}

async function guardar() {
  if (!validar()) return
  guardando.value = true
  try {
    if (esEdicion.value) {
      const result = await store.actualizar(Number(route.params.id), form.value)
      if (!result) throw new Error(store.error ?? 'Error al actualizar')
    } else {
      const result = await store.crear(form.value)
      if (!result) throw new Error(store.error ?? 'Error al crear')
    }
    await Swal.fire({
      title: esEdicion.value ? 'Cliente actualizado' : 'Cliente creado',
      text: esEdicion.value
        ? 'Los cambios fueron guardados.'
        : 'El cliente fue registrado correctamente.',
      icon: 'success',
      timer: 1500,
      showConfirmButton: false,
    })
    const listRoute = String(route.name).startsWith('recepcionista')
      ? 'recepcionista-clientes'
      : 'clientes-lista'
    router.push({ name: listRoute })
  } catch (e) {
    Swal.fire({
      title: 'Error',
      text: (e as Error).message,
      icon: 'error',
    })
  } finally {
    guardando.value = false
  }
}

onMounted(async () => {
  if (esEdicion.value) {
    const c = await store.fetchCliente(Number(route.params.id))
    if (c) {
      form.value = {
        nombre: c.nombre,
        telefono: c.telefono,
        email: c.email,
        direccion: c.direccion,
        rfc: c.rfc,
        notas: c.notas,
      }
    }
  }
})

const inputClass =
  'px-4 py-3 text-[1.4rem] text-body dark:text-dk-body bg-surface dark:bg-dk-surface border border-border dark:border-dk-border outline-none focus:border-primary transition-colors placeholder:text-muted dark:placeholder:text-dk-muted'
</script>

<template>
  <main class="min-h-screen bg-bg dark:bg-dk-bg transition-colors duration-300">
    <AppSidebar />
    <section
      class="min-h-screen flex flex-col transition-all duration-300 ease-out max-[768px]:ml-0"
      :class="collapsed ? 'ml-[6.4rem]' : 'ml-[22rem]'"
    >
      <AppTopbar :dark-mode="darkMode" @toggle-dark="darkMode = !darkMode" />

      <article class="flex-1 px-12 py-10 max-[768px]:px-5 max-[768px]:py-6">
        <header class="flex items-center gap-4 mb-10">
          <button
            class="w-9 h-9 flex items-center justify-center text-muted dark:text-dk-muted hover:text-body dark:hover:text-dk-body cursor-pointer border-none bg-transparent transition-colors"
            @click="router.back()"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1
            class="text-[2.8rem] font-light text-body dark:text-dk-body tracking-[-0.03em] leading-none"
          >
            {{ titulo }}
          </h1>
        </header>

        <form @submit.prevent="guardar" class="grid grid-cols-1 md:grid-cols-2 gap-10">
          <section
            class="bg-surface dark:bg-dk-surface border border-border dark:border-dk-border p-10 mb-8"
          >
            <h2 class="text-[1.6rem] font-bold text-body dark:text-dk-body mb-8">
              Datos del Cliente
            </h2>
            <fieldset class="grid grid-cols-2 gap-6 max-[480px]:grid-cols-1 border-none p-0 m-0">
              <p class="flex flex-col gap-1.5 col-span-2 max-[480px]:col-span-1 m-0">
                <label class="text-[1.2rem] font-medium text-body dark:text-dk-body"
                  >Nombre completo</label
                >
                <input
                  v-model="form.nombre"
                  type="text"
                  placeholder="Nombre del cliente"
                  :class="[inputClass, { 'border-red-500': errores.nombre }]"
                />
                <span v-if="errores.nombre" class="text-[1.1rem] text-red-500">{{
                  errores.nombre
                }}</span>
              </p>
              <p class="flex flex-col gap-1.5 m-0">
                <label class="text-[1.2rem] font-medium text-body dark:text-dk-body"
                  >Telefono</label
                >
                <input
                  v-model="form.telefono"
                  type="tel"
                  placeholder="555-123-4567"
                  :class="[inputClass, { 'border-red-500': errores.telefono }]"
                />
                <span v-if="errores.telefono" class="text-[1.1rem] text-red-500">{{
                  errores.telefono
                }}</span>
              </p>
              <p class="flex flex-col gap-1.5 m-0">
                <label class="text-[1.2rem] font-medium text-body dark:text-dk-body">Email</label>
                <input
                  v-model="form.email"
                  type="email"
                  placeholder="cliente@email.com"
                  :class="[inputClass, { 'border-red-500': errores.email }]"
                />
                <span v-if="errores.email" class="text-[1.1rem] text-red-500">{{
                  errores.email
                }}</span>
              </p>
              <p class="flex flex-col gap-1.5 col-span-2 max-[480px]:col-span-1 m-0">
                <label class="text-[1.2rem] font-medium text-body dark:text-dk-body"
                  >Direccion</label
                >
                <input
                  v-model="form.direccion"
                  type="text"
                  placeholder="Calle, numero, colonia..."
                  :class="inputClass"
                />
              </p>
              <p class="flex flex-col gap-1.5 m-0">
                <label class="text-[1.2rem] font-medium text-body dark:text-dk-body">RFC</label>
                <input
                  v-model="form.rfc"
                  type="text"
                  placeholder="ABCD123456EF7"
                  :class="inputClass"
                />
              </p>
            </fieldset>
          </section>

          <section
            class="bg-surface dark:bg-dk-surface border border-border dark:border-dk-border p-10 mb-8"
          >
            <h2 class="text-[1.6rem] font-bold text-body dark:text-dk-body mb-6">Notas</h2>
            <fieldset class="border-none p-0 m-0">
              <textarea
                v-model="form.notas"
                rows="3"
                placeholder="Notas adicionales sobre el cliente..."
                class="w-full px-4 py-3 text-[1.4rem] text-body dark:text-dk-body bg-surface dark:bg-dk-surface border border-border dark:border-dk-border outline-none focus:border-primary transition-colors resize-none placeholder:text-muted dark:placeholder:text-dk-muted"
              ></textarea>
            </fieldset>
          </section>

          <footer class="flex items-center gap-4 col-span-full">
            <button
              type="submit"
              class="px-8 py-3 text-[1.3rem] font-semibold text-white bg-primary border-none cursor-pointer hover:bg-primary-dark transition-colors"
            >
              {{ esEdicion ? 'Guardar Cambios' : 'Crear Cliente' }}
            </button>
            <button
              type="button"
              class="px-8 py-3 text-[1.3rem] font-medium text-muted dark:text-dk-muted bg-transparent border border-border dark:border-dk-border cursor-pointer hover:text-body dark:hover:text-dk-body transition-colors"
              @click="router.back()"
            >
              Cancelar
            </button>
          </footer>
        </form>
      </article>
    </section>
  </main>
</template>

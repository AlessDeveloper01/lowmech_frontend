<script setup lang="ts">
import { ref, computed, inject, onMounted, type Ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useVehiculosStore, type EstadoVehiculo } from '@/stores/vehiculos'
import { useClientesStore } from '@/stores/clientes'
import { api } from '@/services/api'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppTopbar from '@/components/layout/AppTopbar.vue'
import Swal from 'sweetalert2'

const router = useRouter()
const route = useRoute()
const store = useVehiculosStore()
const cliStore = useClientesStore()

const vehiculosListRoute = computed(() =>
  String(route.name).startsWith('recepcionista') ? 'recepcionista-vehiculos' : 'vehiculos-lista'
)

const collapsed = inject<Ref<boolean>>('sidebarCollapsed')!
const darkMode = inject<Ref<boolean>>('darkMode')!

const esEdicion = computed(() => !!route.params.id)
const titulo = computed(() => (esEdicion.value ? 'Editar Vehiculo' : 'Nuevo Vehiculo'))
const guardando = ref(false)
const clienteSeleccionado = ref('')

const form = ref({
  nombre: '',
  marca: '',
  modelo: '',
  anio: '',
  placa: '',
  color: '',
  vin: '',
  kilometraje: 0,
  combustible: 'Gasolina',
  clienteNombre: '',
  clienteTelefono: '',
  clienteEmail: '',
  estado: 'disponible' as EstadoVehiculo,
  notas: '',
  imagenUrl: '',
})

const imagenPreview = computed(() => form.value.imagenUrl || '')

async function handleImagenChange(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onloadend = async () => {
    const base64 = reader.result as string
    try {
      const { url } = await api.post<{ url: string }>('/vehiculos/upload', { imagen: base64 })
      form.value.imagenUrl = url
    } catch {
      Swal.fire({ title: 'Error', text: 'No se pudo subir la imagen', icon: 'error' })
    }
  }
  reader.readAsDataURL(file)
}

function quitarImagen() {
  form.value.imagenUrl = ''
}

const errores = ref<Record<string, string>>({})

const clientes = computed(() =>
  cliStore.clientes.map((c) => ({
    nombre: c.nombre,
    telefono: c.telefono,
    email: c.email,
  })),
)

const marcas = [
  'Toyota',
  'Honda',
  'Nissan',
  'Ford',
  'Mazda',
  'Chevrolet',
  'Volkswagen',
  'Hyundai',
  'Kia',
  'BMW',
  'Mercedes-Benz',
]
const combustibles = ['Gasolina', 'Diesel', 'Hibrido', 'Electrico', 'GLP']
const estados: { valor: EstadoVehiculo; label: string }[] = [
  { valor: 'disponible', label: 'Disponible' },
  { valor: 'en_taller', label: 'En taller' },
  { valor: 'en_espera', label: 'En espera' },
]

function seleccionarCliente(nombre: string) {
  const c = clientes.value.find((x) => x.nombre === nombre)
  if (c) {
    form.value.clienteNombre = c.nombre
    form.value.clienteTelefono = c.telefono
    form.value.clienteEmail = c.email
  }
}

function validar(): boolean {
  errores.value = {}
  if (!form.value.nombre.trim()) errores.value.nombre = 'Requerido'
  if (!form.value.marca.trim()) errores.value.marca = 'Requerido'
  if (!form.value.modelo.trim()) errores.value.modelo = 'Requerido'
  if (!form.value.placa.trim()) errores.value.placa = 'Requerido'
  if (!form.value.clienteNombre.trim()) errores.value.clienteNombre = 'Selecciona un cliente'
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
      title: esEdicion.value ? 'Vehículo actualizado' : 'Vehículo registrado',
      text: esEdicion.value
        ? 'Los cambios fueron guardados.'
        : 'El vehículo fue registrado correctamente.',
      icon: 'success',
      timer: 1500,
      showConfirmButton: false,
    })
    router.push({ name: vehiculosListRoute })
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
  await cliStore.fetchClientes()

  if (!esEdicion.value) {
    const clienteId = Number(route.query.clienteId)
    if (!Number.isNaN(clienteId) && clienteId > 0) {
      const cliente = cliStore.clientes.find((c) => c.id === clienteId)
      if (cliente) {
        clienteSeleccionado.value = cliente.nombre
        seleccionarCliente(cliente.nombre)
      }
    }
  }

  if (esEdicion.value) {
    const v = await store.fetchVehiculo(Number(route.params.id))
    if (v) {
      form.value = {
        nombre: v.nombre,
        marca: v.marca,
        modelo: v.modelo,
        anio: v.anio,
        placa: v.placa,
        color: v.color,
        vin: v.vin,
        kilometraje: v.kilometraje,
        combustible: v.combustible,
        clienteNombre: v.clienteNombre,
        clienteTelefono: v.clienteTelefono,
        clienteEmail: v.clienteEmail,
        estado: v.estado,
        notas: v.notas,
        imagenUrl: v.imagenUrl || '',
      }
      clienteSeleccionado.value = v.clienteNombre
    }
  }
})

const inputClass =
  'px-4 py-3 text-[1.4rem] text-body dark:text-dk-body bg-surface dark:bg-dk-surface border border-border dark:border-dk-border outline-none focus:border-primary transition-colors placeholder:text-muted dark:placeholder:text-dk-muted'
</script>

<template>
  <div class="min-h-screen bg-bg dark:bg-dk-bg transition-colors duration-300">
    <AppSidebar />
    <div
      class="min-h-screen flex flex-col transition-all duration-300 ease-out max-[768px]:ml-0"
      :class="collapsed ? 'ml-[6.4rem]' : 'ml-[22rem]'"
    >
      <AppTopbar :dark-mode="darkMode" @toggle-dark="darkMode = !darkMode" />

      <main class="flex-1 px-12 py-10 max-[768px]:px-5 max-[768px]:py-6">
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

        <form
          @submit.prevent="guardar"
          class="grid grid-cols-[1fr_30rem] gap-8 max-[1200px]:grid-cols-1"
        >
          <!-- Vehiculo -->
          <section
            class="bg-surface dark:bg-dk-surface border border-border dark:border-dk-border p-10"
          >
            <h2 class="text-[1.6rem] font-bold text-body dark:text-dk-body mb-8">
              Datos del Vehiculo
            </h2>

            <!-- Imagen -->
            <div class="mb-8">
              <div class="flex items-center justify-between mb-3">
                <label class="text-[1.2rem] font-medium text-body dark:text-dk-body">Imagen del Vehiculo</label>
                <span class="text-[1.1rem] text-muted dark:text-dk-muted">Opcional</span>
              </div>
              <div v-if="imagenPreview" class="flex flex-col gap-3">
                <img
                  :src="imagenPreview"
                  alt="Vehiculo"
                  class="w-full h-48 object-contain rounded border border-border dark:border-dk-border bg-bg dark:bg-dk-bg"
                />
                <button
                  type="button"
                  class="text-[1.2rem] font-medium text-red-500 bg-transparent border-none cursor-pointer hover:opacity-70 transition-opacity text-left"
                  @click="quitarImagen"
                >
                  Quitar imagen
                </button>
              </div>
              <label
                v-else
                class="flex flex-col items-center justify-center gap-2 w-full h-32 border-2 border-dashed border-border dark:border-dk-border rounded cursor-pointer hover:border-primary transition-colors"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-muted dark:text-dk-muted">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span class="text-[1.2rem] text-muted dark:text-dk-muted">Haz clic para subir imagen</span>
                <input type="file" accept="image/*" class="hidden" @change="handleImagenChange" />
              </label>
            </div>

            <fieldset
              class="grid grid-cols-3 gap-6 max-[992px]:grid-cols-2 max-[480px]:grid-cols-1"
            >
              <p
                class="flex flex-col gap-1.5 col-span-3 max-[992px]:col-span-2 max-[480px]:col-span-1"
              >
                <label class="text-[1.2rem] font-medium text-body dark:text-dk-body"
                  >Nombre / Descripcion</label
                >
                <input
                  v-model="form.nombre"
                  type="text"
                  placeholder="Ej: Toyota Corolla 2020"
                  :class="[inputClass, { 'border-red-500': errores.nombre }]"
                />
                <span v-if="errores.nombre" class="text-[1.1rem] text-red-500">{{
                  errores.nombre
                }}</span>
              </p>
              <p class="flex flex-col gap-1.5">
                <label class="text-[1.2rem] font-medium text-body dark:text-dk-body">Marca</label>
                <select
                  v-model="form.marca"
                  :class="[inputClass, { 'border-red-500': errores.marca }]"
                >
                  <option value="">Seleccionar...</option>
                  <option v-for="m in marcas" :key="m" :value="m">{{ m }}</option>
                </select>
                <span v-if="errores.marca" class="text-[1.1rem] text-red-500">{{
                  errores.marca
                }}</span>
              </p>
              <p class="flex flex-col gap-1.5">
                <label class="text-[1.2rem] font-medium text-body dark:text-dk-body">Modelo</label>
                <input
                  v-model="form.modelo"
                  type="text"
                  placeholder="Ej: Corolla"
                  :class="[inputClass, { 'border-red-500': errores.modelo }]"
                />
                <span v-if="errores.modelo" class="text-[1.1rem] text-red-500">{{
                  errores.modelo
                }}</span>
              </p>
              <p class="flex flex-col gap-1.5">
                <label class="text-[1.2rem] font-medium text-body dark:text-dk-body">Anio</label>
                <input v-model="form.anio" type="text" placeholder="2024" :class="inputClass" />
              </p>
              <p class="flex flex-col gap-1.5">
                <label class="text-[1.2rem] font-medium text-body dark:text-dk-body">Placas</label>
                <input
                  v-model="form.placa"
                  type="text"
                  placeholder="ABC-123"
                  :class="[inputClass, { 'border-red-500': errores.placa }]"
                />
                <span v-if="errores.placa" class="text-[1.1rem] text-red-500">{{
                  errores.placa
                }}</span>
              </p>
              <p class="flex flex-col gap-1.5">
                <label class="text-[1.2rem] font-medium text-body dark:text-dk-body">Color</label>
                <input v-model="form.color" type="text" placeholder="Blanco" :class="inputClass" />
              </p>
              <p class="flex flex-col gap-1.5">
                <label class="text-[1.2rem] font-medium text-body dark:text-dk-body">VIN</label>
                <input
                  v-model="form.vin"
                  type="text"
                  placeholder="Numero de serie"
                  :class="inputClass"
                />
              </p>
              <p class="flex flex-col gap-1.5">
                <label class="text-[1.2rem] font-medium text-body dark:text-dk-body"
                  >Kilometraje</label
                >
                <input
                  v-model.number="form.kilometraje"
                  type="number"
                  min="0"
                  placeholder="50000"
                  :class="inputClass"
                />
              </p>
              <p class="flex flex-col gap-1.5">
                <label class="text-[1.2rem] font-medium text-body dark:text-dk-body"
                  >Combustible</label
                >
                <select v-model="form.combustible" :class="inputClass">
                  <option v-for="c in combustibles" :key="c" :value="c">{{ c }}</option>
                </select>
              </p>
              <p class="flex flex-col gap-1.5">
                <label class="text-[1.2rem] font-medium text-body dark:text-dk-body">Estado</label>
                <select v-model="form.estado" :class="inputClass">
                  <option v-for="e in estados" :key="e.valor" :value="e.valor">
                    {{ e.label }}
                  </option>
                </select>
              </p>
            </fieldset>
          </section>

          <!-- Right column -->
          <aside class="flex flex-col gap-8">
            <!-- Cliente -->
            <section
              class="bg-surface dark:bg-dk-surface border border-border dark:border-dk-border p-10"
            >
              <h2 class="text-[1.6rem] font-bold text-body dark:text-dk-body mb-8">
                Cliente Propietario
              </h2>
              <fieldset
                class="grid grid-cols-3 gap-6 max-[992px]:grid-cols-2 max-[480px]:grid-cols-1"
              >
                <p
                  class="flex flex-col gap-1.5 col-span-3 max-[992px]:col-span-2 max-[480px]:col-span-1"
                >
                  <label class="text-[1.2rem] font-medium text-body dark:text-dk-body"
                    >Cliente</label
                  >
                  <select
                    v-model="clienteSeleccionado"
                    :class="[inputClass, { 'border-red-500': errores.clienteNombre }]"
                    @change="seleccionarCliente(clienteSeleccionado)"
                  >
                    <option value="">Seleccionar cliente...</option>
                    <option v-for="c in clientes" :key="c.nombre" :value="c.nombre">
                      {{ c.nombre }}
                    </option>
                  </select>
                  <span v-if="errores.clienteNombre" class="text-[1.1rem] text-red-500">{{
                    errores.clienteNombre
                  }}</span>
                </p>
                <p class="flex flex-col gap-1.5">
                  <label class="text-[1.2rem] font-medium text-body dark:text-dk-body"
                    >Telefono</label
                  >
                  <input
                    v-model="form.clienteTelefono"
                    type="tel"
                    readonly
                    class="px-4 py-3 text-[1.4rem] text-body dark:text-dk-body bg-bg dark:bg-dk-bg border border-border dark:border-dk-border outline-none cursor-not-allowed opacity-70"
                  />
                </p>
                <p class="flex flex-col gap-1.5">
                  <label class="text-[1.2rem] font-medium text-body dark:text-dk-body">Email</label>
                  <input
                    v-model="form.clienteEmail"
                    type="email"
                    readonly
                    class="px-4 py-3 text-[1.4rem] text-body dark:text-dk-body bg-bg dark:bg-dk-bg border border-border dark:border-dk-border outline-none cursor-not-allowed opacity-70"
                  />
                </p>
              </fieldset>
            </section>

            <!-- Notas -->
            <section
              class="bg-surface dark:bg-dk-surface border border-border dark:border-dk-border p-10"
            >
              <h2 class="text-[1.6rem] font-bold text-body dark:text-dk-body mb-6">Notas</h2>
              <textarea
                v-model="form.notas"
                rows="3"
                placeholder="Notas adicionales sobre el vehiculo..."
                class="w-full px-4 py-3 text-[1.4rem] text-body dark:text-dk-body bg-surface dark:bg-dk-surface border border-border dark:border-dk-border outline-none focus:border-primary transition-colors resize-none placeholder:text-muted dark:placeholder:text-dk-muted"
              ></textarea>
            </section>
          </aside>

          <!-- Actions -->
          <nav class="flex items-center gap-4 mt-8">
            <button
              type="submit"
              class="px-8 py-3 text-[1.3rem] font-semibold text-white bg-primary border-none cursor-pointer hover:bg-primary-dark transition-colors"
            >
              {{ esEdicion ? 'Guardar Cambios' : 'Crear Vehiculo' }}
            </button>
            <button
              type="button"
              class="px-8 py-3 text-[1.3rem] font-medium text-muted dark:text-dk-muted bg-transparent border border-border dark:border-dk-border cursor-pointer hover:text-body dark:hover:text-dk-body transition-colors"
              @click="router.back()"
            >
              Cancelar
            </button>
          </nav>
        </form>
      </main>
    </div>
  </div>
</template>

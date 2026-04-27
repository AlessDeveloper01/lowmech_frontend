<script setup lang="ts">
import { ref, onMounted, reactive, inject, type Ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { api } from '@/services/api'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppTopbar from '@/components/layout/AppTopbar.vue'

interface VehiculoCliente {
  id: number
  nombre: string
  marca: string
  modelo: string
  anio: string
  placa: string
  color: string
  kilometraje: number
  combustible: string
  estado: string
}

const router = useRouter()
const route = useRoute()
const collapsed = inject<Ref<boolean>>('sidebarCollapsed')!
const darkMode = inject<Ref<boolean>>('darkMode')!

const vehiculo = ref<VehiculoCliente | null>(null)
const loading = ref(true)

// Update Form State
const isEditing = ref(false)
const submitting = ref(false)
const submitError = ref('')

const form = reactive({
  nombre: '',
  marca: '',
  modelo: '',
  anio: '',
  placa: '',
  color: '',
  kilometraje: 0,
})

onMounted(async () => {
  await fetchVehiculo()
})

async function fetchVehiculo() {
  loading.value = true
  try {
    const res = await api.get<VehiculoCliente>(`/vehiculos/${route.params.id}`)
    vehiculo.value = res
    initFormFromVehiculo()
  } catch (error) {
    console.error('Error al cargar vehículo', error)
  } finally {
    loading.value = false
  }
}

function initFormFromVehiculo() {
  if (!vehiculo.value) return
  form.nombre = vehiculo.value.nombre || ''
  form.marca = vehiculo.value.marca || ''
  form.modelo = vehiculo.value.modelo || ''
  form.anio = vehiculo.value.anio || ''
  form.placa = vehiculo.value.placa || ''
  form.color = vehiculo.value.color || ''
  form.kilometraje = vehiculo.value.kilometraje || 0
}

function toggleEdit() {
  if (!isEditing.value) {
    initFormFromVehiculo()
  }
  isEditing.value = !isEditing.value
  submitError.value = ''
}

async function submitUpdate() {
  submitError.value = ''
  submitting.value = true

  const payload = {
    ...form,
    anio: String(form.anio),
  }

  try {
    await api.put(`/vehiculos/${route.params.id}`, payload)
    isEditing.value = false
    await fetchVehiculo()
  } catch (error: any) {
    submitError.value = error.message || 'Error al actualizar el vehículo'
  } finally {
    submitting.value = false
  }
}

function labelEstado(estado: string) {
  const map: Record<string, string> = {
    en_taller: 'En Taller',
    disponible: 'Operativo / Listo',
    en_espera: 'Programado / En cola',
  }
  return map[estado] ?? estado
}

function estadoClass(estado: string) {
  const map: Record<string, string> = {
    en_taller:
      'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800',
    disponible:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800',
    en_espera:
      'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
  }
  return map[estado] ?? 'bg-slate-50 text-slate-600 border-slate-200'
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
    <AppSidebar />
    <div
      class="min-h-screen flex flex-col transition-all duration-300 ease-out max-[768px]:ml-0"
      :class="collapsed ? 'ml-[6.4rem]' : 'ml-[22rem]'"
    >
      <AppTopbar :dark-mode="darkMode" @toggle-dark="darkMode = !darkMode" />

      <main class="flex-1 p-6 md:p-10 max-w-4xl mx-auto w-full">
        <!-- Volver -->
        <button
          @click="router.push({ name: 'cliente-carros' })"
          class="mb-6 flex items-center gap-2 text-slate-500 hover:text-orange-500 transition-colors font-medium"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z"
              clip-rule="evenodd"
            />
          </svg>
          Volver a Mi Garaje
        </button>

        <div v-if="loading" class="py-20 text-center text-slate-400">
          Cargando detalles de vehículo...
        </div>
        <div v-else-if="!vehiculo" class="py-20 text-center text-red-500">
          Vehículo no encontrado.
        </div>

        <div v-else class="space-y-8">
          <!-- Tarjeta Principal Vehiculo -->
          <div
            class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm relative overflow-hidden"
          >
            <!-- Decoration -->
            <div
              class="absolute -right-10 -top-10 w-40 h-40 bg-slate-50 dark:bg-slate-800 rounded-full opacity-60 pointer-events-none"
            ></div>

            <div class="relative z-10">
              <div class="flex flex-col md:flex-row justify-between items-start gap-4 mb-8">
                <div>
                  <h1 class="text-3xl font-black text-slate-800 dark:text-white">
                    {{ vehiculo.nombre }}
                  </h1>
                  <p class="text-orange-500 font-bold mt-2 flex items-center gap-2 text-lg">
                    <span>{{ vehiculo.marca }}</span> • <span>{{ vehiculo.modelo }}</span> •
                    <span>{{ vehiculo.anio }}</span>
                  </p>
                </div>
                <div class="flex flex-col items-end gap-3 w-full md:w-auto">
                  <span
                    class="px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-widest border text-center whitespace-nowrap"
                    :class="estadoClass(vehiculo.estado)"
                  >
                    {{ labelEstado(vehiculo.estado) }}
                  </span>

                  <button
                    @click="toggleEdit"
                    class="w-full md:w-auto px-5 py-2 mt-2 font-bold rounded-xl border-2 transition-colors flex items-center justify-center gap-2"
                    :class="
                      isEditing
                        ? 'border-slate-300 text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800'
                        : 'border-orange-500 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10'
                    "
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"
                      />
                    </svg>
                    {{ isEditing ? 'Cancelar Edición' : 'Editar Datos' }}
                  </button>
                </div>
              </div>

              <!-- Vista de solo lectura (Specs) -->
              <transition
                enter-active-class="transition-all duration-300 ease-out"
                enter-from-class="opacity-0 -translate-y-4"
                enter-to-class="opacity-100 translate-y-0"
                leave-active-class="hidden"
                leave-from-class="hidden"
                leave-to-class="hidden"
              >
                <div
                  v-show="!isEditing"
                  class="grid grid-cols-2 md:grid-cols-4 gap-6 bg-slate-50 dark:bg-slate-800/40 p-6 rounded-2xl border border-slate-100 dark:border-slate-800"
                >
                  <div>
                    <span
                      class="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1 block"
                      >Placas</span
                    >
                    <p class="font-bold text-slate-700 dark:text-slate-300 font-mono text-xl">
                      {{ vehiculo.placa || 'N/A' }}
                    </p>
                  </div>
                  <div>
                    <span
                      class="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1 block"
                      >Color</span
                    >
                    <p class="font-bold text-slate-700 dark:text-slate-300 text-lg">
                      {{ vehiculo.color || 'No definido' }}
                    </p>
                  </div>
                  <div>
                    <span
                      class="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1 block"
                      >Kilometraje</span
                    >
                    <p class="font-bold text-slate-700 dark:text-slate-300 text-lg">
                      {{
                        vehiculo.kilometraje
                          ? vehiculo.kilometraje.toLocaleString('es-MX') + ' km'
                          : '—'
                      }}
                    </p>
                  </div>
                  <div>
                    <span
                      class="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1 block"
                      >Motor / Extra</span
                    >
                    <p class="font-bold text-slate-700 dark:text-slate-300 text-lg truncate">
                      {{ vehiculo.combustible || '—' }}
                    </p>
                  </div>
                </div>
              </transition>

              <!-- Formulario de Edición -->
              <transition
                enter-active-class="transition-all duration-300 ease-out"
                enter-from-class="opacity-0 -translate-y-4"
                enter-to-class="opacity-100 translate-y-0"
                leave-active-class="hidden"
                leave-from-class="hidden"
                leave-to-class="hidden"
              >
                <form
                  v-show="isEditing"
                  @submit.prevent="submitUpdate"
                  class="pt-6 border-t border-slate-200 dark:border-slate-700 mt-4"
                >
                  <div
                    class="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-orange-50/50 dark:bg-orange-900/10 p-6 rounded-2xl border border-orange-100 dark:border-orange-800/50"
                  >
                    <div class="sm:col-span-2">
                      <label
                        class="block text-[0.85rem] font-bold text-slate-700 dark:text-slate-300 mb-2"
                        >Alias / Nombre identificador</label
                      >
                      <input
                        v-model="form.nombre"
                        required
                        class="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white focus:outline-none focus:border-orange-500 transition-colors shadow-sm"
                      />
                    </div>

                    <div>
                      <label
                        class="block text-[0.85rem] font-bold text-slate-700 dark:text-slate-300 mb-2"
                        >Marca</label
                      >
                      <input
                        v-model="form.marca"
                        required
                        class="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white focus:outline-none focus:border-orange-500 transition-colors shadow-sm"
                      />
                    </div>
                    <div>
                      <label
                        class="block text-[0.85rem] font-bold text-slate-700 dark:text-slate-300 mb-2"
                        >Modelo</label
                      >
                      <input
                        v-model="form.modelo"
                        required
                        class="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white focus:outline-none focus:border-orange-500 transition-colors shadow-sm"
                      />
                    </div>

                    <div>
                      <label
                        class="block text-[0.85rem] font-bold text-slate-700 dark:text-slate-300 mb-2"
                        >Año</label
                      >
                      <input
                        v-model="form.anio"
                        type="number"
                        class="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white focus:outline-none focus:border-orange-500 transition-colors shadow-sm"
                      />
                    </div>
                    <div>
                      <label
                        class="block text-[0.85rem] font-bold text-slate-700 dark:text-slate-300 mb-2"
                        >Placas</label
                      >
                      <input
                        v-model="form.placa"
                        required
                        class="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white font-mono uppercase focus:outline-none focus:border-orange-500 transition-colors shadow-sm"
                      />
                    </div>

                    <div>
                      <label
                        class="block text-[0.85rem] font-bold text-slate-700 dark:text-slate-300 mb-2"
                        >Color</label
                      >
                      <input
                        v-model="form.color"
                        class="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white focus:outline-none focus:border-orange-500 transition-colors shadow-sm"
                      />
                    </div>
                    <div>
                      <label
                        class="block text-[0.85rem] font-bold text-slate-700 dark:text-slate-300 mb-2"
                        >Kilometraje actual</label
                      >
                      <input
                        v-model.number="form.kilometraje"
                        type="number"
                        class="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white focus:outline-none focus:border-orange-500 transition-colors shadow-sm"
                      />
                    </div>
                  </div>

                  <div
                    v-if="submitError"
                    class="mt-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm"
                  >
                    {{ submitError }}
                  </div>

                  <div class="mt-6 flex justify-end">
                    <button
                      type="submit"
                      :disabled="submitting"
                      class="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-xl font-bold transition-all disabled:opacity-50"
                    >
                      {{ submitting ? 'Guardando...' : 'Guardar Cambios' }}
                    </button>
                  </div>
                </form>
              </transition>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

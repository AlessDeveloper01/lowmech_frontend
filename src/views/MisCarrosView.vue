<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
    <AppSidebar />
    <div
      class="min-h-screen flex flex-col transition-all duration-300 ease-out max-[768px]:ml-0"
      :class="collapsed ? 'ml-[6.4rem]' : 'ml-[22rem]'"
    >
      <AppTopbar :dark-mode="darkMode" @toggle-dark="darkMode = !darkMode" />

      <main class="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full">
        <!-- Header -->
        <header class="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 class="text-[2.2rem] font-extrabold text-slate-800 dark:text-white tracking-tight">
              Mi Garaje
            </h1>
            <p class="text-[1.1rem] text-slate-500 dark:text-slate-400 mt-1">
              Administra la información de todos tus vehículos registrados
            </p>
          </div>
          <button
            @click="openModal = true"
            class="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md hover:shadow-orange-500/30 flex items-center justify-center gap-2 transform hover:scale-[1.02]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                clip-rule="evenodd"
              />
            </svg>
            Registrar Vehículo
          </button>
        </header>

        <!-- Top Stats -->
        <div v-if="!loading" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-10">
          <div
            class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm flex items-center gap-4"
          >
            <div
              class="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-500"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-7 w-7"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="1.5"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                />
              </svg>
            </div>
            <div>
              <p class="text-sm font-medium text-slate-400 uppercase tracking-widest">
                Total Vehículos
              </p>
              <p class="text-3xl font-black text-slate-800 dark:text-white">
                {{ vehiculos.length }}
              </p>
            </div>
          </div>
          <div
            class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm flex items-center gap-4"
          >
            <div
              class="w-14 h-14 bg-orange-50 dark:bg-orange-500/10 rounded-full flex items-center justify-center text-orange-500"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-7 w-7"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="1.5"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p class="text-sm font-medium text-slate-400 uppercase tracking-widest">
                En reparación
              </p>
              <p class="text-3xl font-black text-slate-800 dark:text-white">{{ enTallerCount }}</p>
            </div>
          </div>
        </div>

        <!-- Cargando -->
        <div v-if="loading" class="flex flex-col items-center justify-center py-20 text-slate-400">
          <svg
            class="animate-spin h-10 w-10 mb-4 text-orange-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p class="text-lg font-medium">Buscando tus datos...</p>
        </div>

        <!-- Sin vehículos -->
        <div
          v-else-if="vehiculos.length === 0"
          class="flex flex-col items-center justify-center py-24 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm"
        >
          <div
            class="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-12 w-12 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="1.5"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
              />
            </svg>
          </div>
          <h3 class="text-xl font-bold text-slate-800 dark:text-white mb-2">Garaje Vacío</h3>
          <p class="text-slate-500 dark:text-slate-400 text-center max-w-sm mb-6">
            No tienes vehículos registrados. Empieza ahora haciendo clic en el botón superior para
            registrar tu primer carro.
          </p>
          <button @click="openModal = true" class="text-orange-500 font-bold hover:underline">
            Registrar Vehículo ahora &rarr;
          </button>
        </div>

        <!-- Grid -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <article
            v-for="v in vehiculos"
            :key="v.id"
            @click="router.push({ name: 'cliente-carros-detalle', params: { id: v.id } })"
            class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-7 relative overflow-hidden group hover:border-orange-500/40 hover:shadow-xl transition-all duration-300 cursor-pointer"
          >
            <!-- Decoration background -->
            <div
              class="absolute -right-8 -top-8 w-32 h-32 bg-slate-50 dark:bg-slate-800 rounded-full opacity-60 group-hover:scale-110 transition-transform -z-10"
            ></div>

            <div class="z-10 relative">
              <div class="flex items-start justify-between gap-3 mb-6">
  <!-- Imagen del vehículo -->
  <div class="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 flex items-center justify-center">
    <img
      v-if="v.imagenUrl"
      :src="v.imagenUrl"
      :alt="v.nombre"
      class="w-full h-full object-cover"
    />
    <svg
      v-else
      xmlns="http://www.w3.org/2000/svg"
      class="h-8 w-8 text-slate-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="1.5"
    >
      <path stroke-linecap="round" stroke-linejoin="round"
        d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"/>
      <path stroke-linecap="round" stroke-linejoin="round"
        d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 .001M13 16l2 .001M13 16H9m4 0h2m0 0h2a1 1 0 001-1v-3.34a1 1 0 00-.26-.67L17 8.34A1 1 0 0016.26 8H13"/>
    </svg>
  </div>

  <div class="flex-1 min-w-0">
    <h2 class="font-extrabold text-slate-800 dark:text-white text-2xl truncate">
      {{ v.nombre }}
    </h2>
    <p class="font-bold text-orange-500 mt-1 flex items-center gap-1.5">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd"
          d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z"
          clip-rule="evenodd"/>
      </svg>
      {{ v.marca }} {{ v.modelo }} {{ v.anio }}
    </p>
  </div>
</div>

              <div class="mb-6">
                <span
                  class="px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-widest border"
                  :class="estadoClass(v.estado)"
                >
                  {{ labelEstado(v.estado) }}
                </span>
              </div>

              <div
                class="grid grid-cols-2 gap-4 text-sm bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-800"
              >
                <div>
                  <span
                    class="text-slate-400 text-xs font-semibold uppercase tracking-wider block mb-0.5"
                    >Placa</span
                  >
                  <p class="font-bold text-slate-700 dark:text-slate-300 font-mono text-[1.05rem]">
                    {{ v.placa || 'No definida' }}
                  </p>
                </div>
                <div>
                  <span
                    class="text-slate-400 text-xs font-semibold uppercase tracking-wider block mb-0.5"
                    >Color</span
                  >
                  <p class="font-bold text-slate-700 dark:text-slate-300">
                    {{ v.color || 'No definido' }}
                  </p>
                </div>
                <div>
                  <span
                    class="text-slate-400 text-xs font-semibold uppercase tracking-wider block mb-0.5"
                    >Kilometraje</span
                  >
                  <p class="font-bold text-slate-700 dark:text-slate-300">
                    {{ v.kilometraje ? v.kilometraje.toLocaleString('es-MX') + ' km' : '—' }}
                  </p>
                </div>
                <div>
                  <span
                    class="text-slate-400 text-xs font-semibold uppercase tracking-wider block mb-0.5"
                    >Motor</span
                  >
                  <p class="font-bold text-slate-700 dark:text-slate-300">
                    {{ v.combustible || '—' }}
                  </p>
                </div>
              </div>
            </div>
          </article>
        </div>

        <!-- Modal Form: Crear Vehículo -->
        <div
          v-if="openModal"
          class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm sm:p-0"
        >
          <div
            class="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl shadow-black/40 border border-slate-200 dark:border-slate-800 overflow-hidden transform transition-all"
            @click.stop
          >
            <div
              class="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50"
            >
              <div>
                <h3 class="text-xl font-extrabold text-slate-800 dark:text-white">
                  Registrar Nuevo Vehículo
                </h3>
                <p class="text-sm text-slate-500 mt-1 font-medium">
                  Llena los datos básicos. Tu contacto se asocia automáticamente.
                </p>
              </div>
              <button
                @click="closeFormModal"
                class="text-slate-400 hover:text-slate-800 dark:hover:text-white bg-slate-200 dark:bg-slate-800 p-2 rounded-full transition-colors"
              >
                <svg
                  class="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form @submit.prevent="submitCreate" class="p-8">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div class="sm:col-span-2">
                  <label
                    class="block text-[0.85rem] font-bold text-slate-700 dark:text-slate-300 mb-2"
                    >Alias / Nombre identificador <span class="text-orange-500">*</span></label
                  >
                  <input
                    v-model="form.nombre"
                    required
                    placeholder="Ej. Mi Jetta Blanco, SUV Familiar..."
                    class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-shadow"
                  />
                </div>

                <div>
                  <label
                    class="block text-[0.85rem] font-bold text-slate-700 dark:text-slate-300 mb-2"
                    >Marca <span class="text-orange-500">*</span></label
                  >
                  <input
                    v-model="form.marca"
                    required
                    placeholder="Chevrolet, Nissan..."
                    class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-shadow"
                  />
                </div>
                <div>
                  <label
                    class="block text-[0.85rem] font-bold text-slate-700 dark:text-slate-300 mb-2"
                    >Modelo <span class="text-orange-500">*</span></label
                  >
                  <input
                    v-model="form.modelo"
                    required
                    placeholder="Aveo, Versa..."
                    class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-shadow"
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
                    placeholder="2018"
                    class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-shadow"
                  />
                </div>
                <div>
                  <label
                    class="block text-[0.85rem] font-bold text-slate-700 dark:text-slate-300 mb-2"
                    >Placa <span class="text-orange-500">*</span></label
                  >
                  <input
                    v-model="form.placa"
                    required
                    placeholder="ABC-123"
                    class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white font-mono uppercase focus:outline-none focus:ring-2 focus:ring-orange-500 transition-shadow"
                  />
                </div>

                <div>
                  <label
                    class="block text-[0.85rem] font-bold text-slate-700 dark:text-slate-300 mb-2"
                    >Color</label
                  >
                  <input
                    v-model="form.color"
                    placeholder="Blanco"
                    class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-shadow"
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
                    placeholder="45000"
                    class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-shadow"
                  />
                </div>
              </div>

              <div
                v-if="submitError"
                class="mt-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl flex gap-3 text-sm items-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5 shrink-0"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clip-rule="evenodd"
                  />
                </svg>
                {{ submitError }}
              </div>

              <div
                class="mt-8 flex items-center justify-end gap-4 border-t border-slate-100 dark:border-slate-800 pt-6"
              >
                <button
                  type="button"
                  @click="closeFormModal"
                  class="px-6 py-3 font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  :disabled="submitting"
                  class="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-3 rounded-xl font-bold hover:bg-orange-500 dark:hover:bg-orange-500 dark:hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {{ submitting ? 'Guardando...' : 'Registrar Vehículo' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, reactive, inject, type Ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/services/api'
import { useRouter } from 'vue-router'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppTopbar from '@/components/layout/AppTopbar.vue'

const router = useRouter()
const collapsed = inject<Ref<boolean>>('sidebarCollapsed')!
const darkMode = inject<Ref<boolean>>('darkMode')!

interface VehiculoMini {
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
  imagenUrl?: string
}

const authStore = useAuthStore()
const vehiculos = ref<VehiculoMini[]>([])
const loading = ref(true)

// Modal State
const openModal = ref(false)
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

const enTallerCount = computed(() => {
  return vehiculos.value.filter((v) => v.estado === 'en_taller').length
})

onMounted(async () => {
  await fetchVehicles()
})

async function fetchVehicles() {
  loading.value = true
  try {
    vehiculos.value = await api.get<VehiculoMini[]>('/vehiculos/mis-vehiculos')
  } catch (error) {
    console.error('Error cargando vehículos:', error)
  } finally {
    loading.value = false
  }
}

function closeFormModal() {
  openModal.value = false
  submitError.value = ''
  form.nombre = ''
  form.marca = ''
  form.modelo = ''
  form.anio = ''
  form.placa = ''
  form.color = ''
  form.kilometraje = 0
}

async function submitCreate() {
  submitError.value = ''
  submitting.value = true

  const user = authStore.user

  const payload = {
    ...form,
    anio: String(form.anio),
    combustible: 'Gasolina/Definir por Mecánico',
    estado: 'disponible',
    clienteNombre: user ? `${user.nombre} ${user.apellido}`.trim() : 'Cliente Web',
    clienteEmail: user?.email,
  }

  try {
    await api.post('/vehiculos', payload)
    await fetchVehicles()
    closeFormModal()
  } catch (error: any) {
    submitError.value = error.message || 'Ocurrió un error al guardar el vehículo'
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

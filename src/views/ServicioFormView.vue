<script setup lang="ts">
import { ref, computed, inject, onMounted, type Ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useServiciosStore, type ServicioItemInput } from '@/stores/servicios'
import { useInventarioStore, type ItemInventario } from '@/stores/inventario'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppTopbar from '@/components/layout/AppTopbar.vue'
import Swal from 'sweetalert2'

const router = useRouter()
const route = useRoute()
const store = useServiciosStore()
const inventarioStore = useInventarioStore()

const collapsed = inject<Ref<boolean>>('sidebarCollapsed')!
const darkMode = inject<Ref<boolean>>('darkMode')!

const esEdicion = computed(() => !!route.params.id)
const titulo = computed(() => (esEdicion.value ? 'Editar Servicio' : 'Nuevo Servicio'))
const guardando = ref(false)

const form = ref({
  nombre: '',
  descripcion: '',
  categoria: '',
  precioManoObra: 0,
  duracionMinutos: 60,
  activo: true,
  notas: '',
})

const itemsSeleccionados = ref<{ articuloId: number; cantidad: number }[]>([])

const errores = ref<Record<string, string>>({})

const categorias = [
  'Mantenimiento',
  'Frenos',
  'Motor',
  'Transmision',
  'Electrico',
  'Suspension',
  'Carroceria',
  'Diagnostico',
  'Otros',
]

// Para buscar articulos del inventario
const busquedaArticulo = ref('')
const mostrarSelectorArticulos = ref(false)

const articulosDisponibles = computed(() => {
  const idsYaSeleccionados = new Set(itemsSeleccionados.value.map((i) => i.articuloId))
  let lista = inventarioStore.items.filter((a) => !idsYaSeleccionados.has(a.id))
  if (busquedaArticulo.value.trim()) {
    const q = busquedaArticulo.value.toLowerCase()
    lista = lista.filter(
      (a) =>
        a.nombre.toLowerCase().includes(q) ||
        a.sku.toLowerCase().includes(q) ||
        a.categoria.toLowerCase().includes(q),
    )
  }
  return lista
})

const costoMateriales = computed(() =>
  itemsSeleccionados.value.reduce((sum, item) => {
    const articulo = inventarioStore.items.find((a) => a.id === item.articuloId)
    return sum + (articulo?.precioVenta ?? 0) * item.cantidad
  }, 0),
)

const costoTotal = computed(() => form.value.precioManoObra + costoMateriales.value)

function obtenerArticulo(articuloId: number): ItemInventario | undefined {
  return inventarioStore.items.find((a) => a.id === articuloId)
}

function agregarArticulo(articulo: ItemInventario) {
  itemsSeleccionados.value.push({ articuloId: articulo.id, cantidad: 1 })
  busquedaArticulo.value = ''
  mostrarSelectorArticulos.value = false
}

function quitarArticulo(index: number) {
  itemsSeleccionados.value.splice(index, 1)
}

function validar(): boolean {
  errores.value = {}
  if (!form.value.nombre.trim()) errores.value.nombre = 'Requerido'
  if (!form.value.categoria) errores.value.categoria = 'Selecciona una categoria'
  if (form.value.precioManoObra < 0) errores.value.precioManoObra = 'No puede ser negativo'
  if (form.value.duracionMinutos < 1) errores.value.duracionMinutos = 'Minimo 1 minuto'
  for (const item of itemsSeleccionados.value) {
    if (item.cantidad < 1) {
      errores.value.items = 'Todas las cantidades deben ser al menos 1'
      break
    }
  }
  return Object.keys(errores.value).length === 0
}

async function guardar() {
  if (!validar()) return
  guardando.value = true
  try {
    const payload = {
      ...form.value,
      items: itemsSeleccionados.value as ServicioItemInput[],
    }
    if (esEdicion.value) {
      const result = await store.actualizar(Number(route.params.id), payload)
      if (!result) throw new Error(store.error ?? 'Error al actualizar')
    } else {
      const result = await store.crear(payload)
      if (!result) throw new Error(store.error ?? 'Error al crear')
    }
    await Swal.fire({
      title: esEdicion.value ? 'Servicio actualizado' : 'Servicio creado',
      text: esEdicion.value
        ? 'Los cambios fueron guardados.'
        : 'El servicio fue registrado correctamente.',
      icon: 'success',
      timer: 1500,
      showConfirmButton: false,
    })
    router.push({ name: 'servicios-lista' })
  } catch (e) {
    Swal.fire({ title: 'Error', text: (e as Error).message, icon: 'error' })
  } finally {
    guardando.value = false
  }
}

function fmt(n: number): string {
  return n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

onMounted(async () => {
  await inventarioStore.fetchItems()
  if (esEdicion.value) {
    const s = await store.fetchServicio(Number(route.params.id))
    if (s) {
      form.value = {
        nombre: s.nombre,
        descripcion: s.descripcion,
        categoria: s.categoria,
        precioManoObra: s.precioManoObra,
        duracionMinutos: s.duracionMinutos,
        activo: s.activo,
        notas: s.notas,
      }
      itemsSeleccionados.value = s.items.map((i) => ({
        articuloId: i.articuloId,
        cantidad: i.cantidad,
      }))
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

        <form @submit.prevent="guardar">
          <section class="grid grid-cols-[1fr_30rem] gap-8 max-[1200px]:grid-cols-1">
            <!-- Left -->
            <section class="flex flex-col gap-8">
              <!-- Datos basicos -->
              <section
                class="bg-surface dark:bg-dk-surface border border-border dark:border-dk-border p-10"
              >
                <header>
                  <h2 class="text-[1.6rem] font-bold text-body dark:text-dk-body mb-8">
                    Datos del Servicio
                  </h2>
                </header>
                <fieldset class="grid grid-cols-2 gap-6 max-[480px]:grid-cols-1">
                  <p class="flex flex-col gap-1.5 col-span-2 max-[480px]:col-span-1">
                    <label class="text-[1.2rem] font-medium text-body dark:text-dk-body"
                      >Nombre</label
                    >
                    <input
                      v-model="form.nombre"
                      type="text"
                      placeholder="Nombre del servicio"
                      :class="[inputClass, { 'border-red-500': errores.nombre }]"
                    />
                    <span v-if="errores.nombre" class="text-[1.1rem] text-red-500">{{
                      errores.nombre
                    }}</span>
                  </p>
                  <p class="flex flex-col gap-1.5 col-span-2 max-[480px]:col-span-1">
                    <label class="text-[1.2rem] font-medium text-body dark:text-dk-body"
                      >Descripcion</label
                    >
                    <textarea
                      v-model="form.descripcion"
                      rows="3"
                      placeholder="Descripcion del servicio..."
                      :class="inputClass"
                    ></textarea>
                  </p>
                  <p class="flex flex-col gap-1.5">
                    <label class="text-[1.2rem] font-medium text-body dark:text-dk-body"
                      >Categoria</label
                    >
                    <select
                      v-model="form.categoria"
                      :class="[inputClass, { 'border-red-500': errores.categoria }]"
                    >
                      <option value="">Seleccionar...</option>
                      <option v-for="c in categorias" :key="c" :value="c">{{ c }}</option>
                    </select>
                    <span v-if="errores.categoria" class="text-[1.1rem] text-red-500">{{
                      errores.categoria
                    }}</span>
                  </p>
                  <p class="flex flex-col gap-1.5">
                    <label class="text-[1.2rem] font-medium text-body dark:text-dk-body"
                      >Duracion (minutos)</label
                    >
                    <input
                      v-model.number="form.duracionMinutos"
                      type="number"
                      min="1"
                      :class="[inputClass, { 'border-red-500': errores.duracionMinutos }]"
                    />
                    <span v-if="errores.duracionMinutos" class="text-[1.1rem] text-red-500">{{
                      errores.duracionMinutos
                    }}</span>
                  </p>
                  <p class="flex flex-col gap-1.5">
                    <label class="text-[1.2rem] font-medium text-body dark:text-dk-body"
                      >Precio Mano de Obra</label
                    >
                    <input
                      v-model.number="form.precioManoObra"
                      type="number"
                      min="0"
                      step="0.01"
                      :class="[inputClass, { 'border-red-500': errores.precioManoObra }]"
                    />
                    <span v-if="errores.precioManoObra" class="text-[1.1rem] text-red-500">{{
                      errores.precioManoObra
                    }}</span>
                  </p>
                  <p class="flex items-center gap-3 self-end py-3">
                    <input
                      v-model="form.activo"
                      type="checkbox"
                      id="activo"
                      class="w-5 h-5 accent-primary"
                    />
                    <label
                      for="activo"
                      class="text-[1.3rem] text-body dark:text-dk-body cursor-pointer"
                      >Servicio activo</label
                    >
                  </p>
                </fieldset>
              </section>

              <!-- Articulos del Paquete -->
              <section
                class="bg-surface dark:bg-dk-surface border border-border dark:border-dk-border p-10"
              >
                <header class="flex items-center justify-between mb-8">
                  <h2 class="text-[1.6rem] font-bold text-body dark:text-dk-body">
                    Articulos del Paquete
                  </h2>
                  <button
                    type="button"
                    class="flex items-center gap-2 px-4 py-2 text-[1.2rem] font-medium text-primary border border-primary/30 bg-transparent cursor-pointer hover:bg-primary hover:text-white transition-colors"
                    @click="mostrarSelectorArticulos = !mostrarSelectorArticulos"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2.5"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Agregar Articulo
                  </button>
                </header>

                <span v-if="errores.items" class="text-[1.1rem] text-red-500 block mb-4">{{
                  errores.items
                }}</span>

                <!-- Selector de articulos -->
                <section
                  v-if="mostrarSelectorArticulos"
                  class="mb-6 border border-border dark:border-dk-border p-6 bg-bg dark:bg-dk-bg"
                >
                  <input
                    v-model="busquedaArticulo"
                    type="text"
                    placeholder="Buscar articulo por nombre, SKU..."
                    class="w-full mb-4 px-4 py-3 text-[1.3rem] text-body dark:text-dk-body bg-surface dark:bg-dk-surface border border-border dark:border-dk-border outline-none focus:border-primary placeholder:text-muted dark:placeholder:text-dk-muted"
                  />
                  <section class="max-h-[24rem] overflow-y-auto">
                    <button
                      v-for="a in articulosDisponibles"
                      :key="a.id"
                      type="button"
                      class="w-full flex items-center justify-between px-4 py-3 text-left border-none bg-transparent cursor-pointer hover:bg-surface dark:hover:bg-dk-surface transition-colors border-b border-border/30 dark:border-dk-border/30"
                      @click="agregarArticulo(a)"
                    >
                      <section>
                        <p class="text-[1.3rem] font-medium text-body dark:text-dk-body">
                          {{ a.nombre }}
                        </p>
                        <p class="text-[1.1rem] text-muted dark:text-dk-muted">
                          {{ a.sku }} — {{ a.categoria }} — Stock: {{ a.stock }} {{ a.unidad }}
                        </p>
                      </section>
                      <span class="text-[1.3rem] font-mono text-body dark:text-dk-body"
                        >${{ fmt(a.precioVenta) }}</span
                      >
                    </button>
                    <p
                      v-if="articulosDisponibles.length === 0"
                      class="text-[1.3rem] text-muted dark:text-dk-muted text-center py-6"
                    >
                      No hay articulos disponibles
                    </p>
                  </section>
                </section>

                <!-- Lista de articulos seleccionados -->
                <section v-if="itemsSeleccionados.length > 0">
                  <table class="w-full">
                    <thead class="border-b border-border dark:border-dk-border">
                      <tr class="grid grid-cols-[2fr_8rem_10rem_10rem_4rem] gap-4 py-3">
                        <th
                          class="text-[1.1rem] font-semibold text-muted dark:text-dk-muted uppercase tracking-wider text-left"
                        >
                          Articulo
                        </th>
                        <th
                          class="text-[1.1rem] font-semibold text-muted dark:text-dk-muted uppercase tracking-wider text-center"
                        >
                          Cantidad
                        </th>
                        <th
                          class="text-[1.1rem] font-semibold text-muted dark:text-dk-muted uppercase tracking-wider text-right"
                        >
                          P. Unitario
                        </th>
                        <th
                          class="text-[1.1rem] font-semibold text-muted dark:text-dk-muted uppercase tracking-wider text-right"
                        >
                          Subtotal
                        </th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="(item, idx) in itemsSeleccionados"
                        :key="item.articuloId"
                        class="grid grid-cols-[2fr_8rem_10rem_10rem_4rem] gap-4 py-4 border-b border-border/30 dark:border-dk-border/30 items-center"
                      >
                        <td>
                          <p class="text-[1.3rem] font-medium text-body dark:text-dk-body">
                            {{ obtenerArticulo(item.articuloId)?.nombre }}
                          </p>
                          <p class="text-[1.1rem] text-muted dark:text-dk-muted">
                            {{ obtenerArticulo(item.articuloId)?.sku }}
                          </p>
                        </td>
                        <td class="flex justify-center">
                          <input
                            v-model.number="item.cantidad"
                            type="number"
                            min="1"
                            class="w-20 px-2 py-2 text-[1.3rem] text-center text-body dark:text-dk-body bg-bg dark:bg-dk-bg border border-border dark:border-dk-border outline-none focus:border-primary"
                          />
                        </td>
                        <td class="text-[1.3rem] text-body dark:text-dk-body text-right font-mono">
                          ${{ fmt(obtenerArticulo(item.articuloId)?.precioVenta ?? 0) }}
                        </td>
                        <td
                          class="text-[1.3rem] text-body dark:text-dk-body text-right font-mono font-semibold"
                        >
                          ${{
                            fmt(
                              (obtenerArticulo(item.articuloId)?.precioVenta ?? 0) * item.cantidad,
                            )
                          }}
                        </td>
                        <td class="flex justify-center">
                          <button
                            type="button"
                            class="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-600 border-none bg-transparent cursor-pointer transition-colors"
                            @click="quitarArticulo(idx)"
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              stroke-width="2"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </section>

                <p v-else class="text-[1.3rem] text-muted dark:text-dk-muted text-center py-8">
                  No se han agregado articulos a este servicio
                </p>
              </section>

              <!-- Notas -->
              <section
                class="bg-surface dark:bg-dk-surface border border-border dark:border-dk-border p-10"
              >
                <header>
                  <h2 class="text-[1.6rem] font-bold text-body dark:text-dk-body mb-8">Notas</h2>
                </header>
                <textarea
                  v-model="form.notas"
                  rows="4"
                  placeholder="Notas adicionales..."
                  :class="inputClass"
                  class="w-full"
                ></textarea>
              </section>
            </section>

            <!-- Right - Resumen -->
            <section class="flex flex-col gap-8">
              <section
                class="bg-surface dark:bg-dk-surface border border-border dark:border-dk-border p-8 sticky top-24"
              >
                <h2 class="text-[1.6rem] font-bold text-body dark:text-dk-body mb-6">Resumen</h2>
                <dl class="flex flex-col gap-4 mb-8">
                  <section class="flex justify-between">
                    <dt class="text-[1.3rem] text-muted dark:text-dk-muted">Mano de Obra</dt>
                    <dd class="text-[1.3rem] font-mono text-body dark:text-dk-body">
                      ${{ fmt(form.precioManoObra) }}
                    </dd>
                  </section>
                  <section class="flex justify-between">
                    <dt class="text-[1.3rem] text-muted dark:text-dk-muted">
                      Materiales ({{ itemsSeleccionados.length }})
                    </dt>
                    <dd class="text-[1.3rem] font-mono text-body dark:text-dk-body">
                      ${{ fmt(costoMateriales) }}
                    </dd>
                  </section>
                  <hr class="border-border dark:border-dk-border" />
                  <section class="flex justify-between">
                    <dt class="text-[1.5rem] font-bold text-body dark:text-dk-body">Total</dt>
                    <dd class="text-[1.5rem] font-bold font-mono text-primary">
                      ${{ fmt(costoTotal) }}
                    </dd>
                  </section>
                </dl>
                <section class="flex flex-col gap-3">
                  <button
                    type="submit"
                    class="w-full py-3.5 text-[1.3rem] font-semibold text-white bg-primary border-none cursor-pointer hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    :disabled="guardando"
                  >
                    {{
                      guardando ? 'Guardando...' : esEdicion ? 'Guardar Cambios' : 'Crear Servicio'
                    }}
                  </button>
                  <button
                    type="button"
                    class="w-full py-3.5 text-[1.3rem] font-medium text-muted dark:text-dk-muted border border-border dark:border-dk-border bg-transparent cursor-pointer hover:text-body dark:hover:text-dk-body transition-colors"
                    @click="router.back()"
                  >
                    Cancelar
                  </button>
                </section>
              </section>
            </section>
          </section>
        </form>
      </main>
    </div>
  </div>
</template>

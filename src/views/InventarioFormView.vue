<script setup lang="ts">
import { ref, computed, inject, onMounted, type Ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useInventarioStore } from '@/stores/inventario'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppTopbar from '@/components/layout/AppTopbar.vue'
import Swal from 'sweetalert2'

const router = useRouter()
const route = useRoute()
const store = useInventarioStore()

const collapsed = inject<Ref<boolean>>('sidebarCollapsed')!
const darkMode = inject<Ref<boolean>>('darkMode')!

const esEdicion = computed(() => !!route.params.id)
const titulo = computed(() => (esEdicion.value ? 'Editar Articulo' : 'Nuevo Articulo'))
const guardando = ref(false)

const form = ref({
  nombre: '',
  sku: '',
  categoria: '',
  stock: 0,
  stockMinimo: 5,
  unidad: 'Piezas',
  precioCompra: 0,
  precioVenta: 0,
  proveedor: '',
  ubicacion: '',
  notas: '',
})

const errores = ref<Record<string, string>>({})

const categorias = [
  'Aceites',
  'Filtros',
  'Frenos',
  'Encendido',
  'Transmision',
  'Liquidos',
  'Accesorios',
  'Herramientas',
  'Otros',
]
const unidades = ['Piezas', 'Litros', 'Pares', 'Kilogramos', 'Metros', 'Galones']

function validar(): boolean {
  errores.value = {}
  if (!form.value.nombre.trim()) errores.value.nombre = 'Requerido'
  if (!form.value.sku.trim()) errores.value.sku = 'Requerido'
  if (!form.value.categoria) errores.value.categoria = 'Selecciona una categoria'
  if (form.value.stock < 0) errores.value.stock = 'No puede ser negativo'
  if (form.value.precioCompra < 0) errores.value.precioCompra = 'No puede ser negativo'
  if (form.value.precioVenta < 0) errores.value.precioVenta = 'No puede ser negativo'
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
      title: esEdicion.value ? 'Artículo actualizado' : 'Artículo creado',
      text: esEdicion.value
        ? 'Los cambios fueron guardados.'
        : 'El artículo fue registrado correctamente.',
      icon: 'success',
      timer: 1500,
      showConfirmButton: false,
    })
    router.push({ name: 'inventario-lista' })
  } catch (e) {
    Swal.fire({ title: 'Error', text: (e as Error).message, icon: 'error' })
  } finally {
    guardando.value = false
  }
}

onMounted(async () => {
  if (esEdicion.value) {
    const item = await store.fetchItem(Number(route.params.id))
    if (item) {
      form.value = {
        nombre: item.nombre,
        sku: item.sku,
        categoria: item.categoria,
        stock: item.stock,
        stockMinimo: item.stockMinimo,
        unidad: item.unidad,
        precioCompra: item.precioCompra,
        precioVenta: item.precioVenta,
        proveedor: item.proveedor,
        ubicacion: item.ubicacion,
        notas: item.notas,
      }
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
              <section
                class="bg-surface dark:bg-dk-surface border border-border dark:border-dk-border p-10"
              >
                <header>
                  <h2 class="text-[1.6rem] font-bold text-body dark:text-dk-body mb-8">
                    Datos del Articulo
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
                      placeholder="Nombre del articulo"
                      :class="[inputClass, { 'border-red-500': errores.nombre }]"
                    />
                    <span v-if="errores.nombre" class="text-[1.1rem] text-red-500">{{
                      errores.nombre
                    }}</span>
                  </p>
                  <p class="flex flex-col gap-1.5">
                    <label class="text-[1.2rem] font-medium text-body dark:text-dk-body">SKU</label>
                    <input
                      v-model="form.sku"
                      type="text"
                      placeholder="OIL-001"
                      :class="[inputClass, { 'border-red-500': errores.sku }]"
                    />
                    <span v-if="errores.sku" class="text-[1.1rem] text-red-500">{{
                      errores.sku
                    }}</span>
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
                      >Proveedor</label
                    >
                    <input
                      v-model="form.proveedor"
                      type="text"
                      placeholder="Nombre del proveedor"
                      :class="inputClass"
                    />
                  </p>
                  <p class="flex flex-col gap-1.5">
                    <label class="text-[1.2rem] font-medium text-body dark:text-dk-body"
                      >Ubicacion</label
                    >
                    <input
                      v-model="form.ubicacion"
                      type="text"
                      placeholder="Estante A-1"
                      :class="inputClass"
                    />
                  </p>
                </fieldset>
              </section>

              <section
                class="bg-surface dark:bg-dk-surface border border-border dark:border-dk-border p-10"
              >
                <header>
                  <h2 class="text-[1.6rem] font-bold text-body dark:text-dk-body mb-8">
                    Stock y Precios
                  </h2>
                </header>
                <fieldset
                  class="grid grid-cols-3 gap-6 max-[768px]:grid-cols-2 max-[480px]:grid-cols-1"
                >
                  <p class="flex flex-col gap-1.5">
                    <label class="text-[1.2rem] font-medium text-body dark:text-dk-body"
                      >Stock Actual</label
                    >
                    <input
                      v-model.number="form.stock"
                      type="number"
                      min="0"
                      :class="[inputClass, { 'border-red-500': errores.stock }]"
                    />
                    <span v-if="errores.stock" class="text-[1.1rem] text-red-500">{{
                      errores.stock
                    }}</span>
                  </p>
                  <p class="flex flex-col gap-1.5">
                    <label class="text-[1.2rem] font-medium text-body dark:text-dk-body"
                      >Stock Minimo</label
                    >
                    <input
                      v-model.number="form.stockMinimo"
                      type="number"
                      min="0"
                      :class="inputClass"
                    />
                  </p>
                  <p class="flex flex-col gap-1.5">
                    <label class="text-[1.2rem] font-medium text-body dark:text-dk-body"
                      >Unidad</label
                    >
                    <select v-model="form.unidad" :class="inputClass">
                      <option v-for="u in unidades" :key="u" :value="u">{{ u }}</option>
                    </select>
                  </p>
                  <p class="flex flex-col gap-1.5">
                    <label class="text-[1.2rem] font-medium text-body dark:text-dk-body"
                      >Precio Compra ($)</label
                    >
                    <input
                      v-model.number="form.precioCompra"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      :class="[inputClass, { 'border-red-500': errores.precioCompra }]"
                    />
                    <span v-if="errores.precioCompra" class="text-[1.1rem] text-red-500">{{
                      errores.precioCompra
                    }}</span>
                  </p>
                  <p class="flex flex-col gap-1.5">
                    <label class="text-[1.2rem] font-medium text-body dark:text-dk-body"
                      >Precio Venta ($)</label
                    >
                    <input
                      v-model.number="form.precioVenta"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      :class="[inputClass, { 'border-red-500': errores.precioVenta }]"
                    />
                    <span v-if="errores.precioVenta" class="text-[1.1rem] text-red-500">{{
                      errores.precioVenta
                    }}</span>
                  </p>
                </fieldset>
              </section>
            </section>

            <!-- Right -->
            <aside class="flex flex-col gap-8">
              <!-- Resumen -->
              <section
                class="bg-surface dark:bg-dk-surface border border-border dark:border-dk-border p-8"
              >
                <header>
                  <h3 class="text-[1.4rem] font-bold text-body dark:text-dk-body mb-5">Resumen</h3>
                </header>
                <dl class="flex flex-col gap-4">
                  <p
                    class="flex justify-between items-center py-3 border-b border-border/60 dark:border-dk-border/60"
                  >
                    <dt class="text-[1.2rem] text-muted dark:text-dk-muted">
                      Valor en stock (compra)
                    </dt>
                    <dd class="text-[1.4rem] font-semibold text-body dark:text-dk-body">
                      ${{
                        (form.stock * form.precioCompra).toLocaleString('es-MX', {
                          minimumFractionDigits: 2,
                        })
                      }}
                    </dd>
                  </p>
                  <p
                    class="flex justify-between items-center py-3 border-b border-border/60 dark:border-dk-border/60"
                  >
                    <dt class="text-[1.2rem] text-muted dark:text-dk-muted">
                      Valor en stock (venta)
                    </dt>
                    <dd class="text-[1.4rem] font-semibold text-primary">
                      ${{
                        (form.stock * form.precioVenta).toLocaleString('es-MX', {
                          minimumFractionDigits: 2,
                        })
                      }}
                    </dd>
                  </p>
                  <p class="flex justify-between items-center py-3">
                    <dt class="text-[1.2rem] text-muted dark:text-dk-muted">Margen</dt>
                    <dd
                      class="text-[1.4rem] font-semibold"
                      :class="
                        form.precioCompra > 0 ? 'text-emerald-500' : 'text-muted dark:text-dk-muted'
                      "
                    >
                      {{
                        form.precioCompra > 0
                          ? (
                              ((form.precioVenta - form.precioCompra) / form.precioCompra) *
                              100
                            ).toFixed(0) + '%'
                          : '—'
                      }}
                    </dd>
                  </p>
                </dl>
              </section>

              <!-- Notas -->
              <section
                class="bg-surface dark:bg-dk-surface border border-border dark:border-dk-border p-8"
              >
                <header>
                  <h3 class="text-[1.4rem] font-bold text-body dark:text-dk-body mb-4">Notas</h3>
                </header>
                <textarea
                  v-model="form.notas"
                  rows="3"
                  placeholder="Notas adicionales..."
                  class="w-full px-4 py-3 text-[1.4rem] text-body dark:text-dk-body bg-surface dark:bg-dk-surface border border-border dark:border-dk-border outline-none focus:border-primary transition-colors resize-none placeholder:text-muted dark:placeholder:text-dk-muted"
                ></textarea>
              </section>
            </aside>
          </section>

          <nav class="flex items-center gap-4 mt-8">
            <button
              type="submit"
              class="px-8 py-3 text-[1.3rem] font-semibold text-white bg-primary border-none cursor-pointer hover:bg-primary-dark transition-colors"
            >
              {{ esEdicion ? 'Guardar Cambios' : 'Crear Articulo' }}
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

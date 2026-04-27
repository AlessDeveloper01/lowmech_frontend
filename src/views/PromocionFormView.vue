<script setup lang="ts">
import { ref, computed, inject, onMounted, type Ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { usePromocionesStore } from '@/stores/promociones'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppTopbar from '@/components/layout/AppTopbar.vue'
import Swal from 'sweetalert2'

const router = useRouter()
const route = useRoute()
const store = usePromocionesStore()

const collapsed = inject<Ref<boolean>>('sidebarCollapsed')!
const darkMode = inject<Ref<boolean>>('darkMode')!

const esEdicion = computed(() => !!route.params.id)
const titulo = computed(() => (esEdicion.value ? 'Editar Promocion' : 'Nueva Promocion'))

const form = ref({
  nombre: '',
  descripcion: '',
  tipo: 'porcentaje' as 'porcentaje' | 'monto' | 'gratis',
  valor: 0,
  codigo: '',
  fechaInicio: new Date().toISOString().split('T')[0] ?? '',
  fechaFin: '',
  activa: true,
  usosMaximos: 0,
  condiciones: '',
})

const errores = ref<Record<string, string>>({})

function validar(): boolean {
  errores.value = {}
  if (!form.value.nombre.trim()) errores.value.nombre = 'El nombre es obligatorio'
  if (form.value.valor <= 0) errores.value.valor = 'El valor debe ser mayor a 0'
  return Object.keys(errores.value).length === 0
}

async function guardar() {
  if (!validar()) return
  const datos = { ...form.value }
  let ok: any
  if (esEdicion.value) {
    ok = await store.actualizar(Number(route.params.id), datos)
  } else {
    ok = await store.crear(datos)
  }
  if (!ok) {
    Swal.fire({ title: 'Error', text: store.error ?? 'No se pudo guardar', icon: 'error' })
    return
  }
  await Swal.fire({
    title: esEdicion.value ? 'Promocion actualizada' : 'Promocion creada',
    icon: 'success',
    timer: 1500,
    showConfirmButton: false,
  })
  router.push({ name: 'promociones-lista' })
}

onMounted(async () => {
  if (esEdicion.value) {
    const p = await store.fetchPromocion(Number(route.params.id))
    if (p) {
      form.value = {
        nombre: p.nombre,
        descripcion: p.descripcion ?? '',
        tipo: p.tipo,
        valor: p.valor,
        codigo: p.codigo ?? '',
        fechaInicio: p.fechaInicio ?? '',
        fechaFin: p.fechaFin ?? '',
        activa: p.activa,
        usosMaximos: p.usosMaximos ?? 0,
        condiciones: p.condiciones ?? '',
      }
    }
  }
})
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
        <header
          class="flex items-start justify-between mb-10 max-[768px]:flex-col max-[768px]:gap-6"
        >
          <hgroup>
            <h1
              class="text-[2.8rem] font-light text-body dark:text-dk-body tracking-[-0.03em] leading-tight"
            >
              {{ titulo }}
            </h1>
          </hgroup>
          <nav class="flex gap-4 max-[768px]:flex-col max-[768px]:w-full">
            <button
              class="px-8 py-3 text-[1.3rem] font-semibold text-muted dark:text-dk-muted bg-transparent border border-border dark:border-dk-border cursor-pointer hover:text-body dark:hover:text-dk-body transition-colors"
              @click="router.back()"
            >
              Cancelar
            </button>
            <button
              class="px-8 py-3 text-[1.3rem] font-semibold text-white bg-primary border-none cursor-pointer hover:bg-primary-dark transition-colors"
              @click="guardar"
            >
              {{ esEdicion ? 'Guardar Cambios' : 'Crear Promocion' }}
            </button>
          </nav>
        </header>

        <form class="max-w-[64rem] flex flex-col gap-8" @submit.prevent="guardar">
          <section
            class="bg-surface dark:bg-dk-surface border border-border dark:border-dk-border p-10"
          >
            <h2 class="text-[1.6rem] font-bold text-body dark:text-dk-body mb-8">
              Informacion General
            </h2>
            <fieldset class="grid grid-cols-2 gap-6 max-[480px]:grid-cols-1 border-0 p-0 m-0">
              <p class="flex flex-col gap-1.5 col-span-2 max-[480px]:col-span-1">
                <label class="text-[1.2rem] font-medium text-body dark:text-dk-body">Nombre</label>
                <input
                  v-model="form.nombre"
                  type="text"
                  placeholder="Ej: Descuento de temporada"
                  class="px-4 py-3 text-[1.4rem] text-body dark:text-dk-body bg-bg dark:bg-dk-bg border border-border dark:border-dk-border outline-none focus:border-primary transition-colors"
                  :class="{ 'border-red-500': errores.nombre }"
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
                  rows="2"
                  placeholder="Descripcion de la promocion..."
                  class="px-4 py-3 text-[1.4rem] text-body dark:text-dk-body bg-bg dark:bg-dk-bg border border-border dark:border-dk-border outline-none focus:border-primary transition-colors resize-none placeholder:text-muted"
                />
              </p>
              <p class="flex flex-col gap-1.5">
                <label class="text-[1.2rem] font-medium text-body dark:text-dk-body"
                  >Tipo de Descuento</label
                >
                <select
                  v-model="form.tipo"
                  class="px-4 py-3 text-[1.4rem] text-body dark:text-dk-body bg-bg dark:bg-dk-bg border border-border dark:border-dk-border outline-none focus:border-primary transition-colors"
                >
                  <option value="porcentaje">Porcentaje (%)</option>
                  <option value="monto">Monto fijo ($)</option>
                  <option value="gratis">Gratis</option>
                </select>
              </p>
              <p class="flex flex-col gap-1.5">
                <label class="text-[1.2rem] font-medium text-body dark:text-dk-body">Valor</label>
                <input
                  v-model.number="form.valor"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  class="px-4 py-3 text-[1.4rem] text-body dark:text-dk-body bg-bg dark:bg-dk-bg border border-border dark:border-dk-border outline-none focus:border-primary transition-colors"
                  :class="{ 'border-red-500': errores.valor }"
                />
                <span v-if="errores.valor" class="text-[1.1rem] text-red-500">{{
                  errores.valor
                }}</span>
              </p>
              <p class="flex flex-col gap-1.5">
                <label class="text-[1.2rem] font-medium text-body dark:text-dk-body"
                  >Codigo de Cupon</label
                >
                <input
                  v-model="form.codigo"
                  type="text"
                  placeholder="Ej: MANT20"
                  class="px-4 py-3 text-[1.4rem] text-body dark:text-dk-body bg-bg dark:bg-dk-bg border border-border dark:border-dk-border outline-none focus:border-primary transition-colors font-mono"
                />
              </p>
              <p class="flex flex-col gap-1.5">
                <label class="text-[1.2rem] font-medium text-body dark:text-dk-body"
                  >Usos Maximos</label
                >
                <input
                  v-model.number="form.usosMaximos"
                  type="number"
                  min="0"
                  placeholder="0 = ilimitado"
                  class="px-4 py-3 text-[1.4rem] text-body dark:text-dk-body bg-bg dark:bg-dk-bg border border-border dark:border-dk-border outline-none focus:border-primary transition-colors"
                />
              </p>
            </fieldset>
          </section>

          <section
            class="bg-surface dark:bg-dk-surface border border-border dark:border-dk-border p-10"
          >
            <h2 class="text-[1.6rem] font-bold text-body dark:text-dk-body mb-8">
              Vigencia y Condiciones
            </h2>
            <fieldset class="grid grid-cols-2 gap-6 max-[480px]:grid-cols-1 border-0 p-0 m-0">
              <p class="flex flex-col gap-1.5">
                <label class="text-[1.2rem] font-medium text-body dark:text-dk-body"
                  >Fecha Inicio</label
                >
                <input
                  v-model="form.fechaInicio"
                  type="date"
                  class="px-4 py-3 text-[1.4rem] text-body dark:text-dk-body bg-bg dark:bg-dk-bg border border-border dark:border-dk-border outline-none focus:border-primary transition-colors"
                />
              </p>
              <p class="flex flex-col gap-1.5">
                <label class="text-[1.2rem] font-medium text-body dark:text-dk-body"
                  >Fecha Fin</label
                >
                <input
                  v-model="form.fechaFin"
                  type="date"
                  class="px-4 py-3 text-[1.4rem] text-body dark:text-dk-body bg-bg dark:bg-dk-bg border border-border dark:border-dk-border outline-none focus:border-primary transition-colors"
                />
              </p>
              <p class="flex items-center gap-3 col-span-2 max-[480px]:col-span-1">
                <input
                  v-model="form.activa"
                  type="checkbox"
                  id="activa-chk"
                  class="w-5 h-5 accent-primary cursor-pointer"
                />
                <label
                  for="activa-chk"
                  class="text-[1.3rem] font-medium text-body dark:text-dk-body cursor-pointer"
                  >Promocion activa</label
                >
              </p>
              <p class="flex flex-col gap-1.5 col-span-2 max-[480px]:col-span-1">
                <label class="text-[1.2rem] font-medium text-body dark:text-dk-body"
                  >Condiciones</label
                >
                <textarea
                  v-model="form.condiciones"
                  rows="2"
                  placeholder="Condiciones especiales..."
                  class="px-4 py-3 text-[1.4rem] text-body dark:text-dk-body bg-bg dark:bg-dk-bg border border-border dark:border-dk-border outline-none focus:border-primary transition-colors resize-none placeholder:text-muted"
                />
              </p>
            </fieldset>
          </section>
        </form>
      </article>
    </section>
  </main>
</template>

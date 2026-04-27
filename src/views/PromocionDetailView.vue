<script setup lang="ts">
import { ref, inject, onMounted, type Ref } from 'vue'
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

const promo = ref<any>(null)
const loading = ref(true)

const tipoLabel: Record<string, string> = {
  porcentaje: 'Porcentaje',
  monto: 'Monto fijo',
  gratis: 'Gratis',
}

async function eliminar() {
  const { isConfirmed } = await Swal.fire({
    title: 'Eliminar promocion?',
    text: 'Esta accion no se puede deshacer',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#ef4444',
    confirmButtonText: 'Eliminar',
    cancelButtonText: 'Cancelar',
  })
  if (!isConfirmed) return
  const ok = await store.eliminar(promo.value.id)
  if (ok) {
    await Swal.fire({ title: 'Eliminada', icon: 'success', timer: 1200, showConfirmButton: false })
    router.push({ name: 'promociones-lista' })
  }
}

onMounted(async () => {
  const id = Number(route.params.id)
  promo.value = await store.fetchPromocion(id)
  loading.value = false
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
        <p v-if="loading" class="text-[1.4rem] text-muted dark:text-dk-muted">Cargando...</p>
        <template v-else-if="promo">
          <header
            class="flex items-start justify-between mb-10 max-[768px]:flex-col max-[768px]:gap-6"
          >
            <hgroup>
              <h1
                class="text-[2.8rem] font-light text-body dark:text-dk-body tracking-[-0.03em] leading-tight"
              >
                {{ promo.nombre }}
              </h1>
              <p class="text-[1.3rem] text-muted dark:text-dk-muted mt-1">
                Codigo: <strong class="font-mono">{{ promo.codigo || '—' }}</strong>
              </p>
            </hgroup>
            <nav class="flex gap-4 max-[768px]:flex-col max-[768px]:w-full">
              <button
                class="px-8 py-3 text-[1.3rem] font-semibold text-muted dark:text-dk-muted bg-transparent border border-border dark:border-dk-border cursor-pointer hover:text-body dark:hover:text-dk-body transition-colors"
                @click="router.push({ name: 'promociones-lista' })"
              >
                Volver
              </button>
              <button
                class="px-8 py-3 text-[1.3rem] font-semibold text-white bg-primary border-none cursor-pointer hover:bg-primary-dark transition-colors"
                @click="router.push({ name: 'promociones-editar', params: { id: promo.id } })"
              >
                Editar
              </button>
              <button
                class="px-8 py-3 text-[1.3rem] font-semibold text-white bg-red-500 border-none cursor-pointer hover:bg-red-600 transition-colors"
                @click="eliminar"
              >
                Eliminar
              </button>
            </nav>
          </header>

          <section
            class="max-w-[64rem] bg-surface dark:bg-dk-surface border border-border dark:border-dk-border p-10"
          >
            <dl class="grid grid-cols-2 gap-x-12 gap-y-6 max-[480px]:grid-cols-1">
              <div>
                <dt
                  class="text-[1.15rem] font-semibold text-muted dark:text-dk-muted uppercase tracking-wider mb-1"
                >
                  Tipo
                </dt>
                <dd class="text-[1.4rem] text-body dark:text-dk-body">
                  {{ tipoLabel[promo.tipo] ?? promo.tipo }}
                </dd>
              </div>
              <div>
                <dt
                  class="text-[1.15rem] font-semibold text-muted dark:text-dk-muted uppercase tracking-wider mb-1"
                >
                  Valor
                </dt>
                <dd class="text-[1.4rem] text-body dark:text-dk-body">
                  {{ promo.tipo === 'porcentaje' ? promo.valor + '%' : '$' + promo.valor }}
                </dd>
              </div>
              <div>
                <dt
                  class="text-[1.15rem] font-semibold text-muted dark:text-dk-muted uppercase tracking-wider mb-1"
                >
                  Estado
                </dt>
                <dd class="text-[1.4rem]">
                  <span
                    :class="promo.activa ? 'text-green-500' : 'text-red-500'"
                    class="font-semibold"
                    >{{ promo.activa ? 'Activa' : 'Inactiva' }}</span
                  >
                </dd>
              </div>
              <div>
                <dt
                  class="text-[1.15rem] font-semibold text-muted dark:text-dk-muted uppercase tracking-wider mb-1"
                >
                  Usos
                </dt>
                <dd class="text-[1.4rem] text-body dark:text-dk-body">
                  {{ promo.usosActuales ?? 0 }} / {{ promo.usosMaximos || '∞' }}
                </dd>
              </div>
              <div>
                <dt
                  class="text-[1.15rem] font-semibold text-muted dark:text-dk-muted uppercase tracking-wider mb-1"
                >
                  Fecha Inicio
                </dt>
                <dd class="text-[1.4rem] text-body dark:text-dk-body">
                  {{ promo.fechaInicio || '—' }}
                </dd>
              </div>
              <div>
                <dt
                  class="text-[1.15rem] font-semibold text-muted dark:text-dk-muted uppercase tracking-wider mb-1"
                >
                  Fecha Fin
                </dt>
                <dd class="text-[1.4rem] text-body dark:text-dk-body">
                  {{ promo.fechaFin || '—' }}
                </dd>
              </div>
              <div class="col-span-2 max-[480px]:col-span-1">
                <dt
                  class="text-[1.15rem] font-semibold text-muted dark:text-dk-muted uppercase tracking-wider mb-1"
                >
                  Descripcion
                </dt>
                <dd class="text-[1.4rem] text-body dark:text-dk-body">
                  {{ promo.descripcion || '—' }}
                </dd>
              </div>
              <div class="col-span-2 max-[480px]:col-span-1">
                <dt
                  class="text-[1.15rem] font-semibold text-muted dark:text-dk-muted uppercase tracking-wider mb-1"
                >
                  Condiciones
                </dt>
                <dd class="text-[1.4rem] text-body dark:text-dk-body">
                  {{ promo.condiciones || '—' }}
                </dd>
              </div>
            </dl>
          </section>
        </template>
        <p v-else class="text-[1.4rem] text-red-500">Promocion no encontrada.</p>
      </article>
    </section>
  </main>
</template>

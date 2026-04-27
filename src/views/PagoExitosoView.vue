<script setup lang="ts">
import { ref, onMounted, inject, type Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePagosStore } from '@/stores/pagos'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppTopbar from '@/components/layout/AppTopbar.vue'

const route = useRoute()
const router = useRouter()
const pagosStore = usePagosStore()

const collapsed = inject<Ref<boolean>>('sidebarCollapsed')!
const darkMode = inject<Ref<boolean>>('darkMode')!

const ordenId = Number(route.params.id)
const pdfUrl = ref<string | null>(null)

onMounted(async () => {
  const blob = await pagosStore.descargarTicket(ordenId)
  if (blob) pdfUrl.value = URL.createObjectURL(blob)
})

function descargar() {
  pagosStore.guardarTicketPDF(ordenId)
}

function imprimir() {
  if (pdfUrl.value) window.open(pdfUrl.value, '_blank')
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

      <article
        class="flex-1 px-12 py-10 max-[768px]:px-5 max-[768px]:py-6 flex items-start justify-center"
      >
        <section
          class="w-full max-w-[80rem] bg-surface dark:bg-dk-surface border border-border dark:border-dk-border p-12 flex flex-col items-center"
        >
          <!-- Icono éxito -->
          <div
            class="w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-8"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="3"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="text-green-600"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <h1 class="text-[3.2rem] font-light text-body dark:text-dk-body text-center mb-3">
            ¡Pago exitoso!
          </h1>
          <p class="text-[1.5rem] text-muted dark:text-dk-muted text-center mb-2">
            Tu orden <strong>#{{ ordenId }}</strong> fue creada y está lista.
          </p>
          <p class="text-[1.3rem] text-muted dark:text-dk-muted text-center mb-10">
            Puedes imprimir o descargar el ticket con el detalle del pago.
          </p>

          <!-- Preview PDF -->
          <div
            v-if="pdfUrl"
            class="w-full max-w-[50rem] h-[60rem] border border-border dark:border-dk-border mb-8"
          >
            <iframe :src="pdfUrl" class="w-full h-full" title="Ticket PDF"></iframe>
          </div>
          <div v-else class="text-muted dark:text-dk-muted mb-8">Generando ticket...</div>

          <nav class="flex gap-4 flex-wrap justify-center">
            <button
              class="px-8 py-3 text-[1.3rem] font-semibold text-white bg-primary border-none cursor-pointer hover:bg-primary-dark transition-colors"
              @click="descargar"
            >
              Descargar PDF
            </button>
            <button
              class="px-8 py-3 text-[1.3rem] font-semibold text-body dark:text-dk-body bg-transparent border border-border dark:border-dk-border cursor-pointer hover:bg-bg dark:hover:bg-dk-bg transition-colors"
              @click="imprimir"
            >
              Imprimir / Abrir
            </button>
            <button
              class="px-8 py-3 text-[1.3rem] font-semibold text-body dark:text-dk-body bg-transparent border border-border dark:border-dk-border cursor-pointer hover:bg-bg dark:hover:bg-dk-bg transition-colors"
              @click="router.push({ name: 'ordenes-detalle', params: { id: ordenId } })"
            >
              Ver Orden
            </button>
            <button
              class="px-8 py-3 text-[1.3rem] font-semibold text-body dark:text-dk-body bg-transparent border border-border dark:border-dk-border cursor-pointer hover:bg-bg dark:hover:bg-dk-bg transition-colors"
              @click="router.push({ name: 'ordenes-lista' })"
            >
              Ir a Órdenes
            </button>
          </nav>
        </section>
      </article>
    </section>
  </main>
</template>

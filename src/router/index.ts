import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { guest: true },
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/views/DashboardView.vue'),
      meta: { requiresAuth: true },
    },
    // Ordenes
    {
      path: '/ordenes',
      name: 'ordenes-lista',
      component: () => import('@/views/OrdenesListView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/ordenes/crear',
      name: 'ordenes-crear',
      component: () => import('@/views/OrdenFormView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/ordenes/:id',
      name: 'ordenes-detalle',
      component: () => import('@/views/OrdenDetailView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/ordenes/:id/editar',
      name: 'ordenes-editar',
      component: () => import('@/views/OrdenFormView.vue'),
      meta: { requiresAuth: true },
    },
    // Vehiculos
    {
      path: '/vehiculos',
      name: 'vehiculos-lista',
      component: () => import('@/views/VehiculosListView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/vehiculos/crear',
      name: 'vehiculos-crear',
      component: () => import('@/views/VehiculoFormView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/vehiculos/:id',
      name: 'vehiculos-detalle',
      component: () => import('@/views/VehiculoDetailView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/vehiculos/:id/editar',
      name: 'vehiculos-editar',
      component: () => import('@/views/VehiculoFormView.vue'),
      meta: { requiresAuth: true },
    },
    // Clientes
    {
      path: '/clientes',
      name: 'clientes-lista',
      component: () => import('@/views/ClientesListView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/clientes/crear',
      name: 'clientes-crear',
      component: () => import('@/views/ClienteFormView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/clientes/:id',
      name: 'clientes-detalle',
      component: () => import('@/views/ClienteDetailView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/clientes/:id/editar',
      name: 'clientes-editar',
      component: () => import('@/views/ClienteFormView.vue'),
      meta: { requiresAuth: true },
    },
    // Inventario
    {
      path: '/inventario',
      name: 'inventario-lista',
      component: () => import('@/views/InventarioListView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/inventario/crear',
      name: 'inventario-crear',
      component: () => import('@/views/InventarioFormView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/inventario/:id',
      name: 'inventario-detalle',
      component: () => import('@/views/InventarioDetailView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/inventario/:id/editar',
      name: 'inventario-editar',
      component: () => import('@/views/InventarioFormView.vue'),
      meta: { requiresAuth: true },
    },
    // Servicios
    {
      path: '/servicios',
      name: 'servicios-lista',
      component: () => import('@/views/ServiciosListView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/servicios/crear',
      name: 'servicios-crear',
      component: () => import('@/views/ServicioFormView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/servicios/:id',
      name: 'servicios-detalle',
      component: () => import('@/views/ServicioDetailView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/servicios/:id/editar',
      name: 'servicios-editar',
      component: () => import('@/views/ServicioFormView.vue'),
      meta: { requiresAuth: true },
    },
    // Promociones
    {
      path: '/promociones',
      name: 'promociones-lista',
      component: () => import('@/views/PromocionesListView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/promociones/crear',
      name: 'promociones-crear',
      component: () => import('@/views/PromocionFormView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/promociones/:id',
      name: 'promociones-detalle',
      component: () => import('@/views/PromocionDetailView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/promociones/:id/editar',
      name: 'promociones-editar',
      component: () => import('@/views/PromocionFormView.vue'),
      meta: { requiresAuth: true },
    },
    // Reportes y Configuracion
    {
      path: '/reportes',
      name: 'reportes',
      component: () => import('@/views/ReportesView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/usuarios',
      name: 'usuarios-lista',
      component: () => import('@/views/UsuariosListView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/usuarios/crear',
      name: 'usuarios-crear',
      component: () => import('@/views/UsuarioFormView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/usuarios/:id',
      name: 'usuarios-detalle',
      component: () => import('@/views/UsuarioDetailView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/usuarios/:id/editar',
      name: 'usuarios-editar',
      component: () => import('@/views/UsuarioFormView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/configuracion',
      name: 'configuracion',
      component: () => import('@/views/SettingsView.vue'),
      meta: { requiresAuth: true },
    },
    // Pagos
    {
      path: '/checkout',
      name: 'checkout',
      component: () => import('@/views/CheckoutView.vue'),
      meta: { requiresAuth: true, rol: 'cliente' },
    },
    {
      path: '/pago-exitoso/:id',
      name: 'pago-exitoso',
      component: () => import('@/views/PagoExitosoView.vue'),
      meta: { requiresAuth: true },
    },
    // Portal clientes
    {
      path: '/cliente',
      redirect: { name: 'cliente-ordenes' },
    },
    {
      path: '/cliente/mis-ordenes',
      name: 'cliente-ordenes',
      component: () => import('@/views/MisOrdenesView.vue'),
      meta: { requiresAuth: true, rol: 'cliente' },
    },
    {
      path: '/cliente/mis-ordenes/:id',
      name: 'cliente-ordenes-detalle',
      component: () => import('@/views/ClienteOrdenDetailView.vue'),
      meta: { requiresAuth: true, rol: 'cliente' },
    },
    {
      path: '/cliente/mis-carros',
      name: 'cliente-carros',
      component: () => import('@/views/MisCarrosView.vue'),
      meta: { requiresAuth: true, rol: 'cliente' },
    },
    {
      path: '/cliente/mis-carros/:id',
      name: 'cliente-carros-detalle',
      component: () => import('@/views/ClienteVehiculoDetailView.vue'),
      meta: { requiresAuth: true, rol: 'cliente' },
    },
    // Portal mecanicos
    {
      path: '/mecanico',
      redirect: { name: 'mecanico-trabajos' },
    },
    {
      path: '/mecanico/mis-trabajos',
      name: 'mecanico-trabajos',
      component: () => import('@/views/MecanicoTrabajosView.vue'),
      meta: { requiresAuth: true, rol: 'mecanico' },
    },
    {
      path: '/mecanico/mis-trabajos/:id',
      name: 'mecanico-trabajos-detalle',
      component: () => import('@/views/MecanicoOrdenDetailView.vue'),
      meta: { requiresAuth: true, rol: 'mecanico' },
    },
    // Portal recepcionista
    {
      path: '/recepcionista',
      redirect: { name: 'recepcionista-dashboard' },
    },
    {
      path: '/recepcionista/dashboard',
      name: 'recepcionista-dashboard',
      component: () => import('@/views/DashboardView.vue'),
      meta: { requiresAuth: true, rol: 'recepcionista' },
    },
    // Ordenes recepcionista
    {
      path: '/recepcionista/ordenes',
      name: 'recepcionista-ordenes',
      component: () => import('@/views/OrdenesListView.vue'),
      meta: { requiresAuth: true, rol: 'recepcionista' },
    },
    {
      path: '/recepcionista/ordenes/crear',
      name: 'recepcionista-ordenes-crear',
      component: () => import('@/views/OrdenFormView.vue'),
      meta: { requiresAuth: true, rol: 'recepcionista' },
    },
    {
      path: '/recepcionista/ordenes/:id',
      name: 'recepcionista-ordenes-detalle',
      component: () => import('@/views/OrdenDetailView.vue'),
      meta: { requiresAuth: true, rol: 'recepcionista' },
    },
    {
      path: '/recepcionista/ordenes/:id/editar',
      name: 'recepcionista-ordenes-editar',
      component: () => import('@/views/OrdenFormView.vue'),
      meta: { requiresAuth: true, rol: 'recepcionista' },
    },
    // Vehiculos recepcionista
    {
      path: '/recepcionista/vehiculos',
      name: 'recepcionista-vehiculos',
      component: () => import('@/views/VehiculosListView.vue'),
      meta: { requiresAuth: true, rol: 'recepcionista' },
    },
    {
      path: '/recepcionista/vehiculos/crear',
      name: 'recepcionista-vehiculos-crear',
      component: () => import('@/views/VehiculoFormView.vue'),
      meta: { requiresAuth: true, rol: 'recepcionista' },
    },
    {
      path: '/recepcionista/vehiculos/:id',
      name: 'recepcionista-vehiculos-detalle',
      component: () => import('@/views/VehiculoDetailView.vue'),
      meta: { requiresAuth: true, rol: 'recepcionista' },
    },
    {
      path: '/recepcionista/vehiculos/:id/editar',
      name: 'recepcionista-vehiculos-editar',
      component: () => import('@/views/VehiculoFormView.vue'),
      meta: { requiresAuth: true, rol: 'recepcionista' },
    },
    // Clientes recepcionista
    {
      path: '/recepcionista/clientes',
      name: 'recepcionista-clientes',
      component: () => import('@/views/ClientesListView.vue'),
      meta: { requiresAuth: true, rol: 'recepcionista' },
    },
    {
      path: '/recepcionista/clientes/crear',
      name: 'recepcionista-clientes-crear',
      component: () => import('@/views/ClienteFormView.vue'),
      meta: { requiresAuth: true, rol: 'recepcionista' },
    },
    {
      path: '/recepcionista/clientes/:id',
      name: 'recepcionista-clientes-detalle',
      component: () => import('@/views/ClienteDetailView.vue'),
      meta: { requiresAuth: true, rol: 'recepcionista' },
    },
    {
      path: '/recepcionista/clientes/:id/editar',
      name: 'recepcionista-clientes-editar',
      component: () => import('@/views/ClienteFormView.vue'),
      meta: { requiresAuth: true, rol: 'recepcionista' },
    },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()

  if (to.meta.requiresAuth && !auth.isAuthenticated) return { name: 'login' }
  if (to.meta.guest && auth.isAuthenticated) {
    // Redirigir según rol
    if (auth.isCliente) return { name: 'cliente-ordenes' }
    if (auth.rol === 'mecanico') return { name: 'mecanico-trabajos' }
    if (auth.rol === 'recepcionista') return { name: 'recepcionista-dashboard' }
    return { name: 'dashboard' }
  }

  if (auth.isAuthenticated) {
    // Cliente intentando acceder a rutas de personal → su portal
    if (auth.isCliente && to.meta.rol !== 'cliente' && to.name !== 'login') {
      return { name: 'cliente-ordenes' }
    }
    // Mecanico intentando acceder a otras rutas → sus trabajos
    if (auth.rol === 'mecanico' && to.meta.rol !== 'mecanico' && to.name !== 'login') {
      return { name: 'mecanico-trabajos' }
    }
    // Recepcionista intentando acceder a otras rutas → su dashboard
    if (auth.rol === 'recepcionista' && to.meta.rol !== 'recepcionista' && to.name !== 'login') {
      return { name: 'recepcionista-dashboard' }
    }
    // Personal (admin) intentando acceder a rutas de clientes, mecanicos o recepcionista → dashboard
    if (!auth.isCliente && auth.rol !== 'mecanico' && auth.rol !== 'recepcionista' && 
        (to.meta.rol === 'cliente' || to.meta.rol === 'mecanico' || to.meta.rol === 'recepcionista')) {
      return { name: 'dashboard' }
    }
  }
})

export default router

import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Layout } from '../components/layout/Layout';
import { StatsCards } from '../components/dashboard/StatsCards';
import { VentasChart } from '../components/dashboard/VentasChart';
import { TopProductos } from '../components/dashboard/TopProductos';
import { RecentSales } from '../components/dashboard/RecentSales';
import { AlertsPanel } from '../components/dashboard/AlertsPanel';
import { reportesAPI } from '../api/reportes';
import toast from 'react-hot-toast';
import { RefreshCw } from 'lucide-react';

export const Dashboard = () => {
  const { user } = useAuth();

  console.log('📊 Dashboard montado');
  console.log('   Usuario desde contexto:', user?.username || 'sin usuario');
  console.log('   Token en localStorage:', localStorage.getItem('access_token') ? 'SÍ' : 'NO');

  // Estados
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    ventasHoy: 0,
    gananciaHoy: 0,
    productosEnStock: 0,
    porVencer: 0,
  });
  const [ventasChart, setVentasChart] = useState([]);
  const [topProductos, setTopProductos] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [alertas, setAlertas] = useState({
    bajoStock: [],
    porVencer: [],
    vencidos: [],
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      console.log('📊 Cargando datos del Dashboard...');
      console.log('   Token disponible:', localStorage.getItem('access_token') ? 'SÍ' : 'NO');

      // Cargar resumen primero
      const resumenResponse = await reportesAPI.getDashboardResumen();

      console.log('📊 Resumen recibido en Dashboard:', resumenResponse);

      // Establecer estadísticas
      if (resumenResponse.success && resumenResponse.data) {
        const statsData = {
          ventasHoy: resumenResponse.data.stats?.ventasHoy || 0,
          gananciaHoy: resumenResponse.data.stats?.gananciaHoy || 0,
          productosEnStock: resumenResponse.data.stats?.productosEnStock || 0,
          porVencer: resumenResponse.data.stats?.porVencer || 0,
        };

        setStats(statsData);
        setAlertas(resumenResponse.data.alertas || {});

        console.log('📈 Stats actualizados:', statsData);
      }

      // Cargar otros datos en paralelo
      const [ventasChartResponse, topProductosResponse] = await Promise.all([
        reportesAPI.getVentasUltimos7Dias(),
        reportesAPI.getTopProductos(10),
      ]);

      console.log('✅ Datos cargados:', {
        ventasChart: ventasChartResponse,
        topProductos: topProductosResponse,
      });

      // Establecer gráfico de ventas
      if (ventasChartResponse.success && ventasChartResponse.data) {
        setVentasChart(ventasChartResponse.data);
      }

      // Establecer top productos
      if (topProductosResponse.success && topProductosResponse.data) {
        setTopProductos(topProductosResponse.data);
      }

      // Establecer últimas ventas desde el resumen
      if (resumenResponse.data?.todasVentas) {
        const ultimas = resumenResponse.data.todasVentas
          .slice()
          .sort((a, b) => {
            const fechaA = new Date(a.fecha_venta || a.fecha || a.created_at);
            const fechaB = new Date(b.fecha_venta || b.fecha || b.created_at);
            return fechaB - fechaA;
          })
          .slice(0, 10);

        console.log('📋 Últimas 10 ventas:', ultimas);
        setRecentSales(ultimas);
      }
    } catch (error) {
      console.error('❌ Error cargando datos del dashboard:', error);
      toast.error('Error al cargar datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadDashboardData();
    toast.success('Datos actualizados');
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-8 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">Dashboard</h1>
            <p className="text-gray-600">
              Bienvenido, <span className="font-semibold text-primary-600">{user?.nombre_completo}</span>
            </p>
            <p className="text-sm text-gray-500 capitalize mt-0.5">Rol: {user?.rol}</p>
          </div>

          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="text-sm font-medium">Recargar</span>
          </button>
        </div>

        {/* Tarjetas de Estadísticas */}
        <StatsCards stats={stats} />

        {/* Grid Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna Izquierda - 2/3 del ancho */}
          <div className="lg:col-span-2 space-y-6">
            {/* Gráfico de Ventas */}
            <VentasChart data={ventasChart} />

            {/* Top Productos */}
            <TopProductos productos={topProductos} />

            {/* Últimas Ventas */}
            <RecentSales ventas={recentSales} />
          </div>

          {/* Columna Derecha - 1/3 del ancho */}
          <div className="space-y-6">
            {/* Panel de Alertas */}
            <AlertsPanel alertas={alertas} />

            {/* Accesos Rápidos */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Accesos Rápidos</h3>

              <div className="space-y-3">
                {user?.rol !== 'bodeguero' && (
                  <a
                    href="/pos"
                    className="w-full flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200 group"
                  >
                    <div className="bg-blue-600 p-2 rounded-lg group-hover:scale-110 transition-transform duration-200">
                      <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-medium text-gray-900">Punto de Venta</p>
                      <p className="text-xs text-gray-600">Procesar ventas</p>
                    </div>
                  </a>
                )}

                {(user?.rol === 'admin' || user?.rol === 'bodeguero') && (
                  <>
                    <a
                      href="/productos"
                      className="w-full flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors duration-200 group"
                    >
                      <div className="bg-green-600 p-2 rounded-lg group-hover:scale-110 transition-transform duration-200">
                        <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                      <div className="text-left flex-1">
                        <p className="font-medium text-gray-900">Productos</p>
                        <p className="text-xs text-gray-600">Gestionar inventario</p>
                      </div>
                    </a>

                    <a
                      href="/lotes"
                      className="w-full flex items-center gap-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors duration-200 group"
                    >
                      <div className="bg-purple-600 p-2 rounded-lg group-hover:scale-110 transition-transform duration-200">
                        <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="text-left flex-1">
                        <p className="font-medium text-gray-900">Lotes</p>
                        <p className="text-xs text-gray-600">Gestionar vencimientos</p>
                      </div>
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

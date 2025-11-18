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
import { RefreshCw, CheckCircle, X } from 'lucide-react';

export const Dashboard = () => {
  const { user } = useAuth();

  console.log('📊 Dashboard montado');
  console.log('   Usuario desde contexto:', user?.username || 'sin usuario');
  console.log('   Token en localStorage:', localStorage.getItem('access_token') ? 'SÍ' : 'NO');

  // Estados
  const [loading, setLoading] = useState(true);
  const [showUpdatedBadge, setShowUpdatedBadge] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
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

  // Detectar si acaba de hacer login (primera carga)
  useEffect(() => {
    const justLoggedIn = sessionStorage.getItem('justLoggedIn');
    if (justLoggedIn === 'true') {
      setShowWelcome(true);
      sessionStorage.removeItem('justLoggedIn');

      // Ocultar después de 3 segundos
      setTimeout(() => setShowWelcome(false), 3000);
    }
  }, []);

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

      // Cargar gráfico de ventas
      const ventasChartResponse = await reportesAPI.getVentasUltimos7Dias();

      console.log('✅ Datos cargados:', {
        ventasChart: ventasChartResponse,
      });

      // Establecer gráfico de ventas
      if (ventasChartResponse.success && ventasChartResponse.data) {
        setVentasChart(ventasChartResponse.data);
      }

      // Establecer últimas ventas desde el resumen y calcular top productos
      if (resumenResponse.data?.todasVentas) {
        const todasLasVentas = resumenResponse.data.todasVentas;

        const ultimas = todasLasVentas
          .slice()
          .sort((a, b) => {
            const fechaA = new Date(a.fecha_venta || a.fecha || a.created_at);
            const fechaB = new Date(b.fecha_venta || b.fecha || b.created_at);
            return fechaB - fechaA;
          })
          .slice(0, 10);

        console.log('📋 Últimas 10 ventas:', ultimas);
        setRecentSales(ultimas);

        // Calcular top productos desde las ventas
        const productosMap = {};

        todasLasVentas.forEach(venta => {
          if (venta.detalles && Array.isArray(venta.detalles)) {
            venta.detalles.forEach(detalle => {
              const key = detalle.producto_id || detalle.producto?.id;

              if (key && !productosMap[key]) {
                productosMap[key] = {
                  producto_id: key,
                  nombre: detalle.producto?.nombre || detalle.producto_nombre || 'Producto Sin Nombre',
                  codigo_barras: detalle.producto?.codigo_barras || 'N/A',
                  cantidadVendida: 0,
                  totalVendido: 0
                };
              }

              if (key) {
                productosMap[key].cantidadVendida += parseInt(detalle.cantidad) || 0;
                productosMap[key].totalVendido += parseFloat(detalle.subtotal_final || detalle.subtotal) || 0;
              }
            });
          }
        });

        // Convertir a array y ordenar por cantidad vendida
        const topProductosArray = Object.values(productosMap)
          .sort((a, b) => b.cantidadVendida - a.cantidadVendida)
          .slice(0, 10);

        // Calcular porcentajes para la barra de progreso
        const maxCantidad = topProductosArray[0]?.cantidadVendida || 1;
        const topProductosConPorcentaje = topProductosArray.map(producto => ({
          ...producto,
          porcentaje: (producto.cantidadVendida / maxCantidad) * 100
        }));

        console.log('📊 Top 10 Productos calculados:', topProductosConPorcentaje);
        setTopProductos(topProductosConPorcentaje);
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
    setShowUpdatedBadge(true);
    setTimeout(() => setShowUpdatedBadge(false), 2000);
  };

  const handleFilterChange = async (fechaInicio, fechaFin) => {
    try {
      setLoading(true);
      console.log(`📅 Filtrando ventas: ${fechaInicio} a ${fechaFin}`);

      const ventasResponse = await reportesAPI.getVentasPorFecha(fechaInicio, fechaFin);

      if (ventasResponse.success) {
        setRecentSales(ventasResponse.data);
        console.log(`✅ ${ventasResponse.data.length} ventas filtradas`);
      }
    } catch (error) {
      console.error('Error al filtrar ventas:', error);
      toast.error('Error al filtrar ventas');
    } finally {
      setLoading(false);
    }
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
          </div>

          <div className="flex items-center gap-3">
            {/* Notificación de bienvenida (extremo derecho) */}
            {showWelcome && (
              <div className="flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2.5 rounded-lg shadow-md animate-fade-in">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">¡Bienvenido, {user?.nombre_completo}!</span>
                <button
                  onClick={() => setShowWelcome(false)}
                  className="ml-2 text-green-600 hover:text-green-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Badge "Datos actualizados" */}
            {showUpdatedBadge && (
              <div className="flex items-center gap-2 bg-green-100 text-green-700 px-3 py-2 rounded-lg animate-fade-in">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Datos actualizados</span>
              </div>
            )}

            {/* Botón Recargar */}
            <button
              onClick={handleRefresh}
              className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="text-sm font-medium">Recargar</span>
            </button>
          </div>
        </div>

        {/* Row 1: Tarjetas de Estadísticas */}
        <StatsCards stats={stats} />

        {/* Row 2: Gráfico (66%) + Alertas (33%) - Misma altura */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <div className="h-[450px]">
              <VentasChart data={ventasChart} />
            </div>
          </div>
          <div className="lg:col-span-1">
            <div className="h-[450px]">
              <AlertsPanel alertas={alertas} />
            </div>
          </div>
        </div>

        {/* Row 3: Top 10 Productos - FULL WIDTH */}
        <div className="w-full mb-6">
          <TopProductos productos={topProductos} />
        </div>

        {/* Row 4: Últimas Ventas - FULL WIDTH (fuera del grid) */}
        <div className="w-full">
          <RecentSales ventas={recentSales} onFilterChange={handleFilterChange} />
        </div>
      </div>
    </Layout>
  );
};

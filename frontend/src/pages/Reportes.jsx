import { useState, useEffect } from 'react';
import { FileText, TrendingUp, Package, DollarSign, FileDown, FileSpreadsheet, BarChart3 } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { SalesReport } from '../components/reportes/SalesReport';
import { InventoryReport } from '../components/reportes/InventoryReport';
import { ProfitReport } from '../components/reportes/ProfitReport';
import { toast } from 'react-hot-toast';
import axiosInstance from '../api/axios';
import { format } from 'date-fns';
import { useAuth } from '../hooks/useAuth';

const Reportes = () => {
  const { user } = useAuth(); // FASE 7: Obtener rol del usuario
  const [tipoReporte, setTipoReporte] = useState('ventas'); // ventas, inventario, ganancias
  const [fechaInicio, setFechaInicio] = useState(() => {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - 7);
    return format(fecha, 'yyyy-MM-dd');
  });
  const [fechaFin, setFechaFin] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(false);
  const [salesData, setSalesData] = useState(null);

  // FASE 7: Estados para filtro de vendedor
  const [vendedorSeleccionado, setVendedorSeleccionado] = useState('todos');
  const [vendedores, setVendedores] = useState([]);

  // FASE 7: Cargar lista de vendedores al montar (solo admin)
  useEffect(() => {
    if (user?.rol === 'admin') {
      loadVendedores();
    }
  }, [user]);

  // Cargar reporte automáticamente cuando cambian los filtros
  useEffect(() => {
    if (tipoReporte === 'ventas' || tipoReporte === 'ganancias') {
      loadSalesReport();
    }
  }, [tipoReporte, fechaInicio, fechaFin, vendedorSeleccionado]);

  const loadVendedores = async () => {
    try {
      const response = await axiosInstance.get('/usuarios');
      if (response.data?.success) {
        // El endpoint devuelve 'usuarios' no 'data'
        const vendedoresList = response.data.usuarios.filter(u => u.rol === 'vendedor' || u.rol === 'admin');

        // Eliminar duplicados por ID (por si hay usuarios duplicados en BD)
        const vendedoresUnicos = vendedoresList.reduce((acc, vendedor) => {
          if (!acc.find(v => v.id === vendedor.id)) {
            acc.push(vendedor);
          }
          return acc;
        }, []);

        setVendedores(vendedoresUnicos);
        console.log('✅ Vendedores cargados:', vendedoresUnicos);
      }
    } catch (error) {
      console.error('Error cargando vendedores:', error);
    }
  };

  const loadSalesReport = async () => {
    try {
      setLoading(true);

      // FASE 7: Construir params con filtro de vendedor opcional
      const params = {
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin
      };

      // Si hay un vendedor específico seleccionado, agregarlo
      if (vendedorSeleccionado !== 'todos') {
        params.vendedor_id = vendedorSeleccionado;
      }

      // Obtener reporte de ventas del backend
      const response = await axiosInstance.get('/ventas/reportes/resumen', { params });

      if (response.data?.success) {
        setSalesData(response.data.data);
      } else {
        toast.error('No se pudo cargar el reporte');
      }
    } catch (error) {
      console.error('Error cargando reporte:', error);
      toast.error('Error al cargar el reporte de ventas');
      setSalesData(null);
    } finally {
      setLoading(false);
    }
  };

  const exportarPDF = async () => {
    try {
      // FASE 7: Incluir vendedor_id en params si está seleccionado
      const params = {
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin
      };

      if (vendedorSeleccionado !== 'todos') {
        params.vendedor_id = vendedorSeleccionado;
      }

      toast.loading('Generando PDF con gráficos...', { id: 'pdf-loading' });

      const response = await axiosInstance.get('/ventas/reportes/pdf', {
        params,
        responseType: 'blob',
        timeout: 60000 // 60 segundos para generar gráficos
      });

      toast.dismiss('pdf-loading');

      // Crear enlace de descarga
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reporte_${tipoReporte}_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('PDF descargado exitosamente');
    } catch (error) {
      toast.dismiss('pdf-loading');
      console.error('❌ ERROR EXPORTANDO PDF:', error);

      if (error.code === 'ECONNABORTED') {
        toast.error('La generación del PDF está tomando más tiempo de lo esperado. Por favor intenta nuevamente.', { duration: 5000 });
      } else if (error.response?.status === 500) {
        toast.error('Error en el servidor al generar PDF. Verifica que haya datos en el rango seleccionado.', { duration: 5000 });
      } else {
        toast.error('Error al exportar PDF. Verifica tu conexión e intenta nuevamente.');
      }
    }
  };

  const exportarExcel = async () => {
    try {
      // FASE 7: Incluir vendedor_id en params si está seleccionado
      const params = {
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin
      };

      if (vendedorSeleccionado !== 'todos') {
        params.vendedor_id = vendedorSeleccionado;
      }

      toast.loading('Generando Excel...', { id: 'excel-loading' });

      const response = await axiosInstance.get('/ventas/reportes/excel', {
        params,
        responseType: 'blob',
        timeout: 60000 // 60 segundos para generar el archivo
      });

      toast.dismiss('excel-loading');

      // Crear enlace de descarga
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reporte_${tipoReporte}_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Excel descargado exitosamente');
    } catch (error) {
      toast.dismiss('excel-loading');
      console.error('❌ ERROR EXPORTANDO EXCEL:', error);

      if (error.code === 'ECONNABORTED') {
        toast.error('La generación del Excel está tomando más tiempo de lo esperado. Por favor intenta nuevamente.', { duration: 5000 });
      } else if (error.response?.status === 500) {
        toast.error('Error en el servidor al generar Excel. Verifica que haya datos en el rango seleccionado.', { duration: 5000 });
      } else {
        toast.error('Error al exportar Excel. Verifica tu conexión e intenta nuevamente.');
      }
    }
  };

  const tabs = [
    { id: 'ventas', label: 'Ventas', icon: TrendingUp },
    { id: 'inventario', label: 'Inventario', icon: Package },
    { id: 'ganancias', label: 'Ganancias', icon: DollarSign },
  ];

  // Determinar si hay datos para mostrar botones de exportación
  const tieneDatos = (tipoReporte === 'ventas' && salesData) ||
                     tipoReporte === 'inventario' ||
                     tipoReporte === 'ganancias';

  return (
    <Layout>
      <div className="p-4 lg:p-6">
        {/* Header Simplificado con botones de exportación */}
        <div className="mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Reportes y Analytics
                </h1>
                <p className="text-sm text-gray-600">
                  Visualiza y analiza los datos de tu negocio
                </p>
              </div>
            </div>

            {/* Botones de exportación (solo aparecen si hay datos) */}
            {tieneDatos && (
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={exportarPDF}
                  className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all flex items-center gap-2 shadow-md transform hover:scale-105"
                >
                  <FileDown className="w-4 h-4" />
                  <span className="text-sm font-medium">Exportar PDF</span>
                </button>
                <button
                  onClick={exportarExcel}
                  className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all flex items-center gap-2 shadow-md transform hover:scale-105"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span className="text-sm font-medium">Exportar Excel</span>
                </button>
              </div>
            )}
          </div>
          {/* Línea decorativa con gradiente */}
          <div className="h-0.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 rounded-full"></div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 border-2 border-gray-200">
          <div className={`grid gap-4 ${tipoReporte === 'inventario' ? 'grid-cols-1 md:grid-cols-1' : user?.rol === 'admin' ? 'grid-cols-1 md:grid-cols-4' : 'grid-cols-1 md:grid-cols-3'}`}>
            {/* Tipo de Reporte */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Reporte
              </label>
              <select
                value={tipoReporte}
                onChange={(e) => setTipoReporte(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="ventas">Ventas</option>
                <option value="inventario">Inventario</option>
                <option value="ganancias">Ganancias</option>
              </select>
            </div>

            {/* FASE 7: Filtro por Vendedor (solo admin) */}
            {user?.rol === 'admin' && tipoReporte !== 'inventario' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vendedor
                </label>
                <select
                  value={vendedorSeleccionado}
                  onChange={(e) => setVendedorSeleccionado(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="todos">Todos los vendedores</option>
                  {vendedores.map(v => (
                    <option key={v.id} value={v.id}>{v.nombre_completo}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Fecha Inicio - ocultar si es inventario */}
            {tipoReporte !== 'inventario' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Inicio
                </label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}

            {/* Fecha Fin - ocultar si es inventario */}
            {tipoReporte !== 'inventario' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Fin
                </label>
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6 border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = tipoReporte === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setTipoReporte(tab.id)}
                    className={`
                      flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors
                      ${isActive
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    <Icon className="h-5 w-5" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Contenido del Reporte */}
        <div>
          {tipoReporte === 'ventas' && (
            <div>
              {loading ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                  <p className="text-gray-500">Cargando reporte de ventas...</p>
                </div>
              ) : salesData ? (
                <SalesReport data={salesData} />
              ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    No hay datos disponibles para el rango de fechas seleccionado
                  </p>
                </div>
              )}
            </div>
          )}

          {tipoReporte === 'inventario' && <InventoryReport />}

          {tipoReporte === 'ganancias' && (
            <ProfitReport
              fechaInicio={fechaInicio}
              fechaFin={fechaFin}
              vendedorId={vendedorSeleccionado !== 'todos' ? vendedorSeleccionado : null}
            />
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Reportes;

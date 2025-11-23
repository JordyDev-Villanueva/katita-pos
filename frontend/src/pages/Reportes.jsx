import { useState, useEffect } from 'react';
import { FileText, TrendingUp, Package, DollarSign, FileDown, FileSpreadsheet, BarChart3 } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { SalesReport } from '../components/reportes/SalesReport';
import { InventoryReport } from '../components/reportes/InventoryReport';
import { ProfitReport } from '../components/reportes/ProfitReport';
import { toast } from 'react-hot-toast';
import axiosInstance from '../api/axios';
import { format } from 'date-fns';

const Reportes = () => {
  const [tipoReporte, setTipoReporte] = useState('ventas'); // ventas, inventario, ganancias
  const [fechaInicio, setFechaInicio] = useState(() => {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - 7);
    return format(fecha, 'yyyy-MM-dd');
  });
  const [fechaFin, setFechaFin] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(false);
  const [salesData, setSalesData] = useState(null);

  // Cargar reporte automáticamente cuando cambian los filtros
  useEffect(() => {
    if (tipoReporte === 'ventas' || tipoReporte === 'ganancias') {
      loadSalesReport();
    }
  }, [tipoReporte, fechaInicio, fechaFin]);

  const loadSalesReport = async () => {
    try {
      setLoading(true);

      // Obtener reporte de ventas del backend
      const response = await axiosInstance.get('/ventas/reportes/resumen', {
        params: {
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin
        }
      });

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
      const response = await axiosInstance.get('/ventas/reportes/pdf', {
        params: { fecha_inicio: fechaInicio, fecha_fin: fechaFin },
        responseType: 'blob'
      });

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
      console.error('Error al exportar PDF:', error);
      toast.error('Error al exportar PDF. Verifica que haya datos para exportar.');
    }
  };

  const exportarExcel = async () => {
    try {
      const response = await axiosInstance.get('/ventas/reportes/excel', {
        params: { fecha_inicio: fechaInicio, fecha_fin: fechaFin },
        responseType: 'blob'
      });

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
      console.error('Error al exportar Excel:', error);
      toast.error('Error al exportar Excel. Verifica que haya datos para exportar.');
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
        {/* Header con botones de exportación */}
        <div className="mb-6 bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <BarChart3 className="w-6 h-6 text-white" />
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
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-200">
          <div className={`grid gap-4 ${tipoReporte === 'inventario' ? 'grid-cols-1 md:grid-cols-1' : 'grid-cols-1 md:grid-cols-3'}`}>
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
            <ProfitReport fechaInicio={fechaInicio} fechaFin={fechaFin} />
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Reportes;

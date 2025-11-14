import { useState } from 'react';
import { FileText, TrendingUp, Package, DollarSign, Calendar, FileDown } from 'lucide-react';
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

  const handleGenerarReporte = () => {
    if (tipoReporte === 'ventas') {
      loadSalesReport();
    }
    // Inventario y Ganancias cargan sus propios datos internamente
  };

  const handleExportPDF = () => {
    toast('Exportación a PDF en desarrollo');
  };

  const handleExportExcel = () => {
    toast('Exportación a Excel en desarrollo');
  };

  const tabs = [
    { id: 'ventas', label: 'Ventas', icon: TrendingUp },
    { id: 'inventario', label: 'Inventario', icon: Package },
    { id: 'ganancias', label: 'Ganancias', icon: DollarSign },
  ];

  return (
    <Layout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Reportes y Analytics</h1>
          </div>
          <p className="text-gray-600">
            Visualiza y analiza los datos de tu negocio
          </p>
        </div>

        {/* Filtros y Controles */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {/* Selector de Tipo de Reporte */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Reporte
              </label>
              <select
                value={tipoReporte}
                onChange={(e) => setTipoReporte(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ventas">Ventas</option>
                <option value="inventario">Inventario</option>
                <option value="ganancias">Ganancias</option>
              </select>
            </div>

            {/* Fecha Inicio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha Inicio
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>

            {/* Fecha Fin */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha Fin
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex flex-wrap gap-3">
            {/* Botón Generar Reporte */}
            <button
              onClick={handleGenerarReporte}
              disabled={loading}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Generando...</span>
                </>
              ) : (
                <>
                  <FileText className="h-5 w-5" />
                  <span>Generar Reporte</span>
                </>
              )}
            </button>

            {/* Botón Exportar PDF */}
            <button
              onClick={handleExportPDF}
              className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <FileDown className="h-5 w-5" />
              <span>Exportar PDF</span>
            </button>

            {/* Botón Exportar Excel */}
            <button
              onClick={handleExportExcel}
              className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <FileDown className="h-5 w-5" />
              <span>Exportar Excel</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
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
                <div className="bg-white rounded-lg shadow p-12 text-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                  <p className="text-gray-500">Cargando reporte de ventas...</p>
                </div>
              ) : salesData ? (
                <SalesReport data={salesData} />
              ) : (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">
                    Selecciona un rango de fechas y haz clic en "Generar Reporte"
                  </p>
                  <button
                    onClick={handleGenerarReporte}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Generar Reporte de Ventas
                  </button>
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

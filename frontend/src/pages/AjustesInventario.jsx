import { useState, useEffect } from 'react';
import { Layout } from '../components/layout/Layout';
import { ClipboardList, Package, Plus, Search, Calendar, Filter, TrendingDown, TrendingUp, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axiosInstance from '../api/axios';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const AjustesInventario = () => {
  const [productos, setProductos] = useState([]);
  const [ajustes, setAjustes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('todos');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  // Formulario de nuevo ajuste
  const [formData, setFormData] = useState({
    producto_id: '',
    cantidad_nueva: '',
    tipo_ajuste: 'inventario_fisico',
    motivo: '',
    observaciones: ''
  });

  const tiposAjuste = [
    { value: 'merma', label: 'Merma (Vencidos/Dañados)', icon: TrendingDown, color: 'red' },
    { value: 'rotura', label: 'Rotura', icon: AlertCircle, color: 'orange' },
    { value: 'robo', label: 'Robo', icon: AlertCircle, color: 'red' },
    { value: 'error_conteo', label: 'Error de Conteo', icon: AlertCircle, color: 'yellow' },
    { value: 'inventario_fisico', label: 'Toma de Inventario Física', icon: Package, color: 'blue' }
  ];

  useEffect(() => {
    loadProductos();
    loadAjustes();
  }, [tipoFiltro, fechaInicio, fechaFin]);

  const loadProductos = async () => {
    try {
      const response = await axiosInstance.get('/products');
      if (response.data?.success) {
        const data = response.data.data || response.data.products || [];
        setProductos(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error cargando productos:', error);
      setProductos([]);
    }
  };

  const loadAjustes = async () => {
    try {
      setLoading(true);

      const params = {};
      if (tipoFiltro !== 'todos') params.tipo_ajuste = tipoFiltro;
      if (fechaInicio) params.fecha_inicio = fechaInicio;
      if (fechaFin) params.fecha_fin = fechaFin;

      const response = await axiosInstance.get('/ajustes-inventario', { params });

      if (response.data?.success) {
        setAjustes(response.data.ajustes || []);
      }
    } catch (error) {
      console.error('Error cargando ajustes:', error);
      toast.error('Error al cargar historial de ajustes');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.producto_id) {
      toast.error('Debe seleccionar un producto');
      return;
    }

    if (!formData.cantidad_nueva || formData.cantidad_nueva < 0) {
      toast.error('La cantidad debe ser un número positivo');
      return;
    }

    if (!formData.motivo.trim()) {
      toast.error('Debe especificar el motivo del ajuste');
      return;
    }

    try {
      const response = await axiosInstance.post('/ajustes-inventario', {
        producto_id: parseInt(formData.producto_id),
        cantidad_nueva: parseInt(formData.cantidad_nueva),
        tipo_ajuste: formData.tipo_ajuste,
        motivo: formData.motivo,
        observaciones: formData.observaciones || null
      });

      if (response.data?.success) {
        const ajuste = response.data.ajuste;
        const signo = ajuste.diferencia > 0 ? '+' : '';

        toast.success(`Ajuste registrado: ${signo}${ajuste.diferencia} unidades`);

        // Resetear formulario
        setFormData({
          producto_id: '',
          cantidad_nueva: '',
          tipo_ajuste: 'inventario_fisico',
          motivo: '',
          observaciones: ''
        });

        setShowModal(false);
        loadAjustes();
        loadProductos(); // Recargar para ver stock actualizado
      }
    } catch (error) {
      console.error('Error al crear ajuste:', error);

      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error('Error al registrar el ajuste');
      }
    }
  };

  const productoSeleccionado = productos.find(p => p.id === parseInt(formData.producto_id));

  // Filtrar ajustes por búsqueda
  const ajustesFiltrados = ajustes.filter(ajuste =>
    ajuste.producto_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ajuste.motivo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="p-4 lg:p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Ajustes de Inventario
                </h1>
                <p className="text-sm text-gray-600">
                  Corregir stock por mermas, roturas o toma física
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all flex items-center gap-2 shadow-md transform hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Nuevo Ajuste</span>
            </button>
          </div>
          <div className="h-0.5 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 rounded-full"></div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 border-2 border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            {/* Búsqueda - Ocupa 3 columnas */}
            <div className="relative md:col-span-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar producto o motivo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Tipo de Ajuste - 1 columna */}
            <div>
              <select
                value={tipoFiltro}
                onChange={(e) => setTipoFiltro(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="todos">Todos los tipos</option>
                {tiposAjuste.map(tipo => (
                  <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                ))}
              </select>
            </div>

            {/* Filtro de Fecha - 2 columnas */}
            <div className="relative md:col-span-2">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                placeholder="Filtrar por fecha"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Tabla de Ajustes */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Fecha
                  </th>
                  <th className="px-3 sm:px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Producto
                  </th>
                  <th className="px-3 sm:px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Tipo
                  </th>
                  <th className="px-3 sm:px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Stock Anterior
                  </th>
                  <th className="px-3 sm:px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Stock Nuevo
                  </th>
                  <th className="px-3 sm:px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Diferencia
                  </th>
                  <th className="px-3 sm:px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Motivo
                  </th>
                  <th className="px-3 sm:px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Admin
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <p className="mt-2">Cargando ajustes...</p>
                    </td>
                  </tr>
                ) : ajustesFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                      <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p>No hay ajustes registrados</p>
                    </td>
                  </tr>
                ) : (
                  ajustesFiltrados.map((ajuste) => {
                    const tipo = tiposAjuste.find(t => t.value === ajuste.tipo_ajuste);
                    const Icon = tipo?.icon || Package;
                    const diferencia = ajuste.diferencia;
                    const isPositive = diferencia > 0;

                    return (
                      <tr key={ajuste.id} className="hover:bg-gray-50">
                        <td className="px-3 sm:px-4 md:px-6 py-3 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                          {format(new Date(ajuste.fecha), 'dd/MM/yyyy HH:mm', { locale: es })}
                        </td>
                        <td className="px-3 sm:px-4 md:px-6 py-3 text-xs sm:text-sm font-medium text-gray-900">
                          {ajuste.producto_nombre}
                        </td>
                        <td className="px-3 sm:px-4 md:px-6 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-${tipo?.color}-100 text-${tipo?.color}-800`}>
                            <Icon className="w-3 h-3" />
                            {tipo?.label || ajuste.tipo_ajuste}
                          </span>
                        </td>
                        <td className="px-3 sm:px-4 md:px-6 py-3 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                          {ajuste.cantidad_anterior}
                        </td>
                        <td className="px-3 sm:px-4 md:px-6 py-3 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                          {ajuste.cantidad_nueva}
                        </td>
                        <td className="px-3 sm:px-4 md:px-6 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 text-xs sm:text-sm font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                            {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                            {isPositive ? '+' : ''}{diferencia}
                          </span>
                        </td>
                        <td className="px-3 sm:px-4 md:px-6 py-3 text-xs sm:text-sm text-gray-600 max-w-xs truncate" title={ajuste.motivo}>
                          {ajuste.motivo}
                        </td>
                        <td className="px-3 sm:px-4 md:px-6 py-3 whitespace-nowrap text-xs sm:text-sm text-gray-600">
                          {ajuste.admin_nombre}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Nuevo Ajuste */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-bold text-gray-900">Nuevo Ajuste de Inventario</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Plus className="w-6 h-6 rotate-45" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Producto */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Producto <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.producto_id}
                    onChange={(e) => setFormData({ ...formData, producto_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Seleccione un producto...</option>
                    {productos.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} (Stock actual: {p.stock_actual})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Stock Actual vs Nueva Cantidad */}
                {productoSeleccionado && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Stock Actual:</span>
                        <p className="text-lg font-bold text-blue-900">{productoSeleccionado.stock_actual}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Nuevo Stock:</span>
                        <p className="text-lg font-bold text-blue-900">{formData.cantidad_nueva || '---'}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Diferencia:</span>
                        <p className={`text-lg font-bold ${(formData.cantidad_nueva - productoSeleccionado.stock_actual) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formData.cantidad_nueva ? (formData.cantidad_nueva - productoSeleccionado.stock_actual >= 0 ? '+' : '') + (formData.cantidad_nueva - productoSeleccionado.stock_actual) : '---'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Cantidad Nueva */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nueva Cantidad en Stock <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.cantidad_nueva}
                    onChange={(e) => setFormData({ ...formData, cantidad_nueva: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Ingrese la cantidad real contada..."
                    required
                  />
                </div>

                {/* Tipo de Ajuste */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Ajuste <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.tipo_ajuste}
                    onChange={(e) => setFormData({ ...formData, tipo_ajuste: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {tiposAjuste.map(tipo => (
                      <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                    ))}
                  </select>
                </div>

                {/* Motivo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Motivo del Ajuste <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.motivo}
                    onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Productos vencidos encontrados en revisión mensual"
                    required
                  />
                </div>

                {/* Observaciones */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observaciones (opcional)
                  </label>
                  <textarea
                    value={formData.observaciones}
                    onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                    placeholder="Detalles adicionales..."
                  />
                </div>

                {/* Botones */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Registrar Ajuste
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AjustesInventario;

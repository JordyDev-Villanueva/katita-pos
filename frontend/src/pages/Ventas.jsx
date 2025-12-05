import { useState, useEffect } from 'react';
import { Layout } from '../components/layout/Layout';
import { DevolucionModal } from '../components/ventas/DevolucionModal';
import { TicketPrint } from '../components/pos/TicketPrint';
import { ShoppingCart, Search, Calendar, RotateCcw, Printer, Eye, AlertCircle, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axiosInstance from '../api/axios';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '../hooks/useAuth';

const Ventas = () => {
  const { user } = useAuth();
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [vendedorFiltro, setVendedorFiltro] = useState('todos');
  const [metodoPago, setMetodoPago] = useState('todos');

  // Modales
  const [showDevolucionModal, setShowDevolucionModal] = useState(false);
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);

  // Vendedores (solo admin)
  const [vendedores, setVendedores] = useState([]);

  useEffect(() => {
    if (user?.rol === 'admin') {
      loadVendedores();
    }
    loadVentas();
  }, [fechaInicio, fechaFin, vendedorFiltro, metodoPago]);

  const loadVendedores = async () => {
    try {
      const response = await axiosInstance.get('/usuarios');
      if (response.data?.success) {
        const vendedoresList = response.data.usuarios.filter(u =>
          (u.rol === 'vendedor' || u.rol === 'admin') && u.activo
        );
        setVendedores(vendedoresList);
      }
    } catch (error) {
      console.error('Error cargando vendedores:', error);
    }
  };

  const loadVentas = async () => {
    try {
      setLoading(true);

      const params = {
        limit: 100,
        include_detalles: true
      };

      if (fechaInicio) params.fecha_inicio = fechaInicio;
      if (fechaFin) params.fecha_fin = fechaFin;
      if (vendedorFiltro !== 'todos') params.vendedor_id = vendedorFiltro;
      if (metodoPago !== 'todos') params.metodo_pago = metodoPago;

      const response = await axiosInstance.get('/ventas', { params });

      if (response.data?.success) {
        setVentas(response.data.data?.ventas || response.data.data || []);
      }
    } catch (error) {
      console.error('Error cargando ventas:', error);
      toast.error('Error al cargar el historial de ventas');
    } finally {
      setLoading(false);
    }
  };

  const handleVerDetalle = async (venta) => {
    try {
      // Cargar detalles completos de la venta
      const response = await axiosInstance.get(`/ventas/${venta.id}`);
      if (response.data?.success) {
        // Combinar venta, detalles y vendedor en un solo objeto
        const ventaCompleta = {
          ...response.data.data.venta,
          detalles: response.data.data.detalles,
          vendedor_nombre: response.data.data.vendedor?.nombre || response.data.data.venta.vendedor_nombre || 'N/A'
        };
        setVentaSeleccionada(ventaCompleta);
        setShowDetalleModal(true);
      }
    } catch (error) {
      console.error('Error cargando detalle:', error);
      toast.error('Error al cargar los detalles de la venta');
    }
  };

  const handleImprimirTicket = async (venta) => {
    try {
      // Cargar detalles completos para el ticket
      const response = await axiosInstance.get(`/ventas/${venta.id}`);
      if (response.data?.success) {
        // Combinar venta, detalles y vendedor en un solo objeto
        const ventaCompleta = {
          ...response.data.data.venta,
          detalles: response.data.data.detalles,
          vendedor_nombre: response.data.data.vendedor?.nombre || response.data.data.venta.vendedor_nombre || 'N/A'
        };
        setVentaSeleccionada(ventaCompleta);
        setShowTicketModal(true);
      }
    } catch (error) {
      console.error('Error cargando venta:', error);
      toast.error('Error al cargar la venta para imprimir');
    }
  };

  const handleDevolucion = (venta) => {
    if (venta.devuelta) {
      toast.error('Esta venta ya fue devuelta');
      return;
    }

    setVentaSeleccionada(venta);
    setShowDevolucionModal(true);
  };

  const handleDevolucionSuccess = () => {
    loadVentas(); // Recargar lista
  };

  // Filtrar ventas por búsqueda
  const ventasFiltradas = ventas.filter(venta =>
    venta.numero_venta?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    venta.vendedor_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    venta.cliente_nombre?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="p-4 lg:p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 pb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Historial de Ventas
              </h1>
              <p className="text-sm text-gray-600">
                Gestiona todas las ventas registradas en el sistema
              </p>
            </div>
          </div>
          <div className="h-0.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 rounded-full"></div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 border-2 border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por número, vendedor o cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Vendedor (solo admin) */}
            {user?.rol === 'admin' && (
              <div>
                <select
                  value={vendedorFiltro}
                  onChange={(e) => setVendedorFiltro(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="todos">Todos los vendedores</option>
                  {vendedores.map(v => (
                    <option key={v.id} value={v.id}>{v.nombre_completo}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Método de Pago */}
            <div>
              <select
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="todos">Todos los métodos</option>
                <option value="efectivo">Efectivo</option>
                <option value="yape">Yape</option>
                <option value="plin">Plin</option>
                <option value="transferencia">Transferencia</option>
              </select>
            </div>

            {/* Fecha Inicio */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Fecha Fin */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Tabla de Ventas con scroll vertical fijo - 8 filas */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    N° Venta
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendedor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Método
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <p className="mt-2">Cargando ventas...</p>
                    </td>
                  </tr>
                ) : ventasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                      <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p>No hay ventas registradas</p>
                    </td>
                  </tr>
                ) : (
                  ventasFiltradas.map((venta) => (
                    <tr key={venta.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">
                          {venta.numero_venta}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {(() => {
                          try {
                            return format(new Date(venta.fecha), 'dd/MM/yyyy HH:mm', { locale: es });
                          } catch (error) {
                            return venta.fecha || 'Fecha inválida';
                          }
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {venta.vendedor_nombre}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {venta.cliente_nombre || 'Sin registro'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        S/ {Number(venta.total || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                          {venta.metodo_pago}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {venta.devuelta ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <AlertCircle className="w-3 h-3" />
                            Devuelta
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Completada
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleVerDetalle(venta)}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                            title="Ver detalles"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleImprimirTicket(venta)}
                            className="text-gray-600 hover:text-gray-800 transition-colors"
                            title="Imprimir ticket"
                          >
                            <Printer className="w-5 h-5" />
                          </button>
                          {user?.rol === 'admin' && !venta.devuelta && (
                            <button
                              onClick={() => handleDevolucion(venta)}
                              className="text-red-600 hover:text-red-800 transition-colors"
                              title="Procesar devolución"
                            >
                              <RotateCcw className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Detalle Venta */}
        {showDetalleModal && ventaSeleccionada && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-bold text-gray-900">
                  Detalle de Venta #{ventaSeleccionada.numero_venta}
                </h2>
                <button
                  onClick={() => setShowDetalleModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Información General */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Fecha:</span>
                    <p className="font-medium">
                      {(() => {
                        try {
                          return format(new Date(ventaSeleccionada.fecha), 'dd/MM/yyyy HH:mm', { locale: es });
                        } catch (error) {
                          return ventaSeleccionada.fecha || 'Fecha inválida';
                        }
                      })()}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Vendedor:</span>
                    <p className="font-medium">{ventaSeleccionada.vendedor_nombre}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Cliente:</span>
                    <p className="font-medium">{ventaSeleccionada.cliente_nombre || 'Sin registro'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Método de Pago:</span>
                    <p className="font-medium capitalize">{ventaSeleccionada.metodo_pago}</p>
                  </div>
                </div>

                {/* Productos */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Productos</h3>
                  <div className="bg-gray-50 rounded-lg overflow-hidden">
                    <table className="min-w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Producto</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Cantidad</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Precio Unit.</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {ventaSeleccionada.detalles?.map((detalle, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 text-sm">{detalle.producto_nombre}</td>
                            <td className="px-4 py-2 text-sm">{detalle.cantidad}</td>
                            <td className="px-4 py-2 text-sm">S/ {Number(detalle.precio_unitario).toFixed(2)}</td>
                            <td className="px-4 py-2 text-sm font-medium">S/ {Number(detalle.subtotal).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Totales */}
                <div className="border-t pt-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">S/ {Number(ventaSeleccionada.subtotal).toFixed(2)}</span>
                  </div>
                  {ventaSeleccionada.descuento > 0 && (
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Descuento:</span>
                      <span className="font-medium text-red-600">-S/ {Number(ventaSeleccionada.descuento).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold">
                    <span>TOTAL:</span>
                    <span className="text-blue-600">S/ {Number(ventaSeleccionada.total).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Ticket */}
        {showTicketModal && ventaSeleccionada && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-4 max-h-[95vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-bold text-gray-900">Imprimir Ticket</h2>
                <button
                  onClick={() => setShowTicketModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <TicketPrint venta={ventaSeleccionada} />

              <button
                onClick={() => setShowTicketModal(false)}
                className="w-full mt-3 px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

        {/* Modal Devolución */}
        <DevolucionModal
          venta={ventaSeleccionada}
          isOpen={showDevolucionModal}
          onClose={() => setShowDevolucionModal(false)}
          onSuccess={handleDevolucionSuccess}
        />
      </div>
    </Layout>
  );
};

export default Ventas;

import { Package, DollarSign, AlertTriangle, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import axiosInstance from '../../api/axios';
import { toast } from 'react-hot-toast';

export const InventoryReport = () => {
  const [loading, setLoading] = useState(true);
  const [productos, setProductos] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [stats, setStats] = useState({
    totalProductos: 0,
    stockTotal: 0,
    valorInventario: 0,
    bajoStock: 0,
    productosVencidos: 0
  });

  useEffect(() => {
    loadInventoryData();
  }, []);

  const loadInventoryData = async () => {
    try {
      setLoading(true);

      // Obtener todos los productos
      const response = await axiosInstance.get('/products', {
        params: { activo: true }
      });

      let productosArray = [];
      if (response.data?.success) {
        if (Array.isArray(response.data.data)) {
          productosArray = response.data.data;
        } else if (Array.isArray(response.data.data?.productos)) {
          productosArray = response.data.data.productos;
        }
      } else if (Array.isArray(response.data)) {
        productosArray = response.data;
      } else if (Array.isArray(response.data?.productos)) {
        productosArray = response.data.productos;
      }

      // Obtener todos los lotes
      const lotesResponse = await axiosInstance.get('/lotes');
      let lotesArray = [];
      if (lotesResponse.data?.success && lotesResponse.data?.data?.lotes) {
        lotesArray = lotesResponse.data.data.lotes;
      } else if (Array.isArray(lotesResponse.data)) {
        lotesArray = lotesResponse.data;
      }

      setProductos(productosArray);
      setLotes(lotesArray);

      // Calcular estadísticas con lógica de vencimiento
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      const tieneStockValido = (productoId) => {
        const lotesProducto = lotesArray.filter(l => l.producto_id === productoId);
        return lotesProducto.some(lote => {
          if ((lote.cantidad_actual || 0) <= 0) return false;
          const fechaVenc = new Date(lote.fecha_vencimiento);
          fechaVenc.setHours(0, 0, 0, 0);
          const diff = Math.ceil((fechaVenc - hoy) / (1000 * 60 * 60 * 24));
          return diff > 0; // Tiene stock Y no está vencido
        });
      };

      const totalProductos = productosArray.length;
      const productosConStockValido = productosArray.filter(p => {
        const stock = parseInt(p.stock_total || p.stock || 0);
        return stock > 0 && tieneStockValido(p.id);
      });
      const productosVencidos = productosArray.filter(p => {
        const stock = parseInt(p.stock_total || p.stock || 0);
        return stock > 0 && !tieneStockValido(p.id);
      }).length;

      const stockTotal = productosConStockValido.reduce((sum, p) => sum + (parseInt(p.stock_total || p.stock || 0)), 0);
      const valorInventario = productosConStockValido.reduce((sum, p) => {
        const stock = parseInt(p.stock_total || p.stock || 0);
        const precioCompra = parseFloat(p.precio_compra || 0);
        return sum + (stock * precioCompra);
      }, 0);
      const bajoStock = productosConStockValido.filter(p => {
        const stock = parseInt(p.stock_total || p.stock || 0);
        const minimo = parseInt(p.stock_minimo || 5);
        return stock <= minimo && stock > 0;
      }).length;

      setStats({
        totalProductos,
        stockTotal,
        valorInventario,
        bajoStock,
        productosVencidos
      });

    } catch (error) {
      console.error('Error cargando inventario:', error);
      toast.error('Error al cargar datos del inventario');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="text-gray-500 mt-2">Cargando datos del inventario...</p>
      </div>
    );
  }

  // Función para verificar si producto tiene stock válido
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const tieneStockValido = (productoId) => {
    const lotesProducto = lotes.filter(l => l.producto_id === productoId);
    return lotesProducto.some(lote => {
      if ((lote.cantidad_actual || 0) <= 0) return false;
      const fechaVenc = new Date(lote.fecha_vencimiento);
      fechaVenc.setHours(0, 0, 0, 0);
      const diff = Math.ceil((fechaVenc - hoy) / (1000 * 60 * 60 * 24));
      return diff > 0;
    });
  };

  // Productos con solo lotes vencidos (tienen stock pero todos vencidos)
  const productosVencidos = productos.filter(p => {
    const stock = parseInt(p.stock_total || p.stock || 0);
    return stock > 0 && !tieneStockValido(p.id);
  });

  // Filtrar productos con bajo stock (solo válidos)
  const productosBajoStock = productos.filter(p => {
    const stock = parseInt(p.stock_total || p.stock || 0);
    const minimo = parseInt(p.stock_minimo || 5);
    return stock > 0 && stock <= minimo && tieneStockValido(p.id);
  });

  // Productos sin stock
  const productosSinStock = productos.filter(p => {
    const stock = parseInt(p.stock_total || p.stock || 0);
    return stock === 0;
  });

  return (
    <div className="space-y-6">
      {/* Cards de Inventario con estilos mejorados */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Productos */}
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl shadow-sm p-6 border border-indigo-200 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-indigo-700 mb-1">Total Productos</p>
              <p className="text-3xl font-bold text-indigo-900">{stats.totalProductos}</p>
              <p className="text-xs text-indigo-600 mt-1">En el sistema</p>
            </div>
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <Package className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>

        {/* Stock Disponible */}
        <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl shadow-sm p-6 border border-teal-200 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-teal-700 mb-1">Stock Válido</p>
              <p className="text-3xl font-bold text-teal-900">{stats.stockTotal}</p>
              <p className="text-xs text-teal-600 mt-1">No vencido</p>
            </div>
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <CheckCircle className="w-6 h-6 text-teal-600" />
            </div>
          </div>
        </div>

        {/* Valor Total */}
        <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl shadow-sm p-6 border border-pink-200 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-pink-700 mb-1">Valor Total</p>
              <p className="text-2xl font-bold text-pink-900">
                S/ {stats.valorInventario.toFixed(2)}
              </p>
              <p className="text-xs text-pink-600 mt-1">Inventario válido</p>
            </div>
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <DollarSign className="w-6 h-6 text-pink-600" />
            </div>
          </div>
        </div>

        {/* Productos Críticos */}
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl shadow-sm p-6 border border-amber-200 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-amber-700 mb-1">Bajo Stock</p>
              <p className="text-3xl font-bold text-amber-900">{stats.bajoStock}</p>
              <p className="text-xs text-amber-600 mt-1">Requieren reposición</p>
            </div>
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>

        {/* Productos Vencidos */}
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl shadow-sm p-6 border border-red-200 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-red-700 mb-1">Stock Vencido</p>
              <p className="text-3xl font-bold text-red-900">{stats.productosVencidos}</p>
              <p className="text-xs text-red-600 mt-1">No vendibles</p>
            </div>
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Alerta de Productos con Lotes Vencidos */}
      {productosVencidos.length > 0 && (
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6 shadow-md">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-bold text-red-900 mb-2">
                🔴 Productos con Stock Vencido ({productosVencidos.length})
              </h3>
              <p className="text-sm text-red-700 mb-3">
                Estos productos tienen stock pero todos sus lotes están vencidos. NO deben ser vendidos.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {productosVencidos.map(producto => {
                  const stock = parseInt(producto.stock_total || producto.stock || 0);
                  return (
                    <div key={producto.id} className="bg-white rounded-lg p-4 border-2 border-red-300 shadow-sm">
                      <p className="font-bold text-gray-900">{producto.nombre}</p>
                      <p className="text-sm text-red-700 font-semibold">
                        Stock vencido: {stock} unidades
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        Código: {producto.codigo_barras || '-'}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Alertas de Bajo Stock */}
      {productosBajoStock.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                Productos con Bajo Stock ({productosBajoStock.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {productosBajoStock.map(producto => (
                  <div key={producto.id} className="bg-white rounded p-3 border border-yellow-200">
                    <p className="font-medium text-gray-900">{producto.nombre}</p>
                    <p className="text-sm text-gray-600">
                      Stock actual: <span className="font-semibold text-red-600">
                        {producto.stock_total || producto.stock || 0}
                      </span> / Mínimo: {producto.stock_minimo || 5}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Productos Sin Stock */}
      {productosSinStock.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-900 mb-2">
                Productos Sin Stock ({productosSinStock.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {productosSinStock.map(producto => (
                  <div key={producto.id} className="bg-white rounded p-2 border border-red-200">
                    <p className="text-sm font-medium text-gray-900">{producto.nombre}</p>
                    <p className="text-xs text-red-600">Sin stock</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabla de Productos */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Inventario Detallado
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Producto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Categoría
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Stock Actual
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Stock Mínimo
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Precio Compra
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Precio Venta
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Valor Stock
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {productos.map((producto) => {
                const stock = parseInt(producto.stock_total || producto.stock || 0);
                const minimo = parseInt(producto.stock_minimo || 5);
                const precioCompra = parseFloat(producto.precio_compra || 0);
                const precioVenta = parseFloat(producto.precio_venta || 0);
                const valorStock = stock * precioCompra;

                let estadoColor = 'bg-green-100 text-green-800';
                let estadoTexto = 'Normal';

                if (stock === 0) {
                  estadoColor = 'bg-red-100 text-red-800';
                  estadoTexto = 'Sin stock';
                } else if (stock <= minimo) {
                  estadoColor = 'bg-yellow-100 text-yellow-800';
                  estadoTexto = 'Bajo';
                }

                return (
                  <tr key={producto.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{producto.nombre}</div>
                      <div className="text-xs text-gray-500">{producto.codigo_barras || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {producto.categoria || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm font-semibold text-gray-900">{stock}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">
                      {minimo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                      S/ {precioCompra.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                      S/ {precioVenta.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-purple-600">
                      S/ {valorStock.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${estadoColor}`}>
                        {estadoTexto}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

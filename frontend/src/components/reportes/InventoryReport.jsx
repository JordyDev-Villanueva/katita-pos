import { Package, TrendingDown, DollarSign, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';
import axiosInstance from '../../api/axios';
import { toast } from 'react-hot-toast';

export const InventoryReport = () => {
  const [loading, setLoading] = useState(true);
  const [productos, setProductos] = useState([]);
  const [stats, setStats] = useState({
    totalProductos: 0,
    stockTotal: 0,
    valorInventario: 0,
    bajoStock: 0
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

      setProductos(productosArray);

      // Calcular estadísticas
      const totalProductos = productosArray.length;
      const stockTotal = productosArray.reduce((sum, p) => sum + (parseInt(p.stock_total || p.stock || 0)), 0);
      const valorInventario = productosArray.reduce((sum, p) => {
        const stock = parseInt(p.stock_total || p.stock || 0);
        const precioCompra = parseFloat(p.precio_compra || 0);
        return sum + (stock * precioCompra);
      }, 0);
      const bajoStock = productosArray.filter(p => {
        const stock = parseInt(p.stock_total || p.stock || 0);
        const minimo = parseInt(p.stock_minimo || 5);
        return stock <= minimo && stock > 0;
      }).length;

      setStats({
        totalProductos,
        stockTotal,
        valorInventario,
        bajoStock
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

  // Filtrar productos con bajo stock
  const productosBajoStock = productos.filter(p => {
    const stock = parseInt(p.stock_total || p.stock || 0);
    const minimo = parseInt(p.stock_minimo || 5);
    return stock <= minimo && stock > 0;
  });

  // Productos sin stock
  const productosSinStock = productos.filter(p => {
    const stock = parseInt(p.stock_total || p.stock || 0);
    return stock === 0;
  });

  return (
    <div className="space-y-6">
      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Productos */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Productos Totales</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalProductos}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Stock Total */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Stock Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.stockTotal}</p>
              <p className="text-xs text-gray-500">unidades</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Package className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Valor del Inventario */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Valor Inventario</p>
              <p className="text-2xl font-bold text-gray-900">
                S/ {stats.valorInventario.toFixed(2)}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <DollarSign className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Bajo Stock */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Productos Bajo Stock</p>
              <p className="text-2xl font-bold text-red-600">{stats.bajoStock}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

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

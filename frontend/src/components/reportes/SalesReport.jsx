import { TrendingUp, DollarSign, ShoppingCart, Percent } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const SalesReport = ({ data }) => {
  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No hay datos de ventas para mostrar</p>
      </div>
    );
  }

  console.log('📊 SalesReport recibió data:', data);

  // Calcular valores - usar los nombres correctos del backend
  const cantidadVentas = parseInt(data.cantidad_ventas || 0);
  const totalVendido = parseFloat(data.total_vendido || 0);
  const ticketPromedio = parseFloat(data.ticket_promedio || 0);
  const gananciaBruta = parseFloat(data.ganancia_total || 0);

  // Preparar datos para gráfico de métodos de pago (ahora es un array)
  const metodosData = (data.ventas_por_metodo || []).map(item => ({
    metodo: item.metodo.charAt(0).toUpperCase() + item.metodo.slice(1),
    total: parseFloat(item.total || 0),
    cantidad: item.cantidad
  }));

  console.log('📊 Métodos de pago procesados:', metodosData);

  // Preparar datos para gráfico de vendedores (ahora es un array)
  const vendedoresData = (data.ventas_por_vendedor || []).map(item => ({
    vendedor: item.vendedor_nombre,
    total: parseFloat(item.total || 0),
    cantidad: item.cantidad
  }));

  console.log('📊 Vendedores procesados:', vendedoresData);

  return (
    <div className="space-y-6">
      {/* Cards de Ventas con estilos mejorados */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Vendido */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-sm p-6 border border-blue-200 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700 mb-1">Total Vendido</p>
              <p className="text-3xl font-bold text-blue-900">
                S/ {totalVendido.toFixed(2)}
              </p>
            </div>
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Cantidad de Ventas */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-sm p-6 border border-green-200 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-green-700 mb-1">Cantidad de Ventas</p>
              <p className="text-3xl font-bold text-green-900">{cantidadVentas}</p>
            </div>
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <ShoppingCart className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Ticket Promedio */}
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl shadow-sm p-6 border border-yellow-200 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-700 mb-1">Ticket Promedio</p>
              <p className="text-3xl font-bold text-yellow-900">
                S/ {ticketPromedio.toFixed(2)}
              </p>
            </div>
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <TrendingUp className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        {/* Ganancia Total */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-sm p-6 border border-purple-200 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700 mb-1">Ganancia Total</p>
              <p className="text-3xl font-bold text-purple-900">
                S/ {gananciaBruta.toFixed(2)}
              </p>
            </div>
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <Percent className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ventas por Método de Pago */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Ventas por Método de Pago
          </h3>
          {metodosData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metodosData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="metodo" />
                <YAxis />
                <Tooltip
                  formatter={(value) => `S/ ${value.toFixed(2)}`}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
                />
                <Legend />
                <Bar dataKey="total" fill="#3b82f6" name="Total (S/)" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-500 py-12">No hay datos</p>
          )}
        </div>

        {/* Ventas por Vendedor */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Ventas por Vendedor
          </h3>
          {vendedoresData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={vendedoresData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="vendedor" />
                <YAxis />
                <Tooltip
                  formatter={(value) => `S/ ${value.toFixed(2)}`}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
                />
                <Legend />
                <Bar dataKey="total" fill="#10b981" name="Total (S/)" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-500 py-12">No hay datos</p>
          )}
        </div>
      </div>

      {/* Top Productos Más Vendidos */}
      {data.productos_mas_vendidos && data.productos_mas_vendidos.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Productos Más Vendidos
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Cantidad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Total Vendido
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.productos_mas_vendidos.map((producto, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {producto.nombre}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {producto.cantidad_vendida}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      S/ {parseFloat(producto.total_vendido || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

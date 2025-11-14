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

  // Calcular ticket promedio - Validar division por cero
  const cantidadVentas = parseInt(data.cantidad_ventas || 0);
  const totalVentas = parseFloat(data.total_ventas || 0);
  const ticketPromedio = cantidadVentas > 0 ? totalVentas / cantidadVentas : 0;

  // Preparar datos para gráfico de métodos de pago
  const metodosData = Object.entries(data.ventas_por_metodo || {}).map(([metodo, monto]) => ({
    metodo: metodo.charAt(0).toUpperCase() + metodo.slice(1),
    total: parseFloat(monto)
  }));

  // Preparar datos para gráfico de vendedores
  const vendedoresData = Object.entries(data.ventas_por_vendedor || {}).map(([vendedor, monto]) => ({
    vendedor,
    total: parseFloat(monto)
  }));

  return (
    <div className="space-y-6">
      {/* Cards de Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Vendido */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Vendido</p>
              <p className="text-2xl font-bold text-gray-900">
                S/ {parseFloat(data.total_ventas || 0).toFixed(2)}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Cantidad de Ventas */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Cantidad de Ventas</p>
              <p className="text-2xl font-bold text-gray-900">{data.cantidad_ventas || 0}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <ShoppingCart className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Ticket Promedio */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ticket Promedio</p>
              <p className="text-2xl font-bold text-gray-900">
                S/ {ticketPromedio.toFixed(2)}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <TrendingUp className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        {/* Ganancia Bruta */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ganancia Bruta</p>
              <p className="text-2xl font-bold text-gray-900">
                S/ {parseFloat(data.ganancia_bruta || 0).toFixed(2)}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Percent className="h-6 w-6 text-purple-600" />
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

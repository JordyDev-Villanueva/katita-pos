import { TrendingUp, DollarSign, Percent, Target } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useState, useEffect } from 'react';
import axiosInstance from '../../api/axios';
import { toast } from 'react-hot-toast';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { extractDateOnly } from '../../utils/timezone';

export const ProfitReport = ({ fechaInicio, fechaFin }) => {
  const [loading, setLoading] = useState(true);
  const [profitData, setProfitData] = useState(null);
  const [evolucion, setEvolucion] = useState([]);

  useEffect(() => {
    loadProfitData();
  }, [fechaInicio, fechaFin]);

  const loadProfitData = async () => {
    try {
      setLoading(true);

      // Obtener todas las ventas
      const response = await axiosInstance.get('/ventas');

      let ventas = [];
      if (response.data?.success) {
        if (Array.isArray(response.data.data)) {
          ventas = response.data.data;
        } else if (Array.isArray(response.data.data?.ventas)) {
          ventas = response.data.data.ventas;
        }
      } else if (Array.isArray(response.data)) {
        ventas = response.data;
      }

      // Filtrar por rango de fechas usando extractDateOnly
      const fechaInicioStr = extractDateOnly(new Date(fechaInicio));
      const fechaFinStr = extractDateOnly(new Date(fechaFin));

      const ventasFiltradas = ventas.filter(venta => {
        const fechaVenta = venta.fecha_venta || venta.fecha || venta.created_at;
        const fechaVentaStr = extractDateOnly(fechaVenta);
        return fechaVentaStr >= fechaInicioStr && fechaVentaStr <= fechaFinStr;
      });

      console.log('=== 📊 DEBUG GANANCIAS - ProfitReport ===');
      console.log(`📊 Filtrando ventas del ${fechaInicioStr} al ${fechaFinStr}`);
      console.log(`📊 Total ventas encontradas: ${ventas.length}, filtradas: ${ventasFiltradas.length}`);

      if (ventasFiltradas.length > 0) {
        console.log('📊 Primera venta filtrada:', ventasFiltradas[0]);
        if (ventasFiltradas[0].detalles && ventasFiltradas[0].detalles.length > 0) {
          const primerDetalle = ventasFiltradas[0].detalles[0];
          console.log('📊 Primer detalle:', {
            producto: primerDetalle.producto?.nombre || 'N/A',
            cantidad: primerDetalle.cantidad,
            precio_unitario: primerDetalle.precio_unitario,
            precio_compra_unitario: primerDetalle.precio_compra_unitario,
            precio_compra_producto: primerDetalle.producto?.precio_compra
          });
        }
      }

      // Calcular ganancias
      let gananciaBruta = 0;
      let totalVentas = 0;
      const productosPorMargen = {};

      console.log('=== 💰 CALCULANDO GANANCIAS EN CARDS ===');

      ventasFiltradas.forEach(venta => {
        totalVentas += parseFloat(venta.total || 0);

        if (venta.detalles && Array.isArray(venta.detalles)) {
          venta.detalles.forEach(detalle => {
            const precioVenta = parseFloat(detalle.precio_unitario || detalle.precio_venta || 0);

            // CORRECCIÓN CRÍTICA: Usar precio_compra_unitario, si es 0, estimar
            let precioCompra = parseFloat(detalle.precio_compra_unitario || detalle.producto?.precio_compra || 0);

            // Si precio_compra es 0, estimar usando margen estándar (60% del precio de venta = 40% margen)
            if (precioCompra === 0 && precioVenta > 0) {
              precioCompra = precioVenta * 0.60;
              console.warn(`⚠️ Producto "${detalle.producto?.nombre || 'Desconocido'}" sin precio_compra → estimando S/ ${precioCompra.toFixed(2)}`);
            }

            const cantidad = parseInt(detalle.cantidad || 0);
            const margen = (precioVenta - precioCompra) * cantidad;

            console.log(`  ${detalle.producto?.nombre || 'N/A'}: (S/ ${precioVenta.toFixed(2)} - S/ ${precioCompra.toFixed(2)}) × ${cantidad} = S/ ${margen.toFixed(2)}`);

            gananciaBruta += margen;

            // Agrupar por producto
            const productoId = detalle.producto_id;
            const productoNombre = detalle.producto?.nombre || 'Desconocido';

            if (!productosPorMargen[productoId]) {
              productosPorMargen[productoId] = {
                nombre: productoNombre,
                margen: 0,
                cantidadVendida: 0,
                totalVendido: 0
              };
            }

            productosPorMargen[productoId].margen += margen;
            productosPorMargen[productoId].cantidadVendida += cantidad;
            productosPorMargen[productoId].totalVendido += precioVenta * cantidad;
          });
        }
      });

      // Calcular margen promedio
      const margenPromedio = totalVentas > 0 ? (gananciaBruta / totalVentas) * 100 : 0;

      // ROI estimado (ganancia / costo)
      const costoTotal = totalVentas - gananciaBruta;
      const roi = costoTotal > 0 ? (gananciaBruta / costoTotal) * 100 : 0;

      // Top productos por margen
      const topProductos = Object.values(productosPorMargen)
        .sort((a, b) => b.margen - a.margen)
        .slice(0, 10);

      console.log('💎 Ganancia Bruta Total:', gananciaBruta.toFixed(2));
      console.log('💎 Total Ventas:', totalVentas.toFixed(2));
      console.log('💎 Margen Promedio:', margenPromedio.toFixed(2) + '%');
      console.log('💎 ROI:', roi.toFixed(2) + '%');
      console.log('💎 Top Productos:', topProductos.length);

      setProfitData({
        gananciaBruta,
        gananciaNeta: gananciaBruta * 0.85, // Estimado restando 15% de gastos operativos
        margenPromedio,
        roi,
        topProductos
      });

      // Calcular evolución de últimos 7 días usando timezone de Perú
      const evolucionData = [];
      console.log('📈 Calculando evolución de ganancias (últimos 7 días)...');

      for (let i = 6; i >= 0; i--) {
        const fecha = subDays(new Date(), i);
        const fechaStr = extractDateOnly(fecha); // Usar extractDateOnly para formato consistente

        const ventasDia = ventas.filter(v => {
          const fechaVenta = v.fecha_venta || v.fecha || v.created_at;
          const fechaVentaStr = extractDateOnly(fechaVenta);
          return fechaVentaStr === fechaStr;
        });

        let gananciaDia = 0;
        ventasDia.forEach(venta => {
          if (venta.detalles && Array.isArray(venta.detalles)) {
            venta.detalles.forEach(d => {
              const pv = parseFloat(d.precio_unitario || d.precio_venta || 0);

              // CORRECCIÓN CRÍTICA: Usar precio_compra_unitario, si es 0, estimar
              let pc = parseFloat(d.precio_compra_unitario || d.producto?.precio_compra || 0);

              // Si precio_compra es 0, estimar usando margen estándar
              if (pc === 0 && pv > 0) {
                pc = pv * 0.60;
              }

              const cantidad = parseInt(d.cantidad || 0);
              const margen = (pv - pc) * cantidad;
              gananciaDia += margen;
            });
          }
        });

        console.log(`  ${fechaStr} (${format(fecha, 'dd MMM', { locale: es })}): ${ventasDia.length} ventas, ganancia: S/ ${gananciaDia.toFixed(2)}`);

        evolucionData.push({
          fecha: format(fecha, 'dd MMM', { locale: es }),
          ganancia: gananciaDia
        });
      }

      console.log('📈 Evolución calculada:', evolucionData);
      setEvolucion(evolucionData);

    } catch (error) {
      console.error('Error cargando datos de ganancia:', error);
      toast.error('Error al cargar datos de ganancias');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="text-gray-500 mt-2">Cargando datos de ganancias...</p>
      </div>
    );
  }

  if (!profitData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No hay datos de ganancias para mostrar</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Ganancia Bruta */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ganancia Bruta</p>
              <p className="text-2xl font-bold text-green-600">
                S/ {profitData.gananciaBruta.toFixed(2)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Ganancia Neta (Estimada) */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ganancia Neta (Est.)</p>
              <p className="text-2xl font-bold text-blue-600">
                S/ {profitData.gananciaNeta.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500">-15% gastos operativos</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Margen Promedio */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Margen Promedio</p>
              <p className="text-2xl font-bold text-purple-600">
                {profitData.margenPromedio.toFixed(1)}%
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Percent className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        {/* ROI */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">ROI</p>
              <p className="text-2xl font-bold text-orange-600">
                {profitData.roi.toFixed(1)}%
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <Target className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico de Evolución */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Evolución de Ganancias (Últimos 7 Días)
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={evolucion}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="fecha" />
            <YAxis />
            <Tooltip
              formatter={(value) => `S/ ${value.toFixed(2)}`}
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="ganancia"
              stroke="#10b981"
              strokeWidth={2}
              name="Ganancia (S/)"
              dot={{ fill: '#10b981', r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Top 10 Productos con Mayor Margen */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Top 10 Productos con Mayor Margen
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
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Cant. Vendida
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Total Vendido
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Margen
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  % Margen
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {profitData.topProductos.map((producto, index) => {
                const porcentajeMargen = producto.totalVendido > 0
                  ? (producto.margen / producto.totalVendido) * 100
                  : 0;

                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {producto.nombre}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                      {producto.cantidadVendida}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                      S/ {producto.totalVendido.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-green-600">
                      S/ {producto.margen.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-purple-600">
                      {porcentajeMargen.toFixed(1)}%
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

import { TrendingUp, DollarSign, Percent, Target } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useState, useEffect } from 'react';
import axiosInstance from '../../api/axios';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
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

      console.log('=== 📊 DEBUG GANANCIAS - ProfitReport ===');
      console.log(`📊 Cargando ganancias con fechas: ${fechaInicio} al ${fechaFin}`);

      // CORRECCIÓN: Usar el endpoint de resumen que filtra correctamente en backend
      const resumenResponse = await axiosInstance.get('/ventas/reportes/resumen', {
        params: {
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin
        }
      });

      console.log('📊 Respuesta del backend (raw):', resumenResponse.data);

      // CORRECCIÓN: success_response() envuelve en {success: true, data: {...}}
      const backendData = resumenResponse.data.data || resumenResponse.data;
      console.log('📊 Datos extraídos:', backendData);

      // Obtener todas las ventas para el gráfico de evolución
      const ventasResponse = await axiosInstance.get('/ventas', {
        params: {
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin,
          limit: 1000
        }
      });

      let ventas = [];
      if (ventasResponse.data?.success) {
        if (Array.isArray(ventasResponse.data.data)) {
          ventas = ventasResponse.data.data;
        } else if (Array.isArray(ventasResponse.data.data?.ventas)) {
          ventas = ventasResponse.data.data.ventas;
        }
      } else if (Array.isArray(ventasResponse.data)) {
        ventas = ventasResponse.data;
      }

      // Filtrar por rango de fechas usando extractDateOnly para el gráfico
      // CORRECCIÓN: Parsear fechas con timezone local
      const [yInicio, mInicio, dInicio] = fechaInicio.split('-').map(Number);
      const [yFin, mFin, dFin] = fechaFin.split('-').map(Number);
      const fechaInicioLocal = new Date(yInicio, mInicio - 1, dInicio);
      const fechaFinLocal = new Date(yFin, mFin - 1, dFin);
      const fechaInicioStr = extractDateOnly(fechaInicioLocal);
      const fechaFinStr = extractDateOnly(fechaFinLocal);

      const ventasFiltradas = ventas.filter(venta => {
        const fechaVenta = venta.fecha_venta || venta.fecha || venta.created_at;
        const fechaVentaStr = extractDateOnly(fechaVenta);
        return fechaVentaStr >= fechaInicioStr && fechaVentaStr <= fechaFinStr;
      });

      console.log(`📊 Ventas filtradas para gráfico: ${ventasFiltradas.length}`);

      if (ventasFiltradas.length > 0) {
        console.log('📊 Primera venta filtrada:', ventasFiltradas[0]);
        console.log('📊 Detalles de primera venta:', ventasFiltradas[0].detalles);
      }

      // CORRECCIÓN: Usar datos del backend en lugar de calcular en frontend
      const gananciaBruta = parseFloat(backendData.ganancia_bruta || 0);
      const totalVentas = parseFloat(backendData.total_vendido || 0);
      const cantidadVentas = parseInt(backendData.cantidad_ventas || 0);

      console.log('=== 💰 DATOS DEL BACKEND ===');
      console.log(`💎 Ganancia Bruta: S/ ${gananciaBruta.toFixed(2)}`);
      console.log(`💎 Total Ventas: S/ ${totalVentas.toFixed(2)}`);
      console.log(`💎 Cantidad Ventas: ${cantidadVentas}`);

      // Calcular productos por margen usando las ventas filtradas (para el top 10)
      const productosPorMargen = {};

      console.log(`\n🔍 Calculando Top Productos con ${ventasFiltradas.length} ventas filtradas...`);

      ventasFiltradas.forEach((venta, idx) => {
        if (venta.detalles && Array.isArray(venta.detalles)) {
          console.log(`  Venta #${idx + 1}: ${venta.detalles.length} detalles`);
          venta.detalles.forEach(detalle => {
            const precioVenta = parseFloat(detalle.precio_unitario || detalle.precio_venta || 0);
            let precioCompra = parseFloat(detalle.precio_compra_unitario || detalle.producto?.precio_compra || 0);

            if (precioCompra === 0 && precioVenta > 0) {
              precioCompra = precioVenta * 0.60;
            }

            const cantidad = parseInt(detalle.cantidad || 0);
            const margen = (precioVenta - precioCompra) * cantidad;

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

            console.log(`    - ${productoNombre}: cantidad=${cantidad}, margen=S/ ${margen.toFixed(2)}`);
          });
        } else {
          console.log(`  ⚠️ Venta #${idx + 1}: NO tiene detalles (${venta.detalles})`);
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

      console.log('💎 Margen Promedio:', margenPromedio.toFixed(2) + '%');
      console.log('💎 ROI:', roi.toFixed(2) + '%');
      console.log('💎 Top Productos:', topProductos.length);
      console.log('💎 Top Productos (detalle):', JSON.stringify(topProductos, null, 2));

      setProfitData({
        gananciaBruta,
        gananciaNeta: gananciaBruta * 0.85, // Estimado restando 15% de gastos operativos
        margenPromedio,
        roi,
        topProductos
      });

      // Calcular evolución de ganancias para el rango seleccionado
      const evolucionData = [];
      console.log(`📈 Calculando evolución de ganancias (${fechaInicioStr} al ${fechaFinStr})...`);

      // CORRECCIÓN: Parsear fechas con timezone local para evitar offset de 1 día
      const [yearInicio, mesInicio, diaInicio] = fechaInicio.split('-').map(Number);
      const [yearFin, mesFin, diaFin] = fechaFin.split('-').map(Number);
      const inicio = new Date(yearInicio, mesInicio - 1, diaInicio); // mes es 0-indexed
      const fin = new Date(yearFin, mesFin - 1, diaFin);
      const diasDiferencia = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24)) + 1;

      for (let i = 0; i < diasDiferencia; i++) {
        const fecha = new Date(inicio);
        fecha.setDate(fecha.getDate() + i);
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
      {/* Cards de Ganancias con estilos mejorados */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Ganancia Bruta */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-sm p-6 border border-green-200 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-green-700 mb-1">Ganancia Bruta</p>
              <p className="text-3xl font-bold text-green-900">
                S/ {profitData.gananciaBruta.toFixed(2)}
              </p>
            </div>
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Card 2: Ganancia Neta */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-sm p-6 border border-blue-200 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700 mb-1">Ganancia Neta (Est.)</p>
              <p className="text-3xl font-bold text-blue-900">
                S/ {profitData.gananciaNeta.toFixed(2)}
              </p>
              <p className="text-xs text-blue-600 mt-1">-15% gastos operativos</p>
            </div>
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Card 3: Margen Promedio */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-sm p-6 border border-purple-200 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700 mb-1">Margen Promedio</p>
              <p className="text-3xl font-bold text-purple-900">
                {profitData.margenPromedio.toFixed(1)}%
              </p>
            </div>
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <Percent className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Card 4: ROI */}
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl shadow-sm p-6 border border-orange-200 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-orange-700 mb-1">ROI</p>
              <p className="text-3xl font-bold text-orange-900">
                {profitData.roi.toFixed(1)}%
              </p>
            </div>
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <Target className="w-6 h-6 text-orange-600" />
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

import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const VentasChart = ({ data }) => {
  const { user } = useAuth();

  // FASE 6: Título dinámico según rol
  const titulo = user?.rol === 'vendedor' ? 'Mis Ventas Últimos 7 Días' : 'Ventas Últimos 7 Días';

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">{titulo}</h3>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-gray-400 mb-2">
              <TrendingUp className="h-12 w-12 mx-auto" />
            </div>
            <p className="text-gray-500">No hay datos de ventas disponibles</p>
            <p className="text-sm text-gray-400 mt-1">
              Las ventas realizadas aparecerán aquí
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Custom Tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 mb-2">
            {payload[0]?.payload?.fechaFormateada}
          </p>
          <div className="space-y-1">
            <p className="text-sm text-blue-600">
              Total: <span className="font-semibold">S/ {payload[0]?.value.toFixed(2)}</span>
            </p>
            <p className="text-sm text-green-600">
              Ventas: <span className="font-semibold">{payload[1]?.value}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">{titulo}</h3>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-gray-600">Total (S/)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-gray-600">Cantidad</span>
          </div>
        </div>
      </div>

      <div style={{ width: '100%', height: '350px' }}>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="fechaFormateada"
              tick={{ fontSize: 12 }}
              stroke="#9ca3af"
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 12 }}
              stroke="#9ca3af"
              tickFormatter={(value) => `S/ ${value}`}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 12 }}
              stroke="#9ca3af"
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="total"
              stroke="#3b82f6"
              fillOpacity={1}
              fill="url(#colorTotal)"
              strokeWidth={2}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="cantidad"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: '#10b981', r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

import { Receipt, Clock } from 'lucide-react';
import { formatPeruDate } from '../../utils/timezone';

export const RecentSales = ({ ventas }) => {
  if (!ventas || ventas.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Receipt className="h-5 w-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Últimas Ventas</h3>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-gray-400 mb-2">
              <Receipt className="h-12 w-12 mx-auto" />
            </div>
            <p className="text-gray-500">No hay ventas registradas</p>
            <p className="text-sm text-gray-400 mt-1">
              Las ventas aparecerán aquí
            </p>
          </div>
        </div>
      </div>
    );
  }

  const getMetodoPagoBadge = (metodo) => {
    const metodos = {
      efectivo: { bg: 'bg-green-100', text: 'text-green-800', label: 'Efectivo' },
      yape: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Yape' },
      plin: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Plin' },
      transferencia: { bg: 'bg-indigo-100', text: 'text-indigo-800', label: 'Transferencia' },
    };

    const metodoKey = (metodo || 'efectivo').toLowerCase();
    const config = metodos[metodoKey] || metodos.efectivo;

    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Receipt className="h-5 w-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Últimas Ventas</h3>
        </div>
        <span className="text-sm text-gray-500">{ventas.length} ventas</span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                N° Venta
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fecha/Hora
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Método
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vendedor
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {ventas.map((venta) => {
              const fechaCompleta = venta.fecha_venta || venta.fecha || venta.created_at;

              return (
                <tr key={venta.id} className="hover:bg-gray-50 transition-colors">
                  {/* Número de venta */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm font-mono font-semibold text-gray-900">
                        #{venta.id?.toString().padStart(6, '0')}
                      </span>
                    </div>
                  </td>

                  {/* Fecha y hora (en zona horaria de Perú) */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1 text-sm text-gray-900">
                      <Clock className="h-3 w-3 text-gray-400" />
                      <div>
                        <div className="font-medium">
                          {formatPeruDate(fechaCompleta, 'dd MMM yyyy')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatPeruDate(fechaCompleta, 'HH:mm')}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Total */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-sm font-semibold text-gray-900">
                      S/ {Number(venta.total || 0).toFixed(2)}
                    </span>
                  </td>

                  {/* Método de pago */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    {getMetodoPagoBadge(venta.metodo_pago)}
                  </td>

                  {/* Vendedor */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    {venta.vendedor_nombre ? (
                      <div className="flex items-center gap-2">
                        <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-semibold text-blue-700">
                            {venta.vendedor_nombre.split(' ').map(n => n[0]).join('').substring(0, 2)}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {venta.vendedor_nombre}
                          </p>
                          <p className="text-xs text-gray-500">
                            {venta.vendedor_username}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-400">
                        <div className="flex-shrink-0 h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-semibold text-gray-400">?</span>
                        </div>
                        <span className="text-sm">Sin asignar</span>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer con total */}
      {ventas.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Total en tabla:</span>
            <span className="text-lg font-bold text-gray-900">
              S/ {ventas.reduce((sum, v) => sum + parseFloat(v.total || 0), 0).toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

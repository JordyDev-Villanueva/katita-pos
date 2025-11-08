import { Calendar, Package, MapPin, FileText } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

export const LoteTable = ({ lotes, loading }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando lotes...</p>
        </div>
      </div>
    );
  }

  if (!lotes || lotes.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
        <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600 text-lg font-medium mb-2">No hay lotes registrados</p>
        <p className="text-gray-500 text-sm">
          Registra tu primer ingreso de mercadería haciendo click en "Registrar Ingreso"
        </p>
      </div>
    );
  }

  const getUrgenciaColor = (diasParaVencer) => {
    if (diasParaVencer < 0) return 'bg-red-100 border-red-300 text-red-700'; // Vencido
    if (diasParaVencer <= 3) return 'bg-red-50 border-red-200 text-red-600'; // Crítico
    if (diasParaVencer <= 7) return 'bg-yellow-50 border-yellow-200 text-yellow-700'; // Urgente
    if (diasParaVencer <= 15) return 'bg-orange-50 border-orange-200 text-orange-600'; // Alerta
    return 'bg-white border-gray-200'; // Normal
  };

  const getUrgenciaLabel = (diasParaVencer) => {
    if (diasParaVencer < 0) return 'VENCIDO';
    if (diasParaVencer === 0) return 'VENCE HOY';
    if (diasParaVencer === 1) return 'VENCE MAÑANA';
    if (diasParaVencer <= 3) return `${diasParaVencer} DÍAS`;
    if (diasParaVencer <= 7) return `${diasParaVencer} días`;
    if (diasParaVencer <= 15) return `${diasParaVencer} días`;
    return `${diasParaVencer} días`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Código Lote
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Producto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cantidad
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ingreso
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vencimiento
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Proveedor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {lotes.map((lote, index) => {
              const fechaVenc = new Date(lote.fecha_vencimiento);
              const hoy = new Date();
              hoy.setHours(0, 0, 0, 0);
              fechaVenc.setHours(0, 0, 0, 0);

              const diasParaVencer = differenceInDays(fechaVenc, hoy);
              const urgenciaColor = getUrgenciaColor(diasParaVencer);
              const urgenciaLabel = getUrgenciaLabel(diasParaVencer);

              const agotado = lote.cantidad_actual === 0;
              const esSiguienteFIFO = index === 0 && !agotado;

              return (
                <tr
                  key={lote.id}
                  className={`hover:bg-gray-50 transition-colors ${
                    esSiguienteFIFO ? 'bg-green-50 border-l-4 border-green-500' : ''
                  }`}
                >
                  {/* Código del lote */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {esSiguienteFIFO && (
                        <span className="mr-2 px-2 py-1 text-xs font-bold bg-green-500 text-white rounded">
                          FIFO
                        </span>
                      )}
                      <span className="text-sm font-mono font-semibold text-gray-900">
                        {lote.codigo_lote}
                      </span>
                    </div>
                  </td>

                  {/* Producto */}
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {lote.producto?.nombre || 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {lote.producto?.categoria || ''}
                      </div>
                    </div>
                  </td>

                  {/* Cantidad */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className={`font-semibold ${agotado ? 'text-gray-400' : 'text-gray-900'}`}>
                        {lote.cantidad_actual} / {lote.cantidad_inicial}
                      </div>
                      <div className="text-xs text-gray-500">
                        {agotado ? 'Agotado' : 'Disponible'}
                      </div>
                    </div>
                  </td>

                  {/* Fecha de ingreso */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {format(new Date(lote.fecha_ingreso), 'dd/MM/yyyy', { locale: es })}
                    </div>
                  </td>

                  {/* Fecha de vencimiento con indicador de urgencia */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border ${urgenciaColor}`}>
                      <Calendar className="h-4 w-4" />
                      <div className="text-sm">
                        <div className="font-semibold">
                          {format(new Date(lote.fecha_vencimiento), 'dd/MM/yyyy', { locale: es })}
                        </div>
                        <div className="text-xs font-medium">
                          {urgenciaLabel}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Proveedor */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">
                      {lote.proveedor || '-'}
                    </div>
                  </td>

                  {/* Estado */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        agotado
                          ? 'bg-gray-100 text-gray-800'
                          : diasParaVencer < 0
                          ? 'bg-red-100 text-red-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {agotado ? 'Agotado' : diasParaVencer < 0 ? 'Vencido' : 'Activo'}
                      </span>

                      {lote.ubicacion && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <MapPin className="h-3 w-3" />
                          <span>{lote.ubicacion}</span>
                        </div>
                      )}

                      {lote.notas && (
                        <div className="flex items-center gap-1 text-xs text-gray-500" title={lote.notas}>
                          <FileText className="h-3 w-3" />
                          <span className="truncate max-w-xs">Notas</span>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer con contador */}
      <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Mostrando <span className="font-semibold">{lotes.length}</span> lote(s)
          </p>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-gray-600">Siguiente FIFO</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-100 rounded"></div>
              <span className="text-gray-600">Crítico (&lt;3 días)</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-100 rounded"></div>
              <span className="text-gray-600">Urgente (&lt;7 días)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import { AlertTriangle, Package, Calendar, CheckCircle } from 'lucide-react';

export const AlertsPanel = ({ alertas }) => {
  const bajoStock = alertas?.bajoStock || [];
  const porVencer = alertas?.porVencer || [];
  const vencidos = alertas?.vencidos || [];

  const totalAlertas = bajoStock.length + porVencer.length + vencidos.length;

  if (totalAlertas === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Alertas del Sistema</h3>
        </div>
        <div className="flex flex-col items-center justify-center py-8">
          <div className="bg-green-100 p-4 rounded-full mb-3">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <p className="text-green-700 font-semibold mb-1">¡Todo en orden!</p>
          <p className="text-sm text-gray-500 text-center">
            No hay alertas activas en el sistema
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Alertas del Sistema</h3>
        </div>
        <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-800 rounded-full">
          {totalAlertas}
        </span>
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {/* Productos bajo stock */}
        {bajoStock.length > 0 && (
          <div className="border-l-4 border-red-500 bg-red-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-4 w-4 text-red-600" />
              <span className="font-semibold text-red-900">
                Productos Bajo Stock ({bajoStock.length})
              </span>
            </div>
            <div className="space-y-2 mt-3">
              {bajoStock.slice(0, 5).map((producto) => (
                <div
                  key={producto.id}
                  className="bg-white rounded-md p-2 border border-red-200"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">
                      {producto.nombre}
                    </span>
                    <span className="text-xs font-semibold text-red-600">
                      {producto.stock_total || 0} / {producto.stock_minimo || 0}
                    </span>
                  </div>
                  <div className="mt-1 bg-red-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-red-500 h-full"
                      style={{
                        width: `${Math.min(
                          ((producto.stock_total || 0) / (producto.stock_minimo || 1)) * 100,
                          100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
              {bajoStock.length > 5 && (
                <p className="text-xs text-gray-500 text-center mt-2">
                  +{bajoStock.length - 5} producto(s) más
                </p>
              )}
            </div>
          </div>
        )}

        {/* Lotes por vencer */}
        {porVencer.length > 0 && (
          <div className="border-l-4 border-yellow-500 bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-yellow-600" />
              <span className="font-semibold text-yellow-900">
                Por Vencer en 7 días ({porVencer.length})
              </span>
            </div>
            <div className="space-y-2 mt-3">
              {porVencer.slice(0, 5).map((lote) => {
                const fechaVenc = new Date(lote.fecha_vencimiento);
                const hoy = new Date();
                hoy.setHours(0, 0, 0, 0);
                fechaVenc.setHours(0, 0, 0, 0);
                const dias = Math.ceil((fechaVenc - hoy) / (1000 * 60 * 60 * 24));

                return (
                  <div
                    key={lote.id}
                    className="bg-white rounded-md p-2 border border-yellow-200"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">
                        {lote.producto?.nombre || 'N/A'}
                      </span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                        dias <= 3 ? 'bg-red-500 text-white' : 'bg-yellow-500 text-white'
                      }`}>
                        {dias === 0 ? 'HOY' : dias === 1 ? 'MAÑANA' : `${dias} días`}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Lote: {lote.codigo_lote} · Stock: {lote.cantidad_actual}
                    </p>
                  </div>
                );
              })}
              {porVencer.length > 5 && (
                <p className="text-xs text-gray-500 text-center mt-2">
                  +{porVencer.length - 5} lote(s) más
                </p>
              )}
            </div>
          </div>
        )}

        {/* Lotes vencidos */}
        {vencidos.length > 0 && (
          <div className="border-l-4 border-red-700 bg-red-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-700" />
              <span className="font-semibold text-red-900">
                Lotes Vencidos ({vencidos.length})
              </span>
            </div>
            <div className="space-y-2 mt-3">
              {vencidos.slice(0, 3).map((lote) => (
                <div
                  key={lote.id}
                  className="bg-white rounded-md p-2 border border-red-300"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">
                      {lote.producto?.nombre || 'N/A'}
                    </span>
                    <span className="text-xs font-bold bg-red-600 text-white px-2 py-0.5 rounded">
                      VENCIDO
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Lote: {lote.codigo_lote} · Pérdida: {lote.cantidad_actual} unidades
                  </p>
                </div>
              ))}
              {vencidos.length > 3 && (
                <p className="text-xs text-gray-500 text-center mt-2">
                  +{vencidos.length - 3} lote(s) más
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer con botón de acción */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <button className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors">
          Ver todas las alertas
        </button>
      </div>
    </div>
  );
};

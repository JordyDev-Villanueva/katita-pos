import { AlertCircle, TrendingDown, Package } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const MermasReport = ({ lotesVencidos, valorPerdido }) => {
  if (!lotesVencidos || lotesVencidos.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-green-500 p-3 rounded-lg">
            <Package className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-green-900">
              Sin Mermas Registradas
            </h3>
            <p className="text-sm text-green-700">
              No hay productos vencidos con stock actualmente
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-red-500 p-2 rounded-lg">
            <AlertCircle className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-red-900">
              Reporte de Mermas (Productos Vencidos)
            </h3>
            <p className="text-sm text-red-700">
              {lotesVencidos.length} lote(s) vencido(s) con stock disponible
            </p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-sm text-red-700">Valor Perdido Estimado:</p>
          <p className="text-2xl font-bold text-red-600">
            S/ {Number(valorPerdido || 0).toFixed(2)}
          </p>
        </div>
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto">
        {lotesVencidos.map((lote) => {
          const valorLote = lote.cantidad_actual * (lote.precio_compra_lote || 0);

          return (
            <div
              key={lote.id}
              className="bg-white border border-red-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-gray-900">
                      {lote.producto?.nombre}
                    </span>
                    <span className="px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded">
                      VENCIDO
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500">Lote:</span>
                      <p className="font-mono font-semibold text-gray-900">
                        {lote.codigo_lote}
                      </p>
                    </div>

                    <div>
                      <span className="text-gray-500">Stock Perdido:</span>
                      <p className="font-semibold text-red-600">
                        {lote.cantidad_actual} unidades
                      </p>
                    </div>

                    <div>
                      <span className="text-gray-500">Fecha Vencimiento:</span>
                      <p className="font-semibold text-gray-900">
                        {format(new Date(lote.fecha_vencimiento), 'dd/MM/yyyy', { locale: es })}
                      </p>
                    </div>

                    <div>
                      <span className="text-gray-500">Valor Perdido:</span>
                      <p className="font-semibold text-red-600">
                        S/ {valorLote.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {lote.proveedor && (
                    <p className="text-xs text-gray-500 mt-2">
                      Proveedor: {lote.proveedor}
                    </p>
                  )}

                  {lote.notas && (
                    <p className="text-xs text-gray-500 mt-1">
                      Notas: {lote.notas}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Resumen */}
      <div className="mt-4 pt-4 border-t border-red-300">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-white rounded-lg p-3">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <TrendingDown className="h-4 w-4" />
              <span>Total Unidades Perdidas:</span>
            </div>
            <p className="text-2xl font-bold text-red-600">
              {lotesVencidos.reduce((sum, lote) => sum + lote.cantidad_actual, 0)}
            </p>
          </div>

          <div className="bg-white rounded-lg p-3">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <Package className="h-4 w-4" />
              <span>Productos Afectados:</span>
            </div>
            <p className="text-2xl font-bold text-red-600">
              {new Set(lotesVencidos.map(l => l.producto_id)).size}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

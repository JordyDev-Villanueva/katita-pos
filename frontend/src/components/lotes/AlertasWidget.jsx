import { AlertTriangle, Calendar } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

export const AlertasWidget = ({ alertas = [] }) => {
  if (alertas.length === 0) {
    return null;
  }

  return (
    <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4 mb-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="bg-yellow-500 p-2 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-yellow-900">
            Productos Próximos a Vencer
          </h3>
          <p className="text-sm text-yellow-700">
            {alertas.length} lote(s) requieren atención
          </p>
        </div>
      </div>

      <div className="space-y-2 max-h-60 overflow-y-auto">
        {alertas.map((lote) => {
          const fechaVenc = new Date(lote.fecha_vencimiento);
          const hoy = new Date();
          hoy.setHours(0, 0, 0, 0);
          fechaVenc.setHours(0, 0, 0, 0);

          const diasParaVencer = differenceInDays(fechaVenc, hoy);

          return (
            <div
              key={lote.id}
              className="bg-white border border-yellow-200 rounded-lg p-3 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900">
                      {lote.producto?.nombre}
                    </span>
                    <span className={`px-2 py-0.5 text-xs font-bold rounded ${
                      diasParaVencer <= 3 ? 'bg-red-500 text-white' : 'bg-yellow-500 text-white'
                    }`}>
                      {diasParaVencer === 0 ? 'VENCE HOY' :
                       diasParaVencer === 1 ? 'VENCE MAÑANA' :
                       `${diasParaVencer} días`}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>Lote: {lote.codigo_lote}</span>
                    <span>Stock: {lote.cantidad_actual} unidades</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(lote.fecha_vencimiento), 'dd/MM/yyyy', { locale: es })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

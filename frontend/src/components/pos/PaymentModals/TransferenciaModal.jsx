import { X, Building2, AlertCircle } from 'lucide-react';
import { Button } from '../../common/Button';

export const TransferenciaModal = ({ isOpen, onClose, total, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-indigo-600 text-white p-4 rounded-t-2xl sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <Building2 className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Transferencia Bancaria</h2>
                <p className="text-indigo-100 text-xs">Banca móvil o cajero</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {/* Total a pagar */}
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-600 mb-1">Monto a Transferir:</p>
            <p className="text-3xl font-bold text-gray-900">S/ {total.toFixed(2)}</p>
          </div>

          {/* Datos bancarios (puedes personalizarlos) */}
          <div className="bg-white border-2 border-indigo-200 rounded-xl p-3 space-y-2">
            <div>
              <p className="text-xs text-gray-500">Banco:</p>
              <p className="font-semibold text-sm text-gray-900">BCP / Interbank / BBVA</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Titular:</p>
              <p className="font-semibold text-sm text-gray-900">Jordy Frank Villanueva Martel</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Cuenta / CCI:</p>
              <p className="font-mono text-xs text-gray-700">Informar al cajero</p>
            </div>
          </div>

          {/* Instrucciones */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3">
            <div className="flex gap-2">
              <AlertCircle className="h-4 w-4 text-indigo-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-gray-700">
                <p className="font-semibold mb-1">Instrucciones:</p>
                <ol className="list-decimal list-inside space-y-0.5">
                  <li>Cliente realiza la transferencia</li>
                  <li>Solicita comprobante o captura</li>
                  <li>Verifica el pago recibido</li>
                  <li>Confirma la operación</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 rounded-b-2xl flex gap-3 sticky bottom-0">
          <Button
            onClick={onClose}
            variant="secondary"
            fullWidth
          >
            Cancelar
          </Button>
          <Button
            onClick={() => onConfirm({})}
            variant="primary"
            fullWidth
          >
            Confirmar Pago Recibido
          </Button>
        </div>
      </div>
    </div>
  );
};

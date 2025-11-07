import { X, Building2, AlertCircle } from 'lucide-react';
import { Button } from '../../common/Button';

export const TransferenciaModal = ({ isOpen, onClose, total, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="bg-indigo-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <Building2 className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Transferencia Bancaria</h2>
                <p className="text-indigo-100 text-sm">Banca móvil o cajero</p>
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
        <div className="p-6 space-y-6">
          {/* Total a pagar */}
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <p className="text-sm text-gray-600 mb-1">Monto a Transferir:</p>
            <p className="text-4xl font-bold text-gray-900">S/ {total.toFixed(2)}</p>
          </div>

          {/* Datos bancarios (puedes personalizarlos) */}
          <div className="bg-white border-2 border-indigo-200 rounded-xl p-4 space-y-3">
            <div>
              <p className="text-xs text-gray-500">Banco:</p>
              <p className="font-semibold text-gray-900">BCP / Interbank / BBVA</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Titular:</p>
              <p className="font-semibold text-gray-900">Jordy Frank Villanueva Martel</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Cuenta / CCI:</p>
              <p className="font-mono text-sm text-gray-700">Informar al cajero</p>
            </div>
          </div>

          {/* Instrucciones */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-indigo-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-700">
                <p className="font-semibold mb-2">Instrucciones:</p>
                <ol className="list-decimal list-inside space-y-1">
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
        <div className="p-6 bg-gray-50 rounded-b-2xl flex gap-3">
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

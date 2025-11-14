import { X, Smartphone, AlertCircle } from 'lucide-react';
import { Button } from '../../common/Button';

export const YapePlinModal = ({ isOpen, onClose, total, onConfirm, metodo }) => {
  if (!isOpen) return null;

  const color = metodo === 'yape' ? 'purple' : 'blue';
  const bgColor = metodo === 'yape' ? 'bg-purple-600' : 'bg-blue-600';
  const borderColor = metodo === 'yape' ? 'border-purple-200' : 'border-blue-200';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className={`${bgColor} text-white p-4 rounded-t-2xl sticky top-0 z-10`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <Smartphone className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  Pago con {metodo === 'yape' ? 'Yape' : 'Plin'}
                </h2>
                <p className={`text-${color}-100 text-xs`}>Escanea el código QR</p>
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
            <p className="text-xs text-gray-600 mb-1">Monto a Pagar:</p>
            <p className="text-3xl font-bold text-gray-900">S/ {total.toFixed(2)}</p>
          </div>

          {/* QR Code */}
          <div className={`border-2 ${borderColor} rounded-xl p-3 bg-white`}>
            <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-center">
              <img
                src="/qr-codes/yape-qr.jpg"
                alt="QR Yape/Plin"
                className="w-48 h-48 object-contain"
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect width="200" height="200" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%236b7280" font-size="16"%3EQR no disponible%3C/text%3E%3C/svg%3E';
                }}
              />
            </div>

            <div className="mt-2 text-center">
              <p className="text-sm font-semibold text-gray-900">
                Jordy Frank Villanueva Martel
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {metodo === 'yape' ? 'Yape' : 'Plin también funciona con este QR'}
              </p>
            </div>
          </div>

          {/* Instrucciones */}
          <div className={`bg-${color}-50 border ${borderColor} rounded-lg p-3`}>
            <div className="flex gap-2">
              <AlertCircle className={`h-4 w-4 text-${color}-600 flex-shrink-0 mt-0.5`} />
              <div className="text-xs text-gray-700">
                <p className="font-semibold mb-1">Instrucciones:</p>
                <ol className="list-decimal list-inside space-y-0.5">
                  <li>Cliente escanea el QR con su app</li>
                  <li>Cliente ingresa el monto: S/ {total.toFixed(2)}</li>
                  <li>Cliente completa el pago</li>
                  <li>Solicita captura de pantalla al cliente</li>
                  <li>Verifica el pago recibido</li>
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

import { useState } from 'react';
import { Banknote, X } from 'lucide-react';
import { Button } from '../../common/Button';
import { Input } from '../../common/Input';

export const EfectivoModal = ({ isOpen, onClose, total, onConfirm }) => {
  const [montoRecibido, setMontoRecibido] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const monto = parseFloat(montoRecibido) || 0;
  const cambio = monto - total;
  const isPagoCorrecto = monto >= total;

  const handleConfirm = () => {
    if (!isPagoCorrecto) {
      setError(`Monto insuficiente. Faltan S/ ${(total - monto).toFixed(2)}`);
      return;
    }
    onConfirm({ monto_recibido: monto });
  };

  const handleMontoPreset = (valor) => {
    setMontoRecibido(valor.toString());
    setError('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="bg-green-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <Banknote className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Pago en Efectivo</h2>
                <p className="text-green-100 text-sm">Calcula el cambio automáticamente</p>
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
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm text-gray-600 mb-1">Total a Pagar:</p>
            <p className="text-3xl font-bold text-gray-900">S/ {total.toFixed(2)}</p>
          </div>

          {/* Monto recibido */}
          <div>
            <Input
              label="Monto Recibido"
              type="number"
              step="0.01"
              min="0"
              value={montoRecibido}
              onChange={(e) => {
                setMontoRecibido(e.target.value);
                setError('');
              }}
              placeholder="0.00"
              error={error}
              icon={Banknote}
              className="text-xl"
              autoFocus
            />
          </div>

          {/* Botones de monto rápido */}
          <div>
            <p className="text-sm text-gray-600 mb-2">Monto Exacto:</p>
            <div className="grid grid-cols-4 gap-2">
              {[10, 20, 50, 100].map((valor) => (
                <button
                  key={valor}
                  onClick={() => handleMontoPreset(valor)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold text-gray-700 transition-colors"
                >
                  S/ {valor}
                </button>
              ))}
            </div>
            <button
              onClick={() => handleMontoPreset(total)}
              className="w-full mt-2 px-4 py-2 bg-primary-100 hover:bg-primary-200 text-primary-700 rounded-lg font-semibold transition-colors"
            >
              Monto Exacto: S/ {total.toFixed(2)}
            </button>
          </div>

          {/* Cambio */}
          {isPagoCorrecto && cambio > 0 && (
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
              <p className="text-sm text-green-700 mb-1">Cambio a Devolver:</p>
              <p className="text-3xl font-bold text-green-600">S/ {cambio.toFixed(2)}</p>
            </div>
          )}

          {isPagoCorrecto && cambio === 0 && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
              <p className="text-center text-blue-700 font-semibold">✓ Monto Exacto</p>
            </div>
          )}
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
            onClick={handleConfirm}
            variant="success"
            fullWidth
            disabled={!isPagoCorrecto}
          >
            Confirmar Pago
          </Button>
        </div>
      </div>
    </div>
  );
};

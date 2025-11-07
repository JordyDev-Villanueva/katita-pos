import { useState } from 'react';
import { X, Banknote, Smartphone, Building2 } from 'lucide-react';
import { EfectivoModal } from './PaymentModals/EfectivoModal';
import { YapePlinModal } from './PaymentModals/YapePlinModal';
import { TransferenciaModal } from './PaymentModals/TransferenciaModal';

export const PaymentModal = ({ isOpen, onClose, total, onConfirmPayment }) => {
  const [selectedMethod, setSelectedMethod] = useState(null);

  if (!isOpen) return null;

  const paymentMethods = [
    {
      id: 'efectivo',
      name: 'Efectivo',
      icon: Banknote,
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600',
      description: 'Calcula cambio automáticamente',
    },
    {
      id: 'yape',
      name: 'Yape',
      icon: Smartphone,
      color: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-600',
      description: 'Pago con código QR',
    },
    {
      id: 'plin',
      name: 'Plin',
      icon: Smartphone,
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600',
      description: 'Pago con código QR',
    },
    {
      id: 'transferencia',
      name: 'Transferencia',
      icon: Building2,
      color: 'bg-indigo-500',
      hoverColor: 'hover:bg-indigo-600',
      description: 'Banca móvil o cajero',
    },
  ];

  const handleMethodSelect = (methodId) => {
    setSelectedMethod(methodId);
  };

  const handlePaymentConfirm = (paymentData) => {
    onConfirmPayment({
      metodo_pago: selectedMethod,
      ...paymentData,
    });
    setSelectedMethod(null);
  };

  const handleCloseSubModal = () => {
    setSelectedMethod(null);
  };

  return (
    <>
      {/* Modal principal de selección */}
      {!selectedMethod && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4">
            {/* Header */}
            <div className="bg-primary-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Seleccionar Método de Pago</h2>
                  <p className="text-primary-100 mt-1">
                    Total a pagar: <span className="font-bold text-2xl">S/ {total.toFixed(2)}</span>
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Métodos de pago */}
            <div className="p-6 grid grid-cols-2 gap-4">
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <button
                    key={method.id}
                    onClick={() => handleMethodSelect(method.id)}
                    className={`${method.color} ${method.hoverColor} text-white p-6 rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-xl`}
                  >
                    <Icon className="h-12 w-12 mx-auto mb-3" />
                    <p className="text-xl font-bold mb-1">{method.name}</p>
                    <p className="text-sm opacity-90">{method.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modales específicos de cada método */}
      <EfectivoModal
        isOpen={selectedMethod === 'efectivo'}
        onClose={handleCloseSubModal}
        total={total}
        onConfirm={handlePaymentConfirm}
      />

      <YapePlinModal
        isOpen={selectedMethod === 'yape'}
        onClose={handleCloseSubModal}
        total={total}
        onConfirm={handlePaymentConfirm}
        metodo="yape"
      />

      <YapePlinModal
        isOpen={selectedMethod === 'plin'}
        onClose={handleCloseSubModal}
        total={total}
        onConfirm={handlePaymentConfirm}
        metodo="plin"
      />

      <TransferenciaModal
        isOpen={selectedMethod === 'transferencia'}
        onClose={handleCloseSubModal}
        total={total}
        onConfirm={handlePaymentConfirm}
      />
    </>
  );
};

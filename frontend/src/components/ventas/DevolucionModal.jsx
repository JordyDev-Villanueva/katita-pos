import { useState } from 'react';
import { X, AlertTriangle, RotateCcw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axiosInstance from '../../api/axios';

/**
 * Modal para Procesar Devoluciones
 *
 * Permite al admin devolver una venta completa con reversión automática de inventario.
 * Solo accesible para administradores.
 */
export const DevolucionModal = ({ venta, isOpen, onClose, onSuccess }) => {
  const [motivo, setMotivo] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [loading, setLoading] = useState(false);

  // Opciones predefinidas de motivos
  const motivosComunes = [
    'Cliente insatisfecho',
    'Producto defectuoso',
    'Producto equivocado',
    'Cambio de opinión',
    'Producto vencido',
    'Otro'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!motivo.trim()) {
      toast.error('Debe seleccionar un motivo de devolución');
      return;
    }

    try {
      setLoading(true);

      const response = await axiosInstance.post('/devoluciones', {
        venta_id: venta.id,
        motivo: motivo,
        observaciones: observaciones.trim() || null
      });

      if (response.data?.success) {
        toast.success('Devolución procesada exitosamente. Inventario revertido.');

        // Mostrar resumen de stock revertido
        if (response.data.stock_revertido && response.data.stock_revertido.length > 0) {
          console.log('📦 Stock revertido:', response.data.stock_revertido);
        }

        if (onSuccess) {
          onSuccess(response.data.devolucion);
        }

        onClose();
      } else {
        toast.error(response.data?.error || 'Error al procesar devolución');
      }
    } catch (error) {
      console.error('Error al procesar devolución:', error);

      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error('Error al procesar la devolución');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !venta) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <RotateCcw className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Procesar Devolución</h2>
              <p className="text-xs text-gray-600">Venta #{venta.numero_venta}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Advertencia */}
        <div className="p-3 bg-yellow-50 border-l-4 border-yellow-400 flex gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-yellow-900">
              Esta acción revertirá el inventario y el dinero del cuadro de caja
            </p>
            <p className="text-xs text-yellow-700 mt-0.5">
              Los productos volverán al stock y el monto se restará del cuadro de caja.
            </p>
          </div>
        </div>

        {/* Detalles de la Venta */}
        <div className="p-4 border-b">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Detalles de la Venta</h3>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-gray-600">Vendedor:</span>
              <p className="font-medium">{venta.vendedor_nombre || 'N/A'}</p>
            </div>
            <div>
              <span className="text-gray-600">Total:</span>
              <p className="font-medium text-base">S/ {Number(venta.total || 0).toFixed(2)}</p>
            </div>
            <div>
              <span className="text-gray-600">Método de Pago:</span>
              <p className="font-medium capitalize">{venta.metodo_pago}</p>
            </div>
            <div>
              <span className="text-gray-600">Fecha:</span>
              <p className="font-medium">{new Date(venta.fecha).toLocaleString('es-PE')}</p>
            </div>
          </div>

          {/* Productos */}
          {venta.detalles && venta.detalles.length > 0 && (
            <div className="mt-3">
              <span className="text-gray-600 text-xs">Productos a devolver:</span>
              <div className="mt-2 bg-gray-50 rounded-lg p-2 max-h-32 overflow-y-auto">
                {venta.detalles.map((detalle, index) => (
                  <div key={index} className="flex justify-between items-center py-1.5 border-b border-gray-200 last:border-0">
                    <div>
                      <p className="font-medium text-xs">{detalle.producto_nombre}</p>
                      <p className="text-xs text-gray-600">Cant: {detalle.cantidad}</p>
                    </div>
                    <p className="text-xs font-medium">S/ {Number(detalle.subtotal).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {/* Motivo */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Motivo de Devolución <span className="text-red-500">*</span>
            </label>
            <select
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              required
            >
              <option value="">Seleccione un motivo...</option>
              {motivosComunes.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Observaciones (opcional)
            </label>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Detalles adicionales..."
              rows={2}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
            />
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Procesando...' : 'Procesar Devolución'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

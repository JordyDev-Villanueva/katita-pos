import { ShoppingCart, Trash2 } from 'lucide-react';
import { CartItem } from './CartItem';
import { Button } from '../common/Button';

export const Cart = ({ items, onUpdateQuantity, onRemove, onClearCart, onCheckout }) => {
  const subtotal = items.reduce((sum, item) => sum + (item.cantidad * item.precio_unitario), 0);
  const itemCount = items.reduce((sum, item) => sum + item.cantidad, 0);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-6 w-6 text-primary-600" />
          <h2 className="text-xl font-bold text-gray-900">Carrito</h2>
          {itemCount > 0 && (
            <span className="bg-primary-600 text-white text-xs font-bold px-2 py-1 rounded-full">
              {itemCount}
            </span>
          )}
        </div>

        {items.length > 0 && (
          <button
            onClick={onClearCart}
            className="text-red-600 hover:text-red-700 flex items-center gap-1 text-sm"
          >
            <Trash2 className="h-4 w-4" />
            Limpiar
          </button>
        )}
      </div>

      {/* Items del carrito */}
      <div className="flex-1 overflow-y-auto space-y-2 mb-4 scrollbar-thin">
        {items.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">El carrito está vacío</p>
            <p className="text-sm text-gray-400 mt-1">
              Escanea o busca productos para agregar
            </p>
          </div>
        ) : (
          items.map((item) => (
            <CartItem
              key={item.producto_id}
              item={item}
              onUpdateQuantity={onUpdateQuantity}
              onRemove={onRemove}
            />
          ))
        )}
      </div>

      {/* Totales */}
      {items.length > 0 && (
        <>
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-semibold">S/ {subtotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t">
              <span>Total:</span>
              <span className="text-primary-600">S/ {subtotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Botón de pagar */}
          <Button
            onClick={onCheckout}
            variant="primary"
            size="lg"
            fullWidth
            className="mt-4 text-lg font-bold"
          >
            Procesar Pago
          </Button>
        </>
      )}
    </div>
  );
};

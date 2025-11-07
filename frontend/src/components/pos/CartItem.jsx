import { Minus, Plus, Trash2 } from 'lucide-react';

export const CartItem = ({ item, onUpdateQuantity, onRemove }) => {
  const subtotal = item.cantidad * item.precio_unitario;

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
      {/* Imagen pequeña */}
      <div className="w-12 h-12 bg-white rounded flex items-center justify-center flex-shrink-0">
        {item.imagen_url ? (
          <img
            src={item.imagen_url}
            alt={item.nombre}
            className="w-full h-full object-cover rounded"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        ) : (
          <span className="text-2xl">📦</span>
        )}
      </div>

      {/* Info del producto */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-sm text-gray-900 truncate">
          {item.nombre}
        </h4>
        <p className="text-xs text-gray-500">
          S/ {Number(item.precio_unitario).toFixed(2)} c/u
        </p>
        <p className="text-sm font-semibold text-primary-600">
          S/ {subtotal.toFixed(2)}
        </p>
      </div>

      {/* Controles de cantidad */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onUpdateQuantity(item.producto_id, item.cantidad - 1)}
          className="p-1 rounded bg-gray-200 hover:bg-gray-300 transition-colors"
          disabled={item.cantidad <= 1}
        >
          <Minus className="h-4 w-4" />
        </button>

        <span className="font-semibold min-w-[2rem] text-center">
          {item.cantidad}
        </span>

        <button
          onClick={() => onUpdateQuantity(item.producto_id, item.cantidad + 1)}
          className="p-1 rounded bg-gray-200 hover:bg-gray-300 transition-colors"
          disabled={item.cantidad >= item.stock_disponible}
        >
          <Plus className="h-4 w-4" />
        </button>

        <button
          onClick={() => onRemove(item.producto_id)}
          className="p-1 rounded bg-red-100 hover:bg-red-200 text-red-600 transition-colors ml-1"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

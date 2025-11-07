import { Package, Plus } from 'lucide-react';

export const ProductCard = ({ producto, onAddToCart }) => {
  const hasStock = producto.stock_total > 0;

  return (
    <div
      className={`bg-white rounded-lg border-2 p-4 transition-all duration-200 ${
        hasStock
          ? 'border-gray-200 hover:border-primary-500 hover:shadow-lg cursor-pointer'
          : 'border-gray-100 opacity-50 cursor-not-allowed'
      }`}
      onClick={() => hasStock && onAddToCart(producto)}
    >
      {/* Imagen o placeholder */}
      <div className="aspect-square mb-3 bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden">
        {producto.imagen_url ? (
          <img
            src={producto.imagen_url}
            alt={producto.nombre}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/placeholder-product.png';
            }}
          />
        ) : (
          <Package className="h-16 w-16 text-gray-300" />
        )}
      </div>

      {/* Información del producto */}
      <div className="space-y-1">
        <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 min-h-[2.5rem]">
          {producto.nombre}
        </h3>

        <div className="flex items-center justify-between">
          <p className="text-lg font-bold text-primary-600">
            S/ {Number(producto.precio_venta).toFixed(2)}
          </p>

          <span className={`text-xs px-2 py-1 rounded ${
            hasStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            Stock: {producto.stock_total}
          </span>
        </div>

        {/* Botón agregar */}
        {hasStock && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(producto);
            }}
            className="w-full mt-2 bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Agregar
          </button>
        )}
      </div>
    </div>
  );
};

import { ProductCard } from './ProductCard';
import { Loader2 } from 'lucide-react';

export const ProductGrid = ({ productos, loading, onAddToCart }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        <span className="ml-2 text-gray-600">Cargando productos...</span>
      </div>
    );
  }

  // CORRECCIÓN: Validar que productos sea array
  if (!Array.isArray(productos)) {
    console.error('productos no es un array:', productos);
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Error: Formato de datos incorrecto</p>
      </div>
    );
  }

  if (productos.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No se encontraron productos</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {productos.map((producto) => (
        <ProductCard
          key={producto.id}
          producto={producto}
          onAddToCart={onAddToCart}
        />
      ))}
    </div>
  );
};

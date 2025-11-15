import { TrendingUp, Award } from 'lucide-react';

export const TopProductos = ({ productos }) => {
  if (!productos || productos.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <Award className="h-5 w-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Top 10 Productos Más Vendidos</h3>
        </div>
        <div className="flex items-center justify-center flex-1">
          <div className="text-center">
            <div className="text-gray-400 mb-2">
              <Award className="h-12 w-12 mx-auto" />
            </div>
            <p className="text-gray-500">No hay datos de productos vendidos</p>
            <p className="text-sm text-gray-400 mt-1">
              Realiza ventas para ver el ranking
            </p>
          </div>
        </div>
      </div>
    );
  }

  const getBadgeColor = (index) => {
    if (index === 0) return 'bg-yellow-400 text-yellow-900'; // Oro
    if (index === 1) return 'bg-gray-300 text-gray-800'; // Plata
    if (index === 2) return 'bg-orange-400 text-orange-900'; // Bronce
    return 'bg-gray-100 text-gray-700';
  };

  const getProgressColor = (index) => {
    if (index === 0) return 'bg-yellow-500';
    if (index === 1) return 'bg-gray-400';
    if (index === 2) return 'bg-orange-500';
    return 'bg-blue-500';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Top 10 Productos Más Vendidos</h3>
        </div>
        <TrendingUp className="h-4 w-4 text-green-600" />
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto">
        {productos.map((producto, index) => (
          <div
            key={producto.producto_id || index}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {/* Badge posición */}
            <div className={`flex-shrink-0 w-8 h-8 rounded-full ${getBadgeColor(index)} flex items-center justify-center font-bold text-sm`}>
              {index + 1}
            </div>

            {/* Información producto */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">
                {producto.nombre}
              </p>

              {/* Barra de progreso */}
              <div className="mt-2 bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full ${getProgressColor(index)} transition-all duration-500`}
                  style={{ width: `${producto.porcentaje}%` }}
                ></div>
              </div>

              {/* Métricas */}
              <div className="flex items-center gap-4 mt-1 text-xs text-gray-600">
                <span>
                  <span className="font-semibold text-gray-900">{producto.cantidadVendida}</span> unidades
                </span>
                <span>
                  <span className="font-semibold text-green-600">S/ {Number(producto.totalVendido).toFixed(2)}</span>
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      {productos.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              Total productos vendidos:
            </span>
            <span className="font-semibold text-gray-900">
              {productos.reduce((sum, p) => sum + p.cantidadVendida, 0)} unidades
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

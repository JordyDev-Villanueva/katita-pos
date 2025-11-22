import { Edit2, Power, Package } from 'lucide-react';

export const ProductTable = ({ productos, loading, onEdit, onToggleActive }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando productos...</p>
        </div>
      </div>
    );
  }

  if (!productos || productos.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
        <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600 text-lg font-medium mb-2">No se encontraron productos</p>
        <p className="text-gray-500 text-sm">
          No hay productos que coincidan con los filtros seleccionados
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Vista de tabla para desktop */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Producto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Código
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Categoría
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Precios
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {productos.map((producto) => {
              const bajoStock = producto.stock_total < producto.stock_minimo;

              return (
                <tr key={producto.id} className="hover:bg-gray-50 transition-colors">
                  {/* Producto con imagen */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        {producto.imagen_url ? (
                          <img
                            src={producto.imagen_url}
                            alt={producto.nombre}
                            className="h-10 w-10 rounded-lg object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div
                          className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center"
                          style={{ display: producto.imagen_url ? 'none' : 'flex' }}
                        >
                          <Package className="h-5 w-5 text-gray-400" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {producto.nombre}
                        </div>
                        {producto.descripcion && (
                          <div className="text-xs text-gray-500 truncate max-w-xs">
                            {producto.descripcion}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Código */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-mono text-gray-900">
                      {producto.codigo_barras}
                    </div>
                  </td>

                  {/* Categoría */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {producto.categoria}
                    </span>
                  </td>

                  {/* Precios */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div className="font-medium text-green-600">
                        Venta: S/ {Number(producto.precio_venta).toFixed(2)}
                      </div>
                      <div className="text-gray-500">
                        Compra: S/ {Number(producto.precio_compra).toFixed(2)}
                      </div>
                    </div>
                  </td>

                  {/* Stock */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className={`font-semibold ${bajoStock ? 'text-red-600' : 'text-gray-900'}`}>
                        {producto.stock_total || 0}
                      </div>
                      <div className="text-xs text-gray-500">
                        Mín: {producto.stock_minimo}
                      </div>
                      {bajoStock && (
                        <span className="text-xs text-red-600 font-medium">Bajo stock</span>
                      )}
                    </div>
                  </td>

                  {/* Estado */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        producto.activo
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {producto.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>

                  {/* Acciones */}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onEdit(producto)}
                        className="text-primary-600 hover:text-primary-900 p-2 rounded-lg hover:bg-primary-50 transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => onToggleActive(producto)}
                        className={`p-2 rounded-lg transition-colors ${
                          producto.activo
                            ? 'text-red-600 hover:text-red-900 hover:bg-red-50'
                            : 'text-green-600 hover:text-green-900 hover:bg-green-50'
                        }`}
                        title={producto.activo ? 'Desactivar' : 'Activar'}
                      >
                        <Power className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Vista de cards para móvil */}
      <div className="lg:hidden divide-y divide-gray-200">
        {productos.map((producto) => {
          const bajoStock = producto.stock_total < producto.stock_minimo;

          return (
            <div key={producto.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start gap-3 mb-3">
                {/* Imagen */}
                <div className="flex-shrink-0">
                  {producto.imagen_url ? (
                    <img
                      src={producto.imagen_url}
                      alt={producto.nombre}
                      className="h-16 w-16 rounded-lg object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    className="h-16 w-16 rounded-lg bg-gray-100 flex items-center justify-center"
                    style={{ display: producto.imagen_url ? 'none' : 'flex' }}
                  >
                    <Package className="h-7 w-7 text-gray-400" />
                  </div>
                </div>

                {/* Info principal */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{producto.nombre}</h3>
                  <p className="text-sm text-gray-500 font-mono">{producto.codigo_barras}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {producto.categoria}
                  </span>
                </div>

                {/* Estado */}
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    producto.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {producto.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>

              {/* Detalles */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <p className="text-xs text-gray-500">Precio Venta</p>
                  <p className="text-sm font-semibold text-green-600">S/ {Number(producto.precio_venta).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Precio Compra</p>
                  <p className="text-sm font-medium text-gray-700">S/ {Number(producto.precio_compra).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Stock</p>
                  <p className={`text-sm font-semibold ${bajoStock ? 'text-red-600' : 'text-gray-900'}`}>
                    {producto.stock_total || 0} {bajoStock && <span className="text-xs">(Bajo)</span>}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Stock Mínimo</p>
                  <p className="text-sm font-medium text-gray-700">{producto.stock_minimo}</p>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <button
                  onClick={() => onEdit(producto)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary-50 text-primary-600 hover:bg-primary-100 rounded-lg transition-colors text-sm font-medium"
                >
                  <Edit2 className="h-4 w-4" />
                  Editar
                </button>
                <button
                  onClick={() => onToggleActive(producto)}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                    producto.activo
                      ? 'bg-red-50 text-red-600 hover:bg-red-100'
                      : 'bg-green-50 text-green-600 hover:bg-green-100'
                  }`}
                >
                  <Power className="h-4 w-4" />
                  {producto.activo ? 'Desactivar' : 'Activar'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer con contador */}
      <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
        <p className="text-sm text-gray-600">
          Mostrando <span className="font-semibold">{productos.length}</span> producto(s)
        </p>
      </div>
    </div>
  );
};

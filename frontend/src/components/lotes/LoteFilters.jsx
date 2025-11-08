import { useState } from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from '../common/Button';

export const LoteFilters = ({ productos, onFilterChange, onClearFilters }) => {
  const [filters, setFilters] = useState({
    producto_id: '',
    estado: 'todos',
    diasVencer: '',
    vencidos: false,
  });

  const handleChange = (field, value) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);

    // Construir parámetros para el backend
    const params = {};

    if (newFilters.producto_id) {
      params.producto_id = parseInt(newFilters.producto_id);
    }

    if (newFilters.estado === 'activos') {
      params.activo = true;
    } else if (newFilters.estado === 'agotados') {
      params.activo = false;
    }

    if (newFilters.diasVencer) {
      params.dias_vencer = parseInt(newFilters.diasVencer);
    }

    if (newFilters.vencidos) {
      params.vencidos = true;
    }

    onFilterChange(params);
  };

  const handleClear = () => {
    const emptyFilters = {
      producto_id: '',
      estado: 'todos',
      diasVencer: '',
      vencidos: false,
    };
    setFilters(emptyFilters);
    onClearFilters();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="h-5 w-5 text-gray-600" />
        <h3 className="font-semibold text-gray-900">Filtros de Búsqueda</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Producto */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Producto
          </label>
          <select
            value={filters.producto_id}
            onChange={(e) => handleChange('producto_id', e.target.value)}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Todos los productos</option>
            {productos.map((prod) => (
              <option key={prod.id} value={prod.id}>
                {prod.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Estado */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Estado del Lote
          </label>
          <select
            value={filters.estado}
            onChange={(e) => handleChange('estado', e.target.value)}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="todos">Todos</option>
            <option value="activos">Solo Activos</option>
            <option value="agotados">Solo Agotados</option>
          </select>
        </div>

        {/* Días para vencer */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Por Vencer En
          </label>
          <select
            value={filters.diasVencer}
            onChange={(e) => handleChange('diasVencer', e.target.value)}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Todos</option>
            <option value="3">3 días o menos</option>
            <option value="7">7 días o menos</option>
            <option value="15">15 días o menos</option>
            <option value="30">30 días o menos</option>
          </select>
        </div>

        {/* Checkbox vencidos */}
        <div className="flex items-end">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.vencidos}
              onChange={(e) => handleChange('vencidos', e.target.checked)}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700">Solo lotes vencidos</span>
          </label>
        </div>
      </div>

      {/* Botón limpiar */}
      <div className="mt-4 flex justify-end">
        <Button
          onClick={handleClear}
          variant="secondary"
          size="sm"
          icon={X}
        >
          Limpiar Filtros
        </Button>
      </div>
    </div>
  );
};

import { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';

export const ProductFilters = ({ onFilterChange, onClearFilters }) => {
  const [filters, setFilters] = useState({
    buscar: '',
    categoria: '',
    activo: 'todos',
    bajoStock: false,
  });

  const handleChange = (field, value) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleClear = () => {
    const emptyFilters = {
      buscar: '',
      categoria: '',
      activo: 'todos',
      bajoStock: false,
    };
    setFilters(emptyFilters);
    onClearFilters();
  };

  const categorias = [
    'Bebidas',
    'Abarrotes',
    'Lácteos',
    'Snacks',
    'Limpieza',
    'Cuidado Personal',
    'Panadería',
    'Congelados',
    'Frutas y Verduras',
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Filtros de Búsqueda</h3>
        </div>
        <button
          onClick={handleClear}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors border border-gray-300"
        >
          <X className="h-4 w-4" />
          Limpiar Filtros
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Búsqueda por nombre o código */}
        <div className="lg:col-span-2">
          <Input
            label="Buscar"
            type="text"
            placeholder="Nombre o código de barras..."
            value={filters.buscar}
            onChange={(e) => handleChange('buscar', e.target.value)}
            icon={Search}
          />
        </div>

        {/* Categoría */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Categoría
          </label>
          <select
            value={filters.categoria}
            onChange={(e) => handleChange('categoria', e.target.value)}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Todas</option>
            {categorias.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Estado */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Estado
          </label>
          <select
            value={filters.activo}
            onChange={(e) => handleChange('activo', e.target.value)}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="todos">Todos</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>
        </div>

        {/* Checkbox bajo stock */}
        <div className="flex flex-col">
          <label className="block text-sm font-medium text-gray-700 mb-1.5 invisible">
            Filtro
          </label>
          <label className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-gray-50 rounded-lg cursor-pointer transition-colors border border-gray-300 w-full h-[38px]">
            <input
              type="checkbox"
              checked={filters.bajoStock}
              onChange={(e) => handleChange('bajoStock', e.target.checked)}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-2 focus:ring-primary-500"
            />
            <span className="text-sm font-medium text-gray-700">Bajo Stock</span>
          </label>
        </div>
      </div>
    </div>
  );
};

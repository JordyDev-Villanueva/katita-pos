import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { ImagePreview } from './ImagePreview';

export const ProductForm = ({ isOpen, onClose, onSubmit, producto = null, loading = false }) => {
  const [formData, setFormData] = useState({
    codigo_barras: '',
    nombre: '',
    descripcion: '',
    categoria: '',
    precio_compra: '',
    precio_venta: '',
    stock_minimo: '',
    imagen_url: '',
    activo: true,
  });

  const [errors, setErrors] = useState({});

  // Cargar datos si es edición
  useEffect(() => {
    if (producto) {
      setFormData({
        codigo_barras: producto.codigo_barras || '',
        nombre: producto.nombre || '',
        descripcion: producto.descripcion || '',
        categoria: producto.categoria || '',
        precio_compra: producto.precio_compra || '',
        precio_venta: producto.precio_venta || '',
        stock_minimo: producto.stock_minimo || '',
        imagen_url: producto.imagen_url || '',
        activo: producto.activo ?? true,
      });
    } else {
      // Reset form cuando se cierra y abre para nuevo producto
      setFormData({
        codigo_barras: '',
        nombre: '',
        descripcion: '',
        categoria: '',
        precio_compra: '',
        precio_venta: '',
        stock_minimo: '',
        imagen_url: '',
        activo: true,
      });
      setErrors({});
    }
  }, [producto, isOpen]);

  if (!isOpen) return null;

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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Limpiar error del campo
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.codigo_barras.trim()) {
      newErrors.codigo_barras = 'El código de barras es requerido';
    }

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }

    if (!formData.categoria) {
      newErrors.categoria = 'La categoría es requerida';
    }

    const precioCompra = parseFloat(formData.precio_compra);
    if (!formData.precio_compra || precioCompra <= 0) {
      newErrors.precio_compra = 'El precio de compra debe ser mayor a 0';
    }

    const precioVenta = parseFloat(formData.precio_venta);
    if (!formData.precio_venta || precioVenta <= 0) {
      newErrors.precio_venta = 'El precio de venta debe ser mayor a 0';
    }

    if (precioVenta <= precioCompra) {
      newErrors.precio_venta = 'El precio de venta debe ser mayor al precio de compra';
    }

    const stockMinimo = parseInt(formData.stock_minimo);
    if (formData.stock_minimo === '' || stockMinimo < 0) {
      newErrors.stock_minimo = 'El stock mínimo debe ser mayor o igual a 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    // Preparar datos para enviar
    const dataToSubmit = {
      ...formData,
      precio_compra: parseFloat(formData.precio_compra),
      precio_venta: parseFloat(formData.precio_venta),
      stock_minimo: parseInt(formData.stock_minimo),
    };

    onSubmit(dataToSubmit);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[98vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-primary-600 text-white p-4 rounded-t-2xl flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                {producto ? 'Editar Producto' : 'Nuevo Producto'}
              </h2>
              <p className="text-primary-100 text-sm mt-1">
                {producto ? 'Modifica los datos del producto' : 'Completa todos los campos requeridos'}
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

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Columna Izquierda */}
            <div className="space-y-3">
              <Input
                label="Código de Barras"
                name="codigo_barras"
                type="text"
                value={formData.codigo_barras}
                onChange={handleChange}
                error={errors.codigo_barras}
                required
                disabled={!!producto}
                placeholder="7750670009999"
              />

              <Input
                label="Nombre del Producto"
                name="nombre"
                type="text"
                value={formData.nombre}
                onChange={handleChange}
                error={errors.nombre}
                required
                placeholder="Coca Cola 500ml"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Categoría <span className="text-red-500">*</span>
                </label>
                <select
                  name="categoria"
                  value={formData.categoria}
                  onChange={handleChange}
                  className={`block w-full rounded-lg border px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.categoria ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Selecciona una categoría</option>
                  {categorias.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                {errors.categoria && (
                  <p className="mt-1.5 text-sm text-red-600">{errors.categoria}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Precio de Compra"
                  name="precio_compra"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.precio_compra}
                  onChange={handleChange}
                  error={errors.precio_compra}
                  required
                  placeholder="2.50"
                />

                <Input
                  label="Precio de Venta"
                  name="precio_venta"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.precio_venta}
                  onChange={handleChange}
                  error={errors.precio_venta}
                  required
                  placeholder="3.50"
                />
              </div>

              <Input
                label="Stock Mínimo"
                name="stock_minimo"
                type="number"
                min="0"
                value={formData.stock_minimo}
                onChange={handleChange}
                error={errors.stock_minimo}
                required
                placeholder="10"
              />

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="activo"
                  checked={formData.activo}
                  onChange={handleChange}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-700">Producto Activo</span>
              </label>
            </div>

            {/* Columna Derecha - Preview de Imagen */}
            <div>
              <ImagePreview
                url={formData.imagen_url}
                onUrlChange={(url) => setFormData(prev => ({ ...prev, imagen_url: url }))}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="mt-4 pt-4 border-t flex gap-3">
            <Button
              type="button"
              onClick={onClose}
              variant="secondary"
              fullWidth
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
            >
              {producto ? 'Guardar Cambios' : 'Crear Producto'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

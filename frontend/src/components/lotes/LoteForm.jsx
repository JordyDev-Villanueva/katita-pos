import { useState } from 'react';
import { X, Package, Calendar, DollarSign } from 'lucide-react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';

export const LoteForm = ({ isOpen, onClose, onSubmit, productos, loading = false }) => {
  const [formData, setFormData] = useState({
    producto_id: '',
    cantidad_inicial: '',
    fecha_vencimiento: '',
    precio_compra_lote: '',
    proveedor: '',
    ubicacion: '',
    notas: '',
  });

  const [errors, setErrors] = useState({});
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Limpiar error del campo
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    // Si cambia el producto, actualizar info
    if (name === 'producto_id' && value) {
      const producto = productos.find(p => p.id === parseInt(value));
      setProductoSeleccionado(producto);

      // Pre-llenar precio de compra con el del producto
      if (producto && !formData.precio_compra_lote) {
        setFormData(prev => ({
          ...prev,
          precio_compra_lote: producto.precio_compra || ''
        }));
      }
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.producto_id) {
      newErrors.producto_id = 'Selecciona un producto';
    }

    const cantidad = parseInt(formData.cantidad_inicial);
    if (!formData.cantidad_inicial || cantidad <= 0) {
      newErrors.cantidad_inicial = 'La cantidad debe ser mayor a 0';
    }

    if (!formData.fecha_vencimiento) {
      newErrors.fecha_vencimiento = 'La fecha de vencimiento es requerida';
    } else {
      const fechaVenc = new Date(formData.fecha_vencimiento);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      if (fechaVenc <= hoy) {
        newErrors.fecha_vencimiento = 'La fecha debe ser posterior a hoy';
      }
    }

    const precio = parseFloat(formData.precio_compra_lote);
    if (!formData.precio_compra_lote || precio <= 0) {
      newErrors.precio_compra_lote = 'El precio debe ser mayor a 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const dataToSubmit = {
      producto_id: parseInt(formData.producto_id),
      cantidad_inicial: parseInt(formData.cantidad_inicial),
      fecha_vencimiento: formData.fecha_vencimiento,
      precio_compra_lote: parseFloat(formData.precio_compra_lote),
      proveedor: formData.proveedor || null,
      ubicacion: formData.ubicacion || null,
      notas: formData.notas || null,
    };

    onSubmit(dataToSubmit);
  };

  // Calcular fecha mínima (mañana) usando fecha local
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const day = String(tomorrow.getDate()).padStart(2, '0');
  const minDate = `${year}-${month}-${day}`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-green-600 text-white p-6 rounded-t-2xl sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <Package className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Registrar Ingreso de Mercadería</h2>
                <p className="text-green-100 text-sm mt-1">
                  Crea un nuevo lote y actualiza el stock automáticamente
                </p>
              </div>
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
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Producto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Producto <span className="text-red-500">*</span>
              </label>
              <select
                name="producto_id"
                value={formData.producto_id}
                onChange={handleChange}
                className={`block w-full rounded-lg border px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.producto_id ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Selecciona un producto</option>
                {productos
                  .filter(p => p.activo)
                  .map((producto) => (
                    <option key={producto.id} value={producto.id}>
                      {producto.nombre} - {producto.codigo_barras}
                    </option>
                  ))}
              </select>
              {errors.producto_id && (
                <p className="mt-1.5 text-sm text-red-600">{errors.producto_id}</p>
              )}
            </div>

            {/* Info del producto seleccionado */}
            {productoSeleccionado && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-blue-900 mb-2">
                  Información del Producto:
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-blue-600">Categoría:</span>{' '}
                    <span className="text-blue-900">{productoSeleccionado.categoria}</span>
                  </div>
                  <div>
                    <span className="text-blue-600">Stock Actual:</span>{' '}
                    <span className="text-blue-900">{productoSeleccionado.stock_total || 0}</span>
                  </div>
                  <div>
                    <span className="text-blue-600">Precio Compra:</span>{' '}
                    <span className="text-blue-900">S/ {Number(productoSeleccionado.precio_compra).toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-blue-600">Precio Venta:</span>{' '}
                    <span className="text-blue-900">S/ {Number(productoSeleccionado.precio_venta).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cantidad */}
              <Input
                label="Cantidad de Unidades"
                name="cantidad_inicial"
                type="number"
                min="1"
                value={formData.cantidad_inicial}
                onChange={handleChange}
                error={errors.cantidad_inicial}
                required
                placeholder="100"
                icon={Package}
              />

              {/* Fecha de vencimiento */}
              <Input
                label="Fecha de Vencimiento"
                name="fecha_vencimiento"
                type="date"
                min={minDate}
                value={formData.fecha_vencimiento}
                onChange={handleChange}
                error={errors.fecha_vencimiento}
                required
                icon={Calendar}
              />

              {/* Precio de compra del lote */}
              <Input
                label="Precio de Compra (por unidad)"
                name="precio_compra_lote"
                type="number"
                step="0.01"
                min="0"
                value={formData.precio_compra_lote}
                onChange={handleChange}
                error={errors.precio_compra_lote}
                required
                placeholder="2.50"
                icon={DollarSign}
              />

              {/* Proveedor */}
              <Input
                label="Proveedor (Opcional)"
                name="proveedor"
                type="text"
                value={formData.proveedor}
                onChange={handleChange}
                placeholder="Nombre del proveedor"
              />
            </div>

            {/* Ubicación */}
            <Input
              label="Ubicación en Bodega (Opcional)"
              name="ubicacion"
              type="text"
              value={formData.ubicacion}
              onChange={handleChange}
              placeholder="Ej: Estante A3, Refrigerador 2"
            />

            {/* Notas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Notas (Opcional)
              </label>
              <textarea
                name="notas"
                value={formData.notas}
                onChange={handleChange}
                rows="2"
                className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                placeholder="Ej: Lote con empaque dañado, promoción especial, etc..."
              />
            </div>

            {/* Resumen del ingreso */}
            {formData.cantidad_inicial && formData.precio_compra_lote && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-green-900 mb-2">
                  Resumen del Ingreso:
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-green-700">Valor Total del Lote:</span>
                  <span className="text-2xl font-bold text-green-600">
                    S/ {(parseFloat(formData.cantidad_inicial) * parseFloat(formData.precio_compra_lote)).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-6 pt-6 border-t flex gap-3">
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
              variant="success"
              fullWidth
              loading={loading}
            >
              Registrar Ingreso
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

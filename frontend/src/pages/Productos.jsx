import { useState, useEffect } from 'react';
import { Plus, RefreshCw, CheckCircle } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { ProductStats } from '../components/productos/ProductStats';
import { ProductFilters } from '../components/productos/ProductFilters';
import { ProductTable } from '../components/productos/ProductTable';
import { ProductForm } from '../components/productos/ProductForm';
import { Button } from '../components/common/Button';
import { productsAPI } from '../api/products';
import { lotesAPI } from '../api/lotes';
import toast from 'react-hot-toast';

export const Productos = () => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [filters, setFilters] = useState({});
  const [showUpdatedBadge, setShowUpdatedBadge] = useState(false);
  const [lotes, setLotes] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    activos: 0,
    bajoStock: 0,
    valorInventario: 0,
  });

  useEffect(() => {
    const init = async () => {
      const lotesArray = await loadLotes(); // Cargar lotes primero y obtener array
      loadProducts({}, lotesArray); // Pasar lotes a loadProducts
    };
    init();
  }, []);

  const loadProducts = async (filterParams = {}, lotesArray = lotes) => {
    try {
      console.log('\n='.repeat(60));
      console.log('[DEBUG FRONTEND] Cargando productos...');
      console.log('='.repeat(60));
      console.log('Parametros de filtro:', filterParams);
      console.log('Lotes disponibles para cálculo:', lotesArray.length);

      setLoading(true);
      const response = await productsAPI.listProducts(filterParams);

      console.log('Respuesta completa del backend:');
      console.log('  - success:', response.success);
      console.log('  - message:', response.message);
      console.log('  - data type:', typeof response.data);
      console.log('  - data keys:', response.data ? Object.keys(response.data) : 'null');

      let productosArray = [];

      // CORRECCIÓN: El backend retorna { data: { productos: [...] } }
      if (response.success) {
        if (Array.isArray(response.data)) {
          console.log('  → Caso 1: response.data es array directo');
          productosArray = response.data;
        } else if (response.data && Array.isArray(response.data.productos)) {
          console.log('  → Caso 2: response.data.productos es array (CORRECTO)');
          productosArray = response.data.productos;
        } else if (response.data && Array.isArray(response.data.data)) {
          console.log('  → Caso 3: response.data.data es array');
          productosArray = response.data.data;
        }
      }

      console.log('Productos extraidos:', productosArray.length);
      if (productosArray.length > 0) {
        console.log('Primeros 3 productos:');
        productosArray.slice(0, 3).forEach((p, i) => {
          console.log(`  ${i + 1}. ${p.nombre} (${p.codigo_barras}) - Activo: ${p.activo}`);
        });
      } else {
        console.warn('⚠ ADVERTENCIA: Array de productos VACIO');
      }
      console.log('='.repeat(60) + '\n');

      setProductos(productosArray);
      calculateStats(productosArray, lotesArray);

    } catch (error) {
      console.error('Error cargando productos:', error);
      toast.error('Error al cargar productos');
      setProductos([]);
    } finally {
      setLoading(false);
    }
  };

  const loadLotes = async () => {
    try {
      const response = await lotesAPI.listLotes({ limit: 500 });
      const lotesArray = response.success && Array.isArray(response.data?.lotes)
        ? response.data.lotes
        : [];
      setLotes(lotesArray);
      return lotesArray;
    } catch (error) {
      console.error('Error cargando lotes:', error);
      return [];
    }
  };

  const calculateStats = (productos, lotesArray = lotes) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    // Función para verificar si un producto tiene al menos un lote válido (no vencido con stock)
    const tieneStockValido = (productoId) => {
      const lotesProducto = lotesArray.filter(l => l.producto_id === productoId);
      return lotesProducto.some(lote => {
        if (lote.cantidad_actual <= 0) return false;
        const fechaVenc = new Date(lote.fecha_vencimiento);
        fechaVenc.setHours(0, 0, 0, 0);
        const diff = Math.ceil((fechaVenc - hoy) / (1000 * 60 * 60 * 24));
        return diff > 0; // Tiene stock Y no está vencido
      });
    };

    // Activos: productos activos Y con al menos un lote válido
    const activos = productos.filter(p => p.activo && tieneStockValido(p.id)).length;
    const bajoStock = productos.filter(p => p.stock_total < p.stock_minimo).length;
    const valorInventario = productos.reduce((sum, p) => {
      return sum + (p.stock_total * p.precio_compra);
    }, 0);

    setStats({
      total: productos.length,
      activos,
      bajoStock,
      valorInventario,
    });
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);

    const params = {};

    if (newFilters.buscar) {
      params.buscar = newFilters.buscar;
    }

    if (newFilters.categoria) {
      params.categoria = newFilters.categoria;
    }

    if (newFilters.activo !== 'todos') {
      params.activo = newFilters.activo === 'true';
    }

    if (newFilters.bajoStock) {
      params.bajo_stock = true;
    }

    loadProducts(params, lotes);
  };

  const handleClearFilters = () => {
    setFilters({});
    loadProducts({}, lotes);
  };

  const handleNewProduct = () => {
    setSelectedProduct(null);
    setShowForm(true);
  };

  const handleEditProduct = (producto) => {
    setSelectedProduct(producto);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setSelectedProduct(null);
  };

  const handleSubmitForm = async (formData) => {
    try {
      setFormLoading(true);

      let response;
      if (selectedProduct) {
        // Editar producto existente
        response = await productsAPI.updateProduct(selectedProduct.id, formData);
        toast.success('Producto actualizado correctamente');
      } else {
        // Crear nuevo producto
        response = await productsAPI.createProduct(formData);
        toast.success('Producto creado correctamente');
      }

      if (response.success) {
        handleCloseForm();
        const lotesArray = await loadLotes(); // Recargar lotes y obtener array
        loadProducts(filters, lotesArray);
      }

    } catch (error) {
      console.error('Error guardando producto:', error);
      const message = error.response?.data?.message || 'Error al guardar producto';
      toast.error(message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleActive = async (producto) => {
    const accion = producto.activo ? 'desactivar' : 'activar';

    if (!window.confirm(`¿Estás seguro de ${accion} este producto?`)) {
      return;
    }

    try {
      const response = await productsAPI.updateProduct(producto.id, {
        activo: !producto.activo,
      });

      if (response.success) {
        toast.success(`Producto ${accion === 'activar' ? 'activado' : 'desactivado'} correctamente`);
        loadProducts(filters, lotes);
      }

    } catch (error) {
      console.error('Error actualizando producto:', error);
      toast.error('Error al actualizar producto');
    }
  };

  const handleRefreshProducts = async () => {
    const lotesArray = await loadLotes(); // Recargar lotes primero y obtener array
    loadProducts(filters, lotesArray);
    setShowUpdatedBadge(true);
    setTimeout(() => setShowUpdatedBadge(false), 2000);
  };

  return (
    <Layout>
      <div className="p-4 lg:p-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Gestión de Productos</h1>
            <p className="text-gray-600 mt-1 text-sm lg:text-base">
              Administra el catálogo completo de productos del minimarket
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Badge "Datos actualizados" */}
            {showUpdatedBadge && (
              <div className="flex items-center gap-2 bg-green-100 text-green-700 px-3 py-2 rounded-lg animate-fade-in">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Datos actualizados</span>
              </div>
            )}

            {/* Botón Recargar */}
            <button
              onClick={handleRefreshProducts}
              className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="text-sm font-medium">Recargar</span>
            </button>

            {/* Botón Nuevo Producto */}
            <button
              onClick={handleNewProduct}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Nuevo Producto</span>
            </button>
          </div>
        </div>

        {/* Estadísticas */}
        <ProductStats stats={stats} />

        {/* Filtros */}
        <ProductFilters
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
        />

        {/* Tabla */}
        <ProductTable
          productos={productos}
          loading={loading}
          onEdit={handleEditProduct}
          onToggleActive={handleToggleActive}
        />
      </div>

      {/* Modal Formulario */}
      <ProductForm
        isOpen={showForm}
        onClose={handleCloseForm}
        onSubmit={handleSubmitForm}
        producto={selectedProduct}
        loading={formLoading}
      />
    </Layout>
  );
};

import { useState, useEffect } from 'react';
import { Plus, RefreshCw, CheckCircle } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { ProductStats } from '../components/productos/ProductStats';
import { ProductFilters } from '../components/productos/ProductFilters';
import { ProductTable } from '../components/productos/ProductTable';
import { ProductForm } from '../components/productos/ProductForm';
import { Button } from '../components/common/Button';
import { productsAPI } from '../api/products';
import toast from 'react-hot-toast';

export const Productos = () => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [filters, setFilters] = useState({});
  const [showUpdatedBadge, setShowUpdatedBadge] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    activos: 0,
    bajoStock: 0,
    valorInventario: 0,
  });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async (filterParams = {}) => {
    try {
      console.log('\n='.repeat(60));
      console.log('[DEBUG FRONTEND] Cargando productos...');
      console.log('='.repeat(60));
      console.log('Parametros de filtro:', filterParams);

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
      calculateStats(productosArray);

    } catch (error) {
      console.error('Error cargando productos:', error);
      toast.error('Error al cargar productos');
      setProductos([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (productos) => {
    const activos = productos.filter(p => p.activo).length;
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

    loadProducts(params);
  };

  const handleClearFilters = () => {
    setFilters({});
    loadProducts();
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
        loadProducts(filters);
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
        loadProducts(filters);
      }

    } catch (error) {
      console.error('Error actualizando producto:', error);
      toast.error('Error al actualizar producto');
    }
  };

  const handleRefreshProducts = () => {
    loadProducts(filters);
    setShowUpdatedBadge(true);
    setTimeout(() => setShowUpdatedBadge(false), 2000);
  };

  return (
    <Layout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Productos</h1>
            <p className="text-gray-600 mt-1">
              Administra el catálogo completo de productos del minimarket
            </p>
          </div>

          <div className="flex items-center gap-3">
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

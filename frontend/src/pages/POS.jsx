import { useState, useEffect } from 'react';
import { Layout } from '../components/layout/Layout';
import { SearchBar } from '../components/pos/SearchBar';
import { ProductGrid } from '../components/pos/ProductGrid';
import { Cart } from '../components/pos/Cart';
import { PaymentModal } from '../components/pos/PaymentModal';
import { productsAPI } from '../api/products';
import { ventasAPI } from '../api/ventas';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';

export const POS = () => {
  const { user } = useAuth();

  // Estados
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Cargar productos al iniciar
  useEffect(() => {
    loadProducts();
  }, []);

  // Cargar todos los productos activos
  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await productsAPI.listProducts({ activo: true, limit: 100 });

      // CORRECCIÓN: Extraer productos correctamente
      let productosArray = [];

      if (response.success) {
        // Intentar diferentes estructuras de respuesta
        if (Array.isArray(response.data)) {
          productosArray = response.data;
        } else if (response.data && Array.isArray(response.data.data)) {
          productosArray = response.data.data;
        } else if (Array.isArray(response.products)) {
          productosArray = response.products;
        }
      }

      console.log('Productos cargados:', productosArray); // Para debugging
      setProductos(productosArray);

    } catch (error) {
      console.error('Error cargando productos:', error);
      toast.error('Error al cargar productos');
      setProductos([]); // Asegurar que sea array vacío en caso de error
    } finally {
      setLoading(false);
    }
  };

  // Buscar producto (por código de barras o nombre)
  const handleSearch = async (searchTerm) => {
    try {
      setLoading(true);

      // Si parece código de barras (solo números)
      if (/^\d+$/.test(searchTerm)) {
        const response = await productsAPI.searchByBarcode(searchTerm);
        if (response.success && response.data) {
          // Agregar automáticamente al carrito
          addToCart(response.data);
          toast.success(`${response.data.nombre} agregado al carrito`);
        } else {
          toast.error('Producto no encontrado');
        }
      } else {
        // Búsqueda por nombre
        const response = await productsAPI.searchByName(searchTerm);

        // CORRECCIÓN: Extraer productos correctamente
        let productosArray = [];

        if (response.success) {
          if (Array.isArray(response.data)) {
            productosArray = response.data;
          } else if (response.data && Array.isArray(response.data.data)) {
            productosArray = response.data.data;
          } else if (Array.isArray(response.products)) {
            productosArray = response.products;
          }
        }

        console.log('Resultados búsqueda:', productosArray); // Para debugging
        setProductos(productosArray);

        if (productosArray.length === 0) {
          toast.error('No se encontraron productos');
        }
      }
    } catch (error) {
      console.error('Error buscando producto:', error);
      toast.error('Error al buscar producto');
      setProductos([]); // Asegurar array vacío
    } finally {
      setLoading(false);
    }
  };

  // Agregar producto al carrito
  const addToCart = (producto) => {
    if (producto.stock_total <= 0) {
      toast.error('Producto sin stock');
      return;
    }

    const existingItem = cart.find(item => item.producto_id === producto.id);

    if (existingItem) {
      // Si ya existe, aumentar cantidad
      if (existingItem.cantidad >= producto.stock_total) {
        toast.error('No hay más stock disponible');
        return;
      }

      setCart(cart.map(item =>
        item.producto_id === producto.id
          ? { ...item, cantidad: item.cantidad + 1 }
          : item
      ));
      toast.success('Cantidad actualizada');
    } else {
      // Agregar nuevo item
      setCart([...cart, {
        producto_id: producto.id,
        nombre: producto.nombre,
        precio_unitario: producto.precio_venta,
        cantidad: 1,
        stock_disponible: producto.stock_total,
        imagen_url: producto.imagen_url,
      }]);
      toast.success(`${producto.nombre} agregado`);
    }
  };

  // Actualizar cantidad de un item
  const updateQuantity = (productoId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productoId);
      return;
    }

    const item = cart.find(i => i.producto_id === productoId);
    if (newQuantity > item.stock_disponible) {
      toast.error('Stock insuficiente');
      return;
    }

    setCart(cart.map(item =>
      item.producto_id === productoId
        ? { ...item, cantidad: newQuantity }
        : item
    ));
  };

  // Eliminar item del carrito
  const removeFromCart = (productoId) => {
    setCart(cart.filter(item => item.producto_id !== productoId));
    toast.success('Producto eliminado del carrito');
  };

  // Limpiar carrito
  const clearCart = () => {
    if (window.confirm('¿Estás seguro de limpiar el carrito?')) {
      setCart([]);
      toast.success('Carrito limpiado');
    }
  };

  // Abrir modal de pago
  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error('El carrito está vacío');
      return;
    }
    setShowPaymentModal(true);
  };

  // Procesar venta
  const handleConfirmPayment = async (paymentData) => {
    try {
      // Preparar datos de la venta
      const ventaData = {
        items: cart.map(item => ({
          producto_id: item.producto_id,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
        })),
        metodo_pago: paymentData.metodo_pago,
        monto_recibido: paymentData.monto_recibido || null,
      };

      // Enviar al backend
      const response = await ventasAPI.createVenta(ventaData);

      if (response.success) {
        toast.success('¡Venta procesada exitosamente!', { duration: 4000 });

        // Mostrar información de la venta
        const venta = response.data;
        if (paymentData.metodo_pago === 'efectivo' && venta.cambio > 0) {
          toast.success(`Cambio: S/ ${venta.cambio.toFixed(2)}`, { duration: 5000 });
        }

        // Limpiar carrito y cerrar modal
        setCart([]);
        setShowPaymentModal(false);

        // Recargar productos para actualizar stock
        loadProducts();
      }
    } catch (error) {
      console.error('Error procesando venta:', error);
      const message = error.response?.data?.message || 'Error al procesar la venta';
      toast.error(message);
    }
  };

  const total = cart.reduce((sum, item) => sum + (item.cantidad * item.precio_unitario), 0);

  return (
    <Layout>
      <div className="flex h-screen bg-gray-50">
        {/* Área principal de productos */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Punto de Venta
              </h1>
              <p className="text-gray-600">
                Vendedor: <span className="font-semibold">{user?.nombre_completo}</span>
              </p>
            </div>

            {/* Barra de búsqueda */}
            <SearchBar
              onProductFound={addToCart}
              onSearch={handleSearch}
            />

            {/* Grid de productos */}
            <ProductGrid
              productos={productos}
              loading={loading}
              onAddToCart={addToCart}
            />
          </div>
        </div>

        {/* Carrito lateral */}
        <div className="w-96 bg-white border-l border-gray-200 flex-shrink-0">
          <Cart
            items={cart}
            onUpdateQuantity={updateQuantity}
            onRemove={removeFromCart}
            onClearCart={clearCart}
            onCheckout={handleCheckout}
          />
        </div>
      </div>

      {/* Modal de pago */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        total={total}
        onConfirmPayment={handleConfirmPayment}
      />
    </Layout>
  );
};

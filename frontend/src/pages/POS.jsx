import { useState, useEffect } from 'react';
import { Layout } from '../components/layout/Layout';
import { ProductGrid } from '../components/pos/ProductGrid';
import { Cart } from '../components/pos/Cart';
import { PaymentModal } from '../components/pos/PaymentModal';
import { productsAPI } from '../api/products';
import { ventasAPI } from '../api/ventas';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import { ShoppingCart, Package, Search, X, Barcode } from 'lucide-react';

export const POS = () => {
  const { user } = useAuth();

  // Estados
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [customToast, setCustomToast] = useState({ show: false, message: '' });
  const [searchNotification, setSearchNotification] = useState(null); // { type: 'success' | 'error' | 'warning', message: 'texto' }

  // Estados para búsqueda profesional
  const [searchQuery, setSearchQuery] = useState('');
  const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
  const [buscando, setBuscando] = useState(false);

  // Función para mostrar toast personalizado
  const showCustomToast = (message) => {
    setCustomToast({ show: true, message });

    // Auto-ocultar después de 2 segundos
    setTimeout(() => {
      setCustomToast({ show: false, message: '' });
    }, 2000);
  };

  // Función para mostrar notificación de búsqueda
  const showSearchNotification = (type, message) => {
    setSearchNotification({ type, message });

    // Auto-ocultar después de 3 segundos
    setTimeout(() => {
      setSearchNotification(null);
    }, 3000);
  };

  // Detectar si es código de barras (8-13 dígitos numéricos)
  const esCodigoBarras = (query) => {
    const regex = /^\d{8,13}$/;
    return regex.test(query.trim());
  };

  // Función de búsqueda inteligente con comportamiento dual
  const buscarProductos = async (query) => {
    if (!query.trim()) {
      setResultadosBusqueda([]);
      setSearchNotification(null);
      return;
    }

    try {
      setBuscando(true);

      // CASO 1: ES CÓDIGO DE BARRAS (solo números, 8-13 dígitos) - AGREGAR AUTOMÁTICAMENTE
      if (esCodigoBarras(query)) {
        console.log('🔍 Búsqueda por código de barras:', query);

        // Buscar producto por código de barras
        const response = await productsAPI.searchByBarcode(query);

        if (response.success && response.data) {
          // AGREGAR DIRECTAMENTE AL CARRITO (sin mostrar tarjeta)
          addToCart(response.data);

          // Limpiar input y resultados
          setSearchQuery('');
          setResultadosBusqueda([]);
        } else {
          // Código de barras no encontrado
          setResultadosBusqueda([]);
          showSearchNotification('error', 'Código de barras no encontrado');
        }
      }
      // CASO 2: ES BÚSQUEDA MANUAL (contiene letras) - MOSTRAR TARJETAS
      else {
        console.log('🔍 Búsqueda manual por nombre:', query);

        // Búsqueda por nombre con backend
        const response = await productsAPI.searchByName(query);

        // Extraer productos correctamente
        let productosArray = [];

        if (response.success) {
          if (Array.isArray(response.data)) {
            productosArray = response.data;
          } else if (response.data && Array.isArray(response.data.productos)) {
            productosArray = response.data.productos;
          } else if (Array.isArray(response.products)) {
            productosArray = response.products;
          }
        }

        console.log('📦 Productos encontrados:', productosArray.length);

        if (productosArray.length > 0) {
          // MOSTRAR TARJETAS DE RESULTADOS
          setResultadosBusqueda(productosArray);
          setSearchNotification(null);
        } else {
          // No se encontraron productos
          setResultadosBusqueda([]);
          showSearchNotification('error', 'No se encontraron productos');
        }
      }
    } catch (error) {
      console.error('Error en búsqueda:', error);
      setResultadosBusqueda([]);
      showSearchNotification('error', 'Error al buscar producto');
    } finally {
      setBuscando(false);
    }
  };

  // Manejo de cambio en el input de búsqueda (con debounce inteligente)
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Limpiar timeout anterior
    clearTimeout(window.searchTimeout);

    // Si es código de barras completo (8-13 dígitos), buscar inmediatamente
    if (esCodigoBarras(query)) {
      buscarProductos(query);
    } else {
      // Si es búsqueda manual, esperar 300ms (debounce)
      window.searchTimeout = setTimeout(() => {
        buscarProductos(query);
      }, 300);
    }
  };

  // Agregar producto al carrito desde los resultados de búsqueda
  const agregarDesdeResultados = (producto) => {
    addToCart(producto);
    setSearchQuery('');
    setResultadosBusqueda([]);
  };

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
      showCustomToast('Cantidad actualizada');
    } else {
      // Agregar nuevo item
      console.log('➕ Agregando producto al carrito:', producto);
      console.log('Precio venta:', producto.precio_venta);
      console.log('Precio compra:', producto.precio_compra);

      // CORRECCIÓN: Incluir precio_compra del producto
      const precioCompra = producto.precio_compra || (producto.precio_venta * 0.60);

      if (!producto.precio_compra) {
        console.warn(`⚠️ Producto "${producto.nombre}" sin precio_compra, estimando: S/ ${precioCompra.toFixed(2)}`);
      }

      const nuevoItem = {
        producto_id: producto.id,
        nombre: producto.nombre,
        precio_unitario: producto.precio_venta,
        precio_compra: precioCompra,  // ✅ AGREGADO
        cantidad: 1,
        stock_disponible: producto.stock_total,
        imagen_url: producto.imagen_url,
      };

      console.log('Item agregado:', nuevoItem);

      setCart([...cart, nuevoItem]);
      showCustomToast(`${producto.nombre} agregado`);
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
    showCustomToast('Producto eliminado del carrito');
  };

  // Limpiar carrito
  const clearCart = () => {
    if (window.confirm('¿Estás seguro de limpiar el carrito?')) {
      setCart([]);
      showCustomToast('Carrito limpiado');
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
      console.log('💳 Preparando venta...');
      console.log('Carrito completo:', cart);

      // Preparar datos de la venta
      const ventaData = {
        items: cart.map((item, idx) => {
          console.log(`--- Item ${idx + 1} ---`);
          console.log('  Item completo:', item);
          console.log('  precio_unitario:', item.precio_unitario);
          console.log('  precio_compra:', item.precio_compra);

          // CORRECCIÓN CRÍTICA: Incluir precio_compra_unitario
          const precioCompra = item.precio_compra || item.precio_compra_unitario || (item.precio_unitario * 0.60);

          console.log('  precio_compra_unitario a usar:', precioCompra);

          return {
            producto_id: item.producto_id,
            cantidad: item.cantidad,
            precio_unitario: item.precio_unitario,
            precio_compra_unitario: precioCompra  // ✅ AGREGADO
          };
        }),
        metodo_pago: paymentData.metodo_pago,
        monto_recibido: paymentData.monto_recibido || null,
      };

      console.log('📦 ventaData construido:', ventaData);

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
            {/* Header Principal con Badge de Notificación */}
            <div className="mb-6 flex items-start justify-between">
              {/* Lado izquierdo: Título */}
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Punto de Venta
                </h1>
                <p className="text-gray-600">
                  Vendedor: <span className="font-semibold">{user?.nombre_completo}</span>
                </p>
              </div>

              {/* Lado derecho: Badge de notificación + Toast personalizado */}
              <div className="flex items-center gap-3">
                {/* Badge de notificación de búsqueda - AL LADO IZQUIERDO */}
                {searchNotification && (
                  <div
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg animate-fade-in ${searchNotification.type === 'success'
                      ? 'bg-green-100 text-green-700'
                      : searchNotification.type === 'error'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                      }`}
                  >
                    {searchNotification.type === 'success' && (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {searchNotification.type === 'error' && (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                    <span className="text-sm font-medium">{searchNotification.message}</span>
                  </div>
                )}

                {/* Toast personalizado para acciones del carrito */}
                {customToast.show && (
                  <div className="px-4 py-2 bg-green-500 text-white rounded-lg shadow-lg flex items-center gap-2 animate-fade-in">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="font-medium">{customToast.message}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Barra de búsqueda profesional */}
            <div className="mb-4">
              <div className="relative">
                <Barcode className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && resultadosBusqueda.length === 1) {
                      agregarDesdeResultados(resultadosBusqueda[0]);
                    }
                  }}
                  placeholder="Escanea código de barras o busca por nombre del producto..."
                  className="w-full pl-10 pr-12 py-4 text-lg border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  autoFocus
                />
                {buscando && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
                  </div>
                )}
              </div>

              <p className="text-sm text-gray-600 mt-2">
                💡 Usa la pistola escáner o escribe manualmente el código/nombre del producto
              </p>
            </div>

            {/* Resultados de búsqueda */}
            {resultadosBusqueda.length > 0 && (
              <div className="mb-6 bg-white rounded-lg border-2 border-blue-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Resultados de búsqueda ({resultadosBusqueda.length})
                  </h3>
                  <button
                    onClick={() => {
                      setResultadosBusqueda([]);
                      setSearchQuery('');
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {resultadosBusqueda.map((producto) => (
                    <div
                      key={producto.id}
                      className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all"
                    >
                      {/* Nombre del producto */}
                      <div className="flex items-start gap-2 mb-2">
                        <Package className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800">{producto.nombre}</h4>
                          {producto.descripcion && (
                            <p className="text-xs text-gray-500">{producto.descripcion}</p>
                          )}
                        </div>
                      </div>

                      {/* Información del producto */}
                      <div className="space-y-1 mb-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Precio:</span>
                          <span className="font-semibold text-green-600">S/ {producto.precio_venta.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Stock:</span>
                          <span className={`font-semibold ${producto.stock_total > producto.stock_minimo
                            ? 'text-green-600'
                            : 'text-yellow-600'
                            }`}>
                            {producto.stock_total} unidades
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Código: {producto.codigo_barras}
                        </div>
                      </div>

                      {/* Botón agregar */}
                      <button
                        onClick={() => agregarDesdeResultados(producto)}
                        disabled={producto.stock_total <= 0}
                        className={`w-full py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${producto.stock_total > 0
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                      >
                        <ShoppingCart className="w-4 h-4" />
                        {producto.stock_total > 0 ? 'Agregar al Carrito' : 'Sin Stock'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mensaje cuando NO hay resultados (solo si buscó y no encontró) */}
            {searchQuery && resultadosBusqueda.length === 0 && !buscando && (
              <div className="bg-gray-50 rounded-lg p-8 text-center border-2 border-dashed border-gray-300 mb-6">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">No se encontraron productos</p>
                <p className="text-sm text-gray-500 mt-1">
                  Intenta con otro término de búsqueda
                </p>
              </div>
            )}

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

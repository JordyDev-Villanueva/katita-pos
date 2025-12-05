import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { ProductGrid } from '../components/pos/ProductGrid';
import { Cart } from '../components/pos/Cart';
import { PaymentModal } from '../components/pos/PaymentModal';
import { TicketPrint } from '../components/pos/TicketPrint'; // FASE 8: Impresión de tickets
import { productsAPI } from '../api/products';
import { ventasAPI } from '../api/ventas';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import { ShoppingCart, Package, Search, X, Barcode, CheckCircle } from 'lucide-react';

export const POS = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Estados
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [customToast, setCustomToast] = useState({ show: false, message: '' });
  const [searchNotification, setSearchNotification] = useState(null); // { type: 'success' | 'error' | 'warning', message: 'texto' }

  // FASE 8: Estados para ticket
  const [ventaCompletada, setVentaCompletada] = useState(null);
  const [showTicketModal, setShowTicketModal] = useState(false);

  // Estados para búsqueda profesional
  const [searchQuery, setSearchQuery] = useState('');
  const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
  const [buscando, setBuscando] = useState(false);

  // Estado para carrito móvil
  const [showMobileCart, setShowMobileCart] = useState(false);

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

        // FASE 8: Guardar venta completada con datos completos
        const ventaConDatos = {
          ...venta,
          vendedor_nombre: user?.nombre_completo || 'N/A',
          metodo_pago: paymentData.metodo_pago,
          detalles: cart.map(item => ({
            producto_nombre: item.nombre,
            cantidad: item.cantidad,
            precio_unitario: item.precio_unitario,
            subtotal: item.cantidad * item.precio_unitario
          }))
        };
        setVentaCompletada(ventaConDatos);
        setShowTicketModal(true);

        // Limpiar carrito y cerrar modal de pago
        setCart([]);
        setShowPaymentModal(false);

        // Recargar productos para actualizar stock
        loadProducts();
      }
    } catch (error) {
      console.error('Error procesando venta:', error);

      // FASE 6: Detectar error de turno de caja no abierto
      if (error.response?.status === 403 && error.response?.data?.errors?.cuadro_caja) {
        toast.error('⚠️ Debe abrir un turno de caja antes de realizar ventas', { duration: 5000 });

        // Redirigir a Cuadro de Caja después de 2 segundos
        setTimeout(() => {
          navigate('/cuadro-caja');
        }, 2000);
        return;
      }

      const message = error.response?.data?.message || 'Error al procesar la venta';
      toast.error(message);
    }
  };

  const total = cart.reduce((sum, item) => sum + (item.cantidad * item.precio_unitario), 0);

  const totalItems = cart.reduce((sum, item) => sum + item.cantidad, 0);

  return (
    <Layout>
      <div className="flex h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50">
        {/* Área principal de productos */}
        <div className="flex-1 p-4 lg:p-6 overflow-y-auto pb-24 lg:pb-6">
          <div className="max-w-7xl mx-auto">
            {/* Header Simplificado */}
            <div className="mb-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4">
                {/* Lado izquierdo: Título con gradiente */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      Punto de Venta
                    </h1>
                    <p className="text-sm text-gray-600">
                      Vendedor: <span className="font-semibold text-blue-600">{user?.nombre_completo}</span>
                    </p>
                  </div>
                </div>

                {/* Lado derecho: Badge de notificación + Toast personalizado */}
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Badge de notificación de búsqueda */}
                  {searchNotification && (
                    <div
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl shadow-md animate-fade-in ${searchNotification.type === 'success'
                        ? 'bg-green-100 text-green-700 border border-green-200'
                        : searchNotification.type === 'error'
                          ? 'bg-red-100 text-red-700 border border-red-200'
                          : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                        }`}
                    >
                      {searchNotification.type === 'success' && (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {searchNotification.type === 'error' && (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                      <span className="text-sm font-semibold">{searchNotification.message}</span>
                    </div>
                  )}

                  {/* Toast personalizado para acciones del carrito */}
                  {customToast.show && (
                    <div className="px-5 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl shadow-lg flex items-center gap-2 animate-fade-in">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="font-semibold">{customToast.message}</span>
                    </div>
                  )}
                </div>
              </div>
              {/* Línea decorativa con gradiente */}
              <div className="h-0.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 rounded-full"></div>
            </div>

            {/* Barra de búsqueda profesional mejorada */}
            <div className="mb-6">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl opacity-20 group-hover:opacity-30 blur transition duration-200"></div>
                <div className="relative bg-white rounded-2xl shadow-lg">
                  <Barcode className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-500 w-6 h-6" />
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
                    className="w-full pl-14 pr-14 py-5 text-lg border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    autoFocus
                  />
                  {buscando && (
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                  {!buscando && searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setResultadosBusqueda([]);
                      }}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 mt-3 text-sm text-gray-600">
                <div className="flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-lg">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium text-blue-700">Usa la pistola escáner o escribe manualmente</span>
                </div>
              </div>
            </div>

            {/* Resultados de búsqueda mejorados */}
            {resultadosBusqueda.length > 0 && (
              <div className="mb-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200 p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                      <Search className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">
                      Resultados de búsqueda
                      <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white text-sm rounded-full">
                        {resultadosBusqueda.length}
                      </span>
                    </h3>
                  </div>
                  <button
                    onClick={() => {
                      setResultadosBusqueda([]);
                      setSearchQuery('');
                    }}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {resultadosBusqueda.map((producto) => (
                    <div
                      key={producto.id}
                      className="bg-white rounded-xl p-4 border-2 border-gray-200 hover:border-blue-400 hover:shadow-xl transition-all transform hover:-translate-y-1 duration-200"
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

                      {/* Botón agregar mejorado */}
                      <button
                        onClick={() => agregarDesdeResultados(producto)}
                        disabled={producto.stock_total <= 0}
                        className={`w-full py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-md ${producto.stock_total > 0
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transform hover:scale-105'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                      >
                        <ShoppingCart className="w-5 h-5" />
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

        {/* Carrito lateral (solo desktop) */}
        <div className="hidden lg:block lg:w-96 bg-gradient-to-b from-white to-gray-50 border-l border-gray-200 flex-shrink-0 shadow-2xl">
          <Cart
            items={cart}
            onUpdateQuantity={updateQuantity}
            onRemove={removeFromCart}
            onClearCart={clearCart}
            onCheckout={handleCheckout}
          />
        </div>
      </div>

      {/* Botón flotante del carrito (solo móvil) */}
      <button
        onClick={() => setShowMobileCart(true)}
        className="lg:hidden fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center z-40 transform hover:scale-110 transition-all"
      >
        <div className="relative">
          <ShoppingCart className="w-7 h-7" />
          {totalItems > 0 && (
            <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
              {totalItems}
            </span>
          )}
        </div>
      </button>

      {/* Modal del carrito (solo móvil) */}
      {showMobileCart && (
        <div className="lg:hidden fixed inset-0 z-50">
          {/* Overlay oscuro */}
          <div
            className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={() => setShowMobileCart(false)}
          ></div>

          {/* Carrito deslizable desde abajo */}
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col animate-slide-up">
            {/* Header del modal */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-3xl">
              <div className="flex items-center gap-2 text-white">
                <ShoppingCart className="w-6 h-6" />
                <h3 className="text-lg font-bold">Carrito ({totalItems} items)</h3>
              </div>
              <button
                onClick={() => setShowMobileCart(false)}
                className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Contenido del carrito */}
            <div className="flex-1 overflow-y-auto">
              <Cart
                items={cart}
                onUpdateQuantity={updateQuantity}
                onRemove={removeFromCart}
                onClearCart={clearCart}
                onCheckout={() => {
                  setShowMobileCart(false);
                  handleCheckout();
                }}
              />
            </div>
          </div>
        </div>
      )}


      {/* Modal de pago */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        total={total}
        onConfirmPayment={handleConfirmPayment}
      />

      {/* FASE 8: Modal de Ticket Completado - Profesional */}
      {showTicketModal && ventaCompletada && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[95vh] overflow-y-auto">
            {/* Header Success - Compacto */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 text-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white bg-opacity-20 backdrop-blur rounded-full flex items-center justify-center animate-pulse">
                  <CheckCircle className="w-7 h-7" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold">¡Venta Procesada Exitosamente!</h2>
                  <p className="text-green-100 text-xs mt-0.5">
                    N° Venta: <span className="font-semibold">{ventaCompletada.numero_venta}</span>
                  </p>
                </div>
                <button
                  onClick={() => setShowTicketModal(false)}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-1.5 transition-colors"
                  title="Cerrar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Resumen de Venta - Compacto */}
              <div className="mt-3 bg-white bg-opacity-10 backdrop-blur rounded-lg p-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-green-100 text-xs mb-0.5">Total</p>
                    <p className="text-2xl font-bold">S/ {Number(ventaCompletada.total || 0).toFixed(2)}</p>
                  </div>
                  {ventaCompletada.metodo_pago === 'efectivo' && ventaCompletada.cambio > 0 && (
                    <div>
                      <p className="text-green-100 text-xs mb-0.5">Cambio</p>
                      <p className="text-xl font-semibold">S/ {Number(ventaCompletada.cambio).toFixed(2)}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-green-100 text-xs mb-0.5">Método de Pago</p>
                    <p className="text-sm font-semibold capitalize">{ventaCompletada.metodo_pago}</p>
                  </div>
                  <div>
                    <p className="text-green-100 text-xs mb-0.5">Productos</p>
                    <p className="text-sm font-semibold">{ventaCompletada.detalles?.length || 0} items</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Ticket Preview */}
            <div className="p-4">
              <TicketPrint
                venta={ventaCompletada}
                onPrintComplete={() => {
                  setShowTicketModal(false);
                }}
              />

              <div className="mt-3 pt-3 border-t flex justify-center gap-3">
                <button
                  onClick={() => setShowTicketModal(false)}
                  className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cerrar sin Imprimir
                </button>
              </div>

              <p className="text-xs text-center text-gray-500 mt-3">
                💡 Tip: Puedes reimprimir este ticket desde "Ventas" → Ver Detalles
              </p>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

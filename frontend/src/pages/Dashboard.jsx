import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Layout } from '../components/layout/Layout';
import { VentasChart } from '../components/dashboard/VentasChart';
import { TopProductos } from '../components/dashboard/TopProductos';
import axiosInstance from '../api/axios';
import toast from 'react-hot-toast';
import { RefreshCw, CheckCircle, X, Calendar, Receipt, TrendingUp, Package, AlertTriangle, DollarSign } from 'lucide-react';
import { formatPeruDate } from '../utils/timezone';

export const Dashboard = () => {
  const { user } = useAuth();

  // Estados de control
  const [filtroActivo, setFiltroActivo] = useState('hoy');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [showWelcome, setShowWelcome] = useState(false);
  const [showUpdatedBadge, setShowUpdatedBadge] = useState(false);
  const [loading, setLoading] = useState(false);

  // Datos que cambian con filtro
  const [ventas, setVentas] = useState([]);
  const [ventasHoy, setVentasHoy] = useState(0);
  const [gananciaHoy, setGananciaHoy] = useState(0);

  // Datos que NO cambian con filtro
  const [productosStock, setProductosStock] = useState(0);
  const [lotesPorVencer, setLotesPorVencer] = useState(0);
  const [lotesVencidos, setLotesVencidos] = useState(0);
  const [lotesAlertas, setLotesAlertas] = useState([]);
  const [ventasGrafico, setVentasGrafico] = useState([]);
  const [topProductos, setTopProductos] = useState([]);

  // ==================== FUNCIÓN HELPER PARA FECHAS ====================
  // Obtener fecha local en formato YYYY-MM-DD sin conversión UTC
  const obtenerFechaLocal = (fecha = new Date()) => {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Detectar login
  useEffect(() => {
    const justLoggedIn = sessionStorage.getItem('justLoggedIn');
    if (justLoggedIn === 'true') {
      setShowWelcome(true);
      sessionStorage.removeItem('justLoggedIn');
      setTimeout(() => setShowWelcome(false), 3000);
    }
  }, []);

  // ==================== CARGAR DATOS QUE CAMBIAN CON FILTRO ====================
  const loadFilteredData = async (inicio, fin) => {
    try {
      setLoading(true);
      console.log('\n' + '='.repeat(70));
      console.log('🔍 FILTRANDO VENTAS');
      console.log('='.repeat(70));
      console.log('📅 Fecha inicio:', inicio);
      console.log('📅 Fecha fin:', fin);

      const response = await axiosInstance.get('/ventas', {
        params: {
          fecha_inicio: inicio,
          fecha_fin: fin
        }
      });

      console.log('\n📦 RESPUESTA RAW DEL BACKEND:');
      console.log(JSON.stringify(response.data, null, 2));

      // Extraer array de ventas según la estructura del backend
      let ventasData = [];

      if (Array.isArray(response.data)) {
        // Caso 1: Array directo
        ventasData = response.data;
        console.log('✅ Formato detectado: Array directo');
      } else if (response.data?.success && response.data?.data) {
        // Caso 2: Wrapper con success
        if (Array.isArray(response.data.data.ventas)) {
          // Backend retorna: {success: true, data: {ventas: [...], total: X}}
          ventasData = response.data.data.ventas;
          console.log('✅ Formato detectado: {success, data: {ventas: []}}');
        } else if (Array.isArray(response.data.data)) {
          // Backend retorna: {success: true, data: [...]}
          ventasData = response.data.data;
          console.log('✅ Formato detectado: {success, data: []}');
        }
      }

      console.log('\n📊 VENTAS EXTRAÍDAS:', ventasData.length);

      if (ventasData.length === 0) {
        console.warn('\n⚠️  NO SE ENCONTRARON VENTAS');
        console.warn('Verifica que existan ventas en el rango:', inicio, 'al', fin);
      } else {
        console.log('\n✅ PRIMERA VENTA:');
        console.log(JSON.stringify(ventasData[0], null, 2));
      }

      // Ordenar por fecha descendente
      const ventasOrdenadas = [...ventasData].sort((a, b) =>
        new Date(b.fecha || b.created_at || b.fecha_venta) - new Date(a.fecha || a.created_at || a.fecha_venta)
      );

      setVentas(ventasOrdenadas);

      // Calcular total vendido
      const totalVendido = ventasOrdenadas.reduce((sum, v) => {
        const total = parseFloat(v.total) || 0;
        return sum + total;
      }, 0);

      setVentasHoy(totalVendido);
      console.log('\n💰 TOTAL VENDIDO: S/', totalVendido.toFixed(2));

      // Calcular ganancia con logs detallados
      let gananciaTotal = 0;
      console.log('\n💎 CALCULANDO GANANCIAS:');

      ventasOrdenadas.forEach((venta, idx) => {
        console.log(`\n  Venta ${idx + 1}/${ventasOrdenadas.length}:`);
        console.log(`  - ID: ${venta.id || venta.numero_venta}`);
        console.log(`  - Total: S/ ${parseFloat(venta.total || 0).toFixed(2)}`);

        if (venta.detalles && Array.isArray(venta.detalles)) {
          console.log(`  - Detalles: ${venta.detalles.length} productos`);

          venta.detalles.forEach((detalle, dIdx) => {
            const pv = parseFloat(detalle.precio_unitario) || 0;
            const pc = parseFloat(detalle.precio_compra_unitario) || 0;
            const cant = parseInt(detalle.cantidad) || 0;
            const gananciaDetalle = (pv - pc) * cant;

            gananciaTotal += gananciaDetalle;

            console.log(`    ${dIdx + 1}. ${detalle.producto?.nombre || 'Producto'}`);
            console.log(`       - Precio venta: S/ ${pv.toFixed(2)}`);
            console.log(`       - Precio compra: S/ ${pc.toFixed(2)}`);
            console.log(`       - Cantidad: ${cant}`);
            console.log(`       - Ganancia: S/ ${gananciaDetalle.toFixed(2)}`);
          });
        } else {
          console.log('  ⚠️  Sin detalles');
        }
      });

      setGananciaHoy(gananciaTotal);
      console.log('\n💎 GANANCIA TOTAL: S/', gananciaTotal.toFixed(2));
      console.log('='.repeat(70) + '\n');

    } catch (error) {
      console.error('\n❌ ERROR CARGANDO DATOS FILTRADOS:');
      console.error(error);
      toast.error('Error al cargar datos');
      setVentas([]);
      setVentasHoy(0);
      setGananciaHoy(0);
    } finally {
      setLoading(false);
    }
  };

  // ==================== CARGAR DATOS QUE NO CAMBIAN ====================
  const loadStaticData = async () => {
    console.log('🔵 [loadStaticData] FUNCIÓN INICIADA');

    try {
      console.log('\n' + '='.repeat(70));
      console.log('🚀 CARGANDO DATOS ESTÁTICOS');
      console.log('='.repeat(70));

      // 1. Productos en Stock
      console.log('\n📦 1/4 - Cargando productos...');
      const resProductos = await axiosInstance.get('/products');

      console.log('📦 RESPUESTA RAW:', JSON.stringify(resProductos.data, null, 2));

      // Manejar múltiples formatos de respuesta del backend
      let productos = [];
      if (Array.isArray(resProductos.data)) {
        productos = resProductos.data;
        console.log('✅ Formato: Array directo');
      } else if (resProductos.data?.success && resProductos.data?.data) {
        // El backend retorna: {success: true, data: {productos: [...], total: X}}
        if (Array.isArray(resProductos.data.data.productos)) {
          productos = resProductos.data.data.productos;
          console.log('✅ Formato: {success, data: {productos: []}}');
        } else if (Array.isArray(resProductos.data.data)) {
          productos = resProductos.data.data;
          console.log('✅ Formato: {success, data: []}');
        }
      }

      console.log('📊 Total productos recibidos:', productos.length);

      if (productos.length > 0) {
        console.log('🔍 PRIMER PRODUCTO:', JSON.stringify(productos[0], null, 2));
        console.log('📋 Keys:', Object.keys(productos[0]));
      }

      // 2. Lotes por Vencer (próximos 7 días)
      console.log('\n⚠️  2/4 - Cargando lotes...');
      const resLotes = await axiosInstance.get('/lotes');

      console.log('📦 RESPUESTA RAW LOTES:', JSON.stringify(resLotes.data, null, 2));

      // Manejar múltiples formatos de respuesta del backend
      let lotes = [];
      if (Array.isArray(resLotes.data)) {
        lotes = resLotes.data;
        console.log('✅ Formato: Array directo');
      } else if (resLotes.data?.success && resLotes.data?.data) {
        if (Array.isArray(resLotes.data.data.lotes)) {
          lotes = resLotes.data.data.lotes;
          console.log('✅ Formato: {success, data: {lotes: []}}');
        } else if (Array.isArray(resLotes.data.data)) {
          lotes = resLotes.data.data;
          console.log('✅ Formato: {success, data: []}');
        }
      }

      console.log('📊 Total lotes recibidos:', lotes.length);

      // Usar fecha local de Perú sin hora
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      console.log('📅 Fecha actual (sin hora):', hoy.toISOString());

      // Función para verificar si un producto tiene lotes válidos (no vencidos con stock)
      const tieneStockValido = (productoId) => {
        const lotesProducto = lotes.filter(l => l.producto_id === productoId);
        return lotesProducto.some(lote => {
          if ((lote.cantidad_actual || 0) <= 0) return false;
          const fechaVenc = new Date(lote.fecha_vencimiento);
          fechaVenc.setHours(0, 0, 0, 0);
          const diff = Math.ceil((fechaVenc - hoy) / (1000 * 60 * 60 * 24));
          return diff > 0; // Tiene stock Y no está vencido
        });
      };

      // Filtrar productos CON STOCK VÁLIDO (excluir los que solo tienen lotes vencidos)
      console.log('\n🔍 FILTRANDO PRODUCTOS CON STOCK VÁLIDO:');
      const productosConStock = productos.filter(p => {
        const stock1 = p.stock ? parseInt(p.stock) : 0;
        const stock2 = p.stock_total ? parseInt(p.stock_total) : 0;
        const stockFinal = Math.max(stock1, stock2);

        const tieneStock = stockFinal > 0;
        const stockEsValido = tieneStockValido(p.id);

        console.log(`  • ${p.nombre || 'Sin nombre'} (ID: ${p.id})`);
        console.log(`    - Stock: ${stockFinal}`);
        console.log(`    - Stock válido (no vencido): ${stockEsValido ? '✅ SÍ' : '❌ NO'}`);

        return tieneStock && stockEsValido;
      });

      const conStock = productosConStock.length;
      setProductosStock(conStock);
      console.log(`\n✅ PRODUCTOS CON STOCK VÁLIDO: ${conStock} / ${productos.length}`);
      console.log('='.repeat(70));

      const lotesProximosVencer = [];
      const lotesYaVencidos = [];

      lotes.forEach(lote => {
        const fechaVenc = new Date(lote.fecha_vencimiento);
        fechaVenc.setHours(0, 0, 0, 0);

        const diff = Math.ceil((fechaVenc - hoy) / (1000 * 60 * 60 * 24));
        const tieneStock = (lote.cantidad_actual || 0) > 0;

        // Por vencer: entre 1 y 7 días (futuro)
        const estaPorVencer = diff >= 1 && diff <= 7;
        // Vencido: hoy o pasado (0 o negativo)
        const estaVencido = diff <= 0;

        console.log(`  • Lote: ${lote.codigo_lote || 'Sin código'}`);
        console.log(`    - Producto: ${lote.producto?.nombre || 'Sin nombre'}`);
        console.log(`    - Vencimiento: ${lote.fecha_vencimiento} (${diff} días)`);
        console.log(`    - Stock actual: ${lote.cantidad_actual || 0}`);
        console.log(`    - Tiene stock: ${tieneStock ? '✅' : '❌'}`);
        console.log(`    - Está por vencer (1-7 días): ${estaPorVencer ? '✅' : '❌'}`);
        console.log(`    - Está vencido (≤0 días): ${estaVencido ? '✅' : '❌'}`);

        if (tieneStock && estaPorVencer) {
          lotesProximosVencer.push(lote);
          console.log(`    - CLASIFICACIÓN: ⚠️ POR VENCER`);
        } else if (tieneStock && estaVencido) {
          lotesYaVencidos.push({
            ...lote,
            critico: true // Marcar como crítico para mostrar en rojo
          });
          console.log(`    - CLASIFICACIÓN: 🔴 VENCIDO (CRÍTICO)`);
        } else {
          console.log(`    - CLASIFICACIÓN: ✅ OK (no incluir)`);
        }
      });

      // Mostrar SOLO lotes por vencer en alertas normales
      // Los vencidos se mostrarán como críticos
      setLotesAlertas([...lotesProximosVencer, ...lotesYaVencidos]);
      setLotesPorVencer(lotesProximosVencer.length);
      setLotesVencidos(lotesYaVencidos.length);
      console.log(`\n✅ LOTES POR VENCER (1-7 días): ${lotesProximosVencer.length} / ${lotes.length}`);
      console.log(`🔴 LOTES VENCIDOS (≤0 días): ${lotesYaVencidos.length} / ${lotes.length}`);

      // 3. Gráfico últimos 7 días
      console.log('\n📊 3/4 - Cargando gráfico...');
      await loadGrafico7Dias();
      console.log('✅ Gráfico cargado');

      // 4. Top 10 productos
      console.log('\n🏆 4/4 - Cargando top 10...');
      await loadTopProductos();
      console.log('✅ Top 10 cargado');

      console.log('\n' + '='.repeat(70));
      console.log('✅ TODOS LOS DATOS ESTÁTICOS CARGADOS');
      console.log('='.repeat(70));
      console.log('🔵 [loadStaticData] FUNCIÓN COMPLETADA\n');

    } catch (error) {
      console.error('\n' + '█'.repeat(70));
      console.error('🔴 ERROR EN loadStaticData():');
      console.error('█'.repeat(70));
      console.error('Tipo:', error.name);
      console.error('Mensaje:', error.message);
      console.error('Stack:', error.stack);
      console.error('█'.repeat(70) + '\n');
      throw error; // Re-lanzar para que sea capturado por el try/catch del useEffect
    }
  };

  // ==================== GRÁFICO ÚLTIMOS 7 DÍAS ====================
  const loadGrafico7Dias = async () => {
    try {
      const hoy = new Date();
      const hace7Dias = new Date();
      hace7Dias.setDate(hoy.getDate() - 6);

      const inicio = obtenerFechaLocal(hace7Dias);
      const fin = obtenerFechaLocal(hoy);

      console.log('\n' + '='.repeat(70));
      console.log('📈 CARGANDO GRÁFICO ÚLTIMOS 7 DÍAS');
      console.log('='.repeat(70));
      console.log('📅 Desde:', inicio);
      console.log('📅 Hasta:', fin);

      const response = await axiosInstance.get('/ventas', {
        params: { fecha_inicio: inicio, fecha_fin: fin }
      });

      // Extraer array de ventas (mismo manejo que las otras funciones)
      let ventas = [];

      if (Array.isArray(response.data)) {
        ventas = response.data;
        console.log('✅ Formato: Array directo');
      } else if (response.data?.success && response.data?.data) {
        if (Array.isArray(response.data.data.ventas)) {
          ventas = response.data.data.ventas;
          console.log('✅ Formato: {success, data: {ventas: []}}');
        } else if (Array.isArray(response.data.data)) {
          ventas = response.data.data;
          console.log('✅ Formato: {success, data: []}');
        }
      }

      console.log('\n📦 Ventas recibidas:', ventas.length);

      // Función para extraer fecha LOCAL (sin conversión a UTC)
      const extraerFechaLocal = (fechaStr) => {
        const d = new Date(fechaStr);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      // Mostrar todas las fechas de ventas para debugging
      if (ventas.length > 0) {
        console.log('\n📅 Fechas de ventas recibidas:');
        ventas.forEach((v, idx) => {
          const fechaCompleta = v.fecha || v.created_at || v.fecha_venta;
          const fechaSolo = extraerFechaLocal(fechaCompleta);
          console.log(`  ${idx + 1}. Venta #${v.id}: ${fechaCompleta} → ${fechaSolo} (Total: S/ ${v.total})`);
        });
      }

      // Agrupar ventas POR FECHA (agrupación manual para mayor claridad)
      console.log('\n📊 Agrupando ventas por fecha...');
      const ventasPorDia = {};

      ventas.forEach(v => {
        const fechaCompleta = v.fecha || v.created_at || v.fecha_venta;
        const fechaSolo = extraerFechaLocal(fechaCompleta);

        if (!ventasPorDia[fechaSolo]) {
          ventasPorDia[fechaSolo] = { ventas: [], total: 0, cantidad: 0 };
        }

        ventasPorDia[fechaSolo].ventas.push(v);
        ventasPorDia[fechaSolo].total += parseFloat(v.total || 0);
        ventasPorDia[fechaSolo].cantidad += 1;
      });

      console.log('\n📊 Ventas agrupadas por día:');
      Object.keys(ventasPorDia).forEach(fecha => {
        const datos = ventasPorDia[fecha];
        console.log(`  ${fecha}: ${datos.cantidad} ventas, S/ ${datos.total.toFixed(2)}`);
      });

      // Crear array de últimos 7 días
      console.log('\n📈 Generando datos del gráfico (últimos 7 días)...');
      const graficoData = [];

      for (let i = 6; i >= 0; i--) {
        const fecha = new Date(hoy);
        fecha.setDate(hoy.getDate() - i);
        const fechaStr = extraerFechaLocal(fecha); // Usar función local para evitar problemas de UTC
        const dia = fecha.getDate();
        const mes = fecha.toLocaleDateString('es-PE', { month: 'short' });

        // Obtener datos del día desde el objeto agrupado
        const datosDelDia = ventasPorDia[fechaStr] || { total: 0, cantidad: 0 };

        graficoData.push({
          fechaFormateada: `${dia} ${mes}`,
          total: datosDelDia.total,
          cantidad: datosDelDia.cantidad
        });

        console.log(`  ${fechaStr} (${dia} ${mes}): ${datosDelDia.cantidad} ventas, S/ ${datosDelDia.total.toFixed(2)}`);
      }

      console.log('\n📊 Datos del gráfico generados:', graficoData.length, 'puntos');
      console.log('='.repeat(70) + '\n');
      setVentasGrafico(graficoData);

    } catch (error) {
      console.error('\n❌ ERROR CARGANDO GRÁFICO:');
      console.error(error);
      setVentasGrafico([]);
    }
  };

  // ==================== TOP 10 PRODUCTOS ====================
  const loadTopProductos = async () => {
    try {
      // Cargar ventas de los últimos 30 días
      const hoy = new Date();
      const hace30Dias = new Date();
      hace30Dias.setDate(hoy.getDate() - 30);
      const inicio = obtenerFechaLocal(hace30Dias);
      const fin = obtenerFechaLocal(hoy);

      console.log('\n' + '='.repeat(70));
      console.log('🏆 CARGANDO TOP 10 PRODUCTOS (ÚLTIMOS 30 DÍAS)');
      console.log('='.repeat(70));
      console.log('📅 Desde:', inicio);
      console.log('📅 Hasta:', fin);

      const response = await axiosInstance.get('/ventas', {
        params: { fecha_inicio: inicio, fecha_fin: fin }
      });

      // Extraer array de ventas (mismo manejo que loadFilteredData)
      let ventas = [];

      if (Array.isArray(response.data)) {
        ventas = response.data;
        console.log('✅ Formato: Array directo');
      } else if (response.data?.success && response.data?.data) {
        if (Array.isArray(response.data.data.ventas)) {
          ventas = response.data.data.ventas;
          console.log('✅ Formato: {success, data: {ventas: []}}');
        } else if (Array.isArray(response.data.data)) {
          ventas = response.data.data;
          console.log('✅ Formato: {success, data: []}');
        }
      }

      console.log('\n📦 Ventas recibidas:', ventas.length);

      if (ventas.length === 0) {
        console.warn('⚠️  No hay ventas en los últimos 30 días');
        setTopProductos([]);
        return;
      }

      // Agrupar por producto
      const productosMap = new Map();

      ventas.forEach((venta) => {
        if (venta.detalles && Array.isArray(venta.detalles)) {
          venta.detalles.forEach((detalle) => {
            const id = detalle.producto_id;
            const nombre = detalle.producto?.nombre || 'Sin nombre';

            if (!productosMap.has(id)) {
              productosMap.set(id, {
                producto_id: id,
                nombre,
                cantidadVendida: 0,
                totalVendido: 0
              });
              console.log(`\n  Nuevo producto: ${nombre} (ID: ${id})`);
            }

            const prod = productosMap.get(id);
            const cant = parseInt(detalle.cantidad) || 0;
            const subtotal = (parseFloat(detalle.precio_unitario) || 0) * cant;

            prod.cantidadVendida += cant;
            prod.totalVendido += subtotal;

            console.log(`    + ${cant} unidades (S/ ${subtotal.toFixed(2)}) → Total: ${prod.cantidadVendida} unidades`);
          });
        }
      });

      console.log('\n📊 Productos únicos encontrados:', productosMap.size);

      // Convertir a array y ordenar
      const top10 = Array.from(productosMap.values())
        .sort((a, b) => b.cantidadVendida - a.cantidadVendida)
        .slice(0, 10);

      // Calcular porcentajes
      if (top10.length > 0) {
        const maxCantidad = top10[0].cantidadVendida;
        top10.forEach(p => {
          p.porcentaje = (p.cantidadVendida / maxCantidad) * 100;
        });
      }

      console.log('\n🏆 TOP 10 FINAL:');
      top10.forEach((p, idx) => {
        console.log(`  ${idx + 1}. ${p.nombre}`);
        console.log(`     - Cantidad vendida: ${p.cantidadVendida} unidades`);
        console.log(`     - Total vendido: S/ ${p.totalVendido.toFixed(2)}`);
        console.log(`     - Porcentaje: ${p.porcentaje.toFixed(1)}%`);
      });

      console.log('='.repeat(70) + '\n');
      setTopProductos(top10);

    } catch (error) {
      console.error('\n❌ ERROR CARGANDO TOP 10:');
      console.error(error);
      setTopProductos([]);
    }
  };

  // ==================== HANDLERS DE FILTROS ====================
  const handleHoy = () => {
    setFiltroActivo('hoy');
    const hoy = obtenerFechaLocal();
    setFechaDesde(hoy);
    setFechaHasta(hoy);
    loadFilteredData(hoy, hoy);
  };

  const handleAyer = () => {
    setFiltroActivo('ayer');
    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1);
    const ayerStr = obtenerFechaLocal(ayer);
    setFechaDesde(ayerStr);
    setFechaHasta(ayerStr);
    loadFilteredData(ayerStr, ayerStr);
  };

  const handleFiltrar = () => {
    setFiltroActivo('personalizado');
    loadFilteredData(fechaDesde, fechaHasta);
  };

  const handleRefresh = async () => {
    try {
      console.log('\n' + '='.repeat(70));
      console.log('🔄 RECARGANDO DASHBOARD');
      console.log('='.repeat(70));

      setLoading(true);

      // Recargar datos estáticos
      console.log('📊 1/2 - Recargando datos estáticos...');
      await loadStaticData();

      // Recargar datos filtrados
      console.log('📊 2/2 - Recargando datos filtrados...');
      await loadFilteredData(fechaDesde, fechaHasta);

      console.log('✅ Dashboard recargado exitosamente');
      console.log('='.repeat(70) + '\n');

      // Solo mostrar badge verde, sin toast
      setShowUpdatedBadge(true);
      setTimeout(() => setShowUpdatedBadge(false), 2000);

    } catch (error) {
      console.error('❌ Error recargando dashboard:', error);
      toast.error('Error al actualizar el dashboard');
    } finally {
      setLoading(false);
    }
  };

  // ==================== INICIALIZACIÓN ====================
  useEffect(() => {
    console.log('\n' + '█'.repeat(80));
    console.log('🎬 DASHBOARD - INICIANDO USEEFFECT');
    console.log('█'.repeat(80));

    const init = async () => {
      try {
        // Obtener fecha local sin conversión UTC
        const hoy = obtenerFechaLocal();
        console.log('📅 Fecha hoy:', hoy);

        setFechaDesde(hoy);
        setFechaHasta(hoy);
        setFiltroActivo('hoy');
        console.log('✅ Estados iniciales configurados');

        console.log('\n📞 PASO 1: Llamando a loadStaticData()...');
        await loadStaticData();
        console.log('✅ PASO 1 COMPLETADO: loadStaticData()');

        console.log('\n📞 PASO 2: Llamando a loadFilteredData()...');
        await loadFilteredData(hoy, hoy);
        console.log('✅ PASO 2 COMPLETADO: loadFilteredData()');

        console.log('\n' + '█'.repeat(80));
        console.log('✅ DASHBOARD INICIALIZADO EXITOSAMENTE');
        console.log('█'.repeat(80) + '\n');

      } catch (error) {
        console.error('\n' + '█'.repeat(80));
        console.error('🔴 ERROR CRÍTICO EN INICIALIZACIÓN:');
        console.error('█'.repeat(80));
        console.error('Tipo:', error.name);
        console.error('Mensaje:', error.message);
        console.error('Stack:', error.stack);
        console.error('█'.repeat(80) + '\n');
        toast.error('Error al inicializar el dashboard');
      }
    };

    init();
  }, []);

  const getCardLabel = (base) => {
    if (filtroActivo === 'hoy') return `${base} Hoy`;
    if (filtroActivo === 'ayer') return `${base} Ayer`;
    return base;
  };

  // ==================== RENDER ====================
  return (
    <Layout>
      <div className="p-4 lg:p-6">
        {/* Header Simplificado */}
        <div className="mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Dashboard
                </h1>
                <p className="text-sm text-gray-600">
                  Bienvenido, <span className="font-semibold text-blue-600">{user?.nombre_completo}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {showWelcome && (
                <div className="flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2.5 rounded-lg shadow-sm border border-green-200 animate-fade-in">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">¡Bienvenido, {user?.nombre_completo}!</span>
                  <button onClick={() => setShowWelcome(false)} className="ml-2 text-green-600 hover:text-green-800">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {showUpdatedBadge && (
                <div className="flex items-center gap-2 bg-green-100 text-green-700 px-3 py-2 rounded-lg border border-green-200 animate-fade-in">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Datos actualizados</span>
                </div>
              )}

              <button
                onClick={handleRefresh}
                className="px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 rounded-lg transition-colors flex items-center gap-2 border border-gray-300 shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="text-sm font-medium">Recargar</span>
              </button>
            </div>
          </div>
          {/* Línea decorativa con gradiente */}
          <div className="h-0.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 rounded-full"></div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-md border-2 border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Acceso Rápido */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Acceso Rápido</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleHoy}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filtroActivo === 'hoy' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Hoy
                </button>
                <button
                  type="button"
                  onClick={handleAyer}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filtroActivo === 'ayer' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Ayer
                </button>
              </div>
            </div>

            {/* Fecha Desde */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Fecha Inicio</label>
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Fecha Hasta */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Fecha Fin</label>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Botón Filtrar */}
            <div className="flex flex-col">
              <label className="block text-sm font-medium text-gray-700 mb-1.5 invisible">Filtro</label>
              <button
                type="button"
                onClick={handleFiltrar}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors h-[38px] ${
                  filtroActivo === 'personalizado' ? 'bg-blue-600 text-white ring-2 ring-blue-300' : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                Filtrar
              </button>
            </div>
          </div>
        </div>

        {/* 4 Cards Principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Ventas */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-md p-6 border-2 border-blue-200 hover:shadow-lg hover:scale-105 transition-all duration-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700 mb-1">{getCardLabel('Ventas')}</p>
                <p className="text-3xl font-bold text-blue-900">S/ {ventasHoy.toFixed(2)}</p>
                <p className="text-xs text-blue-600 mt-1">Total vendido</p>
              </div>
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Productos en Stock */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-md p-6 border-2 border-green-200 hover:shadow-lg hover:scale-105 transition-all duration-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-green-700 mb-1">Productos en Stock</p>
                <p className="text-3xl font-bold text-green-900">{productosStock}</p>
                <p className="text-xs text-green-600 mt-1">Con inventario</p>
              </div>
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <Package className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Por Vencer */}
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl shadow-md p-6 border-2 border-yellow-200 hover:shadow-lg hover:scale-105 transition-all duration-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-700 mb-1">Lotes - Próximos 7 días</p>
                <p className="text-3xl font-bold text-yellow-900">{lotesPorVencer}</p>
                <p className="text-xs text-yellow-600 mt-1">Requieren atención</p>
              </div>
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          {/* Ganancia */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-md p-6 border-2 border-purple-200 hover:shadow-lg hover:scale-105 transition-all duration-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700 mb-1">{getCardLabel('Ganancia')}</p>
                <p className="text-3xl font-bold text-purple-900">S/ {gananciaHoy.toFixed(2)}</p>
                <p className="text-xs text-purple-600 mt-1">Margen bruto</p>
              </div>
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* GRÁFICO + ALERTAS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <VentasChart data={ventasGrafico} />
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <h3 className="font-semibold text-gray-900">Alertas del Sistema</h3>
                </div>
              </div>

              {Array.isArray(lotesAlertas) && lotesAlertas.length > 0 ? (
                <div className="space-y-3">
                  {lotesAlertas.slice(0, 5).map((lote) => {
                    const esVencido = lote.critico;
                    return (
                      <div
                        key={lote.id}
                        className={`flex items-start gap-3 p-3 rounded-lg border transition-all duration-200 cursor-pointer ${
                          esVencido
                            ? 'bg-red-50 border-red-300 hover:bg-red-100 hover:shadow-md'
                            : 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100 hover:shadow-md'
                        }`}
                      >
                        <AlertTriangle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                          esVencido ? 'text-red-600' : 'text-yellow-600'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${
                            esVencido ? 'text-red-900' : 'text-gray-900'
                          }`}>
                            {lote.producto?.nombre}
                          </p>
                          <p className={`text-xs ${
                            esVencido ? 'text-red-700 font-semibold' : 'text-gray-600'
                          }`}>
                            {esVencido ? '🔴 VENCIDO - ' : '🟡 Vence: '}
                            {new Date(lote.fecha_vencimiento).toLocaleDateString('es-PE')}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <CheckCircle className="w-16 h-16 text-green-500 mb-3" />
                  <p className="text-sm font-semibold text-green-600">¡Todo en orden!</p>
                  <p className="text-xs text-gray-500 mt-2">No hay alertas activas en el sistema</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* TOP 10 PRODUCTOS */}
        <div className="w-full mb-6">
          <TopProductos productos={topProductos} />
        </div>

        {/* ÚLTIMAS VENTAS */}
        <div className="w-full">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">Últimas Ventas</h3>
              </div>
              <span className="text-sm text-gray-500">{ventas.length} ventas</span>
            </div>

            {ventas.length === 0 ? (
              <div className="text-center py-12">
                <Receipt className="h-16 w-16 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">
                  {filtroActivo === 'hoy' ? 'No hay ventas hoy' :
                   filtroActivo === 'ayer' ? 'No hay ventas de ayer' :
                   `No hay ventas del ${fechaDesde} al ${fechaHasta}`}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto" style={{ maxHeight: '480px', overflowY: 'auto' }}>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">N° Venta</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha/Hora</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Método</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendedor</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {ventas.map((venta) => {
                      const fechaCompleta = venta.fecha_venta || venta.fecha || venta.created_at;
                      const metodoConfig = {
                        efectivo: { bg: 'bg-green-100', text: 'text-green-800' },
                        yape: { bg: 'bg-purple-100', text: 'text-purple-800' },
                        plin: { bg: 'bg-blue-100', text: 'text-blue-800' },
                        transferencia: { bg: 'bg-indigo-100', text: 'text-indigo-800' },
                      };
                      const metodoKey = (venta.metodo_pago || 'efectivo').toLowerCase();
                      const config = metodoConfig[metodoKey] || metodoConfig.efectivo;

                      return (
                        <tr key={venta.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-mono font-semibold text-gray-900">
                            #{venta.id?.toString().padStart(6, '0')}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            <div>{formatPeruDate(fechaCompleta, 'dd/MM/yyyy')}</div>
                            <div className="text-xs text-gray-500">{formatPeruDate(fechaCompleta, 'HH:mm')}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">
                            S/ {Number(venta.total || 0).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${config.bg} ${config.text}`}>
                              {venta.metodo_pago || 'Efectivo'}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {venta.vendedor_nombre || 'Sin asignar'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

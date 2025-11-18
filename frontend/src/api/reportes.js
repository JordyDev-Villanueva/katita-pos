import axiosInstance from './axios';
import { productsAPI } from './products';
import { lotesAPI } from './lotes';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { getPeruToday, extractDateOnly, formatPeruDate, daysDifference } from '../utils/timezone';

export const reportesAPI = {
  /**
   * Obtiene resumen completo para el Dashboard
   * Combina: ventas del día, productos bajo stock, alertas de vencimiento
   */
  getDashboardResumen: async () => {
    try {
      console.log('🔍 Cargando Dashboard...');

      // 1. Obtener TODAS las ventas
      console.log('📡 Haciendo petición a: /api/ventas');
      let ventasResponse;
      try {
        ventasResponse = await axiosInstance.get('/ventas');
        console.log('✅ Respuesta exitosa de /api/ventas');
        console.log('📊 Respuesta ventas:', ventasResponse.data);
      } catch (ventasError) {
        console.error('❌ ERROR 500 en /api/ventas');
        console.error('📍 URL completa:', ventasError.config?.url);
        console.error('📍 Método:', ventasError.config?.method);
        console.error('📍 Status:', ventasError.response?.status);
        console.error('📍 Mensaje del backend:', ventasError.response?.data);
        console.error('📍 Error completo:', ventasError);
        throw ventasError;
      }

      // Extraer array de ventas
      let todasVentas = [];
      if (ventasResponse.data?.success) {
        if (Array.isArray(ventasResponse.data.data)) {
          todasVentas = ventasResponse.data.data;
        } else if (Array.isArray(ventasResponse.data.data?.ventas)) {
          todasVentas = ventasResponse.data.data.ventas;
        }
      } else if (Array.isArray(ventasResponse.data)) {
        todasVentas = ventasResponse.data;
      } else if (Array.isArray(ventasResponse.data?.data)) {
        todasVentas = ventasResponse.data.data;
      }

      console.log('📦 Total ventas en BD:', todasVentas.length);
      console.log('📋 Ventas:', todasVentas);

      // 2. Filtrar ventas de HOY (en zona horaria de Perú)
      const hoyPeru = getPeruToday(); // "2025-11-12"

      console.log('📅 Hoy en Perú:', hoyPeru);
      console.log('📅 Buscando ventas del día:', hoyPeru);

      const ventasHoy = todasVentas.filter(venta => {
        if (!venta.fecha_venta && !venta.fecha && !venta.created_at) return false;

        // Extraer solo la fecha (YYYY-MM-DD) de la venta
        const fechaVenta = venta.fecha_venta || venta.fecha || venta.created_at;
        const fechaVentaStr = extractDateOnly(fechaVenta);

        console.log(`  Comparando: ${fechaVentaStr} === ${hoyPeru}`, fechaVentaStr === hoyPeru);

        return fechaVentaStr === hoyPeru;
      });

      console.log('✅ Ventas de HOY encontradas:', ventasHoy.length);
      console.log('💰 Ventas de hoy:', ventasHoy);

      // 3. Calcular totales
      const totalVentasHoy = ventasHoy.reduce((sum, v) => {
        return sum + parseFloat(v.total || 0);
      }, 0);

      console.log('💵 Total ventas hoy: S/', totalVentasHoy.toFixed(2));

      // 4. Calcular ganancia (BUG CRÍTICO CORREGIDO + ESTIMACIÓN AUTOMÁTICA)
      console.log('=== 💰 DEBUG GANANCIA HOY ===');
      console.log(`💰 Ventas hoy: ${ventasHoy.length}`);

      if (ventasHoy.length > 0 && ventasHoy[0].detalles && ventasHoy[0].detalles.length > 0) {
        const primerDetalle = ventasHoy[0].detalles[0];
        console.log('💰 Estructura del primer detalle:', {
          precio_unitario: primerDetalle.precio_unitario,
          precio_compra_unitario: primerDetalle.precio_compra_unitario,
          cantidad: primerDetalle.cantidad,
          producto_nombre: primerDetalle.producto?.nombre,
          producto_precio_compra: primerDetalle.producto?.precio_compra,
          categoria: primerDetalle.producto?.categoria
        });
      }

      /**
       * Estima el precio de compra basado en márgenes estándar de minimarkets peruanos
       * Solo se usa si el producto NO tiene precio_compra configurado
       */
      const estimarPrecioCompra = (detalle) => {
        const precioVenta = parseFloat(detalle.precio_unitario || detalle.precio_venta || 0);
        const categoria = (detalle.producto?.categoria || '').toLowerCase();

        // Márgenes típicos de minimarkets peruanos
        if (categoria.includes('bebida') || categoria.includes('gaseosa') || categoria.includes('agua')) {
          return precioVenta * 0.60; // 40% margen
        } else if (categoria.includes('snack') || categoria.includes('galleta') || categoria.includes('dulce')) {
          return precioVenta * 0.65; // 35% margen
        } else if (categoria.includes('abarrote') || categoria.includes('arroz') || categoria.includes('azúcar')) {
          return precioVenta * 0.75; // 25% margen
        } else if (categoria.includes('limpieza') || categoria.includes('higiene')) {
          return precioVenta * 0.70; // 30% margen
        } else {
          return precioVenta * 0.70; // 30% margen por defecto
        }
      };

      let gananciaHoy = 0;
      let productosConPrecioCompra = 0;
      let productosConEstimacion = 0;

      ventasHoy.forEach(venta => {
        if (venta.detalles && Array.isArray(venta.detalles)) {
          venta.detalles.forEach(detalle => {
            const precioVenta = parseFloat(detalle.precio_unitario || detalle.precio_venta || 0);
            const cantidad = parseInt(detalle.cantidad || 0);

            // CORRECCIÓN CRÍTICA: Usar precio_compra_unitario, si no existe, estimar
            let precioCompra = parseFloat(detalle.precio_compra_unitario || detalle.producto?.precio_compra || 0);
            let esEstimado = false;

            if (precioCompra === 0 && precioVenta > 0) {
              precioCompra = estimarPrecioCompra(detalle);
              esEstimado = true;
              productosConEstimacion++;
              console.warn(`  ⚠️ "${detalle.producto?.nombre || 'Desconocido'}" sin precio_compra → estimando S/ ${precioCompra.toFixed(2)} (${detalle.producto?.categoria || 'sin categoría'})`);
            } else if (precioCompra > 0) {
              productosConPrecioCompra++;
            }

            const margen = (precioVenta - precioCompra) * cantidad;
            gananciaHoy += margen;

            console.log(`  ${detalle.producto?.nombre || 'Desconocido'}: (${precioVenta.toFixed(2)} - ${precioCompra.toFixed(2)}${esEstimado ? ' ESTIMADO' : ''}) × ${cantidad} = S/ ${margen.toFixed(2)}`);
          });
        }
      });

      console.log('💎 Ganancia total hoy: S/', gananciaHoy.toFixed(2));
      console.log(`📊 Productos con precio_compra: ${productosConPrecioCompra}, con estimación: ${productosConEstimacion}`);

      // 5. Productos
      const productosResponse = await axiosInstance.get('/products', {
        params: { activo: true }
      });

      let productos = [];
      if (productosResponse.data?.success) {
        if (Array.isArray(productosResponse.data.data)) {
          productos = productosResponse.data.data;
        } else if (Array.isArray(productosResponse.data.data?.productos)) {
          productos = productosResponse.data.data.productos;
        }
      } else if (Array.isArray(productosResponse.data)) {
        productos = productosResponse.data;
      } else if (Array.isArray(productosResponse.data?.data)) {
        productos = productosResponse.data.data;
      } else if (Array.isArray(productosResponse.data?.productos)) {
        productos = productosResponse.data.productos;
      }

      const productosConStock = productos.filter(p =>
        (p.stock_total > 0 || p.stock > 0) && p.activo
      ).length;

      console.log('📦 Productos con stock:', productosConStock);

      // 6. Productos bajo stock
      const bajoStockResponse = await axiosInstance.get('/products', {
        params: { bajo_stock: true }
      });

      let bajoStock = [];
      if (bajoStockResponse.data?.success) {
        if (Array.isArray(bajoStockResponse.data.data)) {
          bajoStock = bajoStockResponse.data.data;
        } else if (Array.isArray(bajoStockResponse.data.data?.productos)) {
          bajoStock = bajoStockResponse.data.data.productos;
        }
      } else if (Array.isArray(bajoStockResponse.data)) {
        bajoStock = bajoStockResponse.data;
      } else if (Array.isArray(bajoStockResponse.data?.productos)) {
        bajoStock = bajoStockResponse.data.productos;
      }

      // 7. Alertas de lotes (BUG 1 CORREGIDO - lotes que vencen en próximos 7 días)
      console.log('⚠️ Obteniendo lotes por vencer...');
      const alertasResponse = await lotesAPI.getAlertas(7);

      let alertas = [];
      if (alertasResponse?.success) {
        if (Array.isArray(alertasResponse.data)) {
          alertas = alertasResponse.data;
        } else if (Array.isArray(alertasResponse.data?.lotes)) {
          alertas = alertasResponse.data.lotes;
        }
      } else if (Array.isArray(alertasResponse)) {
        alertas = alertasResponse;
      } else if (Array.isArray(alertasResponse?.data)) {
        alertas = alertasResponse.data;
      }

      // Filtrar solo lotes activos (cantidad_actual > 0) y que vencen en próximos 7 días
      const hoyPeruDate = new Date(hoyPeru);
      const alertasFiltradas = alertas.filter(lote => {
        const cantidadActual = parseInt(lote.cantidad_actual || 0);
        if (cantidadActual <= 0) return false;

        const fechaVenc = new Date(lote.fecha_vencimiento);
        const diasHastaVencer = daysDifference(fechaVenc, hoyPeruDate);

        // Incluir lotes que vencen desde hoy hasta 7 días en el futuro
        return diasHastaVencer >= 0 && diasHastaVencer <= 7;
      });

      console.log(`⚠️ Lotes por vencer (próximos 7 días): ${alertasFiltradas.length}`);

      // 8. Lotes vencidos (BUG 4 CORREGIDO - incluir lotes que vencen HOY)
      console.log('🔴 Obteniendo lotes vencidos...');
      const vencidosResponse = await lotesAPI.getLotesVencidos();

      let lotesVencidos = [];
      if (vencidosResponse?.success) {
        if (Array.isArray(vencidosResponse.data)) {
          lotesVencidos = vencidosResponse.data;
        } else if (Array.isArray(vencidosResponse.data?.lotes)) {
          lotesVencidos = vencidosResponse.data.lotes;
        }
      } else if (Array.isArray(vencidosResponse)) {
        lotesVencidos = vencidosResponse;
      } else if (Array.isArray(vencidosResponse?.data)) {
        lotesVencidos = vencidosResponse.data;
      }

      // Filtrar lotes vencidos: fecha_vencimiento <= HOY y cantidad_actual > 0
      const vencidosFiltrados = lotesVencidos.filter(lote => {
        const cantidadActual = parseInt(lote.cantidad_actual || 0);
        if (cantidadActual <= 0) return false;

        const fechaVenc = new Date(lote.fecha_vencimiento);
        const fechaVencStr = extractDateOnly(fechaVenc);

        // Incluir si vence hoy o antes
        return fechaVencStr <= hoyPeru;
      });

      console.log(`🔴 Lotes vencidos (incluye hoy): ${vencidosFiltrados.length}`);

      const resultado = {
        success: true,
        data: {
          stats: {
            ventasHoy: totalVentasHoy,
            gananciaHoy,
            productosEnStock: productosConStock,
            porVencer: alertasFiltradas.length,
          },
          alertas: {
            bajoStock,
            porVencer: alertasFiltradas,
            vencidos: vencidosFiltrados,
          },
          ventasHoyCount: ventasHoy.length,
          totalProductos: productos.length,
          productosBajoStock: bajoStock.length,
          todasVentas,
        }
      };

      console.log('🎯 RESUMEN DASHBOARD:', resultado.data);

      return resultado;

    } catch (error) {
      console.error('❌ Error obteniendo resumen dashboard:', error);
      console.error('URL:', error.config?.url);
      throw error;
    }
  },

  /**
   * Obtiene ventas de los últimos 7 días agrupadas por día
   */
  getVentasUltimos7Dias: async () => {
    try {
      console.log('📊 Obteniendo ventas últimos 7 días...');

      const response = await axiosInstance.get('/ventas');

      if (!response.data?.success && !Array.isArray(response.data)) {
        console.warn('⚠️ Respuesta sin datos de ventas');
        return { success: false, data: [] };
      }

      // Extraer ventas con múltiples estructuras
      let ventas = [];
      if (response.data?.success) {
        if (Array.isArray(response.data.data)) {
          ventas = response.data.data;
        } else if (Array.isArray(response.data.data?.ventas)) {
          ventas = response.data.data.ventas;
        }
      } else if (Array.isArray(response.data)) {
        ventas = response.data;
      } else if (Array.isArray(response.data?.data)) {
        ventas = response.data.data;
      }

      console.log('📦 Total ventas para gráfico:', ventas.length);

      // Calcular últimos 7 días
      const hoy = new Date();
      const ventasPorDia = {};

      // Inicializar últimos 7 días con 0
      for (let i = 6; i >= 0; i--) {
        const fecha = subDays(hoy, i);
        const fechaStr = format(fecha, 'yyyy-MM-dd');

        ventasPorDia[fechaStr] = {
          fecha: fechaStr,
          fechaFormateada: format(fecha, 'dd MMM', { locale: es }),
          total: 0,
          cantidad: 0,
        };
      }

      console.log('📅 Días inicializados:', Object.keys(ventasPorDia));

      // Agrupar ventas por día (usando zona horaria de Perú)
      ventas.forEach(venta => {
        // Usar fecha_venta, fecha o created_at
        const fechaCompleta = venta.fecha_venta || venta.fecha || venta.created_at;
        if (!fechaCompleta) {
          console.warn('⚠️ Venta sin fecha:', venta);
          return;
        }

        // Extraer fecha (YYYY-MM-DD) en zona horaria de Perú
        const fechaVenta = extractDateOnly(fechaCompleta);

        // Si la fecha está en los últimos 7 días, sumar
        if (ventasPorDia[fechaVenta]) {
          const totalVenta = parseFloat(venta.total || 0);
          ventasPorDia[fechaVenta].total += totalVenta;
          ventasPorDia[fechaVenta].cantidad += 1;

          console.log(`  ✅ Venta agregada a ${fechaVenta}: S/ ${totalVenta.toFixed(2)}`);
        }
      });

      // Convertir a array para Recharts
      const ventasArray = Object.values(ventasPorDia);

      console.log('📊 Datos para gráfico:', ventasArray);
      console.log('📈 Totales por día:');
      ventasArray.forEach(dia => {
        console.log(`  ${dia.fechaFormateada} (${dia.fecha}): S/ ${dia.total.toFixed(2)} (${dia.cantidad} ventas)`);
      });

      return {
        success: true,
        data: ventasArray,
      };
    } catch (error) {
      console.error('❌ Error obteniendo ventas últimos 7 días:', error);
      throw error;
    }
  },

  /**
   * Obtiene top N productos más vendidos
   */
  getTopProductos: async (limit = 10) => {
    try {
      console.log('\n' + '='.repeat(70));
      console.log('🏆 OBTENIENDO TOP PRODUCTOS MÁS VENDIDOS');
      console.log('='.repeat(70));

      // Obtener todas las ventas
      const response = await axiosInstance.get('/ventas');

      console.log('📊 Respuesta de /api/ventas:', response.data);

      let ventas = [];
      if (Array.isArray(response.data)) {
        ventas = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        ventas = response.data.data;
      } else if (response.data && Array.isArray(response.data.ventas)) {
        ventas = response.data.ventas;
      } else if (response.data?.success && Array.isArray(response.data.data)) {
        ventas = response.data.data;
      }

      console.log(`📦 Total ventas procesadas: ${ventas.length}`);

      if (ventas.length > 0) {
        console.log('📊 Primera venta:', {
          id: ventas[0].id,
          numero_venta: ventas[0].numero_venta,
          tieneDetalles: ventas[0].detalles ? 'SÍ' : 'NO',
          cantidadDetalles: ventas[0].detalles?.length || 0
        });

        if (ventas[0].detalles && ventas[0].detalles.length > 0) {
          console.log('📊 Primer detalle:', {
            producto_id: ventas[0].detalles[0].producto_id,
            cantidad: ventas[0].detalles[0].cantidad,
            subtotal: ventas[0].detalles[0].subtotal,
            producto_nombre: ventas[0].detalles[0].producto?.nombre || ventas[0].detalles[0].producto_nombre
          });
        }
      }

      // Agrupar por producto
      const productosMap = {};
      let detallesCount = 0;

      ventas.forEach(venta => {
        if (venta.detalles && Array.isArray(venta.detalles)) {
          venta.detalles.forEach(detalle => {
            detallesCount++;

            const productoId = detalle.producto_id;
            const cantidad = parseInt(detalle.cantidad || 0);
            const subtotal = parseFloat(detalle.subtotal || detalle.subtotal_final || (detalle.precio_unitario * detalle.cantidad) || 0);
            const nombreProducto = detalle.producto?.nombre || detalle.producto_nombre || 'Producto Desconocido';

            console.log(`  Procesando: ${nombreProducto} (ID: ${productoId}) - Cantidad: ${cantidad}, Subtotal: S/ ${subtotal.toFixed(2)}`);

            if (!productosMap[productoId]) {
              productosMap[productoId] = {
                producto_id: productoId,
                nombre: nombreProducto,
                cantidadVendida: 0,
                totalVendido: 0,
              };
            }

            productosMap[productoId].cantidadVendida += cantidad;
            productosMap[productoId].totalVendido += subtotal;
          });
        }
      });

      console.log(`📋 Total detalles procesados: ${detallesCount}`);
      console.log(`📋 Productos únicos encontrados: ${Object.keys(productosMap).length}`);

      // Convertir a array y ordenar
      const productosArray = Object.values(productosMap);
      productosArray.sort((a, b) => b.cantidadVendida - a.cantidadVendida);

      console.log('📊 Productos ordenados por cantidad:');
      productosArray.forEach((p, idx) => {
        console.log(`  ${idx + 1}. ${p.nombre}: ${p.cantidadVendida} unidades, S/ ${p.totalVendido.toFixed(2)}`);
      });

      // Tomar top N
      const topProductos = productosArray.slice(0, limit);

      // Calcular máximo para barra de progreso
      const maxCantidad = topProductos.length > 0 ? topProductos[0].cantidadVendida : 1;

      topProductos.forEach(producto => {
        producto.porcentaje = (producto.cantidadVendida / maxCantidad) * 100;
      });

      console.log(`🏆 Top ${limit} productos:`, topProductos);
      console.log('='.repeat(70) + '\n');

      return {
        success: true,
        data: topProductos,
      };
    } catch (error) {
      console.error('Error obteniendo top productos:', error);
      throw error;
    }
  },

  /**
   * Obtiene las últimas N ventas
   */
  getUltimasVentas: async (limit = 10) => {
    try {
      const response = await axiosInstance.get('/ventas');

      let ventas = [];
      if (Array.isArray(response.data)) {
        ventas = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        ventas = response.data.data;
      } else if (response.data && Array.isArray(response.data.ventas)) {
        ventas = response.data.ventas;
      }

      // Ordenar por fecha descendente
      ventas.sort((a, b) => {
        const fechaA = new Date(a.fecha || a.created_at);
        const fechaB = new Date(b.fecha || b.created_at);
        return fechaB - fechaA;
      });

      // Tomar últimas N
      const ultimasVentas = ventas.slice(0, limit);

      return {
        success: true,
        data: ultimasVentas,
      };
    } catch (error) {
      console.error('Error obteniendo últimas ventas:', error);
      throw error;
    }
  },

  /**
   * Obtiene ventas filtradas por rango de fechas
   */
  getVentasPorFecha: async (fechaInicio, fechaFin, limit = 50) => {
    try {
      console.log(`📅 Obteniendo ventas desde ${fechaInicio} hasta ${fechaFin}`);

      const response = await axiosInstance.get('/ventas', {
        params: {
          desde: fechaInicio,
          hasta: fechaFin,
          limit: limit
        }
      });

      let ventas = [];
      if (response.data?.success) {
        if (Array.isArray(response.data.data)) {
          ventas = response.data.data;
        } else if (Array.isArray(response.data.data?.ventas)) {
          ventas = response.data.data.ventas;
        }
      } else if (Array.isArray(response.data)) {
        ventas = response.data;
      } else if (Array.isArray(response.data?.data)) {
        ventas = response.data.data;
      }

      console.log(`📦 Total ventas encontradas: ${ventas.length}`);

      // Ordenar por fecha descendente
      ventas.sort((a, b) => {
        const fechaA = new Date(a.fecha || a.created_at);
        const fechaB = new Date(b.fecha || b.created_at);
        return fechaB - fechaA;
      });

      // Limitar resultados
      const ventasLimitadas = ventas.slice(0, limit);

      return {
        success: true,
        data: ventasLimitadas,
        total: ventas.length
      };
    } catch (error) {
      console.error('Error obteniendo ventas por fecha:', error);
      throw error;
    }
  },

  /**
   * Cuenta productos con stock > 0 y activos
   */
  getProductosEnStock: async () => {
    try {
      const response = await productsAPI.listProducts({ activo: true });

      let productos = [];
      if (Array.isArray(response.data)) {
        productos = response.data;
      } else if (response.data && Array.isArray(response.data.productos)) {
        productos = response.data.productos;
      }

      const conStock = productos.filter(p => (p.stock_total || 0) > 0);
      return conStock.length;
    } catch (error) {
      console.error('Error contando productos en stock:', error);
      return 0;
    }
  },

  /**
   * Obtiene métricas de inventario
   */
  getReporteInventario: async () => {
    try {
      const response = await productsAPI.listProducts({});

      let productos = [];
      if (Array.isArray(response.data)) {
        productos = response.data;
      } else if (response.data && Array.isArray(response.data.productos)) {
        productos = response.data.productos;
      }

      const totalProductos = productos.length;
      const productosActivos = productos.filter(p => p.activo).length;
      const productosConStock = productos.filter(p => (p.stock_total || 0) > 0).length;
      const productosBajoStock = productos.filter(p =>
        p.activo && (p.stock_total || 0) <= (p.stock_minimo || 0)
      ).length;

      const valorInventario = productos.reduce((sum, p) => {
        if (p.activo) {
          return sum + (parseFloat(p.precio_compra || 0) * parseInt(p.stock_total || 0));
        }
        return sum;
      }, 0);

      return {
        success: true,
        data: {
          totalProductos,
          productosActivos,
          productosConStock,
          productosBajoStock,
          valorInventario,
        },
      };
    } catch (error) {
      console.error('Error obteniendo reporte inventario:', error);
      throw error;
    }
  },
};

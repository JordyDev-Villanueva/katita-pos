import axiosInstance from './axios';

export const ventasAPI = {
  // Crear nueva venta
  createVenta: async (ventaData) => {
    console.log('\n' + '='.repeat(70));
    console.log('🛒 CREANDO VENTA - Datos a enviar');
    console.log('='.repeat(70));
    console.log('📦 ventaData completo:', JSON.stringify(ventaData, null, 2));
    console.log('🔑 Campos en ventaData:', Object.keys(ventaData));

    if (ventaData.items) {
      console.log(`📊 Tiene "items": ${ventaData.items.length} productos`);
      ventaData.items.forEach((item, idx) => {
        console.log(`  Producto ${idx + 1}:`, {
          producto_id: item.producto_id,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          precio_compra_unitario: item.precio_compra_unitario
        });
      });
    }

    if (ventaData.detalles) {
      console.log(`📊 Tiene "detalles": ${ventaData.detalles.length} productos`);
      ventaData.detalles.forEach((detalle, idx) => {
        console.log(`  Detalle ${idx + 1}:`, {
          producto_id: detalle.producto_id,
          cantidad: detalle.cantidad,
          precio_unitario: detalle.precio_unitario,
          precio_compra_unitario: detalle.precio_compra_unitario
        });
      });
    }

    console.log('🚀 Enviando POST a /api/ventas...');
    console.log('='.repeat(70));

    try {
      const response = await axiosInstance.post('/ventas', ventaData);
      console.log('✅ RESPUESTA EXITOSA:');
      console.log(response.data);
      console.log('='.repeat(70) + '\n');
      return response.data;
    } catch (error) {
      console.error('\n' + '='.repeat(70));
      console.error('❌ ERROR AL CREAR VENTA');
      console.error('='.repeat(70));
      console.error('Status:', error.response?.status);
      console.error('Status Text:', error.response?.statusText);
      console.error('Error data:', error.response?.data);
      console.error('Request URL:', error.config?.url);
      console.error('Request method:', error.config?.method);
      console.error('Request data:', error.config?.data);
      console.error('='.repeat(70) + '\n');
      throw error;
    }
  },

  // Obtener ventas del día
  getVentasDelDia: async () => {
    const response = await axiosInstance.get('/ventas/dia');
    return response.data;
  },

  // Obtener detalle de una venta
  getVentaById: async (id) => {
    const response = await axiosInstance.get(`/ventas/${id}`);
    return response.data;
  },
};

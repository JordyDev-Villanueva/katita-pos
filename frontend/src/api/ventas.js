import axiosInstance from './axios';

export const ventasAPI = {
  // Crear nueva venta
  createVenta: async (ventaData) => {
    const response = await axiosInstance.post('/ventas', ventaData);
    return response.data;
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

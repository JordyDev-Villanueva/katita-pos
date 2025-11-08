import axiosInstance from './axios';

export const lotesAPI = {
  // Listar lotes con filtros
  listLotes: async (params = {}) => {
    const response = await axiosInstance.get('/lotes', { params });
    return response.data;
  },

  // Crear nuevo lote (registrar ingreso de mercadería)
  createLote: async (loteData) => {
    const response = await axiosInstance.post('/lotes', loteData);
    return response.data;
  },

  // Obtener un lote por ID
  getLoteById: async (id) => {
    const response = await axiosInstance.get(`/lotes/${id}`);
    return response.data;
  },

  // Actualizar lote (solo ubicación y notas)
  updateLote: async (id, loteData) => {
    const response = await axiosInstance.put(`/lotes/${id}`, loteData);
    return response.data;
  },

  // Obtener lotes FIFO de un producto específico
  getLotesByProducto: async (productoId) => {
    const response = await axiosInstance.get(`/lotes/producto/${productoId}`);
    return response.data;
  },

  // Obtener alertas de productos por vencer
  getAlertas: async (dias = 7) => {
    const response = await axiosInstance.get('/lotes/alertas', {
      params: { dias }
    });
    return response.data;
  },

  // Obtener lotes vencidos (mermas)
  getLotesVencidos: async () => {
    const response = await axiosInstance.get('/lotes/vencidos');
    return response.data;
  },
};

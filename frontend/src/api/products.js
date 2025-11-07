import axiosInstance from './axios';

export const productsAPI = {
  // Buscar por código de barras
  searchByBarcode: async (barcode) => {
    const response = await axiosInstance.get(`/products/barcode/${barcode}`);
    return response.data;
  },

  // Listar todos los productos
  listProducts: async (params = {}) => {
    const response = await axiosInstance.get('/products', { params });
    return response.data;
  },

  // Buscar productos por nombre
  searchByName: async (searchTerm) => {
    const response = await axiosInstance.get('/products', {
      params: { buscar: searchTerm, activo: true }
    });
    return response.data;
  },

  // NUEVOS MÉTODOS PARA CRUD:

  // Crear producto
  createProduct: async (productData) => {
    const response = await axiosInstance.post('/products', productData);
    return response.data;
  },

  // Obtener un producto por ID
  getProductById: async (id) => {
    const response = await axiosInstance.get(`/products/${id}`);
    return response.data;
  },

  // Actualizar producto
  updateProduct: async (id, productData) => {
    const response = await axiosInstance.put(`/products/${id}`, productData);
    return response.data;
  },

  // Activar/Desactivar producto (no eliminar)
  toggleProductStatus: async (id, activo) => {
    const response = await axiosInstance.put(`/products/${id}`, { activo });
    return response.data;
  },
};

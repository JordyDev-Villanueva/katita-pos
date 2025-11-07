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
};

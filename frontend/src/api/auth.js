import axios from 'axios';
import axiosInstance from './axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';

export const authAPI = {
  login: async (username, password) => {
    console.log('📤 Enviando login al backend...');

    // NO usar axiosInstance aquí porque no tenemos token todavía
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      username,
      password,
    });

    console.log('📥 Respuesta recibida del backend:', response.data);
    return response.data;
  },

  logout: async () => {
    const response = await axiosInstance.post('/auth/logout');
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await axiosInstance.get('/auth/me');
    return response.data;
  },

  refreshToken: async (refreshToken) => {
    const response = await axiosInstance.post('/auth/refresh', {
      refresh_token: refreshToken,
    });
    return response.data;
  },
};

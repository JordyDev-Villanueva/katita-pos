import axiosInstance from './axios';

export const authAPI = {
  login: async (username, password) => {
    const response = await axiosInstance.post('/auth/login', {
      username,
      password,
    });
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

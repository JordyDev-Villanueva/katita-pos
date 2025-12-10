import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 segundos (para reportes con gráficos)
});

// Interceptor para agregar token en cada request
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`✅ Token JWT agregado al request: ${config.method.toUpperCase()} ${config.url}`);
    } else {
      console.warn(`⚠️ No hay token JWT - Request sin autenticación: ${config.method.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => {
    console.error('❌ Error en request interceptor:', error);
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de respuesta y refresh automático de token
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si el error es 401 y no hemos intentado refrescar todavía
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.warn('⚠️ Token expirado, intentando refrescar...');

      originalRequest._retry = true;

      try {
        // Intentar obtener nuevo token usando refresh token
        const refreshToken = localStorage.getItem('refresh_token');

        if (refreshToken) {
          const response = await axios.post(
            `${API_BASE_URL}/auth/refresh`,
            {},
            {
              headers: {
                Authorization: `Bearer ${refreshToken}`
              }
            }
          );

          if (response.data.success && response.data.data.access_token) {
            // Guardar nuevo token
            localStorage.setItem('access_token', response.data.data.access_token);

            console.log('✅ Token refrescado exitosamente');

            // Reintentar request original con nuevo token
            originalRequest.headers.Authorization = `Bearer ${response.data.data.access_token}`;
            return axiosInstance(originalRequest);
          }
        }
      } catch (refreshError) {
        console.error('❌ Error al refrescar token:', refreshError);

        // Si no se pudo refrescar, limpiar tokens y redirigir a login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';

        return Promise.reject(refreshError);
      }
    }

    // Si es 401 pero ya intentamos refrescar, limpiar y redirigir
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;

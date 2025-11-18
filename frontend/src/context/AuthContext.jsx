import { createContext, useState, useEffect } from 'react';
import { authAPI } from '../api/auth';
import toast from 'react-hot-toast';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Cargar usuario al iniciar
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token');
      const savedUser = localStorage.getItem('user');

      if (token && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          setIsAuthenticated(true);

          // Verificar token con el backend
          const response = await authAPI.getCurrentUser();
          if (response.success) {
            setUser(response.data);
            localStorage.setItem('user', JSON.stringify(response.data));
          }
        } catch (error) {
          console.error('Error verificando sesión:', error);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (username, password) => {
    try {
      console.log('🔐 Iniciando login...');
      const response = await authAPI.login(username, password);

      console.log('📦 Respuesta del backend:', response);

      if (response.success) {
        // CORRECCIÓN: Los datos están en response.data, no en response directamente
        const { user, access_token, refresh_token } = response.data;

        console.log('✅ Datos extraídos:', { user: user?.username, hasAccessToken: !!access_token, hasRefreshToken: !!refresh_token });

        if (!access_token || !refresh_token) {
          console.error('❌ Tokens faltantes en la respuesta');
          throw new Error('No se recibieron los tokens de autenticación');
        }

        // Guardar en localStorage
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', refresh_token);
        localStorage.setItem('user', JSON.stringify(user));

        console.log('✅ Tokens guardados en localStorage');
        console.log('   access_token:', localStorage.getItem('access_token') ? 'OK' : 'FALTA');
        console.log('   refresh_token:', localStorage.getItem('refresh_token') ? 'OK' : 'FALTA');

        // Actualizar estado
        setUser(user);
        setIsAuthenticated(true);

        // Marcar que acaba de hacer login (para mostrar notificación en Dashboard)
        sessionStorage.setItem('justLoggedIn', 'true');

        return { success: true };
      } else {
        throw new Error(response.message || 'Login falló');
      }
    } catch (error) {
      console.error('❌ Error en login:', error);
      const message = error.response?.data?.message || error.message || 'Error al iniciar sesión';
      toast.error(message);
      return { success: false, message };
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);

    // Marcar que acaba de cerrar sesión (para mostrar notificación en Login)
    sessionStorage.setItem('justLoggedOut', 'true');
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

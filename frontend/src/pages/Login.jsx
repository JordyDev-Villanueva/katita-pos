import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, CheckCircle, LogIn, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [logoutMessage, setLogoutMessage] = useState(false);

  // Detectar si acaba de cerrar sesión
  useEffect(() => {
    const justLoggedOut = sessionStorage.getItem('justLoggedOut');
    if (justLoggedOut === 'true') {
      setLogoutMessage(true);
      sessionStorage.removeItem('justLoggedOut');

      // Ocultar después de 3 segundos
      setTimeout(() => setLogoutMessage(false), 3000);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
      {/* Notificación de logout exitoso */}
      {logoutMessage && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-green-100 text-green-700 px-4 py-3 rounded-lg shadow-lg animate-fade-in">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">Sesión cerrada correctamente</span>
        </div>
      )}

      <div className="w-full max-w-md">
        {/* Logo y Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl mb-4 shadow-2xl">
            <img
              src="/favicon.svg"
              alt="KATITA POS Logo"
              className="w-12 h-12"
            />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">KATITA POS</h1>
          <p className="text-blue-200">Sistema de Punto de Venta</p>
          <p className="text-sm text-blue-300">Minimarket - Guadalupito, Perú</p>
        </div>

        {/* Formulario de Login */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
            Iniciar Sesión
          </h2>

          {/* Banner de Credenciales Demo */}
          <div className="mb-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="bg-blue-500 text-white p-2.5 rounded-lg shadow-md flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
                  <span>🎯</span> Credenciales Demo
                </p>
                <div className="space-y-2">
                  <div className="bg-white rounded-lg p-3 border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-semibold text-gray-700">👑 Admin (Acceso Total)</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <code className="bg-blue-100 text-blue-700 px-2 py-1 rounded font-mono font-semibold">admin</code>
                      <span className="text-gray-400">/</span>
                      <code className="bg-blue-100 text-blue-700 px-2 py-1 rounded font-mono font-semibold">admin123</code>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-green-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-semibold text-gray-700">👤 Vendedor</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <code className="bg-green-100 text-green-700 px-2 py-1 rounded font-mono font-semibold">vendedor1</code>
                      <span className="text-gray-400">/</span>
                      <code className="bg-green-100 text-green-700 px-2 py-1 rounded font-mono font-semibold">vendedor1</code>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-start gap-2 bg-blue-100 bg-opacity-50 rounded-lg p-2">
                  <span className="text-blue-600 text-sm flex-shrink-0">ℹ️</span>
                  <p className="text-xs text-blue-800 leading-relaxed">
                    Sistema demo. Los datos se resetean diariamente a las 3 AM.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Mensaje de error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Campo Usuario */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Usuario <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ingresa tu usuario"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  required
                  autoFocus
                />
              </div>
            </div>

            {/* Campo Contraseña */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresa tu contraseña"
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Botón Login */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Iniciando sesión...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Iniciar Sesión</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-blue-200 mt-6">
          © 2025 KATITA POS - Desarrollado por Jordy Villanueva
        </p>
      </div>
    </div>
  );
};

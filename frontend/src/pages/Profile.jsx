import { useState, useEffect } from 'react';
import { User, Lock, Mail, Phone, Save, Eye, EyeOff, Shield, UserCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { authAPI } from '../api/auth';
import { Layout } from '../components/layout/Layout';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user } = useAuth();
  // Cache bust: v2.0.1

  // Estados para el formulario
  const [formData, setFormData] = useState({
    nombre_completo: '',
    email: '',
    telefono: ''
  });

  // Estados para cambio de contraseña
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Cargar datos del usuario al montar el componente
  useEffect(() => {
    if (user) {
      setFormData({
        nombre_completo: user.nombre_completo || '',
        email: user.email || '',
        telefono: user.telefono || ''
      });
    }
  }, [user]);

  // Manejar cambios en el formulario de datos personales
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar error del campo
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  // Manejar cambios en el formulario de contraseña
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar error del campo
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  // Guardar cambios de datos personales
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const response = await authAPI.updateProfile(formData);

      if (response.success) {
        toast.success('Perfil actualizado correctamente');
        // Actualizar el usuario en el contexto podría requerir refrescar
        window.location.reload();
      }
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
      toast.error(error.response?.data?.message || 'Error al actualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  // Cambiar contraseña
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    // Validar que las contraseñas coincidan
    if (passwordData.new_password !== passwordData.confirm_password) {
      setErrors({ confirm_password: 'Las contraseñas no coinciden' });
      setLoading(false);
      return;
    }

    // Validar longitud mínima
    if (passwordData.new_password.length < 6) {
      setErrors({ new_password: 'La contraseña debe tener al menos 6 caracteres' });
      setLoading(false);
      return;
    }

    try {
      const response = await authAPI.updateProfile({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      });

      if (response.success) {
        toast.success('Contraseña cambiada correctamente');
        // Limpiar formulario de contraseña
        setPasswordData({
          current_password: '',
          new_password: '',
          confirm_password: ''
        });
      }
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
      toast.error(error.response?.data?.message || 'Error al cambiar contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header Profesional con Gradiente */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm">
              <UserCircle className="w-12 h-12" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Mi Perfil</h1>
              <p className="text-primary-100 mt-1">Administra tu información personal y seguridad</p>
            </div>
          </div>
        </div>

        {/* User Info Card Mejorada */}
        <div className="bg-white rounded-xl shadow-xl border-4 border-gray-300 p-6">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-primary-500 to-primary-700 p-4 rounded-full shadow-lg border-4 border-white ring-4 ring-primary-300">
              <User className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900">{user?.nombre_completo}</h2>
              <p className="text-sm text-gray-500 font-medium">@{user?.username}</p>
            </div>
            <div>
              <span className={`px-4 py-2 rounded-full text-sm font-bold shadow-lg border-3 ${
                user?.rol === 'admin' ? 'bg-purple-100 text-purple-800 border-purple-400 ring-2 ring-purple-200' :
                user?.rol === 'vendedor' ? 'bg-blue-100 text-blue-800 border-blue-400 ring-2 ring-blue-200' :
                'bg-green-100 text-green-800 border-green-400 ring-2 ring-green-200'
              }`}>
                <Shield className="w-4 h-4 inline mr-1" />
                {user?.rol === 'admin' ? 'Administrador' :
                 user?.rol === 'vendedor' ? 'Vendedor' : 'Bodeguero'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Información Personal */}
          <div className="bg-white rounded-xl shadow-xl border-4 border-gray-300 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-b-4 border-blue-400 px-6 py-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Información Personal
              </h2>
            </div>

            <form onSubmit={handleSaveProfile} className="p-6 space-y-5">
              {/* Usuario (solo lectura) */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Usuario
                </label>
                <input
                  type="text"
                  value={user?.username || ''}
                  disabled
                  className="w-full px-4 py-3 border-3 border-gray-400 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed font-medium shadow-inner"
                />
                <p className="text-xs text-gray-500 mt-1.5">El nombre de usuario no se puede cambiar</p>
              </div>

              {/* Nombre completo */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  name="nombre_completo"
                  value={formData.nombre_completo}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border-3 rounded-lg focus:ring-4 focus:ring-blue-300 focus:border-blue-500 transition-all shadow-sm ${
                    errors.nombre_completo ? 'border-red-500 bg-red-50' : 'border-gray-400 hover:border-blue-400'
                  }`}
                  required
                />
                {errors.nombre_completo && (
                  <p className="text-red-600 text-sm mt-1.5 font-medium">{errors.nombre_completo}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-blue-600" />
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border-3 rounded-lg focus:ring-4 focus:ring-blue-300 focus:border-blue-500 transition-all shadow-sm ${
                    errors.email ? 'border-red-500 bg-red-50' : 'border-gray-400 hover:border-blue-400'
                  }`}
                  required
                />
                {errors.email && (
                  <p className="text-red-600 text-sm mt-1.5 font-medium">{errors.email}</p>
                )}
              </div>

              {/* Teléfono */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-blue-600" />
                  Teléfono
                </label>
                <input
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border-3 border-gray-400 hover:border-blue-400 rounded-lg focus:ring-4 focus:ring-blue-300 focus:border-blue-500 transition-all shadow-sm"
                  placeholder="Opcional"
                />
              </div>

              {/* Botón guardar */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Guardar Cambios
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Cambiar Contraseña */}
          <div className="bg-white rounded-xl shadow-xl border-4 border-gray-300 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 border-b-4 border-purple-400 px-6 py-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Lock className="w-5 h-5 text-purple-600" />
                Cambiar Contraseña
              </h2>
            </div>

            <form onSubmit={handleChangePassword} className="p-6 space-y-5">
              {/* Contraseña actual */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Contraseña Actual *
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    name="current_password"
                    value={passwordData.current_password}
                    onChange={handlePasswordChange}
                    className={`w-full px-4 py-3 pr-12 border-3 rounded-lg focus:ring-4 focus:ring-purple-300 focus:border-purple-500 transition-all shadow-sm ${
                      errors.current_password ? 'border-red-500 bg-red-50' : 'border-gray-400 hover:border-purple-400'
                    }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors p-1"
                  >
                    {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.current_password && (
                  <p className="text-red-600 text-sm mt-1.5 font-medium">{errors.current_password}</p>
                )}
              </div>

              {/* Nueva contraseña */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nueva Contraseña *
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    name="new_password"
                    value={passwordData.new_password}
                    onChange={handlePasswordChange}
                    className={`w-full px-4 py-3 pr-12 border-3 rounded-lg focus:ring-4 focus:ring-purple-300 focus:border-purple-500 transition-all shadow-sm ${
                      errors.new_password ? 'border-red-500 bg-red-50' : 'border-gray-400 hover:border-purple-400'
                    }`}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors p-1"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.new_password && (
                  <p className="text-red-600 text-sm mt-1.5 font-medium">{errors.new_password}</p>
                )}
                <p className="text-xs text-gray-500 mt-1.5">Mínimo 6 caracteres</p>
              </div>

              {/* Confirmar contraseña */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirmar Nueva Contraseña *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirm_password"
                    value={passwordData.confirm_password}
                    onChange={handlePasswordChange}
                    className={`w-full px-4 py-3 pr-12 border-3 rounded-lg focus:ring-4 focus:ring-purple-300 focus:border-purple-500 transition-all shadow-sm ${
                      errors.confirm_password ? 'border-red-500 bg-red-50' : 'border-gray-400 hover:border-purple-400'
                    }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors p-1"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirm_password && (
                  <p className="text-red-600 text-sm mt-1.5 font-medium">{errors.confirm_password}</p>
                )}
              </div>

              {/* Indicador de fortaleza */}
              {passwordData.new_password && (
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 space-y-2 border-3 border-gray-400 shadow-md">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Requisitos de contraseña:</p>
                  <div className="flex items-center gap-2 text-sm">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      passwordData.new_password.length >= 6 ? 'bg-green-500' : 'bg-gray-300'
                    }`}>
                      {passwordData.new_password.length >= 6 && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className={`font-medium ${passwordData.new_password.length >= 6 ? 'text-green-700' : 'text-gray-600'}`}>
                      Mínimo 6 caracteres
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      passwordData.new_password === passwordData.confirm_password && passwordData.confirm_password ? 'bg-green-500' : 'bg-gray-300'
                    }`}>
                      {passwordData.new_password === passwordData.confirm_password && passwordData.confirm_password && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className={`font-medium ${
                      passwordData.new_password === passwordData.confirm_password && passwordData.confirm_password ? 'text-green-700' : 'text-gray-600'
                    }`}>
                      Las contraseñas coinciden
                    </span>
                  </div>
                </div>
              )}

              {/* Botón cambiar contraseña */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Cambiando...
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    Cambiar Contraseña
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}

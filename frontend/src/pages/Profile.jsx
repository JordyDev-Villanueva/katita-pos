import { useState, useEffect } from 'react';
import { User, Lock, Mail, Phone, Save, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { authAPI } from '../api/auth';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user } = useAuth();

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <User className="w-8 h-8 text-blue-600" />
            Mi Perfil
          </h1>
          <p className="text-gray-600 mt-1">Administra tu información personal y seguridad</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Información Personal */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            Información Personal
          </h2>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            {/* Usuario (solo lectura) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Usuario
              </label>
              <input
                type="text"
                value={user?.username || ''}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">El nombre de usuario no se puede cambiar</p>
            </div>

            {/* Nombre completo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre Completo *
              </label>
              <input
                type="text"
                name="nombre_completo"
                value={formData.nombre_completo}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.nombre_completo ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {errors.nombre_completo && (
                <p className="text-red-500 text-sm mt-1">{errors.nombre_completo}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-1" />
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4 inline mr-1" />
                Teléfono
              </label>
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Opcional"
              />
            </div>

            {/* Rol (solo lectura) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rol
              </label>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  user?.rol === 'admin' ? 'bg-purple-100 text-purple-800' :
                  user?.rol === 'vendedor' ? 'bg-blue-100 text-blue-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {user?.rol === 'admin' ? 'Administrador' :
                   user?.rol === 'vendedor' ? 'Vendedor' : 'Bodeguero'}
                </span>
              </div>
            </div>

            {/* Botón guardar */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                'Guardando...'
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
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-blue-600" />
            Cambiar Contraseña
          </h2>

          <form onSubmit={handleChangePassword} className="space-y-4">
            {/* Contraseña actual */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña Actual *
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  name="current_password"
                  value={passwordData.current_password}
                  onChange={handlePasswordChange}
                  className={`w-full px-4 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.current_password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.current_password && (
                <p className="text-red-500 text-sm mt-1">{errors.current_password}</p>
              )}
            </div>

            {/* Nueva contraseña */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nueva Contraseña *
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  name="new_password"
                  value={passwordData.new_password}
                  onChange={handlePasswordChange}
                  className={`w-full px-4 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.new_password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.new_password && (
                <p className="text-red-500 text-sm mt-1">{errors.new_password}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
            </div>

            {/* Confirmar contraseña */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Nueva Contraseña *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirm_password"
                  value={passwordData.confirm_password}
                  onChange={handlePasswordChange}
                  className={`w-full px-4 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.confirm_password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirm_password && (
                <p className="text-red-500 text-sm mt-1">{errors.confirm_password}</p>
              )}
            </div>

            {/* Indicador de fortaleza */}
            {passwordData.new_password && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className={`w-4 h-4 ${passwordData.new_password.length >= 6 ? 'text-green-500' : 'text-gray-300'}`} />
                  <span className={passwordData.new_password.length >= 6 ? 'text-green-600' : 'text-gray-500'}>
                    Mínimo 6 caracteres
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className={`w-4 h-4 ${passwordData.new_password === passwordData.confirm_password && passwordData.confirm_password ? 'text-green-500' : 'text-gray-300'}`} />
                  <span className={passwordData.new_password === passwordData.confirm_password && passwordData.confirm_password ? 'text-green-600' : 'text-gray-500'}>
                    Las contraseñas coinciden
                  </span>
                </div>
              </div>
            )}

            {/* Botón cambiar contraseña */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                'Cambiando...'
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
  );
}

import { useState, useEffect } from 'react';
import { User, Lock, Mail, Phone, Save, Eye, EyeOff, Shield, UserCircle2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { authAPI } from '../api/auth';
import { Layout } from '../components/layout/Layout';
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

    // Validar que las contraseñas coincidan
    if (passwordData.new_password !== passwordData.confirm_password) {
      setErrors({ confirm_password: 'Las contraseñas no coinciden' });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await authAPI.changePassword({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      });

      if (response.success) {
        toast.success('Contraseña cambiada correctamente');
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
      {/* DISEÑO COMPACTO: TODO EN UNA PANTALLA SIN SCROLL */}
      <div className="h-[calc(100vh-80px)] overflow-hidden">
        <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">

          {/* COLUMNA IZQUIERDA: Info de Usuario */}
          <div className="lg:col-span-1 space-y-4">
            {/* Tarjeta de Usuario Compacta */}
            <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 rounded-xl shadow-xl p-6 text-white">
              <div className="flex flex-col items-center text-center">
                <div className="relative">
                  <div className="bg-white/20 backdrop-blur-sm p-4 rounded-full border-4 border-white/30 mb-3">
                    <UserCircle2 className="w-16 h-16 text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-green-400 w-5 h-5 rounded-full border-3 border-white"></div>
                </div>

                <h2 className="text-2xl font-bold mt-3">{user?.nombre_completo}</h2>
                <p className="text-indigo-200 text-sm font-medium">@{user?.username}</p>

                <div className="mt-4 w-full">
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${
                    user?.rol === 'admin'
                      ? 'bg-yellow-400 text-yellow-900'
                      : user?.rol === 'vendedor'
                      ? 'bg-blue-400 text-blue-900'
                      : 'bg-green-400 text-green-900'
                  }`}>
                    <Shield className="w-4 h-4" />
                    {user?.rol === 'admin' ? 'Administrador' :
                     user?.rol === 'vendedor' ? 'Vendedor' : 'Bodeguero'}
                  </div>
                </div>
              </div>
            </div>

            {/* Info Rápida */}
            <div className="bg-white rounded-xl shadow-lg p-4 space-y-3">
              <div className="flex items-center gap-3 text-gray-700">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 font-medium">Email</p>
                  <p className="text-sm font-semibold truncate">{user?.email || 'No configurado'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-gray-700">
                <div className="bg-green-100 p-2 rounded-lg">
                  <Phone className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 font-medium">Teléfono</p>
                  <p className="text-sm font-semibold truncate">{user?.telefono || 'No configurado'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: Formularios en 2 columnas */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Formulario de Información Personal */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden h-fit">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-5 py-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Información Personal
                </h3>
              </div>

              <form onSubmit={handleSaveProfile} className="p-5 space-y-4">
                {/* Usuario (solo lectura) */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Usuario
                  </label>
                  <input
                    type="text"
                    value={user?.username || ''}
                    disabled
                    className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-400 mt-1">No se puede cambiar</p>
                </div>

                {/* Nombre completo */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    name="nombre_completo"
                    value={formData.nombre_completo}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 text-sm border-2 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition ${
                      errors.nombre_completo ? 'border-red-400 bg-red-50' : 'border-gray-300'
                    }`}
                    required
                  />
                  {errors.nombre_completo && (
                    <p className="text-red-500 text-xs mt-1">{errors.nombre_completo}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 text-sm border-2 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition ${
                      errors.email ? 'border-red-400 bg-red-50' : 'border-gray-300'
                    }`}
                    required
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                  )}
                </div>

                {/* Teléfono */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Teléfono (Opcional)
                  </label>
                  <input
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition"
                    placeholder="+51 999 999 999"
                  />
                </div>

                {/* Botón guardar */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg text-sm"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Guardar Cambios
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Formulario de Cambio de Contraseña */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden h-fit">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-5 py-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Cambiar Contraseña
                </h3>
              </div>

              <form onSubmit={handleChangePassword} className="p-5 space-y-4">
                {/* Contraseña Actual */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Contraseña Actual *
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      name="current_password"
                      value={passwordData.current_password}
                      onChange={handlePasswordChange}
                      className={`w-full px-3 py-2 pr-10 text-sm border-2 rounded-lg focus:ring-2 focus:ring-purple-300 focus:border-purple-500 transition ${
                        errors.current_password ? 'border-red-400 bg-red-50' : 'border-gray-300'
                      }`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.current_password && (
                    <p className="text-red-500 text-xs mt-1">{errors.current_password}</p>
                  )}
                </div>

                {/* Nueva Contraseña */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Nueva Contraseña *
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      name="new_password"
                      value={passwordData.new_password}
                      onChange={handlePasswordChange}
                      className={`w-full px-3 py-2 pr-10 text-sm border-2 rounded-lg focus:ring-2 focus:ring-purple-300 focus:border-purple-500 transition ${
                        errors.new_password ? 'border-red-400 bg-red-50' : 'border-gray-300'
                      }`}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Mínimo 6 caracteres</p>
                  {errors.new_password && (
                    <p className="text-red-500 text-xs mt-1">{errors.new_password}</p>
                  )}
                </div>

                {/* Confirmar Nueva Contraseña */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Confirmar Nueva Contraseña *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirm_password"
                      value={passwordData.confirm_password}
                      onChange={handlePasswordChange}
                      className={`w-full px-3 py-2 pr-10 text-sm border-2 rounded-lg focus:ring-2 focus:ring-purple-300 focus:border-purple-500 transition ${
                        errors.confirm_password ? 'border-red-400 bg-red-50' : 'border-gray-300'
                      }`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirm_password && (
                    <p className="text-red-500 text-xs mt-1">{errors.confirm_password}</p>
                  )}
                </div>

                {/* Botón cambiar contraseña */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg text-sm"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Cambiando...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Cambiar Contraseña
                    </>
                  )}
                </button>
              </form>
            </div>

          </div>
        </div>
      </div>
    </Layout>
  );
}

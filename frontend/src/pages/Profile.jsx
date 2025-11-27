import { useState, useEffect } from 'react';
import { User, Lock, Mail, Phone, Save, Eye, EyeOff, Shield, UserCircle2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { authAPI } from '../api/auth';
import { Layout } from '../components/layout/Layout';
import toast from 'react-hot-toast';

export default function Profile() {
  const { user } = useAuth();

  // Determinar si el usuario es vendedor (solo lectura)
  const isVendedor = user?.rol === 'vendedor';

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
      {/* DISEÑO RESPONSIVE */}
      <div className="h-full flex flex-col overflow-hidden">
        <div className="flex-1 flex flex-col gap-4 p-4 overflow-y-auto">

          {/* FILA SUPERIOR: Tarjeta de Usuario */}
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-xl shadow-2xl shrink-0">
            <div className="p-4">
              {/* Avatar y nombre - Siempre horizontal */}
              <div className="flex items-center gap-4 mb-4">
                <div className="relative shrink-0">
                  <div className="bg-white/20 backdrop-blur-sm p-2 md:p-3 rounded-full border-4 border-white/30">
                    <UserCircle2 className="w-12 h-12 md:w-16 md:h-16 text-white" />
                    <div className="absolute -bottom-1 -right-1 bg-green-400 w-3 h-3 md:w-4 md:h-4 rounded-full border-2 border-white"></div>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h2 className="text-lg md:text-2xl font-bold text-white truncate">{user?.nombre_completo}</h2>
                  <p className="text-indigo-200 text-xs md:text-base font-medium">@{user?.username}</p>
                </div>
              </div>

              {/* Badge de rol + Info rápida - Stack en móvil */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                {/* Badge de rol */}
                <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs md:text-sm font-bold shadow-lg ${
                  user?.rol === 'admin'
                    ? 'bg-yellow-400 text-yellow-900'
                    : user?.rol === 'vendedor'
                    ? 'bg-blue-400 text-blue-900'
                    : 'bg-green-400 text-green-900'
                }`}>
                  <Shield className="w-3 h-3 md:w-4 md:h-4" />
                  {user?.rol === 'admin' ? 'Administrador' :
                   user?.rol === 'vendedor' ? 'Vendedor' : 'Bodeguero'}
                </div>

                {/* Email */}
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg flex-1 min-w-0">
                  <Mail className="w-3 h-3 md:w-4 md:h-4 text-white shrink-0" />
                  <p className="text-xs md:text-sm font-semibold text-white truncate">{user?.email || 'No configurado'}</p>
                </div>

                {/* Teléfono */}
                {user?.telefono && (
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg">
                    <Phone className="w-3 h-3 md:w-4 md:h-4 text-white shrink-0" />
                    <p className="text-xs md:text-sm font-semibold text-white">{user.telefono}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* FORMULARIOS - Stack en móvil, lado a lado en desktop */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">

            {/* Formulario de Información Personal */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-3 md:px-4 py-2 shrink-0">
                <h3 className="text-sm md:text-base font-bold text-white flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Información Personal
                </h3>
              </div>

              <form onSubmit={handleSaveProfile} className="p-3 md:p-5 flex-1 flex flex-col">
                <div className="space-y-3 md:space-y-5 mb-auto">
                  {/* Usuario (solo lectura) */}
                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">
                      Usuario
                    </label>
                    <input
                      type="text"
                      value={user?.username || ''}
                      disabled
                      className="w-full px-3 md:px-4 py-2 md:py-2.5 text-sm md:text-base border-2 border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1">No se puede cambiar</p>
                  </div>

                  {/* Nombre completo */}
                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      name="nombre_completo"
                      value={formData.nombre_completo}
                      onChange={handleChange}
                      disabled={isVendedor}
                      className={`w-full px-3 md:px-4 py-2 md:py-2.5 text-sm md:text-base border-2 rounded-lg transition ${
                        isVendedor
                          ? 'border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed'
                          : errors.nombre_completo
                            ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-blue-300 focus:border-blue-500'
                            : 'border-gray-300 focus:ring-2 focus:ring-blue-300 focus:border-blue-500'
                      }`}
                      required={!isVendedor}
                    />
                    {isVendedor && (
                      <p className="text-xs text-gray-500 mt-1">Solo lectura</p>
                    )}
                    {errors.nombre_completo && (
                      <p className="text-red-500 text-xs md:text-sm mt-1">{errors.nombre_completo}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">
                      Correo Electrónico *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={isVendedor}
                      className={`w-full px-3 md:px-4 py-2 md:py-2.5 text-sm md:text-base border-2 rounded-lg transition ${
                        isVendedor
                          ? 'border-gray-300 bg-gray-50 text-gray-500 cursor-not-allowed'
                          : errors.email
                            ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-blue-300 focus:border-blue-500'
                            : 'border-gray-300 focus:ring-2 focus:ring-blue-300 focus:border-blue-500'
                      }`}
                      required={!isVendedor}
                    />
                    {isVendedor && (
                      <p className="text-xs text-gray-500 mt-1">Solo lectura</p>
                    )}
                    {errors.email && (
                      <p className="text-red-500 text-xs md:text-sm mt-1">{errors.email}</p>
                    )}
                  </div>
                </div>

                {/* Botón guardar - Solo para admin y bodeguero */}
                {!isVendedor && (
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-2.5 md:py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl text-sm md:text-base mt-3 md:mt-5"
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
                )}
              </form>
            </div>

            {/* Formulario de Cambio de Contraseña - Solo para admin y bodeguero */}
            {!isVendedor && (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col">
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-3 md:px-4 py-2 shrink-0">
                  <h3 className="text-sm md:text-base font-bold text-white flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Cambiar Contraseña
                  </h3>
                </div>

              <form onSubmit={handleChangePassword} className="p-3 md:p-5 flex-1 flex flex-col">
                <div className="space-y-3 md:space-y-5 mb-auto">
                  {/* Contraseña Actual */}
                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">
                      Contraseña Actual *
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        name="current_password"
                        value={passwordData.current_password}
                        onChange={handlePasswordChange}
                        className={`w-full px-3 md:px-4 py-2 md:py-2.5 pr-10 text-sm md:text-base border-2 rounded-lg focus:ring-2 focus:ring-purple-300 focus:border-purple-500 transition ${
                          errors.current_password ? 'border-red-400 bg-red-50' : 'border-gray-300'
                        }`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4 md:w-5 md:h-5" /> : <Eye className="w-4 h-4 md:w-5 md:h-5" />}
                      </button>
                    </div>
                    {errors.current_password && (
                      <p className="text-red-500 text-xs md:text-sm mt-1">{errors.current_password}</p>
                    )}
                  </div>

                  {/* Nueva Contraseña */}
                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">
                      Nueva Contraseña *
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        name="new_password"
                        value={passwordData.new_password}
                        onChange={handlePasswordChange}
                        className={`w-full px-3 md:px-4 py-2 md:py-2.5 pr-10 text-sm md:text-base border-2 rounded-lg focus:ring-2 focus:ring-purple-300 focus:border-purple-500 transition ${
                          errors.new_password ? 'border-red-400 bg-red-50' : 'border-gray-300'
                        }`}
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4 md:w-5 md:h-5" /> : <Eye className="w-4 h-4 md:w-5 md:h-5" />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
                    {errors.new_password && (
                      <p className="text-red-500 text-xs md:text-sm mt-1">{errors.new_password}</p>
                    )}
                  </div>

                  {/* Confirmar Nueva Contraseña */}
                  <div>
                    <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">
                      Confirmar Nueva Contraseña *
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirm_password"
                        value={passwordData.confirm_password}
                        onChange={handlePasswordChange}
                        className={`w-full px-3 md:px-4 py-2 md:py-2.5 pr-10 text-sm md:text-base border-2 rounded-lg focus:ring-2 focus:ring-purple-300 focus:border-purple-500 transition ${
                          errors.confirm_password ? 'border-red-400 bg-red-50' : 'border-gray-300'
                        }`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4 md:w-5 md:h-5" /> : <Eye className="w-4 h-4 md:w-5 md:h-5" />}
                      </button>
                    </div>
                    {errors.confirm_password && (
                      <p className="text-red-500 text-xs md:text-sm mt-1">{errors.confirm_password}</p>
                    )}
                  </div>
                </div>

                {/* Botón cambiar contraseña */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold py-2.5 md:py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl text-sm md:text-base mt-3 md:mt-5"
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
            )}

          </div>
        </div>
      </div>
    </Layout>
  );
}

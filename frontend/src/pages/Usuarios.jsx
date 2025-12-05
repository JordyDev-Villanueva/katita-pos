import { useState, useEffect } from 'react';
import { Layout } from '../components/layout/Layout';
import { Users, Plus, Edit2, Trash2, Key, Shield, Clock, Calendar, Mail, Phone, Search, UserCheck, UserX, Eye, EyeOff, X } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRol, setFilterRol] = useState('vendedor'); // Por defecto solo vendedores
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    nombre_completo: '',
    telefono: '',
    rol: 'vendedor', // Siempre vendedor
    hora_entrada: '',
    hora_salida: '',
    dias_trabajo: []
  });
  const [passwordData, setPasswordData] = useState({
    new_password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const diasSemana = [
    { value: 'Lun', label: 'L' },
    { value: 'Mar', label: 'M' },
    { value: 'Mie', label: 'X' },
    { value: 'Jue', label: 'J' },
    { value: 'Vie', label: 'V' },
    { value: 'Sab', label: 'S' },
    { value: 'Dom', label: 'D' }
  ];

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      const token = localStorage.getItem('access_token');
      console.log('🔑 Token encontrado:', token ? 'SÍ' : 'NO');
      // Solo traer usuarios activos
      const response = await axios.get(`${API_URL}/usuarios/?activo=true`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsuarios(response.data.usuarios || []);
    } catch (error) {
      console.error('❌ Error al cargar usuarios:', error);
      console.error('Token usado:', localStorage.getItem('access_token') ? 'existe' : 'NO EXISTE');
      toast.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('access_token');

      // Convertir array de días a string
      const diasString = formData.dias_trabajo.length > 0
        ? formData.dias_trabajo.join(',')
        : '';

      const submitData = {
        ...formData,
        dias_trabajo: diasString,
        rol: 'vendedor' // Forzar siempre vendedor
      };

      if (editingUser) {
        // Actualizar usuario existente (sin password)
        const { password, ...updateData } = submitData;
        await axios.put(
          `${API_URL}/usuarios/${editingUser.id}`,
          updateData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Vendedor actualizado exitosamente');
      } else {
        // Crear nuevo usuario
        await axios.post(
          `${API_URL}/usuarios/`,
          submitData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('✅ Vendedor creado exitosamente');
      }

      setShowModal(false);
      resetForm();
      fetchUsuarios();
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.response?.data?.error || 'Error al guardar vendedor');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!passwordData.new_password || passwordData.new_password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      await axios.put(
        `${API_URL}/usuarios/${editingUser.id}/password`,
        passwordData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('🔐 Contraseña actualizada exitosamente');
      setShowPasswordModal(false);
      setPasswordData({ new_password: '' });
      setEditingUser(null);
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.response?.data?.error || 'Error al cambiar contraseña');
    }
  };

  const handleToggleActive = async (user) => {
    if (!confirm(`¿Deseas ${user.activo ? 'desactivar' : 'activar'} al vendedor ${user.nombre_completo}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      await axios.put(
        `${API_URL}/usuarios/${user.id}/toggle`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      fetchUsuarios();
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.response?.data?.error || 'Error al cambiar estado');
    }
  };

  const handleDelete = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    try {
      const token = localStorage.getItem('access_token');
      await axios.delete(
        `${API_URL}/usuarios/${userToDelete.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setShowDeleteModal(false);
      setUserToDelete(null);
      fetchUsuarios();
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.response?.data?.error || 'Error al eliminar vendedor');
    }
  };

  const openEditModal = (user) => {
    setEditingUser(user);

    // Convertir string de días a array
    const diasArray = user.dias_trabajo
      ? user.dias_trabajo.split(',').map(d => d.trim())
      : [];

    setFormData({
      username: user.username,
      password: '',
      email: user.email,
      nombre_completo: user.nombre_completo,
      telefono: user.telefono || '',
      rol: 'vendedor',
      hora_entrada: user.hora_entrada || '',
      hora_salida: user.hora_salida || '',
      dias_trabajo: diasArray
    });
    setShowModal(true);
  };

  const openPasswordModal = (user) => {
    setEditingUser(user);
    setShowPasswordModal(true);
  };

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      email: '',
      nombre_completo: '',
      telefono: '',
      rol: 'vendedor',
      hora_entrada: '',
      hora_salida: '',
      dias_trabajo: []
    });
    setEditingUser(null);
  };

  const toggleDia = (dia) => {
    setFormData(prev => ({
      ...prev,
      dias_trabajo: prev.dias_trabajo.includes(dia)
        ? prev.dias_trabajo.filter(d => d !== dia)
        : [...prev.dias_trabajo, dia]
    }));
  };

  // Filtrado de usuarios - solo vendedores
  const filteredUsuarios = usuarios.filter(user => {
    const matchSearch = user.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       user.username.toLowerCase().includes(searchTerm.toLowerCase());
    // Solo mostrar vendedores
    return matchSearch && user.rol === 'vendedor';
  });

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Gestión de Vendedores
                </h1>
                <p className="text-sm text-gray-600">
                  Administra vendedores y su información
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 font-medium shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Nuevo Vendedor
            </button>
          </div>
          <div className="h-0.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 rounded-full"></div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o usuario..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Tabla de vendedores */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Usuario</th>
                  <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Contacto</th>
                  <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Horario</th>
                  <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-4 text-center text-sm font-bold uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                      Cargando vendedores...
                    </td>
                  </tr>
                ) : filteredUsuarios.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                      No se encontraron vendedores
                    </td>
                  </tr>
                ) : (
                  filteredUsuarios.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">{user.nombre_completo}</p>
                          <p className="text-sm text-gray-500">@{user.username}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <Mail className="w-4 h-4 text-blue-600" />
                            {user.email}
                          </div>
                          {user.telefono && (
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <Phone className="w-4 h-4 text-blue-600" />
                              {user.telefono}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {user.hora_entrada && user.hora_salida ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <Clock className="w-4 h-4 text-blue-600" />
                              {user.hora_entrada} - {user.hora_salida}
                            </div>
                            {user.dias_trabajo && (
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Calendar className="w-3 h-3" />
                                {user.dias_trabajo}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">No configurado</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleActive(user)}
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${
                            user.activo
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                          } transition`}
                        >
                          {user.activo ? (
                            <>
                              <UserCheck className="w-4 h-4" />
                              Activo
                            </>
                          ) : (
                            <>
                              <UserX className="w-4 h-4" />
                              Inactivo
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditModal(user)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Editar vendedor"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => openPasswordModal(user)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Cambiar contraseña"
                          >
                            <Key className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(user)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Eliminar vendedor"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Crear/Editar Vendedor */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="shadow-2xl w-full max-w-3xl max-h-[98vh] overflow-hidden rounded-2xl flex flex-col">
              {/* Header */}
              <div className="bg-blue-600 text-white p-4 rounded-t-2xl flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                      <Users className="h-8 w-8" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">{editingUser ? 'Editar Vendedor' : 'Nuevo Vendedor'}</h2>
                      <p className="text-blue-100 text-sm mt-1">
                        Gestiona la información del vendedor
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <form onSubmit={handleSubmit} className="bg-white flex-1 overflow-y-auto p-4 rounded-b-2xl">
                <div className="space-y-4">
                {/* Fila 1: Usuario y Contraseña */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Usuario *
                    </label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      required
                      disabled={editingUser}
                    />
                  </div>

                  {!editingUser && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Contraseña *
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className="w-full px-3 py-2 pr-10 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          required={!editingUser}
                          minLength={6}
                          placeholder="Mínimo 6 caracteres"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
                        >
                          {showPassword ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Fila 2: Nombre Completo */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    value={formData.nombre_completo}
                    onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    required
                  />
                </div>

                {/* Fila 3: Email y Teléfono */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={formData.telefono}
                      onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="987654321"
                    />
                  </div>
                </div>

                {/* Horarios de Trabajo */}
                <div className="border-t pt-3">
                  <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    Horario de Trabajo
                  </h3>

                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Hora de Entrada
                      </label>
                      <input
                        type="time"
                        value={formData.hora_entrada}
                        onChange={(e) => setFormData({ ...formData, hora_entrada: e.target.value })}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Hora de Salida
                      </label>
                      <input
                        type="time"
                        value={formData.hora_salida}
                        onChange={(e) => setFormData({ ...formData, hora_salida: e.target.value })}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-2">
                      Días de Trabajo
                    </label>
                    <div className="flex gap-2">
                      {diasSemana.map(dia => (
                        <button
                          key={dia.value}
                          type="button"
                          onClick={() => toggleDia(dia.value)}
                          className={`flex-1 py-2 rounded-lg font-semibold text-sm transition ${
                            formData.dias_trabajo.includes(dia.value)
                              ? 'bg-blue-600 text-white shadow-lg'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {dia.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                </div>

                {/* Footer */}
                <div className="mt-4 pt-4 border-t flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {loading ? 'Guardando...' : editingUser ? 'Actualizar' : 'Crear Vendedor'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Cambiar Contraseña */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="shadow-2xl max-w-md w-full max-h-[98vh] overflow-hidden rounded-2xl flex flex-col">
              {/* Header */}
              <div className="bg-blue-600 text-white p-4 rounded-t-2xl flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                      <Key className="h-8 w-8" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">Cambiar Contraseña</h2>
                      <p className="text-blue-100 text-sm mt-1">
                        Actualiza la contraseña del vendedor
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowPasswordModal(false);
                      setPasswordData({ new_password: '' });
                      setEditingUser(null);
                    }}
                    className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <form onSubmit={handleChangePassword} className="bg-white flex-1 overflow-y-auto p-4 rounded-b-2xl">
                <div className="space-y-4">
                <div>
                  <p className="text-gray-700 mb-4">
                    Cambiando contraseña para: <strong>{editingUser?.nombre_completo}</strong>
                  </p>

                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nueva Contraseña *
                  </label>
                  <input
                    type="password"
                    value={passwordData.new_password}
                    onChange={(e) => setPasswordData({ new_password: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                    minLength={6}
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
                </div>

                {/* Footer */}
                <div className="mt-4 pt-4 border-t flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordModal(false);
                      setPasswordData({ new_password: '' });
                      setEditingUser(null);
                    }}
                    className="flex-1 px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                  >
                    Cambiar Contraseña
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de Confirmación de Eliminación */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
              {/* Header */}
              <div className="bg-red-600 text-white p-4 rounded-t-2xl">
                <div className="flex items-center gap-3">
                  <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                    <Trash2 className="h-8 w-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Confirmar Eliminación</h2>
                    <p className="text-red-100 text-sm mt-1">
                      Esta acción no se puede deshacer
                    </p>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-6">
                <p className="text-gray-700 text-lg mb-2">
                  ¿Estás seguro de eliminar al vendedor?
                </p>
                <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-red-500">
                  <p className="font-bold text-gray-900 text-lg">{userToDelete?.nombre_completo}</p>
                  <p className="text-gray-600 text-sm">@{userToDelete?.username}</p>
                  {userToDelete?.email && (
                    <p className="text-gray-600 text-sm flex items-center gap-1 mt-1">
                      <Mail className="w-4 h-4" />
                      {userToDelete.email}
                    </p>
                  )}
                </div>
                <p className="text-gray-600 text-sm mt-4">
                  El vendedor será desactivado y ya no podrá acceder al sistema.
                </p>
              </div>

              {/* Footer */}
              <div className="p-6 pt-0 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setUserToDelete(null);
                  }}
                  className="flex-1 px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
                >
                  Eliminar Vendedor
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

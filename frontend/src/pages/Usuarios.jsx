import { useState, useEffect } from 'react';
import { Layout } from '../components/layout/Layout';
import { Users, Plus, Edit2, Trash2, Key, Shield, Clock, Calendar, Mail, Phone, Search, UserCheck, UserX } from 'lucide-react';
import axios from 'axios';

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
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/usuarios/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsuarios(response.data.usuarios || []);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      alert('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');

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
          `${API_URL}/api/usuarios/${editingUser.id}`,
          updateData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert('Vendedor actualizado exitosamente');
      } else {
        // Crear nuevo usuario
        await axios.post(
          `${API_URL}/api/usuarios/`,
          submitData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert('Vendedor creado exitosamente');
      }

      setShowModal(false);
      resetForm();
      fetchUsuarios();
    } catch (error) {
      console.error('Error:', error);
      alert(error.response?.data?.error || 'Error al guardar vendedor');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!passwordData.new_password || passwordData.new_password.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/api/usuarios/${editingUser.id}/password`,
        passwordData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('Contraseña actualizada exitosamente');
      setShowPasswordModal(false);
      setPasswordData({ new_password: '' });
      setEditingUser(null);
    } catch (error) {
      console.error('Error:', error);
      alert(error.response?.data?.error || 'Error al cambiar contraseña');
    }
  };

  const handleToggleActive = async (user) => {
    if (!confirm(`¿Deseas ${user.activo ? 'desactivar' : 'activar'} al vendedor ${user.nombre_completo}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/api/usuarios/${user.id}/toggle`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      fetchUsuarios();
    } catch (error) {
      console.error('Error:', error);
      alert(error.response?.data?.error || 'Error al cambiar estado');
    }
  };

  const handleDelete = async (user) => {
    if (!confirm(`¿Estás seguro de eliminar al vendedor ${user.nombre_completo}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${API_URL}/api/usuarios/${user.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('Vendedor eliminado exitosamente');
      fetchUsuarios();
    } catch (error) {
      console.error('Error:', error);
      alert(error.response?.data?.error || 'Error al eliminar vendedor');
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-3">
              <Users className="w-8 h-8 text-indigo-600" />
              Gestión de Vendedores
            </h1>
            <p className="text-gray-600 mt-1">Administra vendedores y su información</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Nuevo Vendedor
          </button>
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
              className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Tabla de vendedores */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
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
                            <Mail className="w-4 h-4 text-indigo-600" />
                            {user.email}
                          </div>
                          {user.telefono && (
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <Phone className="w-4 h-4 text-indigo-600" />
                              {user.telefono}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {user.hora_entrada && user.hora_salida ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <Clock className="w-4 h-4 text-purple-600" />
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
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition"
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

        {/* Modal Crear/Editar Vendedor - SIN SCROLL */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex justify-between items-center">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Users className="w-6 h-6" />
                  {editingUser ? 'Editar Vendedor' : 'Nuevo Vendedor'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="text-white hover:bg-white/20 rounded-lg p-2 transition"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      required
                      disabled={editingUser}
                    />
                  </div>

                  {!editingUser && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Contraseña *
                      </label>
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        required={!editingUser}
                        minLength={6}
                        placeholder="Mínimo 6 caracteres"
                      />
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
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
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
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
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
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      placeholder="987654321"
                    />
                  </div>
                </div>

                {/* Horarios de Trabajo */}
                <div className="border-t pt-3">
                  <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-600" />
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
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
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
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
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
                              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {dia.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Botones */}
                <div className="flex gap-3 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition disabled:opacity-50 text-sm"
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4 flex justify-between items-center">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Key className="w-6 h-6" />
                  Cambiar Contraseña
                </h2>
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordData({ new_password: '' });
                    setEditingUser(null);
                  }}
                  className="text-white hover:bg-white/20 rounded-lg p-2 transition"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleChangePassword} className="p-6 space-y-4">
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
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    required
                    minLength={6}
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordModal(false);
                      setPasswordData({ new_password: '' });
                      setEditingUser(null);
                    }}
                    className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition"
                  >
                    Cambiar Contraseña
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

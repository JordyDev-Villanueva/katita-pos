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
  const [filterRol, setFilterRol] = useState('todos');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    nombre_completo: '',
    telefono: '',
    rol: 'vendedor',
    hora_entrada: '',
    hora_salida: '',
    dias_trabajo: ''
  });
  const [passwordData, setPasswordData] = useState({
    new_password: ''
  });

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

      if (editingUser) {
        // Actualizar usuario existente (sin password)
        const { password, ...updateData } = formData;
        await axios.put(
          `${API_URL}/api/usuarios/${editingUser.id}`,
          updateData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert('Usuario actualizado exitosamente');
      } else {
        // Crear nuevo usuario
        await axios.post(
          `${API_URL}/api/usuarios/`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert('Usuario creado exitosamente');
      }

      setShowModal(false);
      resetForm();
      fetchUsuarios();
    } catch (error) {
      console.error('Error:', error);
      alert(error.response?.data?.error || 'Error al guardar usuario');
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

  const handleToggleActive = async (usuario) => {
    if (!confirm(`¿Seguro que deseas ${usuario.activo ? 'desactivar' : 'activar'} a ${usuario.nombre_completo}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API_URL}/api/usuarios/${usuario.id}/toggle`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchUsuarios();
    } catch (error) {
      console.error('Error:', error);
      alert(error.response?.data?.error || 'Error al cambiar estado');
    }
  };

  const handleDelete = async (usuario) => {
    if (!confirm(`¿Seguro que deseas eliminar a ${usuario.nombre_completo}? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${API_URL}/api/usuarios/${usuario.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Usuario eliminado exitosamente');
      fetchUsuarios();
    } catch (error) {
      console.error('Error:', error);
      alert(error.response?.data?.error || 'Error al eliminar usuario');
    }
  };

  const openEditModal = (usuario) => {
    setEditingUser(usuario);
    setFormData({
      username: usuario.username,
      password: '', // No mostrar password
      email: usuario.email,
      nombre_completo: usuario.nombre_completo,
      telefono: usuario.telefono || '',
      rol: usuario.rol,
      hora_entrada: usuario.hora_entrada || '',
      hora_salida: usuario.hora_salida || '',
      dias_trabajo: usuario.dias_trabajo || ''
    });
    setShowModal(true);
  };

  const openPasswordModal = (usuario) => {
    setEditingUser(usuario);
    setPasswordData({ new_password: '' });
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
      dias_trabajo: ''
    });
    setEditingUser(null);
  };

  const filteredUsuarios = usuarios.filter(user => {
    const matchesSearch = user.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRol = filterRol === 'todos' || user.rol === filterRol;
    return matchesSearch && matchesRol;
  });

  const getRolBadge = (rol) => {
    const badges = {
      admin: 'bg-red-100 text-red-800',
      vendedor: 'bg-blue-100 text-blue-800',
      bodeguero: 'bg-green-100 text-green-800'
    };
    return badges[rol] || 'bg-gray-100 text-gray-800';
  };

  const getRolIcon = (rol) => {
    if (rol === 'admin') return <Shield className="w-4 h-4" />;
    return <Users className="w-4 h-4" />;
  };

  return (
    <Layout>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <Users className="w-8 h-8 text-indigo-600" />
              Gestión de Usuarios
            </h1>
            <p className="text-gray-600 mt-1">Administra vendedores y su información</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 hover:from-indigo-700 hover:to-purple-700 transition shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Nuevo Usuario
          </button>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o usuario..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Filtro por rol */}
            <select
              value={filterRol}
              onChange={(e) => setFilterRol(e.target.value)}
              className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="todos">Todos los roles</option>
              <option value="admin">Administradores</option>
              <option value="vendedor">Vendedores</option>
              <option value="bodeguero">Bodegueros</option>
            </select>
          </div>
        </div>

        {/* Tabla de usuarios */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold">Usuario</th>
                  <th className="px-6 py-4 text-left text-sm font-bold">Contacto</th>
                  <th className="px-6 py-4 text-left text-sm font-bold">Rol</th>
                  <th className="px-6 py-4 text-left text-sm font-bold">Horario</th>
                  <th className="px-6 py-4 text-left text-sm font-bold">Estado</th>
                  <th className="px-6 py-4 text-center text-sm font-bold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      Cargando usuarios...
                    </td>
                  </tr>
                ) : filteredUsuarios.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      No se encontraron usuarios
                    </td>
                  </tr>
                ) : (
                  filteredUsuarios.map((usuario) => (
                    <tr key={usuario.id} className="hover:bg-gray-50 transition">
                      {/* Usuario */}
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-semibold text-gray-900">{usuario.nombre_completo}</div>
                          <div className="text-sm text-gray-500">@{usuario.username}</div>
                        </div>
                      </td>

                      {/* Contacto */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <Mail className="w-4 h-4 text-gray-400" />
                            {usuario.email}
                          </div>
                          {usuario.telefono && (
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <Phone className="w-4 h-4 text-gray-400" />
                              {usuario.telefono}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Rol */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${getRolBadge(usuario.rol)}`}>
                          {getRolIcon(usuario.rol)}
                          {usuario.rol.charAt(0).toUpperCase() + usuario.rol.slice(1)}
                        </span>
                      </td>

                      {/* Horario */}
                      <td className="px-6 py-4">
                        {usuario.hora_entrada && usuario.hora_salida ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <Clock className="w-4 h-4 text-gray-400" />
                              {usuario.hora_entrada} - {usuario.hora_salida}
                            </div>
                            {usuario.dias_trabajo && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                {usuario.dias_trabajo}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Sin horario</span>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="px-6 py-4">
                        {usuario.activo ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                            <UserCheck className="w-4 h-4" />
                            Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
                            <UserX className="w-4 h-4" />
                            Inactivo
                          </span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditModal(usuario)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openPasswordModal(usuario)}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition"
                            title="Cambiar contraseña"
                          >
                            <Key className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleActive(usuario)}
                            className={`p-2 rounded-lg transition ${
                              usuario.activo
                                ? 'text-orange-600 hover:bg-orange-50'
                                : 'text-green-600 hover:bg-green-50'
                            }`}
                            title={usuario.activo ? 'Desactivar' : 'Activar'}
                          >
                            {usuario.activo ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleDelete(usuario)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
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

        {/* Modal Crear/Editar Usuario */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex justify-between items-center">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Users className="w-6 h-6" />
                  {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
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
                {/* Información de Acceso */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Usuario *
                    </label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                      disabled={editingUser} // No permitir cambiar username al editar
                    />
                  </div>

                  {!editingUser && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Contraseña *
                      </label>
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        required={!editingUser}
                        minLength={6}
                      />
                      <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
                    </div>
                  )}
                </div>

                {/* Información Personal */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    value={formData.nombre_completo}
                    onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={formData.telefono}
                      onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="987654321"
                    />
                  </div>
                </div>

                {/* Rol */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Rol *
                  </label>
                  <select
                    value={formData.rol}
                    onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                    disabled={editingUser} // No permitir cambiar rol al editar
                  >
                    <option value="vendedor">Vendedor</option>
                    <option value="bodeguero">Bodeguero</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>

                {/* Horarios de Trabajo */}
                <div className="border-t pt-4">
                  <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-indigo-600" />
                    Horario de Trabajo
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Hora de Entrada
                      </label>
                      <input
                        type="time"
                        value={formData.hora_entrada}
                        onChange={(e) => setFormData({ ...formData, hora_entrada: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Hora de Salida
                      </label>
                      <input
                        type="time"
                        value={formData.hora_salida}
                        onChange={(e) => setFormData({ ...formData, hora_salida: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Días de Trabajo
                    </label>
                    <input
                      type="text"
                      value={formData.dias_trabajo}
                      onChange={(e) => setFormData({ ...formData, dias_trabajo: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Ej: Lun-Vie, Lun-Sab, Lun,Mie,Vie"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Ejemplo: "Lun-Vie" o "Lun,Mie,Vie"
                    </p>
                  </div>
                </div>

                {/* Botones */}
                <div className="flex gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition disabled:opacity-50"
                  >
                    {loading ? 'Guardando...' : editingUser ? 'Actualizar' : 'Crear Usuario'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Cambiar Contraseña */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
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

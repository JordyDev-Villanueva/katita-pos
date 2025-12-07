import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Minus,
  Calendar,
  Banknote,
  Smartphone,
  Building2,
  AlertCircle,
  Lock,
  Unlock,
  ArrowLeft,
  ClipboardList,
  History,
  ThumbsUp,
  ThumbsDown,
  Eye,
  User
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://katita-pos-production.up.railway.app/api';

export const CuadroCaja = () => {
  const navigate = useNavigate();
  const [turnoActual, setTurnoActual] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Tabs
  const [activeTab, setActiveTab] = useState('mi-turno');

  // Modales
  const [showAbrirModal, setShowAbrirModal] = useState(false);
  const [showCerrarModal, setShowCerrarModal] = useState(false);
  const [showEgresoModal, setShowEgresoModal] = useState(false);

  // Form states
  const [montoInicial, setMontoInicial] = useState('');
  const [efectivoContado, setEfectivoContado] = useState('');
  const [observacionesCierre, setObservacionesCierre] = useState('');
  const [montoEgreso, setMontoEgreso] = useState('');
  const [conceptoEgreso, setConceptoEgreso] = useState('');

  // Estados para Pendientes (Admin)
  const [turnosPendientes, setTurnosPendientes] = useState([]);
  const [loadingPendientes, setLoadingPendientes] = useState(false);
  const [selectedTurno, setSelectedTurno] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState('');

  // Estados para Historial (Admin)
  const [todosLosTurnos, setTodosLosTurnos] = useState([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('todos');

  // Estados para Ventas del Turno
  const [ventasTurno, setVentasTurno] = useState([]);
  const [loadingVentas, setLoadingVentas] = useState(false);
  const [totalesVentas, setTotalesVentas] = useState({
    efectivo: 0,
    yape: 0,
    plin: 0,
    transferencia: 0,
    total: 0
  });
  const [filtroMetodo, setFiltroMetodo] = useState('todos');

  const isAdmin = user?.rol === 'admin';

  useEffect(() => {
    fetchUserData();
    fetchTurnoActual();
  }, []);

  useEffect(() => {
    if (turnoActual && turnoActual.estado === 'abierto') {
      fetchVentasTurno();
    }
  }, [turnoActual]);

  useEffect(() => {
    if (isAdmin && activeTab === 'pendientes') {
      fetchTurnosPendientes();
    }
  }, [activeTab, isAdmin]);

  useEffect(() => {
    if (isAdmin && activeTab === 'historial') {
      fetchTodosLosTurnos();
    }
  }, [activeTab, isAdmin]);

  const fetchUserData = () => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  };

  const fetchTurnoActual = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API_URL}/cuadro-caja/turno-actual`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setTurnoActual(response.data.turno);
    } catch (error) {
      console.error('Error al cargar turno actual:', error);
      toast.error('Error al cargar el turno actual');
    } finally {
      setLoading(false);
    }
  };

  const handleAbrirTurno = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.post(
        `${API_URL}/cuadro-caja/abrir`,
        { monto_inicial: parseFloat(montoInicial) || 0 },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setTurnoActual(response.data.turno);
      setShowAbrirModal(false);
      setMontoInicial('');
      toast.success('✅ Turno abierto exitosamente');
    } catch (error) {
      console.error('Error al abrir turno:', error);
      toast.error(error.response?.data?.error || 'Error al abrir turno');
    }
  };

  const handleCerrarTurno = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('access_token');

      // Vendedores usan /solicitar-cierre, admins usan /cerrar
      const endpoint = user?.rol === 'vendedor' ? '/solicitar-cierre' : '/cerrar';
      const successMessage = user?.rol === 'vendedor'
        ? 'Solicitud de cierre enviada. Espera la aprobación del administrador.'
        : 'Turno cerrado exitosamente';

      const response = await axios.post(
        `${API_URL}/cuadro-caja${endpoint}`,
        {
          efectivo_contado: parseFloat(efectivoContado),
          observaciones: observacionesCierre || null
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setTurnoActual(response.data.turno);
      setShowCerrarModal(false);
      setEfectivoContado('');
      setObservacionesCierre('');
      toast.success(successMessage);
    } catch (error) {
      console.error('Error al cerrar turno:', error);
      toast.error(error.response?.data?.error || 'Error al cerrar turno');
    }
  };

  const handleAgregarEgreso = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.post(
        `${API_URL}/cuadro-caja/agregar-egreso`,
        {
          monto: parseFloat(montoEgreso),
          concepto: conceptoEgreso
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setTurnoActual(response.data.turno);
      setShowEgresoModal(false);
      setMontoEgreso('');
      setConceptoEgreso('');
      toast.success('💸 Egreso registrado');
    } catch (error) {
      console.error('Error al agregar egreso:', error);
      toast.error(error.response?.data?.error || 'Error al agregar egreso');
    }
  };

  // Fetch functions para tabs de admin
  const fetchTurnosPendientes = async () => {
    try {
      setLoadingPendientes(true);
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API_URL}/cuadro-caja/turnos-pendientes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTurnosPendientes(response.data.turnos || []);
    } catch (error) {
      console.error('Error al cargar turnos pendientes:', error);
      toast.error('Error al cargar turnos pendientes');
    } finally {
      setLoadingPendientes(false);
    }
  };

  const fetchTodosLosTurnos = async () => {
    try {
      setLoadingHistorial(true);
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API_URL}/cuadro-caja/todos-los-turnos`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTodosLosTurnos(response.data.turnos || []);
    } catch (error) {
      console.error('Error al cargar historial:', error);
      toast.error('Error al cargar historial de turnos');
    } finally {
      setLoadingHistorial(false);
    }
  };

  const handleAprobarCierre = async () => {
    if (!selectedTurno) return;
    try {
      const token = localStorage.getItem('access_token');
      await axios.post(
        `${API_URL}/cuadro-caja/aprobar-cierre/${selectedTurno.id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Cierre de ${selectedTurno.vendedor_nombre} aprobado exitosamente`);
      setShowApprovalModal(false);
      setSelectedTurno(null);
      fetchTurnosPendientes();
      fetchTodosLosTurnos();
    } catch (error) {
      console.error('Error al aprobar cierre:', error);
      toast.error(error.response?.data?.error || 'Error al aprobar cierre');
    }
  };

  const handleRechazarCierre = async (e) => {
    e.preventDefault();
    if (!selectedTurno || !motivoRechazo.trim()) {
      toast.error('Debes ingresar un motivo de rechazo');
      return;
    }
    try {
      const token = localStorage.getItem('access_token');
      await axios.post(
        `${API_URL}/cuadro-caja/rechazar-cierre/${selectedTurno.id}`,
        { observaciones_rechazo: motivoRechazo },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`❌ Cierre de ${selectedTurno.vendedor_nombre} rechazado`);
      setShowRejectionModal(false);
      setSelectedTurno(null);
      setMotivoRechazo('');
      fetchTurnosPendientes();
      fetchTodosLosTurnos();
    } catch (error) {
      console.error('Error al rechazar cierre:', error);
      toast.error(error.response?.data?.error || 'Error al rechazar cierre');
    }
  };

  const fetchVentasTurno = async () => {
    try {
      setLoadingVentas(true);
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API_URL}/cuadro-caja/ventas-turno`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVentasTurno(response.data.ventas || []);
      setTotalesVentas(response.data.totales || {
        efectivo: 0,
        yape: 0,
        plin: 0,
        transferencia: 0,
        total: 0
      });
    } catch (error) {
      console.error('Error al cargar ventas del turno:', error);
      // No mostrar error si no hay turno abierto
      if (error.response?.status !== 404) {
        toast.error('Error al cargar ventas del turno');
      }
    } finally {
      setLoadingVentas(false);
    }
  };

  const formatCurrency = (value) => {
    const numValue = Number(value);
    // Si es NaN, null, undefined o cualquier valor inválido, retornar 0.00
    if (isNaN(numValue) || value === null || value === undefined) {
      return 'S/ 0.00';
    }
    return `S/ ${numValue.toFixed(2)}`;
  };

  const formatDateTime = (datetime) => {
    if (!datetime) return '-';

    // El backend devuelve fechas UTC en formato ISO
    // Si la fecha no tiene 'Z' al final, añadirla para indicar UTC
    let dateString = datetime;
    if (!dateString.endsWith('Z') && !dateString.includes('+')) {
      dateString = dateString + 'Z';
    }

    const date = new Date(dateString);

    // Convertir a hora de Perú (UTC-5)
    return date.toLocaleString('es-PE', {
      timeZone: 'America/Lima',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-500 rounded-2xl shadow-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded-lg transition-colors"
              title="Volver al Dashboard"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold mb-2">Cuadro de Caja</h1>
              <p className="text-green-100">
                {turnoActual ? 'Gestiona tu turno actual' : 'Abre un nuevo turno para comenzar'}
              </p>
            </div>
          </div>
          <div className="bg-white bg-opacity-20 p-4 rounded-xl">
            <DollarSign className="h-12 w-12" />
          </div>
        </div>
      </div>

      {/* Tabs Navigation (Solo para Admin) */}
      {isAdmin && (
        <div className="bg-white rounded-xl shadow-lg p-2">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('mi-turno')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all ${
                activeTab === 'mi-turno'
                  ? 'bg-green-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <User className="h-5 w-5" />
              Mi Turno
            </button>
            <button
              onClick={() => setActiveTab('pendientes')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all ${
                activeTab === 'pendientes'
                  ? 'bg-yellow-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <ClipboardList className="h-5 w-5" />
              Pendientes
              {turnosPendientes.length > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  {turnosPendientes.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('historial')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all ${
                activeTab === 'historial'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <History className="h-5 w-5" />
              Historial
            </button>
          </div>
        </div>
      )}

      {/* Contenido según tab activo */}
      {activeTab === 'mi-turno' ? (
        <>
      {/* Estado del turno */}
      {!turnoActual ? (
        <div className="space-y-6">
          {/* Card principal de estado cerrado */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-xl p-8 border-2 border-gray-200">
            <div className="text-center mb-6">
              <div className="bg-gradient-to-br from-gray-200 to-gray-300 w-28 h-28 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Lock className="h-14 w-14 text-gray-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-3">No hay turno abierto</h2>
              <p className="text-gray-600 text-lg max-w-md mx-auto mb-6">
                Inicia un nuevo turno para comenzar a registrar ventas y gestionar movimientos de caja
              </p>
              <button
                onClick={() => setShowAbrirModal(true)}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 inline-flex items-center gap-3 shadow-xl"
              >
                <Unlock className="h-6 w-6" />
                Abrir Nuevo Turno
              </button>
            </div>

            {/* Guía rápida */}
            <div className="mt-8 bg-white rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-blue-600" />
                Guía Rápida
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <span className="text-2xl">1️⃣</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Abre tu turno</p>
                    <p className="text-xs text-gray-600">Registra el monto inicial en caja</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <span className="text-2xl">2️⃣</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Registra ventas</p>
                    <p className="text-xs text-gray-600">Realiza transacciones durante tu jornada</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <span className="text-2xl">3️⃣</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Cierra tu turno</p>
                    <p className="text-xs text-gray-600">Cuenta el efectivo y finaliza</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Información de último turno (si existe historial) */}
          {isAdmin && todosLosTurnos.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <History className="h-5 w-5 text-blue-600" />
                Último Turno Cerrado
              </h3>
              {(() => {
                const ultimoTurno = todosLosTurnos
                  .filter(t => t.estado === 'cerrado')
                  .sort((a, b) => new Date(b.fecha_cierre) - new Date(a.fecha_cierre))[0];

                if (!ultimoTurno) return <p className="text-gray-500 text-sm">No hay turnos cerrados aún</p>;

                return (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Vendedor</p>
                      <p className="font-semibold text-gray-900 text-sm">{ultimoTurno.vendedor_nombre}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-600 mb-1">Fecha Cierre</p>
                      <p className="font-semibold text-gray-900 text-sm">{formatDateTime(ultimoTurno.fecha_cierre)}</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="text-xs text-green-700 mb-1">Total Ventas</p>
                      <p className="font-bold text-green-600">{formatCurrency(ultimoTurno.total_ventas_efectivo)}</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-xs text-blue-700 mb-1">Duración</p>
                      <p className="font-bold text-blue-600">{ultimoTurno.duracion_turno} hrs</p>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Información del turno actual */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Estado */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">Estado</h3>
                {turnoActual.estado === 'abierto' ? (
                  <CheckCircle className="h-8 w-8 text-green-500" />
                ) : turnoActual.estado === 'pendiente_cierre' ? (
                  <Clock className="h-8 w-8 text-yellow-500" />
                ) : (
                  <XCircle className="h-8 w-8 text-red-500" />
                )}
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Turno N°</p>
                  <p className="text-xl font-bold text-gray-900">{turnoActual.numero_turno}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Estado</p>
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold ${
                      turnoActual.estado === 'abierto'
                        ? 'bg-green-100 text-green-700'
                        : turnoActual.estado === 'pendiente_cierre'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {turnoActual.estado === 'abierto' ? '🟢 Abierto' :
                     turnoActual.estado === 'pendiente_cierre' ? '⏳ Pendiente Aprobación' :
                     '🔒 Cerrado'}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Duración</p>
                  <p className="text-lg font-semibold text-gray-900 flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {turnoActual.duracion_turno} horas
                  </p>
                </div>
              </div>
            </div>

            {/* Fechas */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">Fechas</h3>
                <Calendar className="h-8 w-8 text-blue-500" />
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Apertura</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatDateTime(turnoActual.fecha_apertura)}
                  </p>
                </div>
                {turnoActual.fecha_cierre && (
                  <div>
                    <p className="text-sm text-gray-600">Cierre</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatDateTime(turnoActual.fecha_cierre)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Vendedor */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">Vendedor</h3>
                <div className="bg-purple-100 p-2 rounded-lg">
                  <span className="text-2xl">👤</span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-lg font-bold text-gray-900">
                  {turnoActual.vendedor_nombre || user?.nombre_completo}
                </p>
                <p className="text-sm text-gray-600">
                  @{turnoActual.vendedor_username || user?.username}
                </p>
              </div>
            </div>
          </div>

          {/* Egresos y arqueo */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Egresos */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">Egresos del Turno</h3>
                {turnoActual.esta_abierto && (
                  <button
                    onClick={() => setShowEgresoModal(true)}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors inline-flex items-center gap-1"
                  >
                    <Minus className="h-4 w-4" />
                    Agregar
                  </button>
                )}
              </div>

              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-red-500 p-2 rounded-lg">
                    <TrendingDown className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-red-700">Total Egresos</p>
                    <p className="text-2xl font-bold text-red-600">
                      {formatCurrency(turnoActual.total_egresos)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Lista de egresos */}
              {turnoActual.detalle_egresos && turnoActual.detalle_egresos.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {turnoActual.detalle_egresos.map((egreso, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-sm font-semibold text-gray-800">{egreso.concepto}</p>
                        <p className="text-sm font-bold text-red-600">
                          -{formatCurrency(egreso.monto)}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500">
                        {formatDateTime(egreso.fecha)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-4 text-sm">Sin egresos registrados</p>
              )}
            </div>

            {/* Arqueo de caja */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Arqueo de Caja</h3>

              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-700">Monto Inicial</span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(turnoActual.monto_inicial)}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-700">+ Ventas en Efectivo</span>
                  <span className="font-semibold text-green-600">
                    +{formatCurrency(turnoActual.total_efectivo)}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span className="text-gray-700">- Egresos</span>
                  <span className="font-semibold text-red-600">
                    -{formatCurrency(turnoActual.total_egresos)}
                  </span>
                </div>

                <div className="bg-blue-50 rounded-lg p-3 border-2 border-blue-200">
                  <div className="flex justify-between items-center">
                    <span className="text-blue-900 font-bold">Efectivo Esperado</span>
                    <span className="text-xl font-bold text-blue-600">
                      {turnoActual.efectivo_esperado !== null
                        ? formatCurrency(turnoActual.efectivo_esperado)
                        : formatCurrency(
                            turnoActual.monto_inicial +
                              turnoActual.total_efectivo -
                              turnoActual.total_egresos
                          )}
                    </span>
                  </div>
                </div>

                {turnoActual.esta_cerrado && (
                  <>
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-gray-700">Efectivo Contado</span>
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(turnoActual.efectivo_contado)}
                      </span>
                    </div>

                    <div
                      className={`rounded-lg p-3 border-2 ${
                        turnoActual.diferencia > 0
                          ? 'bg-yellow-50 border-yellow-200'
                          : turnoActual.diferencia < 0
                          ? 'bg-red-50 border-red-200'
                          : 'bg-green-50 border-green-200'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          {turnoActual.diferencia > 0 ? (
                            <AlertCircle className="h-5 w-5 text-yellow-600" />
                          ) : turnoActual.diferencia < 0 ? (
                            <XCircle className="h-5 w-5 text-red-600" />
                          ) : (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          )}
                          <span
                            className={`font-bold ${
                              turnoActual.diferencia > 0
                                ? 'text-yellow-900'
                                : turnoActual.diferencia < 0
                                ? 'text-red-900'
                                : 'text-green-900'
                            }`}
                          >
                            Diferencia
                          </span>
                        </div>
                        <span
                          className={`text-xl font-bold ${
                            turnoActual.diferencia > 0
                              ? 'text-yellow-600'
                              : turnoActual.diferencia < 0
                              ? 'text-red-600'
                              : 'text-green-600'
                          }`}
                        >
                          {turnoActual.diferencia > 0 ? '+' : ''}
                          {formatCurrency(turnoActual.diferencia)}
                        </span>
                      </div>
                    </div>

                    {turnoActual.observaciones && (
                      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <p className="text-xs text-gray-600 mb-1">Observaciones:</p>
                        <p className="text-sm text-gray-800">{turnoActual.observaciones}</p>
                      </div>
                    )}
                  </>
                )}
              </div>

              {turnoActual.esta_abierto && (
                <button
                  onClick={() => setShowCerrarModal(true)}
                  className="w-full mt-6 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors inline-flex items-center justify-center gap-2"
                >
                  <Lock className="h-5 w-5" />
                  Cerrar Turno
                </button>
              )}
            </div>
          </div>

          {/* Ventas del Turno */}
          {turnoActual.esta_abierto && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Smartphone className="h-6 w-6 text-blue-600" />
                  Ventas del Turno
                </h3>
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                  {ventasTurno.length} {ventasTurno.length === 1 ? 'venta' : 'ventas'}
                </span>
              </div>

              {/* Filtros por método de pago */}
              <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                <button
                  onClick={() => setFiltroMetodo('todos')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
                    filtroMetodo === 'todos'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Todos ({ventasTurno.length})
                </button>
                <button
                  onClick={() => setFiltroMetodo('efectivo')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
                    filtroMetodo === 'efectivo'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Efectivo ({ventasTurno.filter(v => v.metodo_pago === 'efectivo').length})
                </button>
                <button
                  onClick={() => setFiltroMetodo('yape')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
                    filtroMetodo === 'yape'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Yape ({ventasTurno.filter(v => v.metodo_pago === 'yape').length})
                </button>
                <button
                  onClick={() => setFiltroMetodo('plin')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
                    filtroMetodo === 'plin'
                      ? 'bg-pink-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Plin ({ventasTurno.filter(v => v.metodo_pago === 'plin').length})
                </button>
                <button
                  onClick={() => setFiltroMetodo('transferencia')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
                    filtroMetodo === 'transferencia'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Transferencia ({ventasTurno.filter(v => v.metodo_pago === 'transferencia').length})
                </button>
              </div>

              {/* Totales por método de pago */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 shadow-sm">
                  <p className="text-sm font-semibold text-green-700 mb-2">Efectivo</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(totalesVentas.efectivo)}</p>
                </div>
                <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4 shadow-sm">
                  <p className="text-sm font-semibold text-purple-700 mb-2">Yape</p>
                  <p className="text-2xl font-bold text-purple-600">{formatCurrency(totalesVentas.yape)}</p>
                </div>
                <div className="bg-pink-50 border-2 border-pink-200 rounded-xl p-4 shadow-sm">
                  <p className="text-sm font-semibold text-pink-700 mb-2">Plin</p>
                  <p className="text-2xl font-bold text-pink-600">{formatCurrency(totalesVentas.plin)}</p>
                </div>
                <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-4 shadow-sm">
                  <p className="text-sm font-semibold text-indigo-700 mb-2">Transferencia</p>
                  <p className="text-2xl font-bold text-indigo-600">{formatCurrency(totalesVentas.transferencia)}</p>
                </div>
              </div>

              {/* Tabla de ventas */}
              {loadingVentas ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : ventasTurno.filter(v => filtroMetodo === 'todos' || v.metodo_pago === filtroMetodo).length === 0 ? (
                <div className="text-center py-8">
                  <Banknote className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">
                    {filtroMetodo === 'todos'
                      ? 'No hay ventas en este turno aún'
                      : `No hay ventas con método ${filtroMetodo}`}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-gray-200">
                        <th className="text-left py-3 px-2 text-xs font-semibold text-gray-600">VENTA</th>
                        <th className="text-left py-3 px-2 text-xs font-semibold text-gray-600">HORA</th>
                        <th className="text-left py-3 px-2 text-xs font-semibold text-gray-600">MÉTODO</th>
                        <th className="text-center py-3 px-2 text-xs font-semibold text-gray-600">CANT.</th>
                        <th className="text-right py-3 px-2 text-xs font-semibold text-gray-600">TOTAL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ventasTurno
                        .filter(v => filtroMetodo === 'todos' || v.metodo_pago === filtroMetodo)
                        .map((venta) => (
                          <tr key={venta.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-2 text-sm font-semibold text-gray-800">
                              {venta.numero_venta}
                            </td>
                            <td className="py-3 px-2 text-sm text-gray-600">
                              {new Date(venta.fecha).toLocaleTimeString('es-PE', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false,
                                timeZone: 'America/Lima'
                              })}
                            </td>
                            <td className="py-3 px-2">
                              <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                                venta.metodo_pago === 'efectivo'
                                  ? 'bg-green-100 text-green-700'
                                  : venta.metodo_pago === 'yape'
                                  ? 'bg-purple-100 text-purple-700'
                                  : venta.metodo_pago === 'plin'
                                  ? 'bg-pink-100 text-pink-700'
                                  : 'bg-indigo-100 text-indigo-700'
                              }`}>
                                {venta.metodo_pago.toUpperCase()}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-center text-sm font-semibold text-gray-700">
                              {venta.cantidad_items}
                            </td>
                            <td className="py-3 px-2 text-right text-sm font-bold text-gray-900">
                              {formatCurrency(venta.total)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Modal: Abrir Turno - Mejorado */}
      {showAbrirModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all">
            {/* Header con gradiente mejorado */}
            <div className="bg-gradient-to-r from-green-600 via-green-500 to-emerald-600 text-white p-6 rounded-t-3xl">
              <div className="flex items-center gap-4">
                <div className="bg-white bg-opacity-25 p-4 rounded-2xl backdrop-blur-sm">
                  <Unlock className="h-10 w-10" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold mb-1">Abrir Turno</h2>
                  <p className="text-green-50 text-sm">
                    Inicia tu jornada de trabajo
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleAbrirTurno} className="p-6">
              {/* Información contextual */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-blue-500 rounded-xl p-4 mb-6">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-500 text-white p-2 rounded-lg">
                    <Banknote className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-blue-900 mb-1">
                      ¿Qué es el monto inicial?
                    </p>
                    <p className="text-xs text-blue-700 leading-relaxed">
                      Es el dinero en efectivo que tienes en caja al comenzar tu turno.
                      Si la caja está vacía, déjalo en S/ 0.00
                    </p>
                  </div>
                </div>
              </div>

              {/* Input mejorado */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-800 mb-3">
                  Monto Inicial en Caja
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-xl font-bold">
                    S/
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={montoInicial}
                    onChange={(e) => setMontoInicial(e.target.value)}
                    placeholder="0.00"
                    autoFocus
                    className="block w-full rounded-xl border-2 border-gray-300 pl-12 pr-4 py-4 focus:outline-none focus:ring-4 focus:ring-green-200 focus:border-green-500 text-2xl font-bold text-gray-900 transition-all"
                  />
                </div>
              </div>

              {/* Sugerencias de montos */}
              <div className="mb-6">
                <p className="text-xs font-semibold text-gray-600 mb-2">Montos sugeridos:</p>
                <div className="flex gap-2">
                  {[0, 50, 100, 200].map((monto) => (
                    <button
                      key={monto}
                      type="button"
                      onClick={() => setMontoInicial(monto.toString())}
                      className="flex-1 px-3 py-2 bg-gray-100 hover:bg-green-100 hover:text-green-700 hover:border-green-300 border-2 border-transparent rounded-lg font-bold text-sm text-gray-700 transition-all"
                    >
                      S/ {monto}
                    </button>
                  ))}
                </div>
              </div>

              {/* Resumen antes de abrir */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Turno iniciado por:</span>
                  <span className="text-sm font-bold text-gray-900">{user?.nombre_completo}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Monto inicial:</span>
                  <span className="text-xl font-bold text-green-600">
                    S/ {montoInicial || '0.00'}
                  </span>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAbrirModal(false);
                    setMontoInicial('');
                  }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 py-3.5 rounded-xl font-bold transition-all border-2 border-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-6 py-3.5 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Abrir Turno
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Cerrar Turno */}
      {showCerrarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-red-600 text-white p-4 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                  <Lock className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Cerrar Turno</h2>
                  <p className="text-red-100 text-sm mt-1">Realiza el arqueo de caja</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleCerrarTurno} className="p-6">
              <div className="bg-blue-50 rounded-lg p-4 mb-4 border border-blue-200">
                <p className="text-sm text-blue-700 mb-1">Efectivo Esperado</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(
                    turnoActual.monto_inicial +
                      turnoActual.total_efectivo -
                      turnoActual.total_egresos
                  )}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Efectivo Contado (S/) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={efectivoContado}
                  onChange={(e) => setEfectivoContado(e.target.value)}
                  placeholder="0.00"
                  required
                  className="block w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 text-lg"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Cuenta el dinero físicamente y registra el total
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observaciones (Opcional)
                </label>
                <textarea
                  value={observacionesCierre}
                  onChange={(e) => setObservacionesCierre(e.target.value)}
                  rows="2"
                  placeholder="Ej: Todo correcto, sin novedades..."
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCerrarModal(false);
                    setEfectivoContado('');
                    setObservacionesCierre('');
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-3 rounded-lg font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
                >
                  Cerrar Turno
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Agregar Egreso */}
      {showEgresoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-red-600 text-white p-4 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                  <Minus className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Registrar Egreso</h2>
                  <p className="text-red-100 text-sm mt-1">Gastos durante el turno</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleAgregarEgreso} className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monto (S/) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={montoEgreso}
                  onChange={(e) => setMontoEgreso(e.target.value)}
                  placeholder="10.50"
                  required
                  className="block w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500 text-lg"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Concepto <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={conceptoEgreso}
                  onChange={(e) => setConceptoEgreso(e.target.value)}
                  placeholder="Ej: Compra de bolsas"
                  required
                  className="block w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEgresoModal(false);
                    setMontoEgreso('');
                    setConceptoEgreso('');
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-3 rounded-lg font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
                >
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        </>
      ) : activeTab === 'pendientes' ? (
        // Tab Pendientes (Admin)
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <ClipboardList className="h-7 w-7 text-yellow-600" />
              Solicitudes de Cierre Pendientes
            </h2>

            {loadingPendientes ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div>
              </div>
            ) : turnosPendientes.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">No hay solicitudes pendientes</p>
              </div>
            ) : (
              <div className="space-y-4">
                {turnosPendientes.map((turno) => (
                  <div
                    key={turno.id}
                    className="border border-yellow-200 rounded-xl p-6 bg-yellow-50 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                          <User className="h-5 w-5 text-yellow-600" />
                          {turno.vendedor_nombre}
                        </h3>
                        <p className="text-sm text-gray-600">Turno #{turno.numero_turno}</p>
                      </div>
                      <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                        ⏳ Pendiente
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500">Apertura</p>
                        <p className="font-semibold text-gray-800">{formatDateTime(turno.fecha_apertura)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Monto Inicial</p>
                        <p className="font-semibold text-gray-800">{formatCurrency(turno.monto_inicial)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Efectivo Contado</p>
                        <p className="font-semibold text-green-600">{formatCurrency(turno.efectivo_contado || 0)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Diferencia</p>
                        <p className={`font-semibold ${
                          (turno.efectivo_contado || 0) - turno.efectivo_esperado >= 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}>
                          {formatCurrency((turno.efectivo_contado || 0) - turno.efectivo_esperado)}
                        </p>
                      </div>
                    </div>

                    {turno.observaciones && (
                      <div className="bg-white p-3 rounded-lg mb-4">
                        <p className="text-xs text-gray-500 mb-1">Observaciones del vendedor:</p>
                        <p className="text-sm text-gray-700">{turno.observaciones}</p>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setSelectedTurno(turno);
                          setShowApprovalModal(true);
                        }}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                      >
                        <ThumbsUp className="h-5 w-5" />
                        Aprobar Cierre
                      </button>
                      <button
                        onClick={() => {
                          setSelectedTurno(turno);
                          setShowRejectionModal(true);
                        }}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                      >
                        <ThumbsDown className="h-5 w-5" />
                        Rechazar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        // Tab Historial (Admin) - Con scroll optimizado
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header y Filtros - STICKY */}
          <div className="bg-white p-6 border-b-2 border-gray-200 sticky top-0 z-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <History className="h-7 w-7 text-blue-600" />
                Historial de Turnos
              </h2>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setFiltroEstado('todos')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors text-sm ${
                    filtroEstado === 'todos'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setFiltroEstado('abierto')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors text-sm ${
                    filtroEstado === 'abierto'
                      ? 'bg-green-600 text-white shadow-md'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Abiertos
                </button>
                <button
                  onClick={() => setFiltroEstado('pendiente_cierre')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors text-sm ${
                    filtroEstado === 'pendiente_cierre'
                      ? 'bg-yellow-600 text-white shadow-md'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Pendientes
                </button>
                <button
                  onClick={() => setFiltroEstado('cerrado')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors text-sm ${
                    filtroEstado === 'cerrado'
                      ? 'bg-gray-600 text-white shadow-md'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Cerrados
                </button>
              </div>
            </div>
          </div>

          {/* Lista de turnos con scroll - Altura fija para 3-4 turnos */}
          <div className="overflow-y-auto p-6" style={{ maxHeight: '600px' }}>
            {loadingHistorial ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : todosLosTurnos.filter(t => filtroEstado === 'todos' || t.estado === filtroEstado).length === 0 ? (
              <div className="text-center py-12">
                {filtroEstado === 'todos' ? (
                  <>
                    <History className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg">No hay turnos registrados</p>
                  </>
                ) : filtroEstado === 'abierto' ? (
                  <>
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg">No hay turnos abiertos</p>
                  </>
                ) : filtroEstado === 'pendiente_cierre' ? (
                  <>
                    <Clock className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg">No hay turnos pendientes de cierre</p>
                  </>
                ) : (
                  <>
                    <XCircle className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg">No hay turnos cerrados</p>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {todosLosTurnos
                  .filter(t => filtroEstado === 'todos' || t.estado === filtroEstado)
                  .map((turno) => (
                    <div
                      key={turno.id}
                      className={`border rounded-xl p-6 hover:shadow-md transition-shadow ${
                        turno.estado === 'abierto'
                          ? 'border-green-200 bg-green-50'
                          : turno.estado === 'pendiente_cierre'
                          ? 'border-yellow-200 bg-yellow-50'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <User className="h-5 w-5" />
                            {turno.vendedor_nombre}
                          </h3>
                          <p className="text-sm text-gray-600">Turno #{turno.numero_turno}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                          turno.estado === 'abierto'
                            ? 'bg-green-500 text-white'
                            : turno.estado === 'pendiente_cierre'
                            ? 'bg-yellow-500 text-white'
                            : 'bg-gray-500 text-white'
                        }`}>
                          {turno.estado === 'abierto' ? '🟢 Abierto' :
                           turno.estado === 'pendiente_cierre' ? '⏳ Pendiente' :
                           '🔒 Cerrado'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div>
                          <p className="text-xs text-gray-500">Apertura</p>
                          <p className="font-semibold text-gray-800 text-sm">{formatDateTime(turno.fecha_apertura)}</p>
                        </div>
                        {turno.fecha_cierre && (
                          <div>
                            <p className="text-xs text-gray-500">Cierre</p>
                            <p className="font-semibold text-gray-800 text-sm">{formatDateTime(turno.fecha_cierre)}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-gray-500">Inicial</p>
                          <p className="font-semibold text-gray-800">{formatCurrency(turno.monto_inicial)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Ventas Efectivo</p>
                          <p className="font-semibold text-green-600">{formatCurrency(turno.total_ventas_efectivo)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Egresos</p>
                          <p className="font-semibold text-red-600">{formatCurrency(turno.total_egresos)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Aprobar Cierre */}
      {showApprovalModal && selectedTurno && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <ThumbsUp className="h-7 w-7 text-green-600" />
              Aprobar Cierre de Turno
            </h2>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-gray-700 mb-2">
                <strong>Vendedor:</strong> {selectedTurno.vendedor_nombre}
              </p>
              <p className="text-gray-700 mb-2">
                <strong>Turno:</strong> #{selectedTurno.numero_turno}
              </p>
              <p className="text-gray-700 mb-2">
                <strong>Efectivo Esperado:</strong> {formatCurrency(selectedTurno.efectivo_esperado)}
              </p>
              <p className="text-gray-700 mb-2">
                <strong>Efectivo Contado:</strong> {formatCurrency(selectedTurno.efectivo_contado || 0)}
              </p>
              <p className={`font-bold ${
                (selectedTurno.efectivo_contado || 0) - selectedTurno.efectivo_esperado >= 0
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}>
                Diferencia: {formatCurrency((selectedTurno.efectivo_contado || 0) - selectedTurno.efectivo_esperado)}
              </p>
            </div>

            <p className="text-gray-600 mb-6">
              ¿Estás seguro de aprobar el cierre de este turno? Esta acción no se puede deshacer.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowApprovalModal(false);
                  setSelectedTurno(null);
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-3 rounded-lg font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAprobarCierre}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
              >
                Aprobar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Rechazar Cierre */}
      {showRejectionModal && selectedTurno && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <ThumbsDown className="h-7 w-7 text-red-600" />
              Rechazar Cierre de Turno
            </h2>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-gray-700 mb-2">
                <strong>Vendedor:</strong> {selectedTurno.vendedor_nombre}
              </p>
              <p className="text-gray-700">
                <strong>Turno:</strong> #{selectedTurno.numero_turno}
              </p>
            </div>

            <form onSubmit={handleRechazarCierre}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo del rechazo <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={motivoRechazo}
                  onChange={(e) => setMotivoRechazo(e.target.value)}
                  placeholder="Explica por qué rechazas este cierre..."
                  required
                  rows="4"
                  className="block w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowRejectionModal(false);
                    setSelectedTurno(null);
                    setMotivoRechazo('');
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-3 rounded-lg font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
                >
                  Rechazar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

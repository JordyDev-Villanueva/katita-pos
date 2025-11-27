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
  ArrowLeft
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://katita-pos-production.up.railway.app/api';

export const CuadroCaja = () => {
  const navigate = useNavigate();
  const [turnoActual, setTurnoActual] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

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

  useEffect(() => {
    fetchUserData();
    fetchTurnoActual();
  }, []);

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
      const response = await axios.post(
        `${API_URL}/cuadro-caja/cerrar`,
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
      toast.success('✅ Turno cerrado exitosamente');
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

  const formatCurrency = (value) => {
    return `S/ ${Number(value).toFixed(2)}`;
  };

  const formatDateTime = (datetime) => {
    if (!datetime) return '-';
    const date = new Date(datetime);
    return date.toLocaleString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

      {/* Estado del turno */}
      {!turnoActual ? (
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="h-12 w-12 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">No hay turno abierto</h2>
          <p className="text-gray-600 mb-6">
            Abre un nuevo turno para comenzar a registrar ventas y movimientos de caja
          </p>
          <button
            onClick={() => setShowAbrirModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors inline-flex items-center gap-2"
          >
            <Unlock className="h-5 w-5" />
            Abrir Turno
          </button>
        </div>
      ) : (
        <>
          {/* Información del turno actual */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Estado */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">Estado</h3>
                {turnoActual.esta_abierto ? (
                  <CheckCircle className="h-8 w-8 text-green-500" />
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
                      turnoActual.esta_abierto
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {turnoActual.esta_abierto ? '🟢 Abierto' : '🔒 Cerrado'}
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

          {/* Resumen de ventas por método de pago */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Ventas por Método de Pago</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* Efectivo */}
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-green-500 p-2 rounded-lg">
                    <Banknote className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-green-900">Efectivo</span>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(turnoActual.total_efectivo)}
                </p>
              </div>

              {/* Yape */}
              <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-purple-500 p-2 rounded-lg">
                    <Smartphone className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-purple-900">Yape</span>
                </div>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(turnoActual.total_yape)}
                </p>
              </div>

              {/* Plin */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-blue-500 p-2 rounded-lg">
                    <Smartphone className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-blue-900">Plin</span>
                </div>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(turnoActual.total_plin)}
                </p>
              </div>

              {/* Transferencia */}
              <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-indigo-500 p-2 rounded-lg">
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-indigo-900">Transferencia</span>
                </div>
                <p className="text-2xl font-bold text-indigo-600">
                  {formatCurrency(turnoActual.total_transferencia)}
                </p>
              </div>
            </div>

            {/* Total de ventas */}
            <div className="bg-gradient-to-r from-green-600 to-green-500 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 mb-1">Total de Ventas</p>
                  <p className="text-4xl font-bold">{formatCurrency(turnoActual.total_ventas)}</p>
                </div>
                <TrendingUp className="h-12 w-12 text-green-200" />
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
        </>
      )}

      {/* Modal: Abrir Turno */}
      {showAbrirModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-green-600 text-white p-4 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                  <Unlock className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Abrir Turno</h2>
                  <p className="text-green-100 text-sm mt-1">Registra el monto inicial en caja</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleAbrirTurno} className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monto Inicial en Caja (S/)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={montoInicial}
                  onChange={(e) => setMontoInicial(e.target.value)}
                  placeholder="0.00"
                  className="block w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 text-lg"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Deja en 0 si no hay dinero inicial en caja
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAbrirModal(false);
                    setMontoInicial('');
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-3 rounded-lg font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
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
    </div>
  );
};

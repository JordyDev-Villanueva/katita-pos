import { useState, useEffect } from 'react';
import { Plus, RefreshCw, FileText, CheckCircle } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { LoteStats } from '../components/lotes/LoteStats';
import { LoteFilters } from '../components/lotes/LoteFilters';
import { LoteTable } from '../components/lotes/LoteTable';
import { LoteForm } from '../components/lotes/LoteForm';
import { AlertasWidget } from '../components/lotes/AlertasWidget';
import { MermasReport } from '../components/lotes/MermasReport';
import { Button } from '../components/common/Button';
import { lotesAPI } from '../api/lotes';
import { productsAPI } from '../api/products';
import toast from 'react-hot-toast';

export const Lotes = () => {
  const [lotes, setLotes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [mermas, setMermas] = useState({ lotes: [], valorPerdido: 0 });
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [filters, setFilters] = useState({});
  const [showMermasReport, setShowMermasReport] = useState(false);
  const [showUpdatedBadge, setShowUpdatedBadge] = useState(false);

  const [stats, setStats] = useState({
    totalActivos: 0,
    agotados: 0,
    porVencer: 0,
    vencidos: 0,
  });

  useEffect(() => {
    loadProductos();
    loadLotes();
    loadAlertas();
    loadMermas();
  }, []);

  const loadProductos = async () => {
    try {
      const response = await productsAPI.listProducts({ activo: true });

      let productosArray = [];
      if (response.success) {
        if (Array.isArray(response.data)) {
          productosArray = response.data;
        } else if (response.data && Array.isArray(response.data.productos)) {
          productosArray = response.data.productos;
        }
      }

      setProductos(productosArray);
    } catch (error) {
      console.error('Error cargando productos:', error);
      toast.error('Error al cargar productos');
    }
  };

  const loadLotes = async (filterParams = {}) => {
    try {
      setLoading(true);
      const response = await lotesAPI.listLotes(filterParams);

      console.log('📦 Respuesta lotes:', response);

      let lotesArray = [];
      if (response.success) {
        if (Array.isArray(response.data)) {
          lotesArray = response.data;
        } else if (response.data && Array.isArray(response.data.lotes)) {
          lotesArray = response.data.lotes;
        }
      }

      console.log('📊 Lotes cargados:', lotesArray);
      setLotes(lotesArray);
      calculateStats(lotesArray);

    } catch (error) {
      console.error('Error cargando lotes:', error);
      toast.error('Error al cargar lotes');
      setLotes([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAlertas = async () => {
    try {
      const response = await lotesAPI.getAlertas(7); // Próximos 7 días

      let alertasArray = [];
      if (response.success) {
        if (Array.isArray(response.data)) {
          alertasArray = response.data;
        } else if (response.data && Array.isArray(response.data.lotes)) {
          alertasArray = response.data.lotes;
        }
      }

      setAlertas(alertasArray);
    } catch (error) {
      console.error('Error cargando alertas:', error);
    }
  };

  const loadMermas = async () => {
    try {
      const response = await lotesAPI.getLotesVencidos();

      if (response.success && response.data) {
        setMermas({
          lotes: response.data.lotes || [],
          valorPerdido: response.data.valor_perdido || 0,
        });
      }
    } catch (error) {
      console.error('Error cargando mermas:', error);
    }
  };

  const calculateStats = (lotesArray) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    // Primero identificar vencidos y no vencidos
    const vencidos = lotesArray.filter(l => {
      if (l.cantidad_actual <= 0) return false;
      const fechaVenc = new Date(l.fecha_vencimiento);
      fechaVenc.setHours(0, 0, 0, 0);
      const diff = Math.ceil((fechaVenc - hoy) / (1000 * 60 * 60 * 24));
      return diff <= 0; // Vencidos: hoy o antes
    });

    // Activos: tienen stock Y NO están vencidos
    const activos = lotesArray.filter(l => {
      if (l.cantidad_actual <= 0) return false;
      const fechaVenc = new Date(l.fecha_vencimiento);
      fechaVenc.setHours(0, 0, 0, 0);
      const diff = Math.ceil((fechaVenc - hoy) / (1000 * 60 * 60 * 24));
      return diff > 0; // NO vencidos
    });

    const agotados = lotesArray.filter(l => l.cantidad_actual === 0);

    // Por vencer: solo los activos (no vencidos) que vencen entre 1 y 7 días
    const porVencer = activos.filter(l => {
      const fechaVenc = new Date(l.fecha_vencimiento);
      fechaVenc.setHours(0, 0, 0, 0);
      const diff = Math.ceil((fechaVenc - hoy) / (1000 * 60 * 60 * 24));
      return diff >= 1 && diff <= 7;
    });

    setStats({
      totalActivos: activos.length, // Ahora excluye vencidos
      agotados: agotados.length,
      porVencer: porVencer.length,
      vencidos: vencidos.length,
    });
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    loadLotes(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({});
    loadLotes();
  };

  const handleNewLote = () => {
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
  };

  const handleSubmitForm = async (formData) => {
    try {
      setFormLoading(true);

      console.log('📤 Enviando nuevo lote:', formData);

      const response = await lotesAPI.createLote(formData);

      if (response.success) {
        // Mostrar solo mensaje corto
        toast.success('Ingreso registrado', {
          duration: 3000,
          icon: '✅',
        });

        handleCloseForm();
        loadLotes(filters);
        loadAlertas();
        loadProductos(); // Recargar productos para actualizar stock
      }

    } catch (error) {
      console.error('Error creando lote:', error);
      const message = error.response?.data?.message || 'Error al registrar ingreso';
      toast.error(message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleRefresh = () => {
    loadLotes(filters);
    loadAlertas();
    loadMermas();
    loadProductos();
    setShowUpdatedBadge(true);
    setTimeout(() => setShowUpdatedBadge(false), 2000);
  };

  return (
    <Layout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Lotes</h1>
            <p className="text-gray-600 mt-1">
              Control de inventario con sistema FIFO y alertas de vencimiento
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Badge "Datos actualizados" */}
            {showUpdatedBadge && (
              <div className="flex items-center gap-2 bg-green-100 text-green-700 px-3 py-2 rounded-lg animate-fade-in">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Datos actualizados</span>
              </div>
            )}

            {/* Botón Recargar */}
            <button
              onClick={handleRefresh}
              className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="text-sm font-medium">Recargar</span>
            </button>

            {/* Botón Mermas */}
            {mermas.lotes.length > 0 && (
              <button
                onClick={() => setShowMermasReport(!showMermasReport)}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {showMermasReport ? 'Ocultar' : 'Ver'} Mermas ({mermas.lotes.length})
                </span>
              </button>
            )}

            {/* Botón Registrar Ingreso */}
            <button
              onClick={handleNewLote}
              className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Registrar Ingreso</span>
            </button>
          </div>
        </div>

        {/* Estadísticas */}
        <LoteStats stats={stats} />

        {/* Alertas de vencimiento */}
        <AlertasWidget alertas={alertas} />

        {/* Reporte de Mermas (condicional) */}
        {showMermasReport && (
          <MermasReport
            lotesVencidos={mermas.lotes}
            valorPerdido={mermas.valorPerdido}
          />
        )}

        {/* Filtros */}
        <LoteFilters
          productos={productos}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
        />

        {/* Tabla de Lotes */}
        <LoteTable
          lotes={lotes}
          loading={loading}
        />
      </div>

      {/* Modal Formulario */}
      <LoteForm
        isOpen={showForm}
        onClose={handleCloseForm}
        onSubmit={handleSubmitForm}
        productos={productos}
        loading={formLoading}
      />
    </Layout>
  );
};

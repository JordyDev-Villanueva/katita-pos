import { useAuth } from '../hooks/useAuth';
import {
  ShoppingCart,
  Package,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Users,
  Clock
} from 'lucide-react';
import { Layout } from '../components/layout/Layout';

export const Dashboard = () => {
  const { user } = useAuth();

  const quickStats = [
    {
      label: 'Ventas Hoy',
      value: 'S/ 0.00',
      icon: ShoppingCart,
      color: 'bg-blue-500',
      change: '+0%'
    },
    {
      label: 'Productos en Stock',
      value: '0',
      icon: Package,
      color: 'bg-green-500',
      change: '0 productos'
    },
    {
      label: 'Productos por Vencer',
      value: '0',
      icon: AlertTriangle,
      color: 'bg-yellow-500',
      change: 'Próximos 7 días'
    },
    {
      label: 'Ganancia del Día',
      value: 'S/ 0.00',
      icon: TrendingUp,
      color: 'bg-purple-500',
      change: '+0%'
    },
  ];

  const recentActivity = [
    {
      icon: Clock,
      title: 'Sistema iniciado',
      description: 'Bienvenido al sistema POS',
      time: 'Ahora',
      color: 'text-blue-500'
    }
  ];

  return (
    <Layout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Dashboard
          </h1>
          <p className="text-gray-600">
            Bienvenido, <span className="font-semibold text-primary-600">{user?.nombre_completo}</span>
          </p>
          <p className="text-sm text-gray-500 capitalize">
            Rol: {user?.rol}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1 font-medium">
                      {stat.label}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`${stat.color} p-3 rounded-lg`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  {stat.change}
                </p>
              </div>
            );
          })}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Actividad Reciente */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                Actividad Reciente
              </h2>
              <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                Ver todo
              </button>
            </div>

            <div className="space-y-4">
              {recentActivity.map((activity, index) => {
                const ActivityIcon = activity.icon;
                return (
                  <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className={`${activity.color} p-2 rounded-lg bg-opacity-10`}>
                      <ActivityIcon className={`h-5 w-5 ${activity.color}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.title}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {activity.time}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Accesos Rápidos */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Accesos Rápidos
            </h2>

            <div className="space-y-3">
              {user?.rol !== 'bodeguero' && (
                <button className="w-full flex items-center gap-3 p-4 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors duration-200 group">
                  <div className="bg-primary-600 p-2 rounded-lg group-hover:scale-110 transition-transform duration-200">
                    <ShoppingCart className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-medium text-gray-900">Nueva Venta</p>
                    <p className="text-xs text-gray-600">Procesar venta</p>
                  </div>
                </button>
              )}

              {(user?.rol === 'admin' || user?.rol === 'bodeguero') && (
                <button className="w-full flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors duration-200 group">
                  <div className="bg-green-600 p-2 rounded-lg group-hover:scale-110 transition-transform duration-200">
                    <Package className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-medium text-gray-900">Productos</p>
                    <p className="text-xs text-gray-600">Gestionar inventario</p>
                  </div>
                </button>
              )}

              {user?.rol === 'admin' && (
                <button className="w-full flex items-center gap-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors duration-200 group">
                  <div className="bg-purple-600 p-2 rounded-lg group-hover:scale-110 transition-transform duration-200">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-medium text-gray-900">Reportes</p>
                    <p className="text-xs text-gray-600">Ver estadísticas</p>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Nota Informativa */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Package className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">
                Sistema Listo para Usar
              </h3>
              <p className="text-sm text-blue-700">
                Los módulos de Punto de Venta, Inventario y Reportes estarán disponibles en las siguientes fases de desarrollo.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

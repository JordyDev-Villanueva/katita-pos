import { TrendingUp, Package, AlertTriangle, DollarSign } from 'lucide-react';

export const StatsCards = ({ stats }) => {
  // Labels dinámicos según el filtro activo
  const ventasLabel = stats?._labels?.ventas || 'Ventas Hoy';
  const gananciaLabel = stats?._labels?.ganancia || 'Ganancia Hoy';

  const cards = [
    {
      label: ventasLabel,
      value: `S/ ${Number(stats?.ventasHoy || 0).toFixed(2)}`,
      icon: TrendingUp,
      color: 'blue',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      iconBg: 'bg-blue-100',
      description: 'Total vendido',
    },
    {
      label: 'Productos en Stock',
      value: stats?.productosEnStock || 0,
      icon: Package,
      color: 'green',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      iconBg: 'bg-green-100',
      description: 'Con inventario',
    },
    {
      label: 'Por Vencer',
      value: stats?.porVencer || 0,
      icon: AlertTriangle,
      color: 'yellow',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600',
      iconBg: 'bg-yellow-100',
      description: 'Próximos 7 días',
    },
    {
      label: gananciaLabel,
      value: `S/ ${Number(stats?.gananciaHoy || 0).toFixed(2)}`,
      icon: DollarSign,
      color: 'purple',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      iconBg: 'bg-purple-100',
      description: 'Margen bruto',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className={`bg-gradient-to-br from-${card.color}-50 to-${card.color}-100 rounded-xl shadow-sm p-6 border border-${card.color}-200 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className={`text-sm font-medium text-${card.color}-700 mb-1`}>{card.label}</p>
                <p className={`text-3xl font-bold text-${card.color}-900`}>{card.value}</p>
                <p className={`text-xs text-${card.color}-600 mt-1`}>{card.description}</p>
              </div>
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <Icon className={`w-6 h-6 ${card.textColor}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

import { Layers, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

export const LoteStats = ({ stats }) => {
  const cards = [
    {
      label: 'Total Lotes Activos',
      value: stats?.totalActivos || 0,
      icon: Layers,
      color: 'blue',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      iconBg: 'bg-blue-100',
      description: 'Con stock disponible',
    },
    {
      label: 'Lotes Disponibles',
      value: stats?.totalActivos - (stats?.agotados || 0) || 0,
      icon: CheckCircle,
      color: 'green',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      iconBg: 'bg-green-100',
      description: 'Listos para venta',
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
      label: 'Lotes Vencidos',
      value: stats?.vencidos || 0,
      icon: XCircle,
      color: 'red',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600',
      iconBg: 'bg-red-100',
      description: 'Requieren atención',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className={`${card.bgColor} rounded-xl p-5 border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-1">{card.label}</p>
                <p className={`text-3xl font-bold ${card.textColor} mb-1`}>{card.value}</p>
                <p className="text-xs text-gray-500">{card.description}</p>
              </div>
              <div className={`${card.iconBg} p-4 rounded-xl`}>
                <Icon className={`h-7 w-7 ${card.textColor}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

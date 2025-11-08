import { Package, AlertTriangle, CheckCircle, Calendar } from 'lucide-react';

export const LoteStats = ({ stats }) => {
  const cards = [
    {
      label: 'Total Lotes Activos',
      value: stats?.totalActivos || 0,
      icon: Package,
      color: 'blue',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      iconBg: 'bg-blue-100',
    },
    {
      label: 'Lotes Agotados',
      value: stats?.agotados || 0,
      icon: CheckCircle,
      color: 'green',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      iconBg: 'bg-green-100',
    },
    {
      label: 'Por Vencer (7 días)',
      value: stats?.porVencer || 0,
      icon: AlertTriangle,
      color: 'yellow',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600',
      iconBg: 'bg-yellow-100',
    },
    {
      label: 'Lotes Vencidos',
      value: stats?.vencidos || 0,
      icon: Calendar,
      color: 'red',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600',
      iconBg: 'bg-red-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div key={index} className={`${card.bgColor} rounded-xl p-4 border border-gray-200`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{card.label}</p>
                <p className={`text-2xl font-bold ${card.textColor}`}>{card.value}</p>
              </div>
              <div className={`${card.iconBg} p-3 rounded-lg`}>
                <Icon className={`h-6 w-6 ${card.textColor}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

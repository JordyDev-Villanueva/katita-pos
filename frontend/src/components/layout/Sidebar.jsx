import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Layers,
  BarChart3,
  LogOut,
  ShoppingBag
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const Sidebar = () => {
  const { logout, user } = useAuth();

  const menuItems = [
    {
      name: 'Dashboard',
      icon: LayoutDashboard,
      path: '/dashboard',
      roles: ['admin', 'vendedor', 'bodeguero'],
    },
    {
      name: 'Punto de Venta',
      icon: ShoppingCart,
      path: '/pos',
      roles: ['admin', 'vendedor'],
    },
    {
      name: 'Productos',
      icon: Package,
      path: '/productos',
      roles: ['admin', 'bodeguero'],
    },
    {
      name: 'Lotes',
      icon: Layers,
      path: '/lotes',
      roles: ['admin', 'bodeguero'],
    },
    {
      name: 'Reportes',
      icon: BarChart3,
      path: '/reportes',
      roles: ['admin'],
    },
  ];

  // Filtrar items según rol del usuario
  const filteredMenuItems = menuItems.filter(item =>
    item.roles.includes(user?.rol)
  );

  return (
    <div className="w-64 bg-sidebar min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-primary-800">
        <div className="flex items-center gap-3">
          <div className="bg-primary-500 p-2 rounded-lg">
            <ShoppingBag className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">KATITA POS</h1>
            <p className="text-xs text-primary-200">Guadalupito, Perú</p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 space-y-1">
        {filteredMenuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-700 text-white shadow-lg'
                    : 'text-primary-100 hover:bg-sidebar-hover hover:text-white'
                }`
              }
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User Info y Logout */}
      <div className="p-4 border-t border-primary-800">
        <div className="bg-primary-800 rounded-lg p-3 mb-3">
          <p className="text-xs text-primary-200 mb-1">Usuario</p>
          <p className="text-sm font-medium text-white">{user?.nombre_completo}</p>
          <p className="text-xs text-primary-300 capitalize">Rol: {user?.rol}</p>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 font-medium"
        >
          <LogOut className="h-4 w-4" />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
};

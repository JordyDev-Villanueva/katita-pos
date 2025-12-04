import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Layers,
  BarChart3,
  LogOut,
  Menu,
  X,
  User,
  Users,
  DollarSign,
  Receipt,
  Settings
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const Sidebar = () => {
  const { logout, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

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
      name: 'Cuadro de Caja',
      icon: DollarSign,
      path: '/cuadro-caja',
      roles: ['admin', 'vendedor'],
    },
    {
      name: 'Ventas', // FASE 8: Historial completo de ventas
      icon: Receipt,
      path: '/ventas',
      roles: ['admin'],
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
      name: 'Ajustes Inventario', // FASE 8: Ajustes de stock
      icon: Settings,
      path: '/ajustes-inventario',
      roles: ['admin'],
    },
    {
      name: 'Vendedores',
      icon: Users,
      path: '/usuarios',
      roles: ['admin'],
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
    <>
      {/* Botón hamburguesa - Solo móvil */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-primary-600 text-white rounded-lg shadow-lg hover:bg-primary-700 transition-colors"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Overlay para cerrar sidebar en móvil */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-screen w-64 bg-sidebar flex flex-col overflow-hidden z-50 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-primary-800">
          <div className="flex items-center gap-3">
            <img
              src="/katita-logo.svg"
              alt="KATITA POS Logo"
              className="h-12 w-12"
            />
            <div>
              <h1 className="text-xl font-bold text-white">KATITA POS</h1>
              <p className="text-xs text-primary-200">Guadalupito, Perú</p>
            </div>
          </div>
        </div>

        {/* Menu Items - Scrollable */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
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

        {/* User Info y Logout - Sticky at Bottom */}
        <div className="p-4 border-t border-primary-800 bg-sidebar space-y-2">
          <div className="bg-primary-800 rounded-lg p-3">
            <p className="text-xs text-primary-200 mb-1">Usuario</p>
            <p className="text-sm font-medium text-white">{user?.nombre_completo}</p>
            <p className="text-xs text-primary-300 capitalize">Rol: {user?.rol}</p>
          </div>

          <NavLink
            to="/perfil"
            onClick={() => setIsOpen(false)}
            className={({ isActive }) =>
              `w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-colors duration-200 font-medium ${
                isActive
                  ? 'bg-primary-700 text-white'
                  : 'bg-primary-800 hover:bg-primary-700 text-primary-100 hover:text-white'
              }`
            }
          >
            <User className="h-4 w-4" />
            Mi Perfil
          </NavLink>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 font-medium"
          >
            <LogOut className="h-4 w-4" />
            Cerrar Sesión
          </button>
        </div>
      </div>
    </>
  );
};

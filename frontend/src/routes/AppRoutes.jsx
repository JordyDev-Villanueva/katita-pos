import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from '../pages/Login';
import { Dashboard } from '../pages/Dashboard';
import { POS } from '../pages/POS';
import { Productos } from '../pages/Productos';
import { Lotes } from '../pages/Lotes';
import Reportes from '../pages/Reportes';
import { PrivateRoute } from './PrivateRoute';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const AppRoutes = () => {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta pública */}
        <Route path="/login" element={<Login />} />

        {/* Rutas protegidas */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />

        <Route
          path="/pos"
          element={
            <PrivateRoute requiredRoles={['admin', 'vendedor']}>
              <POS />
            </PrivateRoute>
          }
        />

        <Route
          path="/productos"
          element={
            <PrivateRoute requiredRoles={['admin', 'bodeguero']}>
              <Productos />
            </PrivateRoute>
          }
        />

        <Route
          path="/lotes"
          element={
            <PrivateRoute requiredRoles={['admin', 'bodeguero']}>
              <Lotes />
            </PrivateRoute>
          }
        />

        <Route
          path="/reportes"
          element={
            <PrivateRoute requiredRoles={['admin']}>
              <Reportes />
            </PrivateRoute>
          }
        />

        {/* Redirección por defecto */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* 404 */}
        <Route
          path="*"
          element={
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <h1 className="text-6xl font-bold text-gray-900 mb-2">404</h1>
                <p className="text-xl text-gray-600 mb-4">Página no encontrada</p>
                <a
                  href="/dashboard"
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  Volver al inicio
                </a>
              </div>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

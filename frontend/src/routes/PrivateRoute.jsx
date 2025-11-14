import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const PrivateRoute = ({ children, requiredRoles = [] }) => {
  const { isAuthenticated, loading, user } = useAuth();

  // Verificar también localStorage para casos donde el estado aún no se actualizó
  const hasToken = localStorage.getItem('access_token');

  console.log('🔒 PrivateRoute verificando acceso:', {
    isAuthenticated,
    hasToken: !!hasToken,
    loading,
    user: user?.username || 'sin usuario'
  });

  if (loading) {
    console.log('⏳ PrivateRoute: Cargando...');
    return <LoadingSpinner fullScreen />;
  }

  // CORRECCIÓN: Verificar AMBOS - contexto Y localStorage
  if (!isAuthenticated && !hasToken) {
    console.log('❌ PrivateRoute: No autenticado, redirigiendo a login');
    return <Navigate to="/login" replace />;
  }

  // Verificar roles si se especificaron
  if (requiredRoles.length > 0 && !requiredRoles.includes(user?.rol)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="bg-red-100 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <svg className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">403</h1>
          <p className="text-lg text-gray-600 mb-1">Acceso Denegado</p>
          <p className="text-sm text-gray-500">
            No tienes permisos para acceder a esta página
          </p>
        </div>
      </div>
    );
  }

  return children;
};

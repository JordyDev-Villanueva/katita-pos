import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, ShoppingBag } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';

export const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value.trim(),
    }));

    // Limpiar error del campo
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = 'El usuario es requerido';
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    // Trimear valores antes de enviar
    const result = await login(
      formData.username.trim(),
      formData.password.trim()
    );

    setLoading(false);

    if (result.success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-primary-100 to-primary-200 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Logo y Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary-600 p-4 rounded-2xl shadow-lg">
              <ShoppingBag className="h-12 w-12 text-white" strokeWidth={2.5} />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            KATITA POS
          </h1>
          <p className="text-base text-gray-600 font-medium">
            Sistema de Punto de Venta
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Minimarket - Guadalupito, Perú
          </p>
        </div>

        {/* Card de Login */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Iniciar Sesión
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Usuario"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              placeholder="Ingresa tu usuario"
              error={errors.username}
              icon={User}
              required
            />

            <Input
              label="Contraseña"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Ingresa tu contraseña"
              error={errors.password}
              icon={Lock}
              required
            />

            <Button
              type="submit"
              fullWidth
              loading={loading}
              disabled={loading}
              size="lg"
            >
              Iniciar Sesión
            </Button>
          </form>

          {/* Usuarios de prueba */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center mb-3 font-semibold">
              👥 Usuarios de prueba:
            </p>
            <div className="space-y-2 text-xs">
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-2.5 border border-purple-200">
                <p className="text-gray-700">
                  <span className="font-semibold text-purple-900">👤 Admin:</span>{' '}
                  <span className="font-mono text-purple-700 font-medium">admin1</span> /{' '}
                  <span className="font-mono text-purple-700 font-medium">admin123</span>
                </p>
              </div>
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-2.5 border border-blue-200">
                <p className="text-gray-700">
                  <span className="font-semibold text-blue-900">👤 Vendedor (Mañana):</span>{' '}
                  <span className="font-mono text-blue-700 font-medium">vendedor1</span> /{' '}
                  <span className="font-mono text-blue-700 font-medium">vendedor123</span>
                </p>
              </div>
              <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-2.5 border border-green-200">
                <p className="text-gray-700">
                  <span className="font-semibold text-green-900">👤 Vendedor (Tarde):</span>{' '}
                  <span className="font-mono text-green-700 font-medium">vendedor2</span> /{' '}
                  <span className="font-mono text-green-700 font-medium">vendedor456</span>
                </p>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-600 font-semibold mb-1.5">
                ⏰ Turnos:
              </p>
              <div className="space-y-1 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="text-blue-600">🌅</span>
                  <span>Mañana: 7 AM - 2 PM (vendedor1)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-600">🌙</span>
                  <span>Tarde: 2 PM - 10 PM (vendedor2)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600">
          © 2025 KATITA POS - Desarrollado por Jordy Villanueva
        </p>
      </div>
    </div>
  );
};

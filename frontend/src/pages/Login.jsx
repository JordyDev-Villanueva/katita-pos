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
            <p className="text-xs text-gray-500 text-center mb-2 font-medium">
              Usuarios de prueba:
            </p>
            <div className="space-y-1.5 text-xs">
              <div className="bg-gray-50 rounded-lg p-2 border border-gray-200">
                <p className="text-gray-600">
                  👤 <span className="font-medium">Admin:</span>{' '}
                  <span className="font-mono text-primary-600">admin1</span> /{' '}
                  <span className="font-mono text-primary-600">admin123</span>
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2 border border-gray-200">
                <p className="text-gray-600">
                  👤 <span className="font-medium">Vendedor:</span>{' '}
                  <span className="font-mono text-primary-600">vendedor1</span> /{' '}
                  <span className="font-mono text-primary-600">vendedor123</span>
                </p>
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

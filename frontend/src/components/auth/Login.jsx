// ===== frontend/src/components/auth/Login.jsx =====
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Leaf, Lock, Mail, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('🔐 Intentando login...', formData.email);
      const response = await login(formData.email, formData.password);
      console.log('✅ Login exitoso:', response);
      
      toast.success('Inicio de sesión exitoso');
      
      // Esperar un poco antes de navegar para asegurar que el estado se establezca
      setTimeout(() => {
        console.log('🔄 Navegando a dashboard después de login exitoso');
        navigate('/dashboard', { replace: true });
      }, 100);
    } catch (err) {
      console.error('❌ Error en login:', err);
      const message = err.response?.data?.message || err.message || 'Error al iniciar sesión';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="max-w-md w-full relative z-10">
        {/* Logo y título */}
        <div className="text-center mb-8 fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-600 to-green-600 rounded-2xl mb-6 shadow-xl">
            <Leaf className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
            GreenTech Solutions
          </h1>
          <p className="text-slate-600 mt-3 text-lg">Gestión inteligente de energía renovable</p>
        </div>

        {/* Formulario de login */}
        <div className="card-gradient scale-in">
          <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">Iniciar Sesión</h2>

          {error && (
            <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="tu@greentech.com"
                  required
                  className="w-full pl-12 pr-4 py-4 border-2 border-slate-200 rounded-xl bg-white/80 backdrop-blur-sm focus:ring-4 focus:ring-emerald-200 focus:border-emerald-500 focus:bg-white outline-none transition-all duration-200 placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="w-full pl-12 pr-4 py-4 border-2 border-slate-200 rounded-xl bg-white/80 backdrop-blur-sm focus:ring-4 focus:ring-emerald-200 focus:border-emerald-500 focus:bg-white outline-none transition-all duration-200 placeholder:text-slate-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-600 to-green-600 text-white py-4 rounded-xl font-semibold hover:from-emerald-700 hover:to-green-700 focus:ring-4 focus:ring-emerald-200 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Iniciando sesión...
                </div>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-slate-500">
            <p>¿No tienes cuenta? <span className="text-emerald-600 font-semibold">Contacta con el administrador</span></p>
          </div>
        </div>

        {/* Demo credentials */}
        <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200/50 backdrop-blur-sm slide-up">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">i</span>
            </div>
            <p className="text-sm font-bold text-blue-900">Credenciales de prueba</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-blue-800 font-medium">📧 Email: <span className="font-mono">admin@greentech.com</span></p>
            <p className="text-sm text-blue-800 font-medium">🔑 Password: <span className="font-mono">admin123</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
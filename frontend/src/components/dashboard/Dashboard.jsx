import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { debugAuth } from '../../utils/debugAuth';
import { projectService } from '../../services/projectService';
import {
  Leaf, LayoutDashboard, FolderKanban, Activity, 
  Brain, FileText, Users, LogOut, Menu, X
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import KPICard from './KPICard';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Debug info
  const debugInfo = debugAuth();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await projectService.getStats();
      setStats(response.data);
    } catch (error) {
      toast.error('Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Sesión cerrada');
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', roles: ['all'] },
    { icon: FolderKanban, label: 'Proyectos', path: '/projects', roles: ['all'] },
    { icon: Activity, label: 'Monitoreo', path: '/monitoring', roles: ['operator', 'technician', 'manager', 'admin'] },
    { icon: Brain, label: 'Análisis Predictivo', path: '/predictive', roles: ['analyst', 'manager', 'admin'] },
    { icon: FileText, label: 'Documentos', path: '/documents', roles: ['all'] },
    { icon: Users, label: 'Usuarios', path: '/users', roles: ['admin'] },
  ];

  const filteredMenu = menuItems.filter(item => 
    item.roles.includes('all') || item.roles.includes(user?.role)
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`bg-white border-r border-gray-200 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            {sidebarOpen ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                    <Leaf className="w-6 h-6 text-white" />
                  </div>
                  <span className="font-bold text-lg text-gray-900">GreenTech</span>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </>
            ) : (
              <button onClick={() => setSidebarOpen(true)} className="mx-auto text-gray-500 hover:text-gray-700">
                <Menu className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* User Info */}
          <div className={`p-4 border-b border-gray-200 ${!sidebarOpen && 'flex justify-center'}`}>
            <div className={`flex items-center gap-3 ${!sidebarOpen && 'flex-col'}`}>
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-700 font-semibold text-sm">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              {sidebarOpen && (
                <div className="flex-1">
                  <p className="font-medium text-sm text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {filteredMenu.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors ${!sidebarOpen && 'justify-center'}`}
              >
                <item.icon className="w-5 h-5" />
                {sidebarOpen && <span className="font-medium">{item.label}</span>}
              </Link>
            ))}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors w-full ${!sidebarOpen && 'justify-center'}`}
            >
              <LogOut className="w-5 h-5" />
              {sidebarOpen && <span className="font-medium">Cerrar Sesión</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              ¡Bienvenido, {user?.name}!
            </h1>
            <p className="text-gray-600">
              Gestión integral de proyectos de energía renovable
            </p>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <KPICard
              title="Total Proyectos"
              value={stats?.total || 0}
              icon={FolderKanban}
              color="blue"
              trend="+12%"
            />
            <KPICard
              title="Proyectos Completados"
              value={stats?.completed || 0}
              icon={Activity}
              color="green"
              trend="+8%"
            />
            <KPICard
              title="En Progreso"
              value={stats?.byStatus?.find(s => s._id === 'in-progress')?.count || 0}
              icon={Brain}
              color="yellow"
              trend="+5%"
            />
            <KPICard
              title="Capacidad Total"
              value="1,245 MW"
              icon={Leaf}
              color="green"
              trend="+15%"
            />
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Acciones Rápidas</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                to="/projects/new"
                className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all group"
              >
                <FolderKanban className="w-8 h-8 text-gray-400 group-hover:text-green-600 mb-2" />
                <h3 className="font-medium text-gray-900 group-hover:text-green-700">Nuevo Proyecto</h3>
                <p className="text-sm text-gray-600">Crear un nuevo proyecto energético</p>
              </Link>

              <Link
                to="/monitoring"
                className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
              >
                <Activity className="w-8 h-8 text-gray-400 group-hover:text-blue-600 mb-2" />
                <h3 className="font-medium text-gray-900 group-hover:text-blue-700">Monitoreo en Tiempo Real</h3>
                <p className="text-sm text-gray-600">Ver producción de plantas</p>
              </Link>

              <Link
                to="/predictive"
                className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all group"
              >
                <Brain className="w-8 h-8 text-gray-400 group-hover:text-purple-600 mb-2" />
                <h3 className="font-medium text-gray-900 group-hover:text-purple-700">Análisis Predictivo</h3>
                <p className="text-sm text-gray-600">Simulaciones y predicciones</p>
              </Link>
            </div>
          </div>

          {/* Recent Projects Table */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Proyectos Recientes</h2>
            <div className="text-center py-8 text-gray-500">
              <FolderKanban className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No hay proyectos recientes para mostrar</p>
              <Link to="/projects" className="text-green-600 hover:underline mt-2 inline-block">
                Ver todos los proyectos
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { Users, UserPlus, Mail, Shield, AlertTriangle, Loader, RefreshCw, Home, ChevronRight } from 'lucide-react'; // Added Home, ChevronRight
import { toast } from 'react-hot-toast';
import UserTable from './UserTable';
import UserModal from './UserModal';
import userService from '../../services/userService';
import { useNavigate } from 'react-router-dom'; // Added useNavigate

export default function UsersPage() {
  const navigate = useNavigate(); // Added navigate hook
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    byRole: { admin: 0 },
    recentUsers: 0
  });
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cargar datos iniciales
  useEffect(() => {
    loadUsers();
    loadStats();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await userService.getAllUsers();
      setUsers(Array.isArray(data) ? data : data.users || []);
    } catch (error) {
      console.error('Error loading users:', error);
      setError(error.message || 'Error al cargar usuarios');
      toast.error('Error al cargar los usuarios');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await userService.getUserStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
      // No mostrar error para stats, ya que puede fallar si el servicio está dormido
    }
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    setModalOpen(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setModalOpen(true);
  };

  const handleSaveUser = async (userData) => {
    try {
      setModalLoading(true);
      
      if (editingUser) {
        // Actualizar usuario existente
        await userService.updateUser(editingUser._id, userData);
        toast.success('Usuario actualizado correctamente');
      } else {
        // Crear nuevo usuario
        await userService.createUser(userData);
        toast.success('Usuario creado correctamente');
      }
      
      setModalOpen(false);
      setEditingUser(null);
      await loadUsers();
      await loadStats();
    } catch (error) {
      console.error('Error saving user:', error);
      const message = error.response?.data?.message || error.message || 'Error al guardar usuario';
      toast.error(message);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este usuario? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      await userService.deleteUser(userId);
      toast.success('Usuario eliminado correctamente');
      await loadUsers();
      await loadStats();
    } catch (error) {
      console.error('Error deleting user:', error);
      const message = error.response?.data?.message || error.message || 'Error al eliminar usuario';
      toast.error(message);
    }
  };

  const handleToggleStatus = async (userId, isActive) => {
    try {
      await userService.toggleUserStatus(userId, isActive);
      toast.success(`Usuario ${isActive ? 'activado' : 'desactivado'} correctamente`);
      await loadUsers();
      await loadStats();
    } catch (error) {
      console.error('Error toggling user status:', error);
      const message = error.response?.data?.message || error.message || 'Error al cambiar estado del usuario';
      toast.error(message);
    }
  };

  const handleRefresh = () => {
    loadUsers();
    loadStats();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center hover:text-emerald-600 transition-colors"
          >
            <Home className="w-4 h-4 mr-1" />
            Dashboard
          </button>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 font-medium">Gestión de Usuarios</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
            <p className="text-gray-600 mt-1">
              Administra usuarios, roles y permisos del sistema
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
            
            <button
              onClick={handleCreateUser}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <UserPlus className="w-5 h-5" />
              Nuevo Usuario
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-8 h-8 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Total Usuarios</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.total || users.length}</p>
            <p className="text-sm text-gray-500 mt-1">
              {stats.active || users.filter(u => u.isActive).length} activos
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-8 h-8 text-red-600" />
              <h3 className="font-semibold text-gray-900">Administradores</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {stats.byRole?.admin || users.filter(u => u.role === 'admin').length}
            </p>
            <p className="text-sm text-gray-500 mt-1">Con permisos totales</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <Mail className="w-8 h-8 text-purple-600" />
              <h3 className="font-semibold text-gray-900">Últimas 24h</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.recentUsers || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Usuarios nuevos</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-8 h-8 text-green-600" />
              <h3 className="font-semibold text-gray-900">Managers</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {stats.byRole?.manager || users.filter(u => u.role === 'manager').length}
            </p>
            <p className="text-sm text-gray-500 mt-1">Gestión de equipos</p>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <div>
                <h3 className="text-red-800 font-medium">Error al cargar datos</h3>
                <p className="text-red-600 text-sm mt-1">{error}</p>
                <button
                  onClick={handleRefresh}
                  className="text-red-700 underline text-sm mt-2 hover:text-red-800"
                >
                  Intentar de nuevo
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Users Table */}
        <UserTable
          users={users}
          onEdit={handleEditUser}
          onDelete={handleDeleteUser}
          onToggleStatus={handleToggleStatus}
          loading={loading}
        />

        {/* User Modal */}
        <UserModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setEditingUser(null);
          }}
          onSave={handleSaveUser}
          user={editingUser}
          loading={modalLoading}
        />
      </div>
    </div>
  );
}
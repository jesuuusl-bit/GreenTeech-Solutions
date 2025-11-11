import api from './api';

const userService = {
  // Obtener todos los usuarios
  getAllUsers: async () => {
    try {
      console.log('🔍 Fetching all users...');
      const response = await api.get('/users');
      console.log('✅ Users fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching users:', error);
      throw error;
    }
  },

  // Obtener usuario por ID
  getUserById: async (id) => {
    try {
      console.log(`🔍 Fetching user with ID: ${id}`);
      const response = await api.get(`/users/${id}`);
      console.log('✅ User fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching user ${id}:`, error);
      throw error;
    }
  },

  // Crear nuevo usuario
  createUser: async (userData) => {
    try {
      console.log('🆕 Creating new user:', { ...userData, password: '[HIDDEN]' });
      const response = await api.post('/users/register', userData);
      console.log('✅ User created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error creating user:', error);
      throw error;
    }
  },

  // Actualizar usuario
  updateUser: async (id, userData) => {
    try {
      console.log(`🔧 Updating user ${id}:`, userData);
      const response = await api.put(`/users/${id}`, userData);
      console.log('✅ User updated successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error updating user ${id}:`, error);
      throw error;
    }
  },

  // Eliminar usuario
  deleteUser: async (id) => {
    try {
      console.log(`🗑️ Deleting user with ID: ${id}`);
      const response = await api.delete(`/users/${id}`);
      console.log('✅ User deleted successfully');
      return response.data;
    } catch (error) {
      console.error(`❌ Error deleting user ${id}:`, error);
      throw error;
    }
  },

  // Cambiar estado activo/inactivo
  toggleUserStatus: async (id, isActive) => {
    try {
      console.log(`🔄 Toggling user ${id} status to:`, isActive);
      const response = await api.patch(`/users/${id}/status`, { isActive });
      console.log('✅ User status updated successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error toggling user status ${id}:`, error);
      throw error;
    }
  },

  // Obtener estadísticas de usuarios
  getUserStats: async () => {
    try {
      console.log('📊 Fetching user statistics...');
      const response = await api.get('/users/stats');
      console.log('✅ User stats fetched successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching user stats:', error);
      // Si falla, devolver stats por defecto
      return {
        total: 0,
        active: 0,
        byRole: {
          admin: 0,
          manager: 0,
          operator: 0,
          technician: 0,
          analyst: 0,
          auditor: 0
        },
        byDepartment: {
          operations: 0,
          maintenance: 0,
          engineering: 0,
          legal: 0,
          management: 0
        },
        recentUsers: 0
      };
    }
  },

  // Roles disponibles
  getRoles: () => {
    return [
      { value: 'admin', label: 'Administrador', description: 'Acceso total al sistema' },
      { value: 'manager', label: 'Manager', description: 'Gestión de proyectos y equipos' },
      { value: 'operator', label: 'Operador', description: 'Operaciones básicas' },
      { value: 'technician', label: 'Técnico', description: 'Mantenimiento y reparaciones' },
      { value: 'analyst', label: 'Analista', description: 'Análisis de datos y reportes' },
      { value: 'auditor', label: 'Auditor', description: 'Revisión y compliance' }
    ];
  },

  // Departamentos disponibles
  getDepartments: () => {
    return [
      { value: 'operations', label: 'Operaciones', description: 'Producción energética' },
      { value: 'maintenance', label: 'Mantenimiento', description: 'Mantenimiento de equipos' },
      { value: 'engineering', label: 'Ingeniería', description: 'Desarrollo y optimización' },
      { value: 'legal', label: 'Legal', description: 'Asuntos legales y regulatorios' },
      { value: 'management', label: 'Gerencia', description: 'Dirección y estrategia' }
    ];
  }
};

export default userService;
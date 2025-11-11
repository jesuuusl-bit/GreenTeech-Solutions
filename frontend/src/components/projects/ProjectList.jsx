import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  AlertCircle,
  Calendar,
  DollarSign,
  Users,
  Activity,
  Home,
  ChevronRight
} from 'lucide-react';
import { projectService } from '../../services/projectService';
import toast from 'react-hot-toast';

const statusColors = {
  'planning': 'bg-blue-100 text-blue-800',
  'in-progress': 'bg-yellow-100 text-yellow-800', 
  'on-hold': 'bg-orange-100 text-orange-800',
  'completed': 'bg-green-100 text-green-800',
  'cancelled': 'bg-red-100 text-red-800'
};

const priorityColors = {
  'low': 'bg-gray-100 text-gray-800',
  'medium': 'bg-blue-100 text-blue-800',
  'high': 'bg-orange-100 text-orange-800', 
  'critical': 'bg-red-100 text-red-800'
};

export default function ProjectList() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    priority: ''
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);

  useEffect(() => {
    fetchProjects();
  }, [filters]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await projectService.getAll({
        ...filters,
        search: searchTerm
      });
      setProjects(response.data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Error al cargar los proyectos');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchProjects();
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleDeleteClick = (project) => {
    setProjectToDelete(project);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await projectService.delete(projectToDelete._id);
      toast.success('Proyecto eliminado exitosamente');
      fetchProjects();
      setShowDeleteModal(false);
      setProjectToDelete(null);
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Error al eliminar el proyecto');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-ES');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
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
          <span className="text-gray-900 font-medium">Proyectos</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Proyectos</h1>
            <p className="text-gray-600 mt-2">Administra todos los proyectos de energía renovable</p>
          </div>
          <Link
            to="/projects/new"
            className="btn-primary"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nuevo Proyecto
          </Link>
        </div>

        {/* Filters and Search */}
        <div className="card mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Search */}
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar proyectos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="input-search"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="input-field"
            >
              <option value="">Todos los estados</option>
              <option value="planning">Planificación</option>
              <option value="in-progress">En Progreso</option>
              <option value="on-hold">En Espera</option>
              <option value="completed">Completado</option>
              <option value="cancelled">Cancelado</option>
            </select>

            {/* Type Filter */}
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="input-field"
            >
              <option value="">Todos los tipos</option>
              <option value="solar">Solar</option>
              <option value="wind">Eólico</option>
              <option value="hybrid">Híbrido</option>
            </select>

            {/* Priority Filter */}
            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              className="input-field"
            >
              <option value="">Todas las prioridades</option>
              <option value="low">Baja</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
              <option value="critical">Crítica</option>
            </select>
          </div>
          
          <div className="mt-4">
            <button
              onClick={handleSearch}
              className="btn-primary mr-4"
            >
              <Search className="w-4 h-4 mr-2" />
              Buscar
            </button>
            <button
              onClick={() => {
                setSearchTerm('');
                setFilters({ status: '', type: '', priority: '' });
              }}
              className="btn-secondary"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <div className="card text-center py-12">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No hay proyectos</h2>
            <p className="text-gray-600 mb-6">
              Comienza creando tu primer proyecto de energía renovable
            </p>
            <Link to="/projects/new" className="btn-primary">
              <Plus className="w-5 h-5 mr-2" />
              Crear Primer Proyecto
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div key={project._id} className="card hover:shadow-xl transition-all duration-300">
                {/* Project Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {project.name}
                    </h3>
                    <div className="flex gap-2 mb-3">
                      <span className={`status-badge ${statusColors[project.status]}`}>
                        {project.status}
                      </span>
                      <span className={`status-badge ${priorityColors[project.priority]}`}>
                        {project.priority}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Project Details */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-gray-600">
                    <Activity className="w-4 h-4 mr-2" />
                    <span className="text-sm">Progreso: {project.progress || 0}%</span>
                  </div>
                  
                  {project.budget?.allocated && (
                    <div className="flex items-center text-gray-600">
                      <DollarSign className="w-4 h-4 mr-2" />
                      <span className="text-sm">
                        {formatCurrency(project.budget.allocated)}
                      </span>
                    </div>
                  )}

                  {project.dates?.estimatedEnd && (
                    <div className="flex items-center text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span className="text-sm">
                        Fin estimado: {formatDate(project.dates.estimatedEnd)}
                      </span>
                    </div>
                  )}

                  {project.team?.length > 0 && (
                    <div className="flex items-center text-gray-600">
                      <Users className="w-4 h-4 mr-2" />
                      <span className="text-sm">{project.team.length} miembros</span>
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-emerald-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${project.progress || 0}%` }}
                    ></div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <div className="flex gap-2">
                    <Link
                      to={`/projects/${project._id}`}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Ver detalles"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <Link
                      to={`/projects/${project._id}/edit`}
                      className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDeleteClick(project)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="text-xs text-gray-500 capitalize">
                    {project.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Delete Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center mb-4">
                <AlertCircle className="w-6 h-6 text-red-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Confirmar Eliminación
                </h3>
              </div>
              <p className="text-gray-600 mb-6">
                ¿Estás seguro de que quieres eliminar el proyecto "{projectToDelete?.name}"? 
                Esta acción no se puede deshacer.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  className="btn-danger"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
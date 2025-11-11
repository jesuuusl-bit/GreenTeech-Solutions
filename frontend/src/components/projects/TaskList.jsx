import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Clock,
  AlertCircle,
  Calendar,
  User,
  Activity,
  Home,
  ChevronRight,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Pause,
  Play,
  Flag
} from 'lucide-react';
import { taskService } from '../../services/taskService';
import { projectService } from '../../services/projectService';
import toast from 'react-hot-toast';

const statusColors = {
  'pending': 'bg-gray-100 text-gray-800',
  'in-progress': 'bg-blue-100 text-blue-800', 
  'review': 'bg-yellow-100 text-yellow-800',
  'completed': 'bg-green-100 text-green-800',
  'blocked': 'bg-red-100 text-red-800'
};

const priorityColors = {
  'low': 'bg-gray-100 text-gray-800',
  'medium': 'bg-blue-100 text-blue-800',
  'high': 'bg-orange-100 text-orange-800', 
  'critical': 'bg-red-100 text-red-800'
};

const statusLabels = {
  'pending': 'Pendiente',
  'in-progress': 'En Progreso',
  'review': 'En Revisión',
  'completed': 'Completada',
  'blocked': 'Bloqueada'
};

const priorityLabels = {
  'low': 'Baja',
  'medium': 'Media',
  'high': 'Alta',
  'critical': 'Crítica'
};

const StatusIcon = ({ status }) => {
  switch (status) {
    case 'pending': return <Clock className="w-4 h-4" />;
    case 'in-progress': return <Play className="w-4 h-4" />;
    case 'review': return <Pause className="w-4 h-4" />;
    case 'completed': return <CheckCircle className="w-4 h-4" />;
    case 'blocked': return <XCircle className="w-4 h-4" />;
    default: return <Clock className="w-4 h-4" />;
  }
};

export default function TaskList() {
  const navigate = useNavigate();
  const { projectId } = useParams();
  
  const [tasks, setTasks] = useState([]);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    assignedTo: ''
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);

  useEffect(() => {
    fetchProject();
    fetchTasks();
  }, [projectId, filters]);

  const fetchProject = async () => {
    try {
      const response = await projectService.getById(projectId);
      setProject(response.data);
    } catch (error) {
      console.error('Error fetching project:', error);
      toast.error('Error al cargar el proyecto');
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await taskService.getByProject(projectId, {
        ...filters,
        search: searchTerm
      });
      setTasks(response.data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Error al cargar las tareas');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchTasks();
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleDeleteClick = (task) => {
    setTaskToDelete(task);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await taskService.delete(taskToDelete._id);
      toast.success('Tarea eliminada exitosamente');
      fetchTasks();
      setShowDeleteModal(false);
      setTaskToDelete(null);
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Error al eliminar la tarea');
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await taskService.update(taskId, { status: newStatus });
      toast.success('Estado actualizado');
      fetchTasks();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Error al actualizar el estado');
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Sin fecha límite';
    return new Date(date).toLocaleDateString('es-ES');
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
  };

  const getDaysUntilDue = (dueDate) => {
    if (!dueDate) return null;
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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
          <button 
            onClick={() => navigate('/projects')}
            className="hover:text-emerald-600 transition-colors"
          >
            Proyectos
          </button>
          <ChevronRight className="w-4 h-4" />
          <button 
            onClick={() => navigate(`/projects/${projectId}`)}
            className="hover:text-emerald-600 transition-colors truncate max-w-xs"
          >
            {project?.name || 'Proyecto'}
          </button>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 font-medium">Tareas</span>
        </nav>

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(`/projects/${projectId}`)}
            className="p-2 hover:bg-white rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">
              Tareas del Proyecto
            </h1>
            <p className="text-gray-600 mt-2">
              {project?.name}
            </p>
          </div>
          <Link
            to={`/projects/${projectId}/tasks/new`}
            className="btn-primary"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nueva Tarea
          </Link>
        </div>

        {/* Filters and Search */}
        <div className="card mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar tareas..."
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
              <option value="pending">Pendiente</option>
              <option value="in-progress">En Progreso</option>
              <option value="review">En Revisión</option>
              <option value="completed">Completada</option>
              <option value="blocked">Bloqueada</option>
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

            {/* Search Button */}
            <button
              onClick={handleSearch}
              className="btn-primary"
            >
              <Search className="w-4 h-4 mr-2" />
              Buscar
            </button>
          </div>
          
          <div className="mt-4">
            <button
              onClick={() => {
                setSearchTerm('');
                setFilters({ status: '', priority: '', assignedTo: '' });
              }}
              className="btn-secondary"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>

        {/* Task Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="card text-center">
            <Clock className="w-8 h-8 mx-auto mb-2 text-gray-500" />
            <p className="text-2xl font-bold text-gray-900">
              {tasks.filter(t => t.status === 'pending').length}
            </p>
            <p className="text-sm text-gray-600">Pendientes</p>
          </div>
          <div className="card text-center">
            <Play className="w-8 h-8 mx-auto mb-2 text-blue-500" />
            <p className="text-2xl font-bold text-gray-900">
              {tasks.filter(t => t.status === 'in-progress').length}
            </p>
            <p className="text-sm text-gray-600">En Progreso</p>
          </div>
          <div className="card text-center">
            <Pause className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
            <p className="text-2xl font-bold text-gray-900">
              {tasks.filter(t => t.status === 'review').length}
            </p>
            <p className="text-sm text-gray-600">En Revisión</p>
          </div>
          <div className="card text-center">
            <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold text-gray-900">
              {tasks.filter(t => t.status === 'completed').length}
            </p>
            <p className="text-sm text-gray-600">Completadas</p>
          </div>
          <div className="card text-center">
            <XCircle className="w-8 h-8 mx-auto mb-2 text-red-500" />
            <p className="text-2xl font-bold text-gray-900">
              {tasks.filter(t => t.status === 'blocked').length}
            </p>
            <p className="text-sm text-gray-600">Bloqueadas</p>
          </div>
        </div>

        {/* Tasks List */}
        {tasks.length === 0 ? (
          <div className="card text-center py-12">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No hay tareas</h2>
            <p className="text-gray-600 mb-6">
              Comienza creando la primera tarea para este proyecto
            </p>
            <Link to={`/projects/${projectId}/tasks/new`} className="btn-primary">
              <Plus className="w-5 h-5 mr-2" />
              Crear Primera Tarea
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => {
              const daysUntilDue = getDaysUntilDue(task.dueDate);
              const overdue = isOverdue(task.dueDate);
              
              return (
                <div key={task._id} className="card hover:shadow-lg transition-all duration-300">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        <div className="flex items-center gap-2 mt-1">
                          <StatusIcon status={task.status} />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                {task.title}
                              </h3>
                              {task.description && (
                                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                                  {task.description}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                            {task.assignedTo?.name && (
                              <div className="flex items-center gap-1">
                                <User className="w-4 h-4" />
                                <span>{task.assignedTo.name}</span>
                              </div>
                            )}
                            
                            {task.dueDate && (
                              <div className={`flex items-center gap-1 ${overdue ? 'text-red-600' : ''}`}>
                                <Calendar className="w-4 h-4" />
                                <span>{formatDate(task.dueDate)}</span>
                                {daysUntilDue !== null && (
                                  <span className={`ml-1 ${overdue ? 'text-red-600' : daysUntilDue <= 3 ? 'text-orange-600' : 'text-gray-500'}`}>
                                    {overdue ? `(${Math.abs(daysUntilDue)} días atrasada)` :
                                     daysUntilDue === 0 ? '(Vence hoy)' :
                                     `(${daysUntilDue} días restantes)`}
                                  </span>
                                )}
                              </div>
                            )}

                            {task.estimatedHours && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                <span>{task.estimatedHours}h estimadas</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`status-badge ${statusColors[task.status]}`}>
                                {statusLabels[task.status]}
                              </span>
                              <span className={`status-badge ${priorityColors[task.priority]}`}>
                                <Flag className="w-3 h-3 mr-1" />
                                {priorityLabels[task.priority]}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Quick Status Change */}
                              <select
                                value={task.status}
                                onChange={(e) => handleStatusChange(task._id, e.target.value)}
                                className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              >
                                <option value="pending">Pendiente</option>
                                <option value="in-progress">En Progreso</option>
                                <option value="review">En Revisión</option>
                                <option value="completed">Completada</option>
                                <option value="blocked">Bloqueada</option>
                              </select>

                              <Link
                                to={`/projects/${projectId}/tasks/${task._id}/edit`}
                                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                title="Editar"
                              >
                                <Edit className="w-4 h-4" />
                              </Link>
                              
                              <button
                                onClick={() => handleDeleteClick(task)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Eliminar"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="text-gray-600">Progreso</span>
                              <span className="text-gray-900 font-medium">{task.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-emerald-600 h-2 rounded-full transition-all duration-300" 
                                style={{ width: `${task.progress}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
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
                ¿Estás seguro de que quieres eliminar la tarea "{taskToDelete?.title}"? 
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
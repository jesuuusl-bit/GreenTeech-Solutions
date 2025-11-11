import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Calendar,
  User,
  Clock,
  Flag,
  Activity,
  MessageSquare,
  Tag,
  AlertCircle,
  Home,
  ChevronRight,
  Send,
  CheckCircle,
  XCircle,
  Pause,
  Play
} from 'lucide-react';
import { taskService } from '../../services/taskService';
import { projectService } from '../../services/projectService';
import toast from 'react-hot-toast';

const statusColors = {
  'pending': 'bg-gray-100 text-gray-800 border-gray-200',
  'in-progress': 'bg-blue-100 text-blue-800 border-blue-200', 
  'review': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'completed': 'bg-green-100 text-green-800 border-green-200',
  'blocked': 'bg-red-100 text-red-800 border-red-200'
};

const priorityColors = {
  'low': 'bg-gray-100 text-gray-800 border-gray-200',
  'medium': 'bg-blue-100 text-blue-800 border-blue-200',
  'high': 'bg-orange-100 text-orange-800 border-orange-200', 
  'critical': 'bg-red-100 text-red-800 border-red-200'
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
    case 'pending': return <Clock className="w-5 h-5" />;
    case 'in-progress': return <Play className="w-5 h-5" />;
    case 'review': return <Pause className="w-5 h-5" />;
    case 'completed': return <CheckCircle className="w-5 h-5" />;
    case 'blocked': return <XCircle className="w-5 h-5" />;
    default: return <Clock className="w-5 h-5" />;
  }
};

export default function TaskDetail() {
  const navigate = useNavigate();
  const { projectId, taskId } = useParams();
  
  const [task, setTask] = useState(null);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [addingComment, setAddingComment] = useState(false);

  useEffect(() => {
    fetchProject();
    fetchTask();
  }, [projectId, taskId]);

  const fetchProject = async () => {
    try {
      const response = await projectService.getById(projectId);
      setProject(response.data);
    } catch (error) {
      console.error('Error fetching project:', error);
      toast.error('Error al cargar el proyecto');
    }
  };

  const fetchTask = async () => {
    try {
      setLoading(true);
      const response = await taskService.getByProject(projectId);
      const foundTask = response.data.find(t => t._id === taskId);
      
      if (foundTask) {
        setTask(foundTask);
      } else {
        toast.error('Tarea no encontrada');
        navigate(`/projects/${projectId}/tasks`);
      }
    } catch (error) {
      console.error('Error fetching task:', error);
      toast.error('Error al cargar la tarea');
      navigate(`/projects/${projectId}/tasks`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await taskService.delete(taskId);
      toast.success('Tarea eliminada exitosamente');
      navigate(`/projects/${projectId}/tasks`);
    } catch (error) {
      console.error('Error deleting task:', error);
      
      let errorMessage = 'Error al eliminar la tarea';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await taskService.update(taskId, { status: newStatus });
      toast.success('Estado actualizado');
      fetchTask();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Error al actualizar el estado');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) {
      toast.error('El comentario no puede estar vacío');
      return;
    }

    try {
      setAddingComment(true);
      await taskService.addComment(taskId, {
        userName: 'Usuario Actual', // TODO: Get from auth context
        content: newComment.trim()
      });
      
      toast.success('Comentario agregado');
      setNewComment('');
      fetchTask();
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Error al agregar comentario');
    } finally {
      setAddingComment(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'No definida';
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleString('es-ES');
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
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="card text-center py-12">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Tarea no encontrada</h2>
            <p className="text-gray-600 mb-6">
              La tarea que buscas no existe o ha sido eliminada.
            </p>
            <Link to={`/projects/${projectId}/tasks`} className="btn-primary">
              Volver a Tareas
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const daysUntilDue = getDaysUntilDue(task.dueDate);
  const overdue = isOverdue(task.dueDate);

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
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
          <button 
            onClick={() => navigate(`/projects/${projectId}/tasks`)}
            className="hover:text-emerald-600 transition-colors"
          >
            Tareas
          </button>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 font-medium truncate max-w-xs">
            {task.title}
          </span>
        </nav>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/projects/${projectId}/tasks`)}
              className="p-2 hover:bg-white rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{task.title}</h1>
              <div className="flex items-center gap-4 mt-2">
                <span className={`status-badge border flex items-center gap-1 ${statusColors[task.status]}`}>
                  <StatusIcon status={task.status} />
                  {statusLabels[task.status]}
                </span>
                <span className={`status-badge border ${priorityColors[task.priority]}`}>
                  <Flag className="w-3 h-3 mr-1" />
                  Prioridad: {priorityLabels[task.priority]}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Link
              to={`/projects/${projectId}/tasks/${taskId}/edit`}
              className="btn-secondary"
            >
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Link>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="btn-danger"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Descripción</h2>
              {task.description ? (
                <p className="text-gray-700 leading-relaxed">{task.description}</p>
              ) : (
                <p className="text-gray-500 italic">No hay descripción disponible</p>
              )}
            </div>

            {/* Progress */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                Progreso de la Tarea
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Completado</span>
                  <span className="text-2xl font-bold text-emerald-600">{task.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-3 rounded-full transition-all duration-500" 
                    style={{ width: `${task.progress}%` }}
                  ></div>
                </div>
                {task.progress < 100 && (
                  <p className="text-sm text-gray-600">
                    Faltan {100 - task.progress} puntos porcentuales para completar la tarea.
                  </p>
                )}
              </div>
            </div>

            {/* Tags */}
            {task.tags && task.tags.length > 0 && (
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Tag className="w-5 h-5 mr-2" />
                  Etiquetas
                </h2>
                <div className="flex flex-wrap gap-2">
                  {task.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-emerald-100 text-emerald-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Comments */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <MessageSquare className="w-5 h-5 mr-2" />
                Comentarios ({task.comments?.length || 0})
              </h2>
              
              {/* Add Comment Form */}
              <form onSubmit={handleAddComment} className="mb-6">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Agregar un comentario..."
                    className="input-field flex-1"
                    disabled={addingComment}
                  />
                  <button
                    type="submit"
                    disabled={addingComment || !newComment.trim()}
                    className="btn-primary"
                  >
                    {addingComment ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </form>

              {/* Comments List */}
              <div className="space-y-4">
                {task.comments && task.comments.length > 0 ? (
                  task.comments.map((comment, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium text-gray-900">{comment.userName}</span>
                        <span className="text-sm text-gray-500">{formatDateTime(comment.createdAt)}</span>
                      </div>
                      <p className="text-gray-700">{comment.content}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No hay comentarios aún</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Stats & Quick Info */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Cambiar Estado</h3>
              <div className="space-y-2">
                {['pending', 'in-progress', 'review', 'completed', 'blocked'].map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                      task.status === status 
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <StatusIcon status={status} />
                    {statusLabels[status]}
                  </button>
                ))}
              </div>
            </div>

            {/* Task Info */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Información de la Tarea</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Estado:</span>
                  <span className={`status-badge ${statusColors[task.status]}`}>
                    {statusLabels[task.status]}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Prioridad:</span>
                  <span className={`status-badge ${priorityColors[task.priority]}`}>
                    {priorityLabels[task.priority]}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Progreso:</span>
                  <span className="font-medium">{task.progress}%</span>
                </div>

                {task.estimatedHours && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Horas estimadas:</span>
                    <span className="font-medium">{task.estimatedHours}h</span>
                  </div>
                )}

                {task.actualHours > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Horas reales:</span>
                    <span className="font-medium">{task.actualHours}h</span>
                  </div>
                )}
              </div>
            </div>

            {/* Assignment */}
            {task.assignedTo && (
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Asignado a
                </h3>
                <div className="space-y-2">
                  <p className="font-medium text-gray-900">{task.assignedTo.name}</p>
                  {task.assignedTo.email && (
                    <p className="text-sm text-gray-600">{task.assignedTo.email}</p>
                  )}
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Cronograma
              </h3>
              <div className="space-y-4">
                {task.dueDate && (
                  <div>
                    <span className="text-gray-600 text-sm">Fecha límite</span>
                    <p className={`font-medium ${overdue ? 'text-red-600' : ''}`}>
                      {formatDate(task.dueDate)}
                    </p>
                    {daysUntilDue !== null && (
                      <p className={`text-sm mt-1 ${overdue ? 'text-red-600' : daysUntilDue <= 3 ? 'text-orange-600' : 'text-gray-500'}`}>
                        {overdue ? `Atrasada por ${Math.abs(daysUntilDue)} días` :
                         daysUntilDue === 0 ? 'Vence hoy' :
                         `Faltan ${daysUntilDue} días`}
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <span className="text-gray-600 text-sm">Creada</span>
                  <p className="font-medium">{formatDate(task.createdAt)}</p>
                </div>

                {task.updatedAt && (
                  <div>
                    <span className="text-gray-600 text-sm">Última actualización</span>
                    <p className="font-medium">{formatDate(task.updatedAt)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

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
                ¿Estás seguro de que quieres eliminar la tarea "{task.title}"? 
                Esta acción no se puede deshacer y eliminará todos los comentarios asociados.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  className="btn-danger"
                >
                  Eliminar Tarea
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
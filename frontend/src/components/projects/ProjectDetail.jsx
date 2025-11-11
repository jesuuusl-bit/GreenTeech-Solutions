import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Calendar,
  DollarSign,
  MapPin,
  Users,
  Activity,
  AlertCircle,
  Target,
  TrendingUp,
  Clock,
  CheckCircle
} from 'lucide-react';
import { projectService } from '../../services/projectService';
import toast from 'react-hot-toast';

const statusColors = {
  'planning': 'bg-blue-100 text-blue-800 border-blue-200',
  'in-progress': 'bg-yellow-100 text-yellow-800 border-yellow-200', 
  'on-hold': 'bg-orange-100 text-orange-800 border-orange-200',
  'completed': 'bg-green-100 text-green-800 border-green-200',
  'cancelled': 'bg-red-100 text-red-800 border-red-200'
};

const priorityColors = {
  'low': 'bg-gray-100 text-gray-800 border-gray-200',
  'medium': 'bg-blue-100 text-blue-800 border-blue-200',
  'high': 'bg-orange-100 text-orange-800 border-orange-200', 
  'critical': 'bg-red-100 text-red-800 border-red-200'
};

const statusLabels = {
  'planning': 'Planificación',
  'in-progress': 'En Progreso',
  'on-hold': 'En Espera',
  'completed': 'Completado',
  'cancelled': 'Cancelado'
};

const priorityLabels = {
  'low': 'Baja',
  'medium': 'Media',
  'high': 'Alta',
  'critical': 'Crítica'
};

const typeLabels = {
  'solar': 'Solar',
  'wind': 'Eólico',
  'hybrid': 'Híbrido'
};

export default function ProjectDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetchProject();
  }, [id]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const response = await projectService.getById(id);
      setProject(response.data);
    } catch (error) {
      console.error('Error fetching project:', error);
      toast.error('Error al cargar el proyecto');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await projectService.delete(id);
      toast.success('Proyecto eliminado exitosamente');
      navigate('/projects');
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Error al eliminar el proyecto');
    }
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatDate = (date) => {
    if (!date) return 'No definida';
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateDaysLeft = (endDate) => {
    if (!endDate) return null;
    const now = new Date();
    const end = new Date(endDate);
    const diffTime = end - now;
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

  if (!project) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="card text-center py-12">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Proyecto no encontrado</h2>
            <p className="text-gray-600 mb-6">
              El proyecto que buscas no existe o ha sido eliminado.
            </p>
            <Link to="/projects" className="btn-primary">
              Volver a Proyectos
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const daysLeft = calculateDaysLeft(project.dates?.estimatedEnd);

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/projects')}
              className="p-2 hover:bg-white rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
              <div className="flex items-center gap-4 mt-2">
                <span className={`status-badge border ${statusColors[project.status]}`}>
                  {statusLabels[project.status]}
                </span>
                <span className={`status-badge border ${priorityColors[project.priority]}`}>
                  Prioridad: {priorityLabels[project.priority]}
                </span>
                <span className="status-badge bg-purple-100 text-purple-800 border border-purple-200">
                  {typeLabels[project.type]}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Link
              to={`/projects/${id}/edit`}
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
              <p className="text-gray-700 leading-relaxed">{project.description}</p>
            </div>

            {/* Progress */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                Progreso del Proyecto
              </h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Completado</span>
                  <span className="text-2xl font-bold text-emerald-600">{project.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-3 rounded-full transition-all duration-500" 
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
                {project.progress < 100 && (
                  <p className="text-sm text-gray-600">
                    Faltan {100 - project.progress} puntos porcentuales para completar el proyecto.
                  </p>
                )}
              </div>
            </div>

            {/* Location */}
            {project.location && (
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  Ubicación
                </h2>
                <div className="space-y-3">
                  {project.location.country && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">País:</span>
                      <span className="font-medium">{project.location.country}</span>
                    </div>
                  )}
                  {project.location.region && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Región:</span>
                      <span className="font-medium">{project.location.region}</span>
                    </div>
                  )}
                  {project.location.coordinates?.lat && project.location.coordinates?.lng && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Coordenadas:</span>
                      <span className="font-medium">
                        {project.location.coordinates.lat}, {project.location.coordinates.lng}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Team & Manager */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Equipo del Proyecto
              </h2>
              
              {project.manager?.name && (
                <div className="mb-6 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                  <h3 className="font-semibold text-emerald-900 mb-2">Manager del Proyecto</h3>
                  <div className="space-y-1">
                    <p className="text-emerald-800">{project.manager.name}</p>
                    {project.manager.email && (
                      <p className="text-emerald-700 text-sm">{project.manager.email}</p>
                    )}
                  </div>
                </div>
              )}

              {project.team && project.team.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900">Miembros del Equipo</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {project.team.map((member, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <p className="font-medium text-gray-900">{member.name}</p>
                        <p className="text-sm text-gray-600">{member.role}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No hay miembros del equipo asignados</p>
              )}
            </div>

            {/* Milestones */}
            {project.milestones && project.milestones.length > 0 && (
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Target className="w-5 h-5 mr-2" />
                  Hitos del Proyecto
                </h2>
                <div className="space-y-4">
                  {project.milestones.map((milestone, index) => (
                    <div key={index} className={`p-4 rounded-lg border ${milestone.completed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          {milestone.completed ? (
                            <CheckCircle className="w-5 h-5 text-green-600 mt-1" />
                          ) : (
                            <Clock className="w-5 h-5 text-gray-400 mt-1" />
                          )}
                          <div>
                            <h4 className={`font-medium ${milestone.completed ? 'text-green-900' : 'text-gray-900'}`}>
                              {milestone.name}
                            </h4>
                            {milestone.description && (
                              <p className={`text-sm mt-1 ${milestone.completed ? 'text-green-700' : 'text-gray-600'}`}>
                                {milestone.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-sm text-right">
                          {milestone.completed && milestone.completedDate && (
                            <p className="text-green-700">
                              Completado: {formatDate(milestone.completedDate)}
                            </p>
                          )}
                          {milestone.dueDate && (
                            <p className={milestone.completed ? 'text-green-600' : 'text-gray-600'}>
                              Fecha límite: {formatDate(milestone.dueDate)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Stats & Quick Info */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Rápida</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Estado:</span>
                  <span className={`status-badge ${statusColors[project.status]}`}>
                    {statusLabels[project.status]}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Tipo:</span>
                  <span className="font-medium">{typeLabels[project.type]}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Progreso:</span>
                  <span className="font-medium">{project.progress}%</span>
                </div>

                {project.capacity?.value && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Capacidad:</span>
                    <span className="font-medium">
                      {project.capacity.value} {project.capacity.unit}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Budget */}
            {project.budget?.allocated && (
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Presupuesto
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Asignado:</span>
                      <span className="font-medium text-emerald-600">
                        {formatCurrency(project.budget.allocated, project.budget.currency)}
                      </span>
                    </div>
                    {project.budget.spent > 0 && (
                      <>
                        <div className="flex justify-between mb-2">
                          <span className="text-gray-600">Gastado:</span>
                          <span className="font-medium text-red-600">
                            {formatCurrency(project.budget.spent, project.budget.currency)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Restante:</span>
                          <span className="font-medium">
                            {formatCurrency(project.budget.allocated - project.budget.spent, project.budget.currency)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                          <div 
                            className="bg-red-500 h-2 rounded-full" 
                            style={{ width: `${Math.min((project.budget.spent / project.budget.allocated) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </>
                    )}
                  </div>
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
                {project.dates?.start && (
                  <div>
                    <span className="text-gray-600 text-sm">Fecha de inicio</span>
                    <p className="font-medium">{formatDate(project.dates.start)}</p>
                  </div>
                )}
                
                {project.dates?.estimatedEnd && (
                  <div>
                    <span className="text-gray-600 text-sm">Finalización estimada</span>
                    <p className="font-medium">{formatDate(project.dates.estimatedEnd)}</p>
                    {daysLeft !== null && (
                      <p className={`text-sm mt-1 ${daysLeft > 0 ? 'text-emerald-600' : daysLeft < 0 ? 'text-red-600' : 'text-orange-600'}`}>
                        {daysLeft > 0 ? `Faltan ${daysLeft} días` : 
                         daysLeft < 0 ? `Retrasado por ${Math.abs(daysLeft)} días` :
                         'Finaliza hoy'}
                      </p>
                    )}
                  </div>
                )}

                {project.dates?.actualEnd && (
                  <div>
                    <span className="text-gray-600 text-sm">Fecha real de finalización</span>
                    <p className="font-medium text-green-600">{formatDate(project.dates.actualEnd)}</p>
                  </div>
                )}

                <div>
                  <span className="text-gray-600 text-sm">Creado</span>
                  <p className="font-medium">{formatDate(project.createdAt)}</p>
                </div>

                {project.updatedAt && (
                  <div>
                    <span className="text-gray-600 text-sm">Última actualización</span>
                    <p className="font-medium">{formatDate(project.updatedAt)}</p>
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
                ¿Estás seguro de que quieres eliminar el proyecto "{project.name}"? 
                Esta acción no se puede deshacer y eliminará todos los datos asociados.
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
                  Eliminar Proyecto
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Save, 
  X, 
  Calendar,
  User,
  Clock,
  Flag,
  ArrowLeft,
  Home,
  ChevronRight,
  Activity,
  MessageSquare,
  Tag
} from 'lucide-react';
import { taskService } from '../../services/taskService';
import { projectService } from '../../services/projectService';
import toast from 'react-hot-toast';

export default function TaskForm() {
  const navigate = useNavigate();
  const { projectId, taskId } = useParams();
  const isEdit = Boolean(taskId);
  
  const [loading, setLoading] = useState(false);
  const [project, setProject] = useState(null);
  const [formData, setFormData] = useState({
    projectId: projectId,
    title: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    assignedTo: {
      name: '',
      email: ''
    },
    dueDate: '',
    estimatedHours: '',
    progress: 0,
    tags: []
  });
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    fetchProject();
    if (isEdit) {
      fetchTask();
    }
  }, [projectId, taskId, isEdit]);

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
      const task = response.data.find(t => t._id === taskId);
      
      if (task) {
        const formatDate = (date) => {
          if (!date) return '';
          return new Date(date).toISOString().split('T')[0];
        };

        setFormData({
          projectId: task.projectId,
          title: task.title || '',
          description: task.description || '',
          status: task.status || 'pending',
          priority: task.priority || 'medium',
          assignedTo: {
            name: task.assignedTo?.name || '',
            email: task.assignedTo?.email || ''
          },
          dueDate: formatDate(task.dueDate),
          estimatedHours: task.estimatedHours || '',
          progress: task.progress || 0,
          tags: task.tags || []
        });
      } else {
        toast.error('Tarea no encontrada');
        navigate(`/projects/${projectId}/tasks`);
      }
    } catch (error) {
      console.error('Error fetching task:', error);
      toast.error('Error al cargar la tarea');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title.trim()) {
      toast.error('El título de la tarea es requerido');
      return;
    }

    if (formData.estimatedHours && formData.estimatedHours <= 0) {
      toast.error('Las horas estimadas deben ser un número positivo');
      return;
    }

    if (formData.progress < 0 || formData.progress > 100) {
      toast.error('El progreso debe estar entre 0 y 100');
      return;
    }

    if (formData.assignedTo.email && !formData.assignedTo.email.includes('@')) {
      toast.error('Por favor ingresa un email válido');
      return;
    }

    try {
      setLoading(true);
      
      // Prepare data for submission
      const submitData = {
        ...formData,
        estimatedHours: formData.estimatedHours ? Number(formData.estimatedHours) : undefined,
        progress: Number(formData.progress)
      };

      // Remove empty fields
      if (!submitData.estimatedHours) delete submitData.estimatedHours;
      if (!submitData.dueDate) delete submitData.dueDate;
      if (!submitData.assignedTo.name && !submitData.assignedTo.email) {
        delete submitData.assignedTo;
      }

      if (isEdit) {
        await taskService.update(taskId, submitData);
        toast.success('Tarea actualizada exitosamente');
      } else {
        await taskService.create(submitData);
        toast.success('Tarea creada exitosamente');
      }
      
      navigate(`/projects/${projectId}/tasks`);
    } catch (error) {
      console.error('Error saving task:', error);
      
      let errorMessage = isEdit ? 'Error al actualizar la tarea' : 'Error al crear la tarea';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading && isEdit) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
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
          <span className="text-gray-900 font-medium">
            {isEdit ? 'Editar' : 'Nueva Tarea'}
          </span>
        </nav>

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(`/projects/${projectId}/tasks`)}
            className="p-2 hover:bg-white rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEdit ? 'Editar Tarea' : 'Crear Nueva Tarea'}
            </h1>
            <p className="text-gray-600 mt-2">
              Proyecto: {project?.name}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Información Básica</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título de la Tarea *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Ej: Instalar paneles solares en sector A"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="input-field"
                  placeholder="Describe los detalles de la tarea, requisitos específicos, etc..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="input-field"
                  >
                    <option value="pending">Pendiente</option>
                    <option value="in-progress">En Progreso</option>
                    <option value="review">En Revisión</option>
                    <option value="completed">Completada</option>
                    <option value="blocked">Bloqueada</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prioridad
                  </label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="input-field"
                  >
                    <option value="low">Baja</option>
                    <option value="medium">Media</option>
                    <option value="high">Alta</option>
                    <option value="critical">Crítica</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Progreso (%)
                  </label>
                  <input
                    type="number"
                    name="progress"
                    value={formData.progress}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                    className="input-field"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Assignment & Timeline */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Asignación
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Responsable
                  </label>
                  <input
                    type="text"
                    name="assignedTo.name"
                    value={formData.assignedTo.name}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Ej: Juan Pérez"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email del Responsable
                  </label>
                  <input
                    type="email"
                    name="assignedTo.email"
                    value={formData.assignedTo.email}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="Ej: juan.perez@empresa.com"
                  />
                </div>
              </div>
            </div>

            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Cronograma
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha Límite
                  </label>
                  <input
                    type="date"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleInputChange}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Horas Estimadas
                  </label>
                  <input
                    type="number"
                    name="estimatedHours"
                    value={formData.estimatedHours}
                    onChange={handleInputChange}
                    step="0.5"
                    min="0"
                    className="input-field"
                    placeholder="Ej: 8"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <Tag className="w-5 h-5 mr-2" />
              Etiquetas
            </h2>
            
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  className="input-field flex-1"
                  placeholder="Añadir etiqueta..."
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="btn-secondary"
                >
                  Añadir
                </button>
              </div>

              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-emerald-100 text-emerald-800"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-2 text-emerald-600 hover:text-emerald-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Progreso de la Tarea
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Progreso actual</span>
                <span className="text-2xl font-bold text-emerald-600">{formData.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-3 rounded-full transition-all duration-300" 
                  style={{ width: `${formData.progress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600">
                Ajusta el progreso según el avance real de la tarea
              </p>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-4 pt-6">
            <button
              type="button"
              onClick={() => navigate(`/projects/${projectId}/tasks`)}
              className="btn-secondary"
              disabled={loading}
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {isEdit ? 'Actualizar Tarea' : 'Crear Tarea'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
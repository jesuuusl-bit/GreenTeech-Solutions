import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Save, 
  X, 
  Calendar,
  DollarSign,
  MapPin,
  Users,
  AlertCircle,
  ArrowLeft,
  Home,
  ChevronRight
} from 'lucide-react';
import { projectService } from '../../services/projectService';
import toast from 'react-hot-toast';

export default function ProjectForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'solar',
    status: 'planning',
    priority: 'medium',
    location: {
      country: '',
      region: '',
      coordinates: {
        lat: '',
        lng: ''
      }
    },
    capacity: {
      value: '',
      unit: 'MW'
    },
    budget: {
      allocated: '',
      currency: 'USD'
    },
    dates: {
      start: '',
      estimatedEnd: ''
    },
    manager: {
      name: '',
      email: ''
    },
    progress: 0
  });

  useEffect(() => {
    if (isEdit) {
      fetchProject();
    }
  }, [id, isEdit]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const response = await projectService.getById(id);
      const project = response.data;
      
      // Format dates for input fields
      const formatDate = (date) => {
        if (!date) return '';
        return new Date(date).toISOString().split('T')[0];
      };

      setFormData({
        name: project.name || '',
        description: project.description || '',
        type: project.type || 'solar',
        status: project.status || 'planning',
        priority: project.priority || 'medium',
        location: {
          country: project.location?.country || '',
          region: project.location?.region || '',
          coordinates: {
            lat: project.location?.coordinates?.lat || '',
            lng: project.location?.coordinates?.lng || ''
          }
        },
        capacity: {
          value: project.capacity?.value || '',
          unit: project.capacity?.unit || 'MW'
        },
        budget: {
          allocated: project.budget?.allocated || '',
          currency: project.budget?.currency || 'USD'
        },
        dates: {
          start: formatDate(project.dates?.start),
          estimatedEnd: formatDate(project.dates?.estimatedEnd)
        },
        manager: {
          name: project.manager?.name || '',
          email: project.manager?.email || ''
        },
        progress: project.progress || 0
      });
    } catch (error) {
      console.error('Error fetching project:', error);
      toast.error('Error al cargar el proyecto');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child, grandchild] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: grandchild ? {
            ...prev[parent][child],
            [grandchild]: value
          } : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name.trim()) {
      toast.error('El nombre del proyecto es requerido');
      return;
    }
    
    if (!formData.description.trim()) {
      toast.error('La descripción es requerida');
      return;
    }

    try {
      setLoading(true);
      
      // Prepare data for submission
      const submitData = {
        ...formData,
        capacity: {
          ...formData.capacity,
          value: formData.capacity.value ? Number(formData.capacity.value) : undefined
        },
        budget: {
          ...formData.budget,
          allocated: formData.budget.allocated ? Number(formData.budget.allocated) : undefined
        },
        location: {
          ...formData.location,
          coordinates: {
            lat: formData.location.coordinates.lat ? Number(formData.location.coordinates.lat) : undefined,
            lng: formData.location.coordinates.lng ? Number(formData.location.coordinates.lng) : undefined
          }
        },
        progress: Number(formData.progress)
      };

      // Remove empty fields and validate
      if (!submitData.capacity.value) {
        delete submitData.capacity;
      } else if (submitData.capacity.value <= 0) {
        toast.error('La capacidad debe ser un número positivo');
        return;
      }
      
      if (!submitData.budget.allocated) {
        delete submitData.budget;
      } else if (submitData.budget.allocated <= 0) {
        toast.error('El presupuesto debe ser un número positivo');
        return;
      }
      
      if (!submitData.location.coordinates.lat || !submitData.location.coordinates.lng) {
        delete submitData.location.coordinates;
      } else {
        // Validate coordinates
        const lat = Number(submitData.location.coordinates.lat);
        const lng = Number(submitData.location.coordinates.lng);
        if (lat < -90 || lat > 90) {
          toast.error('La latitud debe estar entre -90 y 90');
          return;
        }
        if (lng < -180 || lng > 180) {
          toast.error('La longitud debe estar entre -180 y 180');
          return;
        }
      }
      
      if (!submitData.location.country && !submitData.location.region && !submitData.location.coordinates) {
        delete submitData.location;
      }
      
      // Validate dates
      if (submitData.dates.start && submitData.dates.estimatedEnd) {
        const startDate = new Date(submitData.dates.start);
        const endDate = new Date(submitData.dates.estimatedEnd);
        if (startDate >= endDate) {
          toast.error('La fecha de finalización debe ser posterior a la fecha de inicio');
          return;
        }
      }
      
      if (!submitData.dates.start && !submitData.dates.estimatedEnd) {
        delete submitData.dates;
      }
      
      // Validate manager email
      if (submitData.manager.email && !submitData.manager.email.includes('@')) {
        toast.error('Por favor ingresa un email válido para el manager');
        return;
      }
      
      if (!submitData.manager.name && !submitData.manager.email) {
        delete submitData.manager;
      }

      if (isEdit) {
        await projectService.update(id, submitData);
        toast.success('Proyecto actualizado exitosamente');
      } else {
        await projectService.create(submitData);
        toast.success('Proyecto creado exitosamente');
      }
      
      navigate('/projects');
    } catch (error) {
      console.error('Error saving project:', error);
      
      // Better error handling
      let errorMessage = isEdit ? 'Error al actualizar el proyecto' : 'Error al crear el proyecto';
      
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
          <span className="text-gray-900 font-medium">
            {isEdit ? 'Editar' : 'Nuevo Proyecto'}
          </span>
        </nav>

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/projects')}
            className="p-2 hover:bg-white rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEdit ? 'Editar Proyecto' : 'Crear Nuevo Proyecto'}
            </h1>
            <p className="text-gray-600 mt-2">
              {isEdit ? 'Modifica los detalles del proyecto' : 'Completa la información del nuevo proyecto'}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Información Básica</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Proyecto *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Ej: Parque Solar Valle Verde"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="input-field"
                  placeholder="Describe el proyecto, sus objetivos y características principales..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Proyecto
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="input-field"
                >
                  <option value="solar">Solar</option>
                  <option value="wind">Eólico</option>
                  <option value="hybrid">Híbrido</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado del Proyecto
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="input-field"
                >
                  <option value="planning">Planificación</option>
                  <option value="in-progress">En Progreso</option>
                  <option value="on-hold">En Espera</option>
                  <option value="completed">Completado</option>
                  <option value="cancelled">Cancelado</option>
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

          {/* Location */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              Ubicación
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  País
                </label>
                <input
                  type="text"
                  name="location.country"
                  value={formData.location.country}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Ej: España"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Región/Estado
                </label>
                <input
                  type="text"
                  name="location.region"
                  value={formData.location.region}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Ej: Andalucía"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Latitud
                </label>
                <input
                  type="number"
                  name="location.coordinates.lat"
                  value={formData.location.coordinates.lat}
                  onChange={handleInputChange}
                  step="any"
                  className="input-field"
                  placeholder="Ej: 36.7213"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Longitud
                </label>
                <input
                  type="number"
                  name="location.coordinates.lng"
                  value={formData.location.coordinates.lng}
                  onChange={handleInputChange}
                  step="any"
                  className="input-field"
                  placeholder="Ej: -4.4214"
                />
              </div>
            </div>
          </div>

          {/* Capacity & Budget */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Capacidad</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Capacidad
                  </label>
                  <input
                    type="number"
                    name="capacity.value"
                    value={formData.capacity.value}
                    onChange={handleInputChange}
                    step="any"
                    className="input-field"
                    placeholder="Ej: 100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unidad
                  </label>
                  <select
                    name="capacity.unit"
                    value={formData.capacity.unit}
                    onChange={handleInputChange}
                    className="input-field"
                  >
                    <option value="kW">kW</option>
                    <option value="MW">MW</option>
                    <option value="GW">GW</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                Presupuesto
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Presupuesto Asignado
                  </label>
                  <input
                    type="number"
                    name="budget.allocated"
                    value={formData.budget.allocated}
                    onChange={handleInputChange}
                    step="any"
                    className="input-field"
                    placeholder="Ej: 1000000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Moneda
                  </label>
                  <select
                    name="budget.currency"
                    value={formData.budget.currency}
                    onChange={handleInputChange}
                    className="input-field"
                  >
                    <option value="USD">USD - Dólar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - Libra</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Fechas
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Inicio
                </label>
                <input
                  type="date"
                  name="dates.start"
                  value={formData.dates.start}
                  onChange={handleInputChange}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha Estimada de Finalización
                </label>
                <input
                  type="date"
                  name="dates.estimatedEnd"
                  value={formData.dates.estimatedEnd}
                  onChange={handleInputChange}
                  className="input-field"
                />
              </div>
            </div>
          </div>

          {/* Manager */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Manager del Proyecto
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Manager
                </label>
                <input
                  type="text"
                  name="manager.name"
                  value={formData.manager.name}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Ej: Juan Pérez"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email del Manager
                </label>
                <input
                  type="email"
                  name="manager.email"
                  value={formData.manager.email}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Ej: juan.perez@empresa.com"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-4 pt-6">
            <button
              type="button"
              onClick={() => navigate('/projects')}
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
              {isEdit ? 'Actualizar Proyecto' : 'Crear Proyecto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
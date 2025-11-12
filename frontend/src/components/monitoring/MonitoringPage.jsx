import { useState, useEffect } from 'react';
import { Activity, AlertCircle, Zap, Clock, Loader2, Home, ChevronRight, Filter, CalendarDays, Factory, PlusCircle } from 'lucide-react';
import { monitoringService } from '../../services/monitoringService';
import toast from 'react-hot-toast';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { format, subDays } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export default function MonitoringPage() {
  const navigate = useNavigate();
  const [currentProduction, setCurrentProduction] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [historicalData, setHistoricalData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddDataForm, setShowAddDataForm] = useState(false); // State for form visibility

  // State for historical data filters
  const [selectedPlantId, setSelectedPlantId] = useState('');
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 1), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  // State for editing production data
  const [editingPlantId, setEditingPlantId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    plantId: '',
    plantName: '',
    plantType: 'solar',
    production: {
      current: '',
      capacity: ''
    },
    efficiency: '',
    timestamp: ''
  });

  // State for new production data form
  const [newProductionData, setNewProductionData] = useState({
    plantId: '',
    plantName: '',
    plantType: 'solar', // Added plantType
    production: {
      current: '',
      capacity: ''
    },
    efficiency: '',
    timestamp: format(new Date(), "yyyy-MM-dd'T'HH:mm")
  });

  const fetchMonitoringData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch current production data
      const currentProdResponse = await monitoringService.getCurrentProduction();
      setCurrentProduction(currentProdResponse.data); // Data now contains summary and plants

      // Fetch alerts
      const alertsResponse = await monitoringService.getAlerts({ status: 'active' });
      setAlerts(alertsResponse.data);

      // Fetch historical data
      const historicalResponse = await monitoringService.getHistoricalData(
        selectedPlantId || null, // Pass selected plant ID or null for all
        new Date(startDate).toISOString(),
        new Date(endDate).toISOString()
      );
      
      const formattedHistoricalData = historicalResponse.data.map(item => ({
        ...item,
        timestamp: new Date(item.timestamp).getTime(),
        production: item.production.current
      })).sort((a, b) => a.timestamp - b.timestamp);

      setHistoricalData(formattedHistoricalData);

    } catch (err) {
      console.error('Error fetching monitoring data:', err);
      setError('Error al cargar los datos de monitoreo. Intenta de nuevo más tarde.');
      toast.error('Error al cargar los datos de monitoreo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitoringData();
    const intervalId = setInterval(fetchMonitoringData, 30000); 
    return () => clearInterval(intervalId);
  }, [selectedPlantId, startDate, endDate]); // Re-fetch when filters change

  const handleAcknowledgeAlert = async (alertId) => {
    try {
      const user = JSON.parse(localStorage.getItem('user')); // Get user from local storage
      if (!user) {
        toast.error('Debes iniciar sesión para reconocer alertas.');
        return;
      }
      await monitoringService.acknowledgeAlert(alertId, user.id, user.name);
      toast.success('Alerta reconocida exitosamente.');
      fetchMonitoringData(); // Refresh data
    } catch (err) {
      console.error('Error acknowledging alert:', err);
      toast.error('Error al reconocer la alerta.');
    }
  };

  const handleResolveAlert = async (alertId) => {
    try {
      const user = JSON.parse(localStorage.getItem('user')); // Get user from local storage
      if (!user) {
        toast.error('Debes iniciar sesión para resolver alertas.');
        return;
      }
      const resolution = prompt('Describe la resolución de la alerta:');
      if (!resolution) {
        toast.error('La resolución no puede estar vacía.');
        return;
      }
      await monitoringService.resolveAlert(alertId, user.id, user.name, resolution);
      toast.success('Alerta resuelta exitosamente.');
      fetchMonitoringData(); // Refresh data
    } catch (err) {
      console.error('Error resolving alert:', err);
      toast.error('Error al resolver la alerta.');
    }
  };

  const handleNewProductionDataChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setNewProductionData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setNewProductionData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleAddProductionDataSubmit = async (e) => {
    e.preventDefault();
    try {
      // Basic validation
      if (!newProductionData.plantId || !newProductionData.plantName || !newProductionData.plantType || !newProductionData.production.current || !newProductionData.production.capacity || !newProductionData.efficiency || !newProductionData.timestamp) {
        toast.error('Todos los campos son obligatorios.');
        return;
      }

      const dataToSubmit = {
        ...newProductionData,
        production: {
          current: Number(newProductionData.production.current),
          capacity: Number(newProductionData.production.capacity)
        },
        efficiency: Number(newProductionData.efficiency),
        timestamp: new Date(newProductionData.timestamp).toISOString()
      };

      await monitoringService.createProductionData(dataToSubmit);
      toast.success('Datos de producción añadidos exitosamente.');
      setShowAddDataForm(false); // Hide form
      setNewProductionData({ // Reset form
        plantId: '',
        plantName: '',
        plantType: 'solar', // Reset plantType
        production: {
          current: '',
          capacity: ''
        },
        efficiency: '',
        timestamp: format(new Date(), "yyyy-MM-dd'T'HH:mm")
      });
      fetchMonitoringData(); // Refresh data
    } catch (err) {
      console.error('Error adding production data:', err);
      toast.error('Error al añadir datos de producción.');
    }
  };

  const handleEditClick = (plant) => {
    setEditingPlantId(plant._id);
    setEditFormData({
      plantId: plant.plantId,
      plantName: plant.plantName,
      plantType: plant.plantType,
      production: {
        current: plant.production.current,
        capacity: plant.production.capacity
      },
      efficiency: plant.efficiency,
      timestamp: format(new Date(plant.timestamp), "yyyy-MM-dd'T'HH:mm")
    });
  };

  const handleEditProductionDataChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setEditFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setEditFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleUpdateProductionDataSubmit = async (e) => {
    e.preventDefault();
    try {
      // Basic validation
      if (!editFormData.plantId || !editFormData.plantName || !editFormData.plantType || !editFormData.production.current || !editFormData.production.capacity || !editFormData.efficiency || !editFormData.timestamp) {
        toast.error('Todos los campos son obligatorios.');
        return;
      }

      const dataToSubmit = {
        ...editFormData,
        production: {
          current: Number(editFormData.production.current),
          capacity: Number(editFormData.production.capacity)
        },
        efficiency: Number(editFormData.efficiency),
        timestamp: new Date(editFormData.timestamp).toISOString()
      };

      await monitoringService.updateProductionData(editingPlantId, dataToSubmit);
      toast.success('Datos de producción actualizados exitosamente.');
      setEditingPlantId(null); // Hide form
      fetchMonitoringData(); // Refresh data
    } catch (err) {
      console.error('Error updating production data:', err);
      toast.error('Error al actualizar datos de producción.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
        <Loader2 className="w-12 h-12 text-green-600 animate-spin" />
        <p className="ml-4 text-gray-700">Cargando datos de monitoreo...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
        <AlertCircle className="w-12 h-12 text-red-600" />
        <p className="ml-4 text-red-700">{error}</p>
      </div>
    );
  }

  const summary = currentProduction?.summary || {};
  const plants = currentProduction?.plants || [];

  const totalProduction = summary.totalProduction || 0;
  const activeAlertsCount = alerts.length || 0;
  const averageEfficiency = summary.averageEfficiency || 0;

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
          <span className="text-gray-900 font-medium">
            Monitoreo
          </span>
        </nav>

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Monitoreo en Tiempo Real</h1>
          <button 
            onClick={() => setShowAddDataForm(true)}
            className="btn-primary flex items-center"
          >
            <PlusCircle className="w-5 h-5 mr-2" />
            Añadir Datos de Producción
          </button>
        </div>
        
        {/* Add Production Data Form Modal */}
        {showAddDataForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
            <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Añadir Nuevos Datos de Producción</h2>
              <form onSubmit={handleAddProductionDataSubmit} className="space-y-4">
                <div>
                  <label htmlFor="plantId" className="block text-sm font-medium text-gray-700 mb-1">ID de Planta</label>
                  <input
                    type="text"
                    id="plantId"
                    name="plantId"
                    value={newProductionData.plantId}
                    onChange={handleNewProductionDataChange}
                    className="input-field"
                    placeholder="Ej: solar-farm-001"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="plantName" className="block text-sm font-medium text-gray-700 mb-1">Nombre de Planta</label>
                  <input
                    type="text"
                    id="plantName"
                    name="plantName"
                    value={newProductionData.plantName}
                    onChange={handleNewProductionDataChange}
                    className="input-field"
                    placeholder="Ej: Valle del Sol"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="plantType" className="block text-sm font-medium text-gray-700 mb-1">Tipo de Planta</label>
                  <select
                    id="plantType"
                    name="plantType"
                    value={newProductionData.plantType}
                    onChange={handleNewProductionDataChange}
                    className="input-field"
                    required
                  >
                    <option value="solar">Solar</option>
                    <option value="wind">Eólico</option>
                    <option value="hybrid">Híbrido</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="currentProduction" className="block text-sm font-medium text-gray-700 mb-1">Producción Actual (MW)</label>
                  <input
                    type="number"
                    id="currentProduction"
                    name="production.current"
                    value={newProductionData.production.current}
                    onChange={handleNewProductionDataChange}
                    className="input-field"
                    placeholder="Ej: 50"
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-1">Capacidad (MW)</label>
                  <input
                    type="number"
                    id="capacity"
                    name="production.capacity"
                    value={newProductionData.production.capacity}
                    onChange={handleNewProductionDataChange}
                    className="input-field"
                    placeholder="Ej: 60"
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="efficiency" className="block text-sm font-medium text-gray-700 mb-1">Eficiencia (%)</label>
                  <input
                    type="number"
                    id="efficiency"
                    name="efficiency"
                    value={newProductionData.efficiency}
                    onChange={handleNewProductionDataChange}
                    className="input-field"
                    placeholder="Ej: 85.5"
                    min="0"
                    max="100"
                    step="0.1"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="timestamp" className="block text-sm font-medium text-gray-700 mb-1">Fecha y Hora</label>
                  <input
                    type="datetime-local"
                    id="timestamp"
                    name="timestamp"
                    value={newProductionData.timestamp}
                    onChange={handleNewProductionDataChange}
                    className="input-field"
                    required
                  />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddDataForm(false)}
                    className="btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                  >
                    Añadir Datos
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Production Data Form Modal */}
        {editingPlantId && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
            <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Editar Datos de Producción</h2>
              <form onSubmit={handleUpdateProductionDataSubmit} className="space-y-4">
                <div>
                  <label htmlFor="editPlantId" className="block text-sm font-medium text-gray-700 mb-1">ID de Planta</label>
                  <input
                    type="text"
                    id="editPlantId"
                    name="plantId"
                    value={editFormData.plantId}
                    onChange={handleEditProductionDataChange}
                    className="input-field"
                    placeholder="Ej: solar-farm-001"
                    required
                    disabled // Plant ID should not be editable
                  />
                </div>
                <div>
                  <label htmlFor="editPlantName" className="block text-sm font-medium text-gray-700 mb-1">Nombre de Planta</label>
                  <input
                    type="text"
                    id="editPlantName"
                    name="plantName"
                    value={editFormData.plantName}
                    onChange={handleEditProductionDataChange}
                    className="input-field"
                    placeholder="Ej: Valle del Sol"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="editPlantType" className="block text-sm font-medium text-gray-700 mb-1">Tipo de Planta</label>
                  <select
                    id="editPlantType"
                    name="plantType"
                    value={editFormData.plantType}
                    onChange={handleEditProductionDataChange}
                    className="input-field"
                    required
                  >
                    <option value="solar">Solar</option>
                    <option value="wind">Eólico</option>
                    <option value="hybrid">Híbrido</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="editCurrentProduction" className="block text-sm font-medium text-gray-700 mb-1">Producción Actual (MW)</label>
                  <input
                    type="number"
                    id="editCurrentProduction"
                    name="production.current"
                    value={editFormData.production.current}
                    onChange={handleEditProductionDataChange}
                    className="input-field"
                    placeholder="Ej: 50"
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="editCapacity" className="block text-sm font-medium text-gray-700 mb-1">Capacidad (MW)</label>
                  <input
                    type="number"
                    id="editCapacity"
                    name="production.capacity"
                    value={editFormData.production.capacity}
                    onChange={handleEditProductionDataChange}
                    className="input-field"
                    placeholder="Ej: 60"
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="editEfficiency" className="block text-sm font-medium text-gray-700 mb-1">Eficiencia (%)</label>
                  <input
                    type="number"
                    id="editEfficiency"
                    name="efficiency"
                    value={editFormData.efficiency}
                    onChange={handleEditProductionDataChange}
                    className="input-field"
                    placeholder="Ej: 85.5"
                    min="0"
                    max="100"
                    step="0.1"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="editTimestamp" className="block text-sm font-medium text-gray-700 mb-1">Fecha y Hora</label>
                  <input
                    type="datetime-local"
                    id="editTimestamp"
                    name="timestamp"
                    value={editFormData.timestamp}
                    onChange={handleEditProductionDataChange}
                    className="input-field"
                    required
                  />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setEditingPlantId(null)}
                    className="btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="card">
            <div className="flex items-center gap-3 mb-2">
              <Activity className="w-8 h-8 text-green-600" />
              <h3 className="font-semibold text-gray-900">Producción Actual</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">{totalProduction} MW</p>
            <p className="text-sm text-gray-500 mt-1">Última actualización: {format(new Date(), 'HH:mm:ss')}</p>
          </div>

          <div className="card">
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="w-8 h-8 text-red-600" />
              <h3 className="font-semibold text-gray-900">Alertas Activas</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">{activeAlertsCount}</p>
            <p className="text-sm text-gray-500 mt-1">{activeAlertsCount > 0 ? 'Revisar alertas' : 'Sin alertas'}</p>
          </div>

          <div className="card">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="w-8 h-8 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Eficiencia Promedio</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">{averageEfficiency}%</p>
            <p className="text-sm text-gray-500 mt-1">Basado en datos recientes</p>
          </div>
        </div>

        {/* Production by Plant Section */}
        <div className="card mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Factory className="w-5 h-5 mr-2" />
            Producción por Planta
          </h2>
          {plants.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Planta
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Producción Actual (MW)
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Eficiencia (%)
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Capacidad (MW)
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Última Actualización
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {plants.map(plant => (
                    <tr key={plant._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {plant.plantName || plant.plantId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {plant.plantType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {plant.production.current.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {plant.efficiency.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {plant.production.capacity.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(plant.timestamp), 'MMM dd, HH:mm:ss')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEditClick(plant)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Factory className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No hay datos de producción por planta disponibles.</p>
            </div>
          )}
        </div>

        {/* Historical Data Chart */}
        <div className="card mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <CalendarDays className="w-5 h-5 mr-2" />
            Producción Histórica
          </h2>
          
          {/* Filters for Historical Data */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-[150px]">
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                Desde
              </label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input-field"
              />
            </div>
            <div className="flex-1 min-w-[150px]">
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                Hasta
              </label>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input-field"
              />
            </div>
            <div className="flex-1 min-w-[150px]">
              <label htmlFor="plantFilter" className="block text-sm font-medium text-gray-700 mb-1">
                Filtrar por Planta
              </label>
              <select
                id="plantFilter"
                value={selectedPlantId}
                onChange={(e) => setSelectedPlantId(e.target.value)}
                className="input-field"
              >
                <option value="">Todas las Plantas</option>
                {plants.map(plant => (
                  <option key={plant._id} value={plant.plantId}>
                    {plant.plantName || plant.plantId}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {historicalData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historicalData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={(timestamp) => format(new Date(timestamp), 'MMM dd, HH:mm')} 
                  minTickGap={30}
                />
                <YAxis label={{ value: 'Producción (MW)', angle: -90, position: 'insideLeft' }} />
                <Tooltip labelFormatter={(timestamp) => format(new Date(timestamp), 'MMM dd, HH:mm:ss')} />
                <Line type="monotone" dataKey="production" stroke="#22c55e" activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No hay datos históricos disponibles para mostrar con los filtros actuales.</p>
            </div>
          )}
        </div>

        {/* Active Alerts Section */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            Alertas Activas
          </h2>
          {alerts.length > 0 ? (
            <div className="space-y-4">
              {alerts.map(alert => (
                <div key={alert._id} className="flex flex-col sm:flex-row items-start sm:items-center p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center mb-2 sm:mb-0 sm:mr-4">
                    <AlertCircle className="w-6 h-6 text-red-600 mr-3" />
                    <div>
                      <p className="font-medium text-red-800">{alert.title}</p>
                      <p className="text-sm text-red-700">{alert.description}</p>
                      <p className="text-xs text-red-600">
                        Severidad: {alert.severity} | Planta: {alert.plantName} | Fecha: {format(new Date(alert.createdAt), 'MMM dd, HH:mm')}
                      </p>
                    </div>
                  </div>
                  <div className="flex-grow"></div> {/* Spacer */}
                  <div className="flex gap-2 mt-2 sm:mt-0">
                    <button
                      onClick={() => handleAcknowledgeAlert(alert._id)}
                      className="btn-secondary btn-sm"
                    >
                      Reconocer
                    </button>
                    <button
                      onClick={() => handleResolveAlert(alert._id)}
                      className="btn-primary btn-sm"
                    >
                      Resolver
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No hay alertas activas en este momento.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
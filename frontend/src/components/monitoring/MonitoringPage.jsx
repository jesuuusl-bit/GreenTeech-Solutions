import { useState, useEffect } from 'react';
import { Activity, AlertCircle, Zap, Clock, Loader2, Home, ChevronRight, Filter, CalendarDays, Factory } from 'lucide-react';
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

  // State for historical data filters
  const [selectedPlantId, setSelectedPlantId] = useState('');
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 1), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

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

        <h1 className="text-3xl font-bold text-gray-900 mb-6">Monitoreo en Tiempo Real</h1>
        
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
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {plants.map(plant => (
                    <tr key={plant._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {plant.plantName || plant.plantId}
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

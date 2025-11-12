import { useState, useEffect } from 'react';
import { Activity, AlertCircle, Zap, Clock, Loader2 } from 'lucide-react';
import { monitoringService } from '../../services/monitoringService';
import toast from 'react-hot-toast';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { format } from 'date-fns';

export default function MonitoringPage() {
  const [currentProduction, setCurrentProduction] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [historicalData, setHistoricalData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch current production data
        const currentProdResponse = await monitoringService.getCurrentProduction();
        setCurrentProduction(currentProdResponse.data.summary);

        // Fetch alerts
        const alertsResponse = await monitoringService.getAlerts({ status: 'active' });
        setAlerts(alertsResponse.data);

        // Fetch historical data (last 24 hours)
        const now = new Date();
        const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const historicalResponse = await monitoringService.getHistoricalData(
          // Assuming a default plantId or fetching for all plants
          // For now, we'll fetch without plantId and aggregate if needed
          // Or assume the backend handles aggregation if plantId is null
          null, // plantId - assuming backend aggregates if null
          twentyFourHoursAgo.toISOString(),
          now.toISOString()
        );
        
        // Format historical data for Recharts
        const formattedHistoricalData = historicalResponse.data.map(item => ({
          ...item,
          timestamp: new Date(item.timestamp).getTime(), // Convert to timestamp for chart
          production: item.production.current // Use current production for chart
        })).sort((a, b) => a.timestamp - b.timestamp); // Sort by timestamp

        setHistoricalData(formattedHistoricalData);

      } catch (err) {
        console.error('Error fetching monitoring data:', err);
        setError('Error al cargar los datos de monitoreo. Intenta de nuevo más tarde.');
        toast.error('Error al cargar los datos de monitoreo.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Set up polling for current data (e.g., every 30 seconds)
    const intervalId = setInterval(fetchData, 30000); 
    return () => clearInterval(intervalId); // Cleanup on unmount
  }, []);

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

  const totalProduction = currentProduction?.totalProduction || 0;
  const activeAlertsCount = alerts.length || 0;
  const averageEfficiency = currentProduction?.averageEfficiency || 0;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Monitoreo en Tiempo Real</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <Activity className="w-8 h-8 text-green-600" />
              <h3 className="font-semibold text-gray-900">Producción Actual</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">{totalProduction} MW</p>
            <p className="text-sm text-gray-500 mt-1">Última actualización: {format(new Date(), 'HH:mm:ss')}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="w-8 h-8 text-red-600" />
              <h3 className="font-semibold text-gray-900">Alertas Activas</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">{activeAlertsCount}</p>
            <p className="text-sm text-gray-500 mt-1">{activeAlertsCount > 0 ? 'Revisar alertas' : 'Sin alertas'}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <Zap className="w-8 h-8 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Eficiencia Promedio</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">{averageEfficiency}%</p>
            <p className="text-sm text-gray-500 mt-1">Basado en datos recientes</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-8 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Producción Histórica (Últimas 24h)</h2>
          {historicalData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historicalData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={(timestamp) => format(new Date(timestamp), 'HH:mm')} 
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
              <p>No hay datos históricos disponibles para mostrar.</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Alertas Activas</h2>
          {alerts.length > 0 ? (
            <div className="space-y-4">
              {alerts.map(alert => (
                <div key={alert._id} className="flex items-center p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-red-600 mr-3" />
                  <div>
                    <p className="font-medium text-red-800">{alert.title}</p>
                    <p className="text-sm text-red-700">{alert.description}</p>
                    <p className="text-xs text-red-600">Severidad: {alert.severity} | Planta: {alert.plantName}</p>
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

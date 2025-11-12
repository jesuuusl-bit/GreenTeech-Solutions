import React, { useState, useEffect } from 'react';
import predictiveService from '../../services/predictiveService';
import { toast } from 'react-hot-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Brain, TrendingUp, Home, ChevronRight, AlertCircle } from 'lucide-react'; // Iconos
import { useNavigate } from 'react-router-dom';

export default function PredictivePage() {
  const navigate = useNavigate();
  const [predictionInput, setPredictionInput] = useState({
    rainProbability: 20, // Ejemplo: 20%
    windIntensity: 5,    // Ejemplo: 5 m/s
    city: 'Madrid'
  });
  const [predictionResult, setPredictionResult] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [loading, setLoading] = useState(true); // Set to true initially for loading state
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchHistoricalData();
  }, []);

  const fetchHistoricalData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await predictiveService.getHistoricalData();
      const formattedData = data.map((item, index) => ({
        name: item.name || `Día ${index + 1}`,
        value: item.value,
      }));
      setHistoricalData(formattedData);
    } catch (err) {
      setError('Error al cargar datos históricos.');
      toast.error('Error al cargar datos históricos.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPredictionInput((prev) => ({ ...prev, [name]: name === 'city' ? value : parseFloat(value) }));
  };

  const handleGetPrediction = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await predictiveService.getPrediction(predictionInput);
      setPredictionResult(result);
      toast.success('Predicción obtenida exitosamente!');
    } catch (err) {
      setError('Error al obtener la predicción.');
      toast.error('Error al obtener la predicción.');
    } finally {
      setLoading(false);
    }
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
          <span className="text-gray-900 font-medium">Análisis Predictivo</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Análisis Predictivo</h1>
            <p className="text-gray-600 mt-2">Genera predicciones y visualiza datos históricos</p>
          </div>
        </div>

        {/* Sección de Predicción */}
        <div className="card mb-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900">Realizar Predicción</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label htmlFor="rainProbability" className="block text-sm font-medium text-gray-700">
                Probabilidad de Lluvia (%):
              </label>
              <input
                type="number"
                id="rainProbability"
                name="rainProbability"
                value={predictionInput.rainProbability}
                onChange={handleInputChange}
                className="input-field"
                min="0"
                max="100"
              />
            </div>
            <div>
              <label htmlFor="windIntensity" className="block text-sm font-medium text-gray-700">
                Intensidad del Viento (m/s):
              </label>
              <input
                type="number"
                id="windIntensity"
                name="windIntensity"
                value={predictionInput.windIntensity}
                onChange={handleInputChange}
                className="input-field"
                min="0"
              />
            </div>
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                Ciudad (para clima):
              </label>
              <input
                type="text"
                id="city"
                name="city"
                value={predictionInput.city}
                onChange={handleInputChange}
                className="input-field"
                placeholder="Ej: Madrid"
              />
            </div>
          </div>
          <button
            onClick={handleGetPrediction}
            disabled={loading}
            className="btn-primary"
          >
            <Brain className="mr-2 h-5 w-5" />
            {loading ? 'Calculando...' : 'Obtener Predicción'}
          </button>

          {error && <p className="text-red-500 mt-4">{error}</p>}

          {predictionResult && (
            <div className="mt-6 p-4 bg-emerald-50 rounded-md border border-emerald-200">
              <h3 className="text-xl font-semibold text-emerald-800 mb-2">Resultado de la Predicción:</h3>
              <p className="text-lg text-emerald-700">
                Valor Predicho: <span className="font-bold">{predictionResult.predictedValue?.toFixed(2)}</span>
              </p>
              {predictionResult.weatherInfo && (
                <p className="text-sm text-emerald-600 mt-2">
                  Clima en {predictionResult.weatherInfo.city}: {predictionResult.weatherInfo.temp}°C, {predictionResult.weatherInfo.description}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Sección de Datos Históricos y Gráfico */}
        <div className="card">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900">Datos Históricos</h2>
          {loading && <p className="text-center text-gray-600">Cargando datos históricos...</p>}
          {!loading && historicalData.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">No hay datos históricos disponibles.</p>
            </div>
          ) : (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={historicalData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" /> {/* Light gray grid */}
                  <XAxis dataKey="name" stroke="#6B7280" /> {/* Darker gray for axis */}
                  <YAxis stroke="#6B7280" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '4px', color: '#1F2937' }}
                    itemStyle={{ color: '#1F2937' }}
                    labelStyle={{ color: '#4B5563' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="value" stroke="#059669" activeDot={{ r: 8 }} /> {/* Emerald green line */}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

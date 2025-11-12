import React, { useState, useEffect } from 'react';
import predictiveService from '../../services/predictiveService';
import { toast } from 'react-hot-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Brain, TrendingUp } from 'lucide-react'; // Iconos

export default function PredictivePage() {
  const [predictionInput, setPredictionInput] = useState({
    feature1: 10,
    feature2: 20,
  });
  const [predictionResult, setPredictionResult] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchHistoricalData();
  }, []);

  const fetchHistoricalData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Asumiendo que el servicio predictivo puede devolver datos históricos
      const data = await predictiveService.getHistoricalData();
      // Formatear datos para Recharts si es necesario
      const formattedData = data.map((item, index) => ({
        name: `Día ${index + 1}`, // O una fecha real si viene del backend
        value: item.value, // Asumiendo que cada item tiene una propiedad 'value'
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
    setPredictionInput((prev) => ({ ...prev, [name]: parseFloat(value) }));
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

  return (
    <div className="container mx-auto p-6 bg-gray-900 text-white min-h-screen">
      <h1 className="text-4xl font-bold mb-8 text-green-400">Análisis Predictivo</h1>

      {/* Sección de Predicción */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-green-300">Realizar Predicción</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="feature1" className="block text-sm font-medium text-gray-300">
              Característica 1:
            </label>
            <input
              type="number"
              id="feature1"
              name="feature1"
              value={predictionInput.feature1}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="feature2" className="block text-sm font-medium text-gray-300">
              Característica 2:
            </label>
            <input
              type="number"
              id="feature2"
              name="feature2"
              value={predictionInput.feature2}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
            />
          </div>
        </div>
        <button
          onClick={handleGetPrediction}
          disabled={loading}
          className="flex items-center justify-center px-6 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Brain className="mr-2 h-5 w-5" />
          {loading ? 'Calculando...' : 'Obtener Predicción'}
        </button>

        {error && <p className="text-red-500 mt-4">{error}</p>}

        {predictionResult && (
          <div className="mt-6 p-4 bg-gray-700 rounded-md">
            <h3 className="text-xl font-semibold text-green-300 mb-2">Resultado de la Predicción:</h3>
            <p className="text-lg">
              Valor Predicho: <span className="font-bold text-green-400">{predictionResult.predictedValue}</span>
            </p>
            {/* Puedes mostrar más detalles de la predicción aquí */}
          </div>
        )}
      </div>

      {/* Sección de Datos Históricos y Gráfico */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold mb-4 text-green-300">Datos Históricos</h2>
        {loading && <p className="text-center text-gray-400">Cargando datos históricos...</p>}
        {!loading && historicalData.length === 0 && (
          <p className="text-center text-gray-400">No hay datos históricos disponibles.</p>
        )}
        {!loading && historicalData.length > 0 && (
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
                <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
                <XAxis dataKey="name" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#374151', border: 'none', borderRadius: '4px' }}
                  itemStyle={{ color: '#E5E7EB' }}
                  labelStyle={{ color: '#D1D5DB' }}
                />
                <Legend />
                <Line type="monotone" dataKey="value" stroke="#10B981" activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

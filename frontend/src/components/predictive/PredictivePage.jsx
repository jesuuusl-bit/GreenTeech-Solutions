import { Brain, TrendingUp } from 'lucide-react';

export default function PredictivePage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Análisis Predictivo</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <Brain className="w-8 h-8 text-purple-600" />
              <h3 className="font-semibold text-gray-900">Simulaciones</h3>
            </div>
            <p className="text-gray-600">
              Simula escenarios futuros basados en condiciones meteorológicas
            </p>
            <button className="mt-4 w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
              Iniciar Simulación
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-8 h-8 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Predicciones</h3>
            </div>
            <p className="text-gray-600">
              Predicciones de fallos y mantenimiento preventivo con IA
            </p>
            <button className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Ver Predicciones
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <Brain className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Módulo Predictivo</h2>
          <p className="text-gray-600 mb-4">
            Simulaciones, predicciones y análisis con IA
          </p>
          <p className="text-sm text-gray-500">
            Funcionalidad en desarrollo...
          </p>
        </div>
      </div>
    </div>
  );
}
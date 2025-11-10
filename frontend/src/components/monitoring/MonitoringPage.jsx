import { Activity, AlertCircle } from 'lucide-react';

export default function MonitoringPage() {
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
            <p className="text-3xl font-bold text-gray-900">0 MW</p>
            <p className="text-sm text-gray-500 mt-1">En tiempo real</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="w-8 h-8 text-yellow-600" />
              <h3 className="font-semibold text-gray-900">Alertas Activas</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">0</p>
            <p className="text-sm text-gray-500 mt-1">Sin alertas</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <Activity className="w-8 h-8 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Eficiencia</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">--</p>
            <p className="text-sm text-gray-500 mt-1">Sin datos</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <Activity className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Panel de Monitoreo</h2>
          <p className="text-gray-600 mb-4">
            Visualización de producción energética y alertas en tiempo real
          </p>
          <p className="text-sm text-gray-500">
            Funcionalidad en desarrollo...
          </p>
        </div>
      </div>
    </div>
  );
}
import { Users, UserPlus, Mail, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function UsersPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <Link
            to="/register"
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <UserPlus className="w-5 h-5" />
            Nuevo Usuario
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-8 h-8 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Total Usuarios</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">0</p>
            <p className="text-sm text-gray-500 mt-1">Usuarios activos</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="w-8 h-8 text-green-600" />
              <h3 className="font-semibold text-gray-900">Administradores</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">0</p>
            <p className="text-sm text-gray-500 mt-1">Con permisos totales</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <Mail className="w-8 h-8 text-purple-600" />
              <h3 className="font-semibold text-gray-900">Últimas 24h</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">0</p>
            <p className="text-sm text-gray-500 mt-1">Usuarios nuevos</p>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Panel de Usuarios</h2>
          <p className="text-gray-600 mb-4">
            Gestión completa de usuarios, roles y permisos
          </p>
          <p className="text-sm text-gray-500">
            Funcionalidad en desarrollo...
          </p>
        </div>
      </div>
    </div>
  );
}
import { Link } from 'react-router-dom';
import { FolderKanban, Plus } from 'lucide-react';

export default function ProjectsPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Proyectos</h1>
          <Link
            to="/projects/new"
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nuevo Proyecto
          </Link>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <FolderKanban className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Módulo de Proyectos</h2>
          <p className="text-gray-600 mb-4">
            Aquí se mostrarán todos los proyectos, tareas y cronogramas
          </p>
          <p className="text-sm text-gray-500">
            Funcionalidad en desarrollo...
          </p>
        </div>
      </div>
    </div>
  );
}
import { Bell, Settings, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const { user } = useAuth();

  return (
    <nav className="page-header">
      <div className="px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex-1">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
              Dashboard
            </h2>
            <p className="text-slate-500 text-sm mt-1">Bienvenido de vuelta, {user?.name}</p>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative p-3 rounded-xl hover:bg-slate-100 transition-all duration-200 group">
              <Bell className="w-5 h-5 text-slate-600 group-hover:text-slate-900 transition-colors" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500/20 rounded-full animate-ping"></span>
            </button>

            <button className="p-3 rounded-xl hover:bg-slate-100 transition-all duration-200 group">
              <Settings className="w-5 h-5 text-slate-600 group-hover:text-slate-900 transition-colors" />
            </button>

            <div className="flex items-center gap-4 pl-4 border-l-2 border-slate-200">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center shadow-lg">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-slate-900">{user?.name}</p>
                <span className="status-badge badge-success text-xs">
                  {user?.role}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
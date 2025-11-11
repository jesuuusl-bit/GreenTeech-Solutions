import { TrendingUp, TrendingDown } from 'lucide-react';

export default function KPICard({ title, value, icon: Icon, color, trend, description }) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600 shadow-blue-200',
    green: 'from-emerald-500 to-green-600 shadow-emerald-200',
    yellow: 'from-amber-500 to-yellow-500 shadow-amber-200',
    purple: 'from-purple-500 to-violet-600 shadow-purple-200',
    red: 'from-red-500 to-pink-600 shadow-red-200',
  };

  const bgColorClasses = {
    blue: 'from-blue-50 to-blue-100',
    green: 'from-emerald-50 to-green-100',
    yellow: 'from-amber-50 to-yellow-100',
    purple: 'from-purple-50 to-violet-100',
    red: 'from-red-50 to-pink-100',
  };

  const isPositiveTrend = trend?.startsWith('+');
  const trendValue = trend?.replace(/[+-]/, '');

  return (
    <div className={`card-gradient hover:scale-105 group cursor-pointer`}>
      <div className="flex items-start justify-between mb-6">
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-7 h-7 text-white" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 px-3 py-1.5 rounded-xl ${
            isPositiveTrend 
              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
              : 'bg-red-100 text-red-700 border border-red-200'
          }`}>
            {isPositiveTrend ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span className="text-sm font-bold">{trendValue}</span>
          </div>
        )}
      </div>
      
      <div className="space-y-2">
        <h3 className="text-slate-600 text-sm font-semibold tracking-wide uppercase">{title}</h3>
        <p className="text-3xl font-bold text-slate-900 group-hover:text-emerald-600 transition-colors duration-300">
          {value}
        </p>
        {description && (
          <p className="text-sm text-slate-500 font-medium">{description}</p>
        )}
      </div>

      {/* Decorative element */}
      <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${bgColorClasses[color]} rounded-bl-3xl opacity-20 -z-10`}></div>
    </div>
  );
}
import { useLocation, useNavigate } from 'react-router';
import { Calculator, Settings, Calendar } from 'lucide-react';

const tabs = [
  { id: 'calculator', label: 'Заказы и Расчет', icon: Calculator, path: '/' },
  { id: 'erp', label: 'Таймлайн План', icon: Calendar, path: '/erp' },
  { id: 'settings', label: 'Система', icon: Settings, path: '/settings' },
];

export function NavTabs() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 glass border-t border-white/10 md:static md:border-t-0 md:border-b z-50">
      <div className="flex justify-around md:justify-center md:gap-8 p-0 md:p-0">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname === tab.path || (location.pathname === '/' && tab.path === '/');
          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col md:flex-row items-center justify-center gap-2 px-8 py-6 rounded-none transition-all border-b-2 ${
                isActive ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4 md:w-5 md:h-5" />
              <span className="text-[10px] uppercase tracking-widest">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

import { NavLink } from 'react-router-dom';
import { authApi } from '../../api/auth.api';
import { useAuthStore } from '../../stores/auth.store';
import { useNavigate } from 'react-router-dom';

const NAV = [
  { to: '/daily', label: 'Programação Diária', icon: '📋' },
  { to: '/absences', label: 'Ausências', icon: '🤒' },
  { to: '/reports', label: 'Relatórios', icon: '📊' },
  { to: '/equipment', label: 'Equipamentos', icon: '🚜' },
  { to: '/drivers', label: 'Motoristas', icon: '👷' },
  { to: '/work-sites', label: 'Obras', icon: '🏗️' },
];

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await authApi.logout().catch(() => null);
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-60 bg-gray-900 text-white flex flex-col shrink-0">
      <div className="px-5 py-5 border-b border-gray-700">
        <h1 className="text-lg font-bold text-white">DPaula</h1>
        <p className="text-xs text-gray-400 mt-0.5">Gestão de Equipamentos</p>
      </div>

      <nav className="flex-1 py-4 space-y-1 px-2">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`
            }
          >
            <span>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-gray-700">
        <p className="text-xs text-gray-400 truncate">{user?.name ?? user?.email}</p>
        <button
          onClick={handleLogout}
          className="mt-2 w-full text-left text-xs text-gray-400 hover:text-white transition-colors"
        >
          Sair →
        </button>
      </div>
    </aside>
  );
}

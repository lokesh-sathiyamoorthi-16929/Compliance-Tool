import { NavLink } from 'react-router-dom';
import {
  Home,
  Wand2,
  GitBranch,
  Plug,
  LayoutDashboard,
  BookOpen,
} from 'lucide-react';

const links = [
  { to: '/', icon: Home, label: 'Home', end: true },
  { to: '/wizard', icon: Wand2, label: 'Wizard' },
  { to: '/frameworks', icon: GitBranch, label: 'Frameworks' },
  { to: '/connections', icon: Plug, label: 'Connections' },
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
];

export default function Sidebar() {
  return (
    <aside className="hidden lg:flex flex-col w-56 bg-white border-r border-slate-200 pt-6 pb-4 gap-1 px-3 shrink-0">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
        Navigation
      </p>
      {links.map(({ to, icon: Icon, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
              isActive
                ? 'bg-blue-50 text-blue-700'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`
          }
        >
          <Icon className="w-4 h-4 shrink-0" />
          {label}
        </NavLink>
      ))}

      <div className="mt-auto pt-4 border-t border-slate-100 px-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-400">MVP v1.0.0</span>
        </div>
        <p className="text-xs text-slate-400 mt-1">Demo mode — no real data</p>
      </div>
    </aside>
  );
}

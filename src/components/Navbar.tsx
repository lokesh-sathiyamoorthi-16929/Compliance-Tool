import { Link, NavLink } from 'react-router-dom';
import {
  Shield,
  LayoutDashboard,
  GitBranch,
  Plug,
  Wand2,
  Home,
  Scale,
} from 'lucide-react';

const navItems = [
  { label: 'Home', path: '/', icon: Home, end: true },
  { label: 'Wizard', path: '/wizard', icon: Wand2 },
  { label: 'Frameworks', path: '/frameworks', icon: GitBranch },
  { label: 'Connections', path: '/connections', icon: Plug },
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Compare', path: '/compare', icon: Scale },
];

interface Props {
  topOffsetClass?: string;
}

export default function Navbar({ topOffsetClass = 'top-0' }: Props) {
  return (
    <nav className={`sticky ${topOffsetClass} z-50 bg-white border-b border-slate-200 shadow-sm`}>
      <div className="max-w-7xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm group-hover:bg-blue-700 transition-colors">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div className="hidden sm:block">
            <span className="font-bold text-slate-900 text-lg leading-none">ComplianceIQ</span>
            <p className="text-xs text-slate-500 leading-none mt-0.5">Posture Management</p>
          </div>
        </Link>

        <div className="flex items-center gap-1 flex-wrap justify-end">
          {navItems.map(({ label, path, icon: Icon, end }) => (
            <NavLink
              key={path}
              to={path}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}

import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Shield,
  LayoutDashboard,
  GitBranch,
  Plug,
  Wand2,
  Home,
  Scale,
  LogOut,
  ChevronDown,
  Users,
} from 'lucide-react';
import { isDemoMode } from '../config/env';
import { useAuthStore } from '../store/useAuthStore';

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
  const demoMode = isDemoMode();
  const { user, status, logout } = useAuthStore((state) => ({
    user: state.user,
    status: state.status,
    logout: state.logout,
  }));
  const isAuthenticated = status === 'authenticated';
  const visibleNavItems = demoMode || isAuthenticated ? navItems : [navItems[0]];
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', onClickOutside);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
    };
  }, []);

  const initials = (user?.fullName || user?.username || 'U')
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);

  const onLogout = async () => {
    setMenuOpen(false);
    await logout();
  };

  const goToUsers = () => {
    setMenuOpen(false);
    navigate('/admin/users');
  };

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
          {visibleNavItems.map(({ label, path, icon: Icon, end }) => (
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

          {!demoMode && !isAuthenticated ? (
            <Link
              to="/login"
              className="ml-1 rounded-full bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Sign in
            </Link>
          ) : null}

          {!demoMode && isAuthenticated && user ? (
            <div className="relative ml-1" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 hover:bg-slate-50"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-700 font-semibold">
                  {initials}
                </span>
                <ChevronDown className="h-4 w-4" />
              </button>

              {menuOpen ? (
                <div className="absolute right-0 mt-2 w-64 rounded-lg border border-slate-200 bg-white py-2 shadow-lg">
                  <div className="border-b border-slate-100 px-3 pb-2">
                    <p className="text-sm font-semibold text-slate-900">{user.fullName || user.username}</p>
                    <p className="text-xs text-slate-500">@{user.username}</p>
                  </div>
                  {user.role === 'admin' && (
                    <button
                      type="button"
                      onClick={goToUsers}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <Users className="h-4 w-4" />
                      Users
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onLogout}
                    className="mt-1 flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </nav>
  );
}

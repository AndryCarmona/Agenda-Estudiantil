import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { BookOpen, CalendarDays, FileText, LayoutDashboard, LogOut, Trophy, RotateCcw, CalendarCheck2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import MascotAssistant from './Mascot';
import { initials } from './ui';

const NAV = [
  { to: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
  { to: '/agenda', label: 'Agenda', icon: CalendarDays },
  { to: '/materias', label: 'Materias', icon: BookOpen },
  { to: '/concursos', label: 'Concursos', icon: Trophy },
  { to: '/cv-preview', label: 'CV', icon: FileText },
];

export function Brand() {
  return (
    <NavLink to="/dashboard" className="brand" aria-label="AgendaU, ir al inicio">
      <span className="brand__mark"><CalendarCheck2 size={22} /></span>
      <span>AgendaU<small>Vida universitaria</small></span>
    </NavLink>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const { resetDemo } = useData();
  const toast = useToast();
  const { pathname } = useLocation();
  const links = NAV;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="shell">
      <aside className="sidebar no-print">
        <Brand />
        <nav className="nav" aria-label="Principal">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to}>
              <Icon size={20} aria-hidden /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar__foot">
          <div className="usercard">
            <span className="avatar">{initials(user.nombre)}</span>
            <div>
              <div className="usercard__name">{user.nombre}</div>
              <div className="usercard__role">{user.matricula}</div>
            </div>
          </div>
          <button
            className="btn btn--ghost btn--sm"
            onClick={() => {
              resetDemo();
              toast('Datos de demostración restablecidos', 'info');
            }}
          >
            <RotateCcw size={15} aria-hidden /> Restablecer demo
          </button>
          <button className="btn btn--sm" onClick={logout}>
            <LogOut size={16} aria-hidden /> Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="main">
        <div className="topbar no-print">
          <Brand />
          <div className="actions">
            <button className="icon-btn" onClick={logout} aria-label="Cerrar sesión">
              <LogOut size={18} />
            </button>
          </div>
        </div>
        <main className="content">
          <Outlet />
        </main>
      </div>

      <MascotAssistant />

      <nav className="tabbar no-print" aria-label="Navegación móvil">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to}>
            <Icon size={21} aria-hidden />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

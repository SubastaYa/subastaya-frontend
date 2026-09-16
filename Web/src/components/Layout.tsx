import React, { useState } from 'react';
import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { LayoutGrid, Wallet, Activity, PlusCircle, LogOut, User, Menu, X } from 'lucide-react';

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/login');
  };

  const navLinks = [
    { label: 'Catálogo', path: '/', icon: LayoutGrid },
    { label: 'Mi Billetera', path: '/wallet', icon: Wallet },
    { label: 'Mis Actividades', path: '/activities', icon: Activity },
    { label: 'Publicar Subasta', path: '/create-auction', icon: PlusCircle },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-brand-bg text-brand-dark">
      {/* Navbar Superior */}
      <header className="bg-brand-navy text-white shadow-sm border-b border-slate-800 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 sm:h-20 flex items-center justify-between">
          {/* Marca / Logo */}
          <div className="flex items-center gap-6 lg:gap-8">
            <Link
              to="/"
              className="flex items-center gap-2 group transition-transform duration-150 hover:scale-102 select-none"
              title="Ir al inicio de SubastaYa"
              onClick={() => setMobileMenuOpen(false)}
            >
              <img
                src="/logo.png"
                alt="Logo SubastaYa"
                className="h-8 sm:h-10 w-auto object-contain shrink-0"
                onError={(e) => {
                  // Si no carga la imagen, ocultamos el img silenciosamente
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <span className="font-bold text-xl sm:text-2xl text-white tracking-tight">
                SubastaYa
              </span>
            </Link>

            {/* Enlaces de Navegación de Escritorio */}
            <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
              {navLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  end={link.path === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-brand-action text-white shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    }`
                  }
                >
                  <link.icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Acciones de Usuario (Escritorio) */}
          <div className="hidden md:flex items-center gap-3">
            {/* Identificador visual del usuario logueado con badge de estado */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="font-mono text-slate-200 max-w-[180px] truncate" title={user?.email}>
                {user?.email || 'Usuario'}
              </span>
            </div>

            {/* Botón Cerrar Sesión */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:text-white hover:bg-rose-900/40 border border-rose-900/40 hover:border-rose-700/60 rounded-lg transition-colors cursor-pointer"
              title="Cerrar sesión"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Cerrar Sesión</span>
            </button>
          </div>

          {/* Botón de Menú Móvil */}
          <div className="flex md:hidden items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 focus:outline-none transition-colors"
              aria-label="Abrir menú de navegación"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Menú Desplegable Móvil */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-950 border-b border-slate-800 px-4 pt-3 pb-5 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <nav className="flex flex-col space-y-1">
              {navLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  end={link.path === '/'}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-brand-action text-white'
                        : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                    }`
                  }
                >
                  <link.icon className="w-4 h-4 text-slate-400" />
                  <span>{link.label}</span>
                </NavLink>
              ))}
            </nav>

            <div className="pt-3 border-t border-slate-800 space-y-2">
              <div className="px-3 py-2 rounded-lg bg-slate-900 text-xs text-slate-300 flex items-center justify-between">
                <span className="text-slate-400">Sesión:</span>
                <span className="font-mono text-white truncate max-w-[200px]">{user?.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold text-rose-300 bg-rose-950/40 border border-rose-900/60 hover:bg-rose-900/50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Área de contenido principal */}
      <main className="container mx-auto p-4 flex-1">
        <Outlet />
      </main>

      {/* Pie de página sutil */}
      <footer className="bg-brand-navy text-slate-400 py-6 border-t border-slate-800 text-xs mt-auto">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="text-slate-400">
            © 2026 SubastaYa. Plataforma de Subastas en Vivo.
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Privacidad</span>
            <span>Términos</span>
            <span>Soporte</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;

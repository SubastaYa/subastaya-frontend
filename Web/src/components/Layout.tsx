import React, { useState } from 'react';
import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { LayoutGrid, Wallet, Activity, PlusCircle, LogOut, LogIn, Menu, X } from 'lucide-react';

export const Layout: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/login');
  };

  const navLinks = [
    { label: 'Catálogo', path: '/', icon: LayoutGrid },
    ...(isAuthenticated
      ? [
          { label: 'Mi Billetera', path: '/wallet', icon: Wallet },
          { label: 'Mis Actividades', path: '/activities', icon: Activity },
          { label: 'Publicar Subasta', path: '/create-auction', icon: PlusCircle },
        ]
      : []),
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
              className="group flex items-center gap-2.5 sm:gap-3 py-1 cursor-pointer select-none transition-all duration-200 active:scale-95"
              title="Ir al inicio de Subasta Ya"
              onClick={() => setMobileMenuOpen(false)}
            >
              <img
                src="/logo.png"
                alt="Logo Subasta Ya"
                className="h-[46px] sm:h-[56px] w-auto object-contain shrink-0 transition-all duration-300 ease-out group-hover:scale-110 group-hover:-rotate-6 group-hover:-translate-y-1 group-hover:drop-shadow-[0_4px_12px_rgba(255,255,255,0.2)]"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <span className="font-bold text-xl sm:text-2xl text-white tracking-tight transition-all duration-300 ease-out group-hover:translate-x-1 group-hover:text-[#F5E6D3]">
                Subasta Ya
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
                    `inline-flex items-center justify-center gap-2 h-10 px-3.5 rounded-lg text-sm font-medium transition-all box-border ${
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
            {isAuthenticated && user ? (
              <>
                {/* Botón Mi Cuenta con Bigote -> Navega a la ventana completa /mi-cuenta */}
                <Link
                  to="/mi-cuenta"
                  title="Ir a Mi Cuenta"
                  className="group inline-flex items-center justify-center gap-2.5 h-10 px-3.5 rounded-lg bg-[#F5E6D3] hover:bg-[#ebdcc0] border border-[#e5d5be] transition-all duration-200 cursor-pointer select-none active:scale-95 shadow-sm text-sm box-border"
                >
                  <img
                    src="/mustache_beige.png?v=4"
                    alt="Bigote"
                    className="h-5 w-auto object-contain transition-all duration-300 group-hover:scale-110 group-hover:-rotate-6"
                  />
                  <span className="font-sans font-bold text-sm text-[#0B1220] tracking-tight">
                    Mi Cuenta
                  </span>
                </Link>

                {/* Botón Cerrar Sesión (Mismo tamaño h-10 que Catálogo, fondo blanco, letras azul) */}
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center justify-center gap-2 h-10 px-3.5 text-sm font-semibold text-[#1E3A8A] bg-white hover:bg-slate-100 rounded-lg shadow-sm transition-all duration-150 cursor-pointer border border-white box-border"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4 text-[#1E3A8A]" />
                  <span>Cerrar Sesión</span>
                </button>
              </>
            ) : (
              /* Botón Iniciar Sesión (Mismo tamaño h-10 que Catálogo, invertido: fondo azul, letras blancas) */
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 h-10 px-3.5 text-sm font-semibold rounded-lg bg-brand-action hover:bg-brand-action-hover text-white shadow-sm transition-all duration-150 cursor-pointer border border-transparent box-border"
              >
                <LogIn className="w-4 h-4" />
                <span>Iniciar Sesión</span>
              </Link>
            )}
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
              {isAuthenticated && user ? (
                <>
                  <Link
                    to="/mi-cuenta"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center justify-center gap-2.5 px-3.5 py-2 rounded-lg bg-[#F5E6D3] text-[#0B1220] text-sm font-bold hover:bg-[#ebdcc0] transition-colors shadow-sm"
                  >
                    <img
                      src="/mustache_beige.png?v=4"
                      alt="Bigote"
                      className="h-5 w-auto object-contain"
                    />
                    <span>
                      Mi Cuenta
                    </span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold text-[#1E3A8A] bg-white hover:bg-slate-100 transition-colors shadow-sm"
                  >
                    <LogOut className="w-4 h-4 text-[#1E3A8A]" />
                    <span>Cerrar Sesión</span>
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold bg-brand-action hover:bg-brand-action-hover text-white shadow transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Iniciar Sesión</span>
                </Link>
              )}
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
            © 2026 SubastaYa.
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

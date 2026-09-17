import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { LayoutGrid, Wallet, Activity, PlusCircle, LogOut, LogIn, Menu, X, ChevronDown, User as UserIcon } from 'lucide-react';

export const Layout: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
    navigate('/login');
  };

  // Cerrar el menú desplegable si se hace clic afuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const navLinks = [
    { label: 'Subastas', path: '/', icon: LayoutGrid },
    ...(isAuthenticated
      ? [
          { label: 'Mi Billetera', path: '/wallet', icon: Wallet },
          { label: 'Mis Actividades', path: '/activities', icon: Activity },
          { label: 'Publicar Subasta', path: '/create-auction', icon: PlusCircle },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen flex flex-col bg-brand-bg text-brand-dark select-none">
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
            <div className="relative" ref={userMenuRef}>
              {/* Botón único del Bigote en la posición de acción con menú desplegable */}
              <button
                type="button"
                onClick={() => setUserMenuOpen((prev) => !prev)}
                title={isAuthenticated ? 'Opciones de cuenta' : 'Iniciar sesión'}
                className="group inline-flex items-center justify-center gap-2 h-10 px-3.5 rounded-lg bg-[#F5E6D3] hover:bg-[#ebdcc0] border border-[#e5d5be] transition-all duration-200 cursor-pointer select-none active:scale-95 shadow-sm text-sm box-border"
                aria-expanded={userMenuOpen}
              >
                <img
                  src="/mustache_beige.png?v=4"
                  alt="Bigote"
                  className="h-5 w-auto object-contain transition-all duration-300 group-hover:scale-110 group-hover:-rotate-6"
                />
                <ChevronDown
                  className={`w-3.5 h-3.5 text-[#0B1220] transition-transform duration-200 ${
                    userMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Menú Desplegable Deslizante */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200/90 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  {isAuthenticated && user ? (
                    <>
                      <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/60 rounded-t-xl">
                        <p className="text-xs font-bold text-slate-800 truncate">
                          {user.nombre || 'Mi Perfil'}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {user.email}
                        </p>
                      </div>

                      <div className="p-1 space-y-0.5">
                        <Link
                          to="/mi-cuenta"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-slate-700 hover:text-[#1E3A8A] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <UserIcon className="w-4 h-4 text-slate-500" />
                          <span>Mi cuenta</span>
                        </Link>

                        <div className="h-px bg-slate-100 my-1"></div>

                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer text-left"
                        >
                          <LogOut className="w-4 h-4 text-rose-500" />
                          <span>Cerrar Sesión</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/60 rounded-t-xl">
                        <p className="text-xs font-bold text-slate-800">
                          Acceso de Usuarios
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Identifícate para participar
                        </p>
                      </div>

                      <div className="p-1 space-y-0.5">
                        <Link
                          to="/login"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-sm font-semibold text-[#1E3A8A] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <LogIn className="w-4 h-4 text-[#1E3A8A]" />
                          <span>Iniciar Sesión</span>
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
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
                  className="w-full flex items-center justify-center gap-2.5 px-3.5 py-2 rounded-lg bg-[#F5E6D3] text-[#0B1220] text-sm font-bold hover:bg-[#ebdcc0] transition-colors shadow-sm"
                >
                  <img
                    src="/mustache_beige.png?v=4"
                    alt="Bigote"
                    className="h-5 w-auto object-contain"
                  />
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
      <footer className="bg-brand-navy text-slate-400 py-6 border-t border-slate-800 text-xs mt-auto select-none">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left select-none">
          <div className="text-slate-400 select-none">
            © 2026 SubastaYa.
          </div>
          <div className="flex items-center gap-4 text-slate-400 select-none">
            <button
              type="button"
              onClick={(e) => e.preventDefault()}
              className="hover:text-slate-200 transition-colors cursor-pointer select-none active:opacity-70 focus:outline-none"
            >
              Privacidad
            </button>
            <button
              type="button"
              onClick={(e) => e.preventDefault()}
              className="hover:text-slate-200 transition-colors cursor-pointer select-none active:opacity-70 focus:outline-none"
            >
              Términos
            </button>
            <button
              type="button"
              onClick={(e) => e.preventDefault()}
              className="hover:text-slate-200 transition-colors cursor-pointer select-none active:opacity-70 focus:outline-none"
            >
              Soporte
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;

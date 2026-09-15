import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { User as UserIcon, LogOut, LogIn, Menu, X, Tag } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/login');
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className="bg-brand-navy text-white border-b border-slate-800 shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-18 sm:h-22 flex items-center justify-between">
        {/* Logo corporativo con mascota y texto en blanco, con animación conjunta y redirección al inicio */}
        <Link
          to="/"
          onClick={closeMobileMenu}
          className="flex items-center gap-2 sm:gap-3 py-1 group transition-transform duration-200 hover:scale-105 active:scale-95 cursor-pointer select-none"
          title="Ir a la página principal de Subastas Ya"
        >
          <img
            src="/logo.png"
            alt="Logo Subastas Ya"
            className="h-10 sm:h-13 w-auto object-contain drop-shadow-sm shrink-0"
          />
          <span className="font-serif font-bold text-xl sm:text-2xl md:text-3xl text-white tracking-tight">
            Subastas Ya
          </span>
        </Link>

        {/* Enlaces de Navegación de Escritorio */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link
            to="/"
            className={`transition-colors duration-150 ${
              location.pathname === '/' ? 'text-white font-semibold' : 'text-slate-300 hover:text-white'
            }`}
          >
            Categorías
          </Link>
          <Link
            to="/mi-cuenta"
            className={`transition-colors duration-150 ${
              location.pathname === '/mi-cuenta' ? 'text-white font-semibold' : 'text-slate-300 hover:text-white'
            }`}
          >
            Mi Cuenta
          </Link>
        </nav>

        {/* Acciones de Usuario de Escritorio */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
                <UserIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="font-mono text-slate-200 max-w-[160px] truncate">{user.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors border border-transparent hover:border-slate-700 cursor-pointer"
                title="Cerrar sesión"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Cerrar sesión</span>
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-brand-action hover:bg-brand-action-hover text-white shadow transition-all duration-150 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Iniciar Sesión</span>
            </Link>
          )}
        </div>

        {/* Botón de Menú Móvil (Hamburguesa) */}
        <div className="flex md:hidden items-center gap-2">
          {isAuthenticated && user && (
            <Link
              to="/mi-cuenta"
              onClick={closeMobileMenu}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
              title="Mi Cuenta"
            >
              <UserIcon className="w-4 h-4" />
            </Link>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 focus:outline-none transition-colors cursor-pointer"
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
            <Link
              to="/"
              onClick={closeMobileMenu}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/' ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <Tag className="w-4 h-4 text-brand-action" />
              <span>Categorías</span>
            </Link>
            <Link
              to="/mi-cuenta"
              onClick={closeMobileMenu}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/mi-cuenta' ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <UserIcon className="w-4 h-4 text-brand-action" />
              <span>Mi Cuenta</span>
            </Link>
          </nav>

          <div className="pt-3 border-t border-slate-800">
            {isAuthenticated && user ? (
              <div className="space-y-2">
                <div className="px-3 py-2 rounded-lg bg-slate-900 text-xs text-slate-300 flex items-center justify-between">
                  <span className="text-slate-400">Usuario:</span>
                  <span className="font-mono text-white truncate max-w-[200px]">{user.email}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold text-rose-300 bg-rose-950/40 border border-rose-900/60 hover:bg-rose-900/40 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Cerrar sesión</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                onClick={closeMobileMenu}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-brand-action hover:bg-brand-action-hover text-white shadow transition-colors"
              >
                <LogIn className="w-4 h-4" />
                <span>Iniciar Sesión</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

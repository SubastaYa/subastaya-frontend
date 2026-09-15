import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Login } from './pages/Login';
import { CatalogPage } from './pages/CatalogPage';
import { AccountPage } from './pages/AccountPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen flex flex-col bg-brand-bg text-brand-dark">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Ruta Pública: Catálogo y flujo de pujas */}
              <Route path="/" element={<CatalogPage />} />

              {/* Ruta Pública: Login con soporte de returnUrl */}
              <Route path="/login" element={<Login />} />

              {/* Ruta Protegida: Cuenta institucional */}
              <Route
                path="/mi-cuenta"
                element={
                  <ProtectedRoute>
                    <AccountPage />
                  </ProtectedRoute>
                }
              />

              {/* Ruta por defecto */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          {/* Pie de página con enlaces informativos y copyright */}
          <footer className="bg-brand-navy text-slate-400 py-6 sm:py-8 border-t border-slate-800 text-xs">
            <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 flex flex-col items-center justify-center gap-3 text-center">
              <div className="flex flex-wrap items-center justify-center gap-x-4 sm:gap-x-6 gap-y-2 text-[11px] sm:text-xs text-slate-300 leading-relaxed">
                <a
                  href="#condiciones-de-uso"
                  onClick={(e) => e.preventDefault()}
                  className="hover:underline hover:text-white transition-colors cursor-pointer"
                >
                  Condiciones de uso
                </a>
                <a
                  href="#aviso-de-privacidad"
                  onClick={(e) => e.preventDefault()}
                  className="hover:underline hover:text-white transition-colors cursor-pointer"
                >
                  Aviso de privacidad
                </a>
                <a
                  href="#aviso-privacidad-salud"
                  onClick={(e) => e.preventDefault()}
                  className="hover:underline hover:text-white transition-colors cursor-pointer"
                >
                  Aviso de Privacidad de Datos de Salud del Consumidor
                </a>
                <a
                  href="#opciones-privacidad-anuncios"
                  onClick={(e) => e.preventDefault()}
                  className="inline-flex items-center gap-1.5 hover:underline hover:text-white transition-colors cursor-pointer"
                >
                  <span>Tus opciones de privacidad de los anuncios</span>
                  <svg className="w-7 h-3.5 inline-block ml-0.5" viewBox="0 0 28 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="28" height="14" rx="7" fill="#0073BB"/>
                    <path d="M7 7.5L9 9.5L13 5.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M18 5L22 9M22 5L18 9" stroke="#90CAF9" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </a>
              </div>
              <div className="text-xs text-slate-400 mt-1">
                © 2026 SubastaYa.com, Inc. o sus afiliados
              </div>
            </div>
          </footer>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;

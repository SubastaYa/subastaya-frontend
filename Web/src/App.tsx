import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/useAuth';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { CatalogPage } from './pages/CatalogPage';
import { Wallet } from './pages/Wallet';
import { ProfilePage } from './pages/ProfilePage';
import { Activity, PlusCircle } from 'lucide-react';

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, token } = useAuth();
  if (isAuthenticated && token) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

const ActivitiesPlaceholder: React.FC = () => (
  <div className="bg-brand-surface rounded-xl border border-brand-border p-8 text-center shadow-sm max-w-2xl mx-auto my-8">
    <div className="w-16 h-16 bg-blue-50 text-brand-action rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-100">
      <Activity className="w-8 h-8" />
    </div>
    <h2 className="text-xl font-bold text-brand-dark mb-2">Mis Actividades</h2>
    <p className="text-sm text-slate-600 mb-6">
      Consulta el estado de tus publicaciones, el historial de tus ofertas activas y las subastas ganadas en tiempo real.
    </p>
    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
      Próximamente disponible
    </span>
  </div>
);

const CreateAuctionPlaceholder: React.FC = () => (
  <div className="bg-brand-surface rounded-xl border border-brand-border p-8 text-center shadow-sm max-w-2xl mx-auto my-8">
    <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
      <PlusCircle className="w-8 h-8" />
    </div>
    <h2 className="text-xl font-bold text-brand-dark mb-2">Publicar Subasta</h2>
    <p className="text-sm text-slate-600 mb-6">
      Publica nuevos artículos con precio base, fechas de apertura y cierre, categorías e imágenes.
    </p>
    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
      Próximamente disponible
    </span>
  </div>
);

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta Pública: Login con redirección a / si ya está autenticado */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        {/* Estructura con Layout General */}
        <Route element={<Layout />}>
          {/* Ruta Pública: Catálogo accesible para todos (autenticados o anónimos) */}
          <Route path="/" element={<CatalogPage />} />

          {/* Rutas Privadas: Protegidas con ProtectedRoute */}
          <Route element={<ProtectedRoute />}>
            <Route path="/wallet" element={<Wallet />} />
            <Route path="/activities" element={<ActivitiesPlaceholder />} />
            <Route path="/create-auction" element={<CreateAuctionPlaceholder />} />
            {/* Ventana de cuenta completa como billetera */}
            <Route path="/mi-cuenta" element={<ProfilePage />} />
          </Route>
        </Route>

        {/* Ruta por defecto */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;

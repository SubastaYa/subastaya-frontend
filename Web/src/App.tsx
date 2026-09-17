import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/useAuth';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Catalog } from './pages/Catalog';
import { Wallet } from './pages/Wallet';
import { ProfilePage } from './pages/ProfilePage';
import { CreateAuction } from './pages/CreateAuction';
import { MyActivities } from './pages/MyActivities';
import { AuctionRoom } from './pages/AuctionRoom';

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, token } = useAuth();
  if (isAuthenticated && token) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};



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
          <Route path="/" element={<Catalog />} />

          {/* Rutas Privadas: Protegidas con ProtectedRoute */}
          <Route element={<ProtectedRoute />}>
            <Route path="/wallet" element={<Wallet />} />
            <Route path="/activities" element={<MyActivities />} />
            <Route path="/create-auction" element={<CreateAuction />} />
            <Route path="/auctions/:id" element={<AuctionRoom />} />
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

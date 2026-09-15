import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-brand-dark">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-brand-action rounded-full animate-spin"></div>
        <p className="mt-3 text-xs text-slate-500 font-medium tracking-wide">
          Verificando sesión...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    const returnUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?returnUrl=${returnUrl}`} state={{ from: location }} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

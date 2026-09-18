import React from 'react';
import { Navigate, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

const AUDITOR_EMAIL = 'auditoria@test.com';

interface AdminRouteProps {
  children?: React.ReactNode;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { isAuthenticated, token, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-brand-dark">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-brand-action rounded-full animate-spin"></div>
        <p className="mt-3 text-xs text-slate-500 font-medium tracking-wide">
          Verificando permisos de acceso...
        </p>
      </div>
    );
  }

  if (!isAuthenticated || !token) {
    return <Navigate to="/login" replace />;
  }

  const isAuditor = Boolean(user?.email?.toLowerCase().includes(AUDITOR_EMAIL));

  if (!isAuditor) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center font-sans">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 sm:p-12 flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mb-5 shadow-xs">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
            Acceso Exclusivo de Auditoría
          </h2>

          <p className="text-sm text-slate-600 max-w-md mb-6 leading-relaxed">
            El registro de actividades y eventos del sistema solo puede ser visualizado por la cuenta autorizada de auditoría (<span className="font-semibold text-slate-800">{AUDITOR_EMAIL}</span>).
          </p>

          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-brand-action hover:bg-brand-action-hover transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a las subastas</span>
          </Link>
        </div>
      </div>
    );
  }

  return children ? <>{children}</> : <Outlet />;
};

export default AdminRoute;

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { AuditLogsSection } from '../components/AuditLogsSection';

export const AuditLogsPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
      {/* Breadcrumb / Regresar */}
      <div className="flex items-center justify-between mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-brand-action transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a las subastas
        </Link>
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
        </span>
      </div>

      {/* Componente central de auditoría */}
      <AuditLogsSection />
    </div>
  );
};

export default AuditLogsPage;

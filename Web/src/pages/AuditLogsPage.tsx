import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { AuditLogsSection } from '../components/AuditLogsSection';

export const AuditLogsPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8 font-sans select-none">
      {/* Cabecera Principal con fondo verde idéntica a Mis Actividades */}
      <div className="bg-[#E6F4EA] rounded-xl border border-[#C5E8D2] p-4 sm:p-6 shadow-sm mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-sans">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-brand-dark font-sans tracking-tight">
            Registro de actividades
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-sans">
            Registro de eventos, transacciones y acciones del sistema.
          </p>
        </div>

        <Link
          to="/"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#C5E8D2] bg-white hover:bg-slate-50 text-xs sm:text-sm font-semibold text-slate-700 transition-all font-sans self-stretch sm:self-auto justify-center shadow-xs"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500" />
          <span>Volver a las subastas</span>
        </Link>
      </div>

      {/* Componente central de auditoría */}
      <AuditLogsSection />
    </div>
  );
};

export default AuditLogsPage;

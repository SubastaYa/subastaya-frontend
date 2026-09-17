import React from 'react';
import { useAuth } from '../context/useAuth';
import { Link } from 'react-router-dom';
import { User as UserIcon, Wallet, Mail, Hash } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-4xl mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8 font-sans select-none">
      {/* Cabecera de la página */}
      <div className="bg-brand-surface rounded-xl border border-slate-200 p-4 sm:p-6 shadow-sm mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-sans">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-sm p-1.5">
            <img
              src="/bow_tie.png?v=1"
              alt="Moño Dorado"
              className="w-9 sm:w-10 h-auto object-contain"
            />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-brand-dark font-sans tracking-tight">
              Mi Cuenta
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-sans">
              Información de tu identidad
            </p>
          </div>
        </div>

        {/* Acceso rápido a billetera */}
        <Link
          to="/wallet"
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-bold text-[#0B1220] bg-[#F5E6D3] hover:bg-[#ebdcc0] rounded-lg transition-colors border border-[#e5d5be] shadow-sm cursor-pointer"
        >
          <Wallet className="w-4 h-4 text-[#0B1220]" />
          <span>Ver Mi Billetera</span>
        </Link>
      </div>

      {/* Tarjeta de Información de la Cuenta */}
      <div className="bg-brand-surface rounded-xl border border-slate-200 shadow-sm overflow-hidden font-sans p-5 sm:p-6 space-y-4">
        {/* Nombre */}
        {user?.nombre && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-slate-100 gap-1 sm:gap-4">
            <div className="flex items-center gap-2.5 text-slate-500 text-sm">
              <UserIcon className="w-4 h-4 text-slate-500" />
              <span className="font-medium">Nombre:</span>
            </div>
            <span className="font-semibold text-base text-slate-900 font-sans">
              {user.nombre}
            </span>
          </div>
        )}

        {/* ID de Usuario */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b border-slate-100 gap-1 sm:gap-4">
          <div className="flex items-center gap-2.5 text-slate-500 text-sm">
            <Hash className="w-4 h-4 text-slate-500" />
            <span className="font-medium">ID de Usuario:</span>
          </div>
          <span className="font-semibold text-sm sm:text-base text-slate-900 font-mono bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
            {user?.id}
          </span>
        </div>

        {/* Email */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 gap-1 sm:gap-4">
          <div className="flex items-center gap-2.5 text-slate-500 text-sm">
            <Mail className="w-4 h-4 text-slate-500" />
            <span className="font-medium">Email:</span>
          </div>
          <span className="font-semibold text-sm sm:text-base text-slate-900 font-sans">
            {user?.email}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

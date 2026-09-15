import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/useAuth';
import api from '../api/axios';
import { User as UserIcon, Wallet, Shield, ArrowUpRight, History } from 'lucide-react';

interface WalletData {
  balance: number;
  saldoRetenido: number;
  saldoDisponible: number;
}

export const AccountPage: React.FC = () => {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const response = await api.get<WalletData>('/wallet/balance');
        setWallet(response.data);
      } catch {
        // Fallback en caso de que la billetera esté vacía o backend sin inicializar
        setWallet(null);
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8">
      {/* Cabecera de la cuenta */}
      <div className="bg-brand-surface rounded-xl border border-slate-200 p-4 sm:p-6 shadow-sm mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-brand-action shrink-0">
            <UserIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-brand-dark">Mi Cuenta Institucional</h1>
            <p className="text-xs font-mono text-slate-500 mt-0.5 break-all">{user?.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-700 w-full sm:w-auto justify-center sm:justify-start">
          <Shield className="w-3.5 h-3.5 text-brand-action" />
          <span>Sesión Autenticada</span>
        </div>
      </div>

      {/* Billetera y Saldos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 mb-6">
        <div className="bg-brand-surface p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Saldo Total</span>
            <Wallet className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-brand-dark">
            {loading ? '...' : `$${(wallet?.balance ?? 0).toLocaleString()}`}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Fondos totales en custodia</span>
        </div>

        <div className="bg-brand-surface p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Saldo Retenido</span>
            <History className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-brand-dark">
            {loading ? '...' : `$${(wallet?.saldoRetenido ?? 0).toLocaleString()}`}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Comprometido en ofertas activas</span>
        </div>

        <div className="bg-brand-surface p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Disponible para Pujar</span>
            <ArrowUpRight className="w-4 h-4 text-brand-action" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-brand-action">
            {loading ? '...' : `$${(wallet?.saldoDisponible ?? 0).toLocaleString()}`}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Límite para nuevas ofertas</span>
        </div>
      </div>

      {/* Información del Token y Claims */}
      <div className="bg-brand-surface rounded-xl border border-slate-200 p-4 sm:p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-brand-dark mb-3">Información de Identidad y Sesión</h2>
        <div className="bg-slate-50 rounded-lg p-3 sm:p-4 border border-slate-200 text-xs font-mono text-slate-700 space-y-2">
          <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-2">
            <span className="text-slate-400">ID Usuario (sub):</span>
            <span className="break-all">{user?.id}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-2">
            <span className="text-slate-400">Email (claim):</span>
            <span className="break-all">{user?.email}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 sm:gap-2 pt-1 border-t border-slate-200/60">
            <span className="text-slate-400">Estado de Protección:</span>
            <span className="text-slate-900 font-semibold">Validado por Bearer Token en cada solicitud</span>
          </div>
        </div>
      </div>
    </div>
  );
};

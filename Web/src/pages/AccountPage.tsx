import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/useAuth';
import api from '../api/axios';
import { Wallet, ArrowUpRight, History } from 'lucide-react';

interface WalletData {
  totalBalance?: number;
  retainedBalance?: number;
  availableBalance?: number;
  balance?: number;
  saldoRetenido?: number;
  saldoDisponible?: number;
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

  const totalBalance = wallet?.totalBalance ?? wallet?.balance ?? 0;
  const retainedBalance = wallet?.retainedBalance ?? wallet?.saldoRetenido ?? 0;
  const availableBalance = wallet?.availableBalance ?? wallet?.saldoDisponible ?? 0;

  return (
    <div className="max-w-4xl mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8 font-sans">
      {/* Cabecera de la cuenta */}
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
            <h1 className="text-base sm:text-lg font-bold text-brand-dark font-sans">
              {user?.nombre || user?.email?.split('@')[0] || 'Usuario'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 break-all font-sans">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Billetera y Saldos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 mb-6 font-sans">
        <div className="bg-brand-surface p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2 font-sans">
            <span>Saldo Total</span>
            <Wallet className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-brand-dark font-sans">
            {loading ? '...' : `$${totalBalance.toLocaleString()}`}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block font-sans">Fondos totales</span>
        </div>

        <div className="bg-brand-surface p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2 font-sans">
            <span>Saldo Retenido</span>
            <History className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-brand-dark font-sans">
            {loading ? '...' : `$${retainedBalance.toLocaleString()}`}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block font-sans">Fondos en ofertas activas</span>
        </div>

        <div className="bg-brand-surface p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2 font-sans">
            <span>Saldo Disponible</span>
            <ArrowUpRight className="w-4 h-4 text-brand-action" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-brand-action font-sans">
            {loading ? '...' : `$${availableBalance.toLocaleString()}`}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block font-sans">Límite para nuevas ofertas</span>
        </div>
      </div>

    </div>
  );
};

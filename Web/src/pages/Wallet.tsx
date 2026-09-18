import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import {
  Wallet as WalletIcon,
  History,
  ArrowUpRight,
  PlusCircle,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Receipt,
} from 'lucide-react';
import axios from 'axios';
import { formatLocalDateTime } from '../utils/dateUtils';

interface WalletResponseDto {
  totalBalance: number;
  retainedBalance: number;
  availableBalance: number;
}

interface TransaccionLedgerDto {
  id: number;
  tipo: number | string;
  monto: number;
  fecha: string;
  subastaId?: number | null;
  subastaTitulo?: string | null;
}

export const Wallet: React.FC = () => {
  const [balance, setBalance] = useState<WalletResponseDto>({
    totalBalance: 0,
    retainedBalance: 0,
    availableBalance: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDepositing, setIsDepositing] = useState<boolean>(false);
  const [depositAmount, setDepositAmount] = useState<string>('10000');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [transactions, setTransactions] = useState<TransaccionLedgerDto[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState<boolean>(false);

  // Formateador de moneda en formato local argentino (ej. $ 200.000,00)
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Cargar saldo de billetera
  const fetchBalance = async () => {
    try {
      const res = await api.get<WalletResponseDto>('/wallet/balance');
      if (res.data) {
        setBalance({
          totalBalance: Number(res.data.totalBalance ?? 0),
          retainedBalance: Number(res.data.retainedBalance ?? 0),
          availableBalance: Number(res.data.availableBalance ?? 0),
        });
      }
    } catch {
      setMessage({
        type: 'error',
        text: 'No fue posible sincronizar el saldo de la billetera con el servidor.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar historial de movimientos contables (opcional)
  const fetchTransactions = async () => {
    setIsLoadingTransactions(true);
    try {
      const res = await api.get<TransaccionLedgerDto[]>('/wallet/transactions');
      if (Array.isArray(res.data)) {
        setTransactions(res.data);
      }
    } catch {
      // Endpoint opcional, si falla no bloquea la billetera
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  useEffect(() => {
    fetchBalance();
    fetchTransactions();
  }, []);

  // Manejar depósito de fondos
  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(depositAmount);

    if (isNaN(amountNum) || amountNum <= 0) {
      setMessage({
        type: 'error',
        text: 'Por favor, ingresa un monto numérico positivo mayor a cero.',
      });
      return;
    }

    setIsDepositing(true);
    setMessage(null);

    try {
      const response = await api.post<WalletResponseDto>('/wallet/deposit', {
        amount: amountNum,
      });

      // Actualizar directamente el estado balance con la respuesta del backend
      setBalance({
        totalBalance: Number(response.data.totalBalance ?? 0),
        retainedBalance: Number(response.data.retainedBalance ?? 0),
        availableBalance: Number(response.data.availableBalance ?? 0),
      });

      setMessage({
        type: 'success',
        text: `¡Se acreditaron ${formatCurrency(amountNum)} en tu saldo disponible con éxito!`,
      });

      setDepositAmount('');
      // Refrescar transacciones contables
      fetchTransactions();
    } catch (err: unknown) {
      let errorText = 'Ocurrió un error al intentar acreditar fondos en la billetera.';
      if (axios.isAxiosError(err)) {
        errorText = err.response?.data?.detail || err.response?.data?.message || errorText;
      }
      setMessage({
        type: 'error',
        text: errorText,
      });
    } finally {
      setIsDepositing(false);
    }
  };

  const setPresetAmount = (val: number) => {
    setDepositAmount(val.toString());
    setMessage(null);
    const input = document.getElementById('deposit-amount-input');
    if (input) {
      input.focus();
    }
  };

  // Mapear tipos de transacciones para el historial
  const renderTipoTransaccion = (tipo: number | string) => {
    const tipoStr = String(tipo).toLowerCase();
    if (tipo === 0 || tipoStr.includes('deposito') || tipoStr.includes('deposit')) {
      return { label: 'Depósito Acreditado' };
    }
    if (tipo === 1 || tipoStr.includes('retencion') || tipoStr.includes('bloqueo')) {
      return { label: 'Retención de Oferta' };
    }
    if (tipo === 2 || tipoStr.includes('liberacion') || tipoStr.includes('reembolso')) {
      return { label: 'Reembolso por Sobreofertar' };
    }
    if (tipo === 3 || tipoStr.includes('pago') || tipoStr.includes('debito')) {
      return { label: 'Débito por Adjudicación' };
    }
    return { label: 'Movimiento Ledger' };
  };

  return (
    <div className="max-w-4xl mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8 font-sans">
      {/* Cabecera Principal */}
      <div className="bg-[#E6F4EA] rounded-xl border border-[#C5E8D2] p-4 sm:p-6 shadow-sm mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-sans">
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
              Mi Billetera
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-sans">
              Gestión de fondos y límites disponibles para subastas
            </p>
          </div>
        </div>
      </div>

      {/* Mensajes de Notificación */}
      {message && (
        <div
          role="alert"
          className={`mb-6 p-4 rounded-xl border flex items-start justify-between gap-3 text-sm shadow-sm animate-in fade-in duration-200 ${message.type === 'success'
            ? 'bg-emerald-50/90 border-emerald-200 text-emerald-900'
            : 'bg-rose-50/90 border-rose-200 text-rose-900'
            }`}
        >
          <div className="flex items-start gap-2.5">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
            )}
            <p className="font-medium leading-relaxed">{message.text}</p>
          </div>
          <button
            type="button"
            onClick={() => setMessage(null)}
            className="text-slate-400 hover:text-slate-600 text-xs font-semibold cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Tres Tarjetas de Métricas Financieras */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 mb-8 font-sans">
        {/* Saldo Total */}
        <div className="bg-brand-surface p-5 sm:p-6 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            <span>Saldo Total</span>
            <div className="p-2 rounded-lg bg-slate-50 text-slate-500 border border-slate-100">
              <WalletIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-brand-dark tracking-tight my-1 font-sans">
            {isLoading ? (
              <div className="h-8 w-32 bg-slate-100 rounded animate-pulse"></div>
            ) : (
              formatCurrency(balance.totalBalance)
            )}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">Fondos totales</span>
        </div>

        {/* Saldo Retenido */}
        <div className="bg-brand-surface p-5 sm:p-6 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            <span>Saldo Retenido</span>
            <div className="p-2 rounded-lg bg-slate-50 text-slate-500 border border-slate-100">
              <History className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-brand-dark tracking-tight my-1 font-sans">
            {isLoading ? (
              <div className="h-8 w-32 bg-slate-100 rounded animate-pulse"></div>
            ) : (
              formatCurrency(balance.retainedBalance)
            )}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">Fondos en ofertas activas</span>
        </div>

        {/* Saldo Disponible */}
        <div className="bg-brand-surface p-5 sm:p-6 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-brand-action uppercase tracking-wider mb-2">
            <span>Saldo Disponible</span>
            <div className="p-2 rounded-lg bg-blue-50 text-brand-action border border-blue-100">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-brand-action tracking-tight my-1 font-sans">
            {isLoading ? (
              <div className="h-8 w-32 bg-slate-100 rounded animate-pulse"></div>
            ) : (
              formatCurrency(balance.availableBalance)
            )}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">Límite para nuevas ofertas</span>
        </div>
      </div>

      {/* Formulario de Depósito / Recarga de Fondos */}
      <div className="bg-brand-surface rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8 mb-8 font-sans">
        <div className="flex items-center gap-3 mb-2">
          <div className="group w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-center justify-center shrink-0 p-1 shadow-sm cursor-pointer hover:bg-emerald-100/60 transition-all duration-200">
            <img
              src="/money_deposit.png"
              alt="Ingresar Dinero"
              className="w-full h-full object-contain drop-shadow-sm transition-transform duration-200 ease-out group-hover:scale-110 hover:scale-110"
            />
          </div>
          <div>
            <h2 className="text-lg font-bold text-brand-dark tracking-tight font-sans">
              Ingresa Dinero
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-sans">
              Ingresa el monto. Se reflejará inmediatamente en tu saldo disponible
            </p>
          </div>
        </div>

        {/* Atajos de montos rápidos */}
        <div className="mt-4 mb-5 flex flex-wrap items-center gap-2 font-sans">
          <span className="text-xs font-semibold text-slate-500 mr-1 font-sans">Montos sugeridos:</span>
          {[5000, 10000, 50000, 100000].map((val) => {
            const isSelected = depositAmount === val.toString();
            return (
              <button
                key={val}
                type="button"
                onClick={() => setPresetAmount(val)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-sans transition-all duration-150 cursor-pointer shadow-sm active:scale-95 border ${
                  isSelected
                    ? 'bg-brand-action text-white border-brand-action shadow-md ring-2 ring-brand-action/20'
                    : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 hover:border-slate-400'
                }`}
                title={`Autocompletar con $${val.toLocaleString('es-AR')}`}
              >
                +${val.toLocaleString('es-AR')}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleDeposit} className="space-y-4 font-sans">
          <div>
            <label
              htmlFor="deposit-amount-input"
              className="block text-xs sm:text-sm font-semibold text-slate-700 mb-2 font-sans"
            >
              Monto a Depositar (ARS)
            </label>
            <div className="relative max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <DollarSign className="w-4 h-4" />
              </div>
              <input
                id="deposit-amount-input"
                type="number"
                min="1"
                step="any"
                required
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="10000"
                disabled={isDepositing}
                className="w-full pl-10 pr-4 py-2.5 text-base sm:text-lg font-bold rounded-lg bg-white border border-slate-300 text-brand-dark placeholder-slate-400 focus:outline-none focus:border-brand-action focus:ring-2 focus:ring-brand-action/15 transition-all disabled:bg-slate-50 font-sans tracking-tight"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isDepositing || !depositAmount || Number(depositAmount) <= 0}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-white bg-brand-action hover:bg-brand-action-hover active:scale-[0.99] transition-all shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer font-sans"
          >
            {isDepositing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                <span>Acreditando fondos...</span>
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4" />
                <span>Acreditar Fondos</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Historial de Movimientos Contables Ledger (Si hay transacciones) */}
      <div className="bg-brand-surface rounded-xl border border-slate-200 shadow-sm overflow-hidden font-sans selectable-content select-text">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80 selectable-content select-text">
          <div className="flex items-center gap-2.5 selectable-content select-text">
            <Receipt className="w-4 h-4 text-slate-600" />
            <h3 className="text-sm sm:text-base font-bold text-slate-800 font-sans tracking-tight">
              Historial
            </h3>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-white px-2.5 py-1 rounded-md border border-slate-200 font-sans selectable-content select-text">
            {transactions.length} {transactions.length === 1 ? 'registro' : 'registros'}
          </span>
        </div>

        {/* Encabezado de columnas para alineación prolija */}
        <div className="hidden sm:grid sm:grid-cols-12 px-6 py-2.5 bg-slate-50/50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider selectable-content select-text">
          <div className="sm:col-span-6">Movimiento / Concepto</div>
          <div className="sm:col-span-3 text-center">Fecha y Hora</div>
          <div className="sm:col-span-3 text-right">Monto</div>
        </div>

        <div className="divide-y divide-slate-200 selectable-content select-text">
          {isLoadingTransactions ? (
            <div className="py-8 text-center text-xs text-slate-400 font-sans">Cargando movimientos...</div>
          ) : transactions.length === 0 ? (
            <div className="py-8 text-center text-xs sm:text-sm text-slate-400 font-sans">
              No registras movimientos contables aún. Acredita fondos para comenzar a operar.
            </div>
          ) : (
            transactions.map((t) => {
              const badge = renderTipoTransaccion(t.tipo);
              const isPositive = Number(t.monto) >= 0;
              return (
                <div
                  key={t.id}
                  className="px-6 py-4 grid grid-cols-1 sm:grid-cols-12 items-center gap-2 hover:bg-slate-50/70 transition-colors selectable-content select-text"
                >
                  <div className="sm:col-span-6 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2.5 selectable-content select-text">
                    <span className="text-sm font-bold text-slate-900 font-sans tracking-tight">
                      {badge.label}
                    </span>
                    {t.subastaTitulo && (
                      <span className="text-xs text-slate-500 font-sans">
                        • Subasta: {t.subastaTitulo}
                      </span>
                    )}
                  </div>

                  <div className="sm:col-span-3 text-left sm:text-center selectable-content select-text">
                    <span className="text-xs text-slate-500 font-sans font-medium">
                      {formatLocalDateTime(t.fecha)}
                    </span>
                  </div>

                  <div className="sm:col-span-3 text-left sm:text-right selectable-content select-text">
                    <span
                      className={`text-base font-bold font-sans tracking-tight ${
                        isPositive ? 'text-emerald-600' : 'text-slate-800'
                      }`}
                    >
                      {isPositive ? `+${formatCurrency(t.monto)}` : formatCurrency(t.monto)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Wallet;

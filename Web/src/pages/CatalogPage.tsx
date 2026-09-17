import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import api from '../api/axios';
import { Gavel, Clock, Tag, AlertCircle, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

interface SubastaItem {
  id: number;
  titulo: string;
  urlImagen: string;
  precioBase: number;
  precioActual: number;
  categoriaNombre: string;
  vendedorNombre: string;
  totalPujas: number;
  fechaFin: string;
}

// Datos de demostración en caso de que la API local aún no esté encendida
const DEMO_ITEMS: SubastaItem[] = [
  {
    id: 1,
    titulo: 'iPhone 15 Pro Max 256GB',
    urlImagen: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80',
    precioBase: 30000,
    precioActual: 45000,
    categoriaNombre: 'Tecnología',
    vendedorNombre: 'Vendedor Test',
    totalPujas: 2,
    fechaFin: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  },
  {
    id: 2,
    titulo: 'MacBook Pro 16" M3 Max',
    urlImagen: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
    precioBase: 100000,
    precioActual: 100000,
    categoriaNombre: 'Tecnología',
    vendedorNombre: 'Vendedor Test',
    totalPujas: 0,
    fechaFin: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  },
  {
    id: 3,
    titulo: 'Toyota Corolla 2019 XEI',
    urlImagen: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?auto=format&fit=crop&w=800&q=80',
    precioBase: 5000000,
    precioActual: 5000000,
    categoriaNombre: 'Vehículos',
    vendedorNombre: 'Vendedor Test',
    totalPujas: 0,
    fechaFin: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const CatalogPage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [subastas, setSubastas] = useState<SubastaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubasta, setSelectedSubasta] = useState<SubastaItem | null>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [isBidding, setIsBidding] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    const fetchSubastas = async () => {
      try {
        const response = await api.get<SubastaItem[]>('/subastas');
        if (Array.isArray(response.data) && response.data.length > 0) {
          setSubastas(response.data);
        } else {
          setSubastas(DEMO_ITEMS);
        }
      } catch {
        // En caso de que el backend no esté corriendo, usar datos de demo
        setSubastas(DEMO_ITEMS);
      } finally {
        setLoading(false);
      }
    };

    fetchSubastas();
  }, []);

  // REGLA CRÍTICA: Interceptar oferta si el usuario NO está autenticado
  const handleInitiateBid = (item: SubastaItem) => {
    if (!isAuthenticated) {
      // No enviar petición al backend. Redirigir a login con returnUrl
      const returnUrl = encodeURIComponent(`/?subastaId=${item.id}`);
      navigate(`/login?returnUrl=${returnUrl}`);
      return;
    }

    // Si está autenticado, abrir modal de puja
    setSelectedSubasta(item);
    setBidAmount(String(item.precioActual + 1000));
    setFeedback(null);
  };

  const handleConfirmBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubasta) return;

    const amountNum = parseFloat(bidAmount);
    if (isNaN(amountNum) || amountNum <= selectedSubasta.precioActual) {
      setFeedback({
        type: 'error',
        message: `La oferta debe ser superior al precio actual ($${selectedSubasta.precioActual.toLocaleString()}).`,
      });
      return;
    }

    setIsBidding(true);
    setFeedback(null);

    try {
      // POST al backend utilizando JWT mediante Axios
      const response = await api.post<{ id: number; mensaje: string }>(
        `/subastas/${selectedSubasta.id}/pujas`,
        { amount: amountNum }
      );

      setFeedback({
        type: 'success',
        message: response.data.mensaje || '¡Oferta registrada exitosamente en el sistema!',
      });

      // Actualizar precio en la UI local
      setSubastas((prev) =>
        prev.map((s) =>
          s.id === selectedSubasta.id
            ? { ...s, precioActual: amountNum, totalPujas: s.totalPujas + 1 }
            : s
        )
      );

      setTimeout(() => {
        setSelectedSubasta(null);
        setFeedback(null);
      }, 2000);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail;
        setFeedback({
          type: 'error',
          message: detail || 'No se pudo procesar la oferta. Verifique su saldo disponible.',
        });
      } else {
        setFeedback({
          type: 'error',
          message: 'Error inesperado al conectar con el servidor.',
        });
      }
    } finally {
      setIsBidding(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8">
      {/* Encabezado */}
      <div className="mb-6 sm:mb-8 p-4 sm:p-5 rounded-xl bg-brand-surface border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-brand-dark">Categorías de Subastas</h1>
        </div>

        {isAuthenticated && user && (
          <span className="text-lg sm:text-xl font-bold text-brand-action select-none">
            Hola, {user.nombre || user.email}.
          </span>
        )}
      </div>

      {/* Grid de Lotes */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 border-2 border-slate-300 border-t-brand-action rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {subastas.map((item) => (
            <div
              key={item.id}
              id={`subasta-${item.id}`}
              className="bg-brand-surface rounded-lg border border-slate-200 overflow-hidden shadow-sm flex flex-col hover:border-slate-300 transition-all duration-200"
            >
              {/* Imagen del Lote */}
              <div className="h-48 bg-slate-100 relative overflow-hidden">
                <img
                  src={item.urlImagen}
                  alt={item.titulo}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 bg-brand-navy/90 text-white text-[10px] font-semibold px-2 py-1 rounded tracking-wide uppercase">
                  {item.categoriaNombre}
                </div>
              </div>

              {/* Contenido */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h2 className="font-semibold text-base text-brand-dark line-clamp-1">
                    {item.titulo}
                  </h2>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-2">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5" />
                      {item.vendedorNombre}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {item.totalPujas} {item.totalPujas === 1 ? 'oferta' : 'ofertas'}
                    </span>
                  </div>
                </div>

                {/* Precios y Acción */}
                <div className="mt-5 pt-4 border-t border-slate-100">
                  <div className="flex items-baseline justify-between mb-3">
                    <span className="text-xs text-slate-500">Precio actual:</span>
                    <span className="text-lg font-bold text-brand-dark">
                      ${item.precioActual.toLocaleString()}
                    </span>
                  </div>

                  <button
                    onClick={() => handleInitiateBid(item)}
                    className={`w-full py-2.5 px-4 rounded text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                      isAuthenticated
                        ? 'bg-brand-action hover:bg-brand-action-hover text-white shadow-sm'
                        : 'bg-slate-100 hover:bg-slate-200 text-brand-dark border border-slate-300'
                    }`}
                  >
                    <Gavel className="w-4 h-4" />
                    {isAuthenticated ? 'Realizar Puja' : 'Iniciar sesión para pujar'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Oferta (Solo accesible cuando está autenticado) */}
      {selectedSubasta && (
        <div className="fixed inset-0 z-50 bg-brand-navy/70 backdrop-blur-sm flex items-center justify-center p-3.5 sm:p-4 overflow-y-auto">
          <div className="bg-brand-surface rounded-xl border border-slate-200 shadow-2xl max-w-md w-full p-5 sm:p-6 my-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-brand-dark pr-2 line-clamp-1">Ofertar en {selectedSubasta.titulo}</h3>
              <button
                onClick={() => setSelectedSubasta(null)}
                className="text-slate-400 hover:text-brand-dark p-1 rounded-md text-lg leading-none"
                aria-label="Cerrar modal"
              >
                ✕
              </button>
            </div>

            {feedback && (
              <div
                className={`mt-4 p-3 rounded-lg text-xs flex items-start gap-2 ${
                  feedback.type === 'error'
                    ? 'bg-slate-900 border border-slate-800 text-slate-100'
                    : 'bg-emerald-950 border border-emerald-800 text-emerald-100'
                }`}
              >
                {feedback.type === 'error' ? (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                )}
                <span>{feedback.message}</span>
              </div>
            )}

            <form onSubmit={handleConfirmBid} className="mt-4 space-y-4">
              <div>
                <span className="block text-xs text-slate-500 mb-0.5">Precio actual del lote:</span>
                <span className="text-lg font-bold text-brand-dark">
                  ${selectedSubasta.precioActual.toLocaleString()}
                </span>
              </div>

              <div>
                <label htmlFor="bidInput" className="block text-xs font-semibold text-brand-dark mb-1">
                  Tu Oferta ($)
                </label>
                <input
                  id="bidInput"
                  type="number"
                  min={selectedSubasta.precioActual + 1}
                  step="1"
                  required
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-base sm:text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-brand-action focus:ring-2 focus:ring-brand-action/20 text-brand-dark"
                  disabled={isBidding}
                />
                <span className="text-[11px] text-slate-500 mt-1 block leading-normal">
                  El sistema verificará y retendrá el saldo de tu billetera institucional.
                </span>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedSubasta(null)}
                  disabled={isBidding}
                  className="flex-1 py-2.5 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isBidding}
                  className="flex-1 py-2.5 text-xs font-semibold rounded-lg bg-brand-action hover:bg-brand-action-hover text-white flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-60 transition-colors"
                >
                  {isBidding ? 'Enviando...' : 'Confirmar Puja'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

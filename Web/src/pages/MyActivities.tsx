import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { auctionService } from '../services';
import {
  Gavel,
  Tag,
  ArrowLeft,
  AlertCircle,
  PlusCircle,
  RefreshCw,
  ShoppingBag,
  Trophy,
  ShieldCheck,
  TrendingUp,
  UserCheck
} from 'lucide-react';
import axios from 'axios';

type TabType = 'ofertas' | 'publicaciones';

export interface MiOfertaItem {
  id: number;
  titulo: string;
  urlImagen: string;
  estado: number; // 0=Programada, 1=Activa, 2=Finalizada, 3=Desierta
  fechaInicio: string;
  fechaFin: string;
  precioBase: number;
  precioActual: number;
  miOfertaMaxima: number;
  esGanador: boolean;
  esLider: boolean;
  categoriaNombre: string;
}

export interface MiPublicacionItem {
  id: number;
  titulo: string;
  urlImagen: string;
  precioBase: number;
  precioActual: number;
  estado: number; // 0=Programada, 1=Activa, 2=Finalizada, 3=Desierta
  fechaInicio: string;
  fechaFin: string;
  categoriaNombre: string;
  totalOfertas: number;
  montoRecaudado: number;
  ganadorNombre?: string | null;
  ganadorNombreOfuscado?: string | null;
}

export const MyActivities: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('ofertas');
  const [ofertas, setOfertas] = useState<MiOfertaItem[]>([]);
  const [publicaciones, setPublicaciones] = useState<MiPublicacionItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const formatCurrency = (monto: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(monto);
  };

  const formatFecha = (fechaIso: string) => {
    try {
      const fecha = new Date(fechaIso);
      return fecha.toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return fechaIso;
    }
  };

  const fetchActivities = async (tab: TabType) => {
    setIsLoading(true);
    setError(null);

    try {
      if (tab === 'ofertas') {
        const response = await auctionService.getMyBids();
        setOfertas(Array.isArray(response.data) ? (response.data as MiOfertaItem[]) : []);
      } else {
        const response = await auctionService.getMyAuctions();
        setPublicaciones(Array.isArray(response.data) ? (response.data as MiPublicacionItem[]) : []);
      }
    } catch (err: unknown) {
      console.error(`Error al obtener ${tab}:`, err);
      let errorMsg = 'No fue posible cargar las actividades. Verifica tu conexión con el servidor.';
      if (axios.isAxiosError(err) && err.response?.data) {
        const d = err.response.data;
        errorMsg = typeof d === 'string' ? d : d.message || d.detail || errorMsg;
      }
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities(activeTab);
  }, [activeTab]);

  const renderEstadoBadge = (estado: number) => {
    switch (estado) {
      case 1:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-sm">
            Activa
          </span>
        );
      case 0:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-600 text-white shadow-sm">
            Programada
          </span>
        );
      case 3:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-800 text-white shadow-sm">
            Desierta
          </span>
        );
      case 2:
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-600 text-white shadow-sm">
            Finalizada
          </span>
        );
    }
  };

  const currentCount = activeTab === 'ofertas' ? ofertas.length : publicaciones.length;

  return (
    <div className="max-w-6xl mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8 font-sans select-none">
      {/* Cabecera Principal */}
      <div className="bg-[#E6F4EA] rounded-xl border border-[#C5E8D2] p-4 sm:p-6 shadow-sm mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-sans">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-brand-dark font-sans tracking-tight">
            Mis Actividades
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-sans">
            Gestiona y monitorea tus ofertas activas y publicaciones en tiempo real
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

      {/* Selector de Pestañas (Tabs) */}
      <div className="bg-brand-surface rounded-xl border border-slate-200 shadow-sm p-1.5 mb-8 inline-flex flex-wrap sm:flex-nowrap gap-1.5 font-sans">
        <button
          type="button"
          onClick={() => setActiveTab('ofertas')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer font-sans ${
            activeTab === 'ofertas'
              ? 'bg-brand-action text-white shadow-sm'
              : 'text-slate-600 hover:text-brand-dark hover:bg-slate-100'
          }`}
        >
          <Gavel className="w-4 h-4" />
          <span>Mis Compras / Ofertas</span>
          {!isLoading && activeTab === 'ofertas' && (
            <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-white/20 text-white font-bold">
              {ofertas.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('publicaciones')}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer font-sans ${
            activeTab === 'publicaciones'
              ? 'bg-brand-action text-white shadow-sm'
              : 'text-slate-600 hover:text-brand-dark hover:bg-slate-100'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Mis Publicaciones</span>
          {!isLoading && activeTab === 'publicaciones' && (
            <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-white/20 text-white font-bold">
              {publicaciones.length}
            </span>
          )}
        </button>
      </div>

      {/* Alerta de Error si ocurre */}
      {error && (
        <div
          role="alert"
          className="mb-6 p-4 rounded-xl border border-rose-200 bg-rose-50/90 text-rose-900 flex items-start justify-between gap-3 text-sm shadow-sm animate-in fade-in duration-200 font-sans"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
            <p className="font-medium leading-relaxed">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => fetchActivities(activeTab)}
            className="inline-flex items-center gap-1 text-rose-700 hover:text-rose-900 text-xs font-semibold cursor-pointer underline"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reintentar
          </button>
        </div>
      )}

      {/* Estado de Carga (Loading) */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 font-sans">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-brand-surface rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-pulse font-sans"
            >
              <div className="h-52 bg-slate-200"></div>
              <div className="p-5 space-y-3">
                <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                <div className="h-6 bg-slate-200 rounded w-3/4"></div>
                <div className="h-8 bg-slate-200 rounded w-1/2 pt-2"></div>
                <div className="h-10 bg-slate-200 rounded w-full pt-2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : currentCount === 0 ? (
        /* Estado Vacío (Empty State) */
        <div className="bg-brand-surface rounded-xl border border-slate-200 shadow-sm p-10 sm:p-14 text-center font-sans max-w-lg mx-auto my-8">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-brand-action border border-blue-100 flex items-center justify-center mx-auto mb-4 shadow-sm">
            {activeTab === 'ofertas' ? (
              <ShoppingBag className="w-7 h-7 text-brand-action" />
            ) : (
              <Tag className="w-7 h-7 text-brand-action" />
            )}
          </div>

          <h3 className="text-lg font-bold text-brand-dark tracking-tight mb-2 font-sans">
            {activeTab === 'ofertas'
              ? 'Aún no has realizado ninguna oferta'
              : 'No tienes subastas publicadas'}
          </h3>

          <p className="text-xs sm:text-sm text-slate-500 mb-6 font-sans leading-relaxed">
            {activeTab === 'ofertas'
              ? 'Explora las subastas activas disponibles y puja por los productos que te interesen.'
              : 'Publica tu primer artículo para comenzar a recibir ofertas de los postores de la plataforma.'}
          </p>

          <div>
            {activeTab === 'ofertas' ? (
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-brand-action hover:bg-brand-action-hover active:scale-[0.99] transition-all shadow-sm font-sans"
              >
                <Gavel className="w-4 h-4" />
                <span>Explorar Subastas</span>
              </Link>
            ) : (
              <Link
                to="/create-auction"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-brand-action hover:bg-brand-action-hover active:scale-[0.99] transition-all shadow-sm font-sans"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Publicar Subasta</span>
              </Link>
            )}
          </div>
        </div>
      ) : activeTab === 'ofertas' ? (
        /* ================= PESTAÑA: MIS OFERTAS ================= */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 font-sans">
          {ofertas.map((item) => (
            <div
              key={item.id}
              className="bg-brand-surface rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group"
            >
              {/* Imagen con Badge de Estado */}
              <div className="relative w-full h-52 bg-slate-600 overflow-hidden shrink-0">
                <img
                  src={
                    item.estado === 2 || item.estado === 3
                      ? '/images/subasta-finalizada.svg'
                      : (item.urlImagen || '/images/default-subasta.jpg')
                  }
                  alt={item.titulo}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      item.estado === 2 || item.estado === 3
                        ? '/images/subasta-finalizada.svg'
                        : '/images/default-subasta.jpg';
                  }}
                />
                <div className="absolute top-3 right-3">
                  {renderEstadoBadge(item.estado)}
                </div>
              </div>

              {/* Contenido */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                    {item.categoriaNombre || 'General'}
                  </span>
                  <h3 className="text-lg font-bold text-brand-dark tracking-tight line-clamp-2">
                    {item.titulo}
                  </h3>
                </div>

                <div className="space-y-3 pt-2 border-t border-slate-100">
                  {/* Banner de Ganador o Liderazgo */}
                  {item.esGanador ? (
                    <div className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-300 shadow-xs">
                      <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                        <Trophy className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-extrabold text-amber-900 block">¡Ganaste esta subasta!</span>
                        <span className="text-[11px] text-amber-700 block truncate">
                          Adjudicada por {formatCurrency(item.precioActual)}
                        </span>
                      </div>
                    </div>
                  ) : item.esLider ? (
                    <div className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 shadow-xs">
                      <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-extrabold text-emerald-800 block">¡Estás liderando!</span>
                        <span className="text-[11px] text-emerald-600 block truncate">
                          Tu puja de {formatCurrency(item.miOfertaMaxima)} encabeza
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <span>Tu puja máxima:</span>
                      <strong className="text-slate-800 font-bold">{formatCurrency(item.miOfertaMaxima)}</strong>
                    </div>
                  )}

                  {/* Precios */}
                  <div className="flex items-baseline justify-between pt-1">
                    <div>
                      <span className="text-xs text-slate-500 block">Precio actual</span>
                      <span className="text-xl font-extrabold text-brand-dark">
                        {formatCurrency(item.precioActual)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-500 block">Fecha fin</span>
                      <span className="text-xs font-medium text-slate-600">
                        {formatFecha(item.fechaFin)}
                      </span>
                    </div>
                  </div>

                  <Link
                    to={`/auctions/${item.id}`}
                    className="w-full py-2.5 px-4 rounded-lg bg-[#1E3A8A] hover:bg-[#1E40AF] text-white text-xs sm:text-sm font-semibold text-center transition-colors shadow-sm block active:scale-[0.98]"
                  >
                    Ingresar a la Sala
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ================= PESTAÑA: MIS PUBLICACIONES (CON MÉTRICAS DE RECAUDACIÓN Y ADJUDICACIÓN) ================= */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 font-sans">
          {publicaciones.map((pub) => {
            const tieneOfertas = pub.totalOfertas > 0;
            const esFinalizada = pub.estado === 2;
            const esDesierta = pub.estado === 3;

            return (
              <div
                key={pub.id}
                className="bg-brand-surface rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group"
              >
                {/* Imagen con Badge de Estado */}
                <div className="relative w-full h-52 bg-slate-600 overflow-hidden shrink-0">
                  <img
                    src={
                      pub.estado === 2 || pub.estado === 3
                        ? '/images/subasta-finalizada.svg'
                        : (pub.urlImagen || '/images/default-subasta.jpg')
                    }
                    alt={pub.titulo}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        pub.estado === 2 || pub.estado === 3
                          ? '/images/subasta-finalizada.svg'
                          : '/images/default-subasta.jpg';
                    }}
                  />
                  <div className="absolute top-3 right-3">
                    {renderEstadoBadge(pub.estado)}
                  </div>
                </div>

                {/* Contenido */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                      {pub.categoriaNombre || 'General'}
                    </span>
                    <h3 className="text-lg font-bold text-brand-dark tracking-tight line-clamp-2">
                      {pub.titulo}
                    </h3>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    {/* Panel de Métricas de Liquidación y Adjudicación */}
                    {esFinalizada && pub.montoRecaudado > 0 ? (
                      <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 space-y-2 shadow-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                            <Trophy className="w-3.5 h-3.5 text-emerald-700" />
                            Subasta Adjudicada
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800">
                            Cobrado
                          </span>
                        </div>
                        <div className="flex items-baseline justify-between pt-1 border-t border-emerald-200">
                          <span className="text-xs text-emerald-800 font-medium">Recaudación final:</span>
                          <strong className="text-base font-extrabold text-emerald-800 font-sans">
                            {formatCurrency(pub.montoRecaudado)}
                          </strong>
                        </div>
                        {(pub.ganadorNombreOfuscado || pub.ganadorNombre) && (
                          <div className="flex items-center justify-between text-xs text-emerald-700 pt-0.5">
                            <span className="flex items-center gap-1">
                              <UserCheck className="w-3.5 h-3.5 text-emerald-600" /> Ganador:
                            </span>
                            <strong className="font-semibold text-emerald-900">
                              {pub.ganadorNombreOfuscado || pub.ganadorNombre}
                            </strong>
                          </div>
                        )}
                      </div>
                    ) : esDesierta || (esFinalizada && pub.montoRecaudado === 0) ? (
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs">
                        <span className="font-bold block text-slate-700">Subasta Desierta</span>
                        <span>Finalizó sin registrar ofertas. No se generó recaudación.</span>
                      </div>
                    ) : (
                      /* Subasta en curso o programada */
                      <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200 text-blue-900 flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 font-medium">
                          <TrendingUp className="w-3.5 h-3.5 text-blue-600" /> Ofertas recibidas:
                        </span>
                        <strong className="font-bold text-blue-900">
                          {pub.totalOfertas} {pub.totalOfertas === 1 ? 'oferta' : 'ofertas'}
                        </strong>
                      </div>
                    )}

                    {/* Resumen Financiero Base vs Actual */}
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <span className="text-slate-400 block text-[11px]">Precio base</span>
                        <span className="font-bold text-slate-700">{formatCurrency(pub.precioBase)}</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 text-right">
                        <span className="text-slate-400 block text-[11px]">
                          {tieneOfertas ? 'Mejor oferta' : 'Sin ofertas'}
                        </span>
                        <span className="font-bold text-brand-dark">
                          {tieneOfertas ? formatCurrency(pub.precioActual) : '-'}
                        </span>
                      </div>
                    </div>

                    <Link
                      to={`/auctions/${pub.id}`}
                      className="w-full py-2.5 px-4 rounded-lg bg-[#1E3A8A] hover:bg-[#1E40AF] text-white text-xs sm:text-sm font-semibold text-center transition-colors shadow-sm block active:scale-[0.98]"
                    >
                      Ver Sala de Subasta
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyActivities;

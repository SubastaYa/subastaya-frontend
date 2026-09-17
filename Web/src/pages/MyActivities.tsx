import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { AuctionCard, type SubastaListDto } from '../components/AuctionCard';
import {
  Gavel,
  Tag,
  ArrowLeft,
  AlertCircle,
  PlusCircle,
  RefreshCw,
  ShoppingBag,
} from 'lucide-react';
import axios from 'axios';

type TabType = 'ofertas' | 'publicaciones';

interface RawItem {
  id: number;
  titulo: string;
  urlImagen: string;
  precioBase: number;
  precioActual: number;
  estado: number | string;
  fechaFin: string;
  categoriaNombre?: string;
  vendedorNombre?: string;
  totalOfertas?: number;
  miOfertaMaxima?: number;
  esGanador?: boolean;
  esLider?: boolean;
}

export const MyActivities: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('ofertas');
  const [items, setItems] = useState<SubastaListDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Mapeo seguro y defensivo para alimentar AuctionCard
  const mapToSubastaListDto = (raw: RawItem, isPublicacion: boolean): SubastaListDto => {
    let estadoNum = 1;
    if (typeof raw.estado === 'number') {
      estadoNum = raw.estado;
    } else if (typeof raw.estado === 'string') {
      const s = raw.estado.toLowerCase();
      if (s.includes('programada')) estadoNum = 0;
      else if (s.includes('activa')) estadoNum = 1;
      else if (s.includes('desierta')) estadoNum = 3;
      else estadoNum = 2; // Finalizada
    }

    return {
      id: raw.id,
      titulo: raw.titulo,
      urlImagen: raw.urlImagen || '/images/default-subasta.jpg',
      precioBase: Number(raw.precioBase ?? 0),
      precioActual: Number(raw.precioActual ?? raw.precioBase ?? 0),
      estado: estadoNum,
      fechaFin: raw.fechaFin,
      categoriaNombre: raw.categoriaNombre || 'General',
      vendedorNombre: raw.vendedorNombre || (isPublicacion ? 'Tú (Vendedor)' : 'Vendedor'),
      totalOfertas: Number(raw.totalOfertas ?? (raw.miOfertaMaxima ? 1 : 0)),
    };
  };

  const fetchActivities = async (tab: TabType) => {
    setIsLoading(true);
    setError(null);

    const endpoint = tab === 'ofertas' ? '/subastas/mis-ofertas' : '/subastas/mis-publicaciones';

    try {
      const response = await api.get<RawItem[]>(endpoint);
      const data = response.data || [];
      const mapped = data.map((item) => mapToSubastaListDto(item, tab === 'publicaciones'));
      setItems(mapped);
    } catch (err: unknown) {
      console.error(`Error al obtener ${tab}:`, err);
      let errorMsg = 'No fue posible cargar las actividades. Verifica tu conexión con el servidor.';
      if (axios.isAxiosError(err) && err.response?.data) {
        const d = err.response.data;
        errorMsg = typeof d === 'string' ? d : d.message || d.detail || errorMsg;
      }
      setError(errorMsg);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities(activeTab);
  }, [activeTab]);

  return (
    <div className="max-w-4xl mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8 font-sans select-none">
      {/* Cabecera Principal (Mismo patrón de diseño de Billetera y Publicar Subasta) */}
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

      {/* Selector de Pestañas (Tabs) con estilo coherente con Billetera */}
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
              {items.length}
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
              {items.length}
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
      ) : items.length === 0 ? (
        /* Estado Vacío (Empty State) armonizado con el patrón de diseño */
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
      ) : (
        /* Grilla de Subastas reutilizando AuctionCard */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 font-sans">
          {items.map((item) => (
            <AuctionCard key={item.id} auction={item} />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyActivities;

import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Tag, Gavel, ShieldCheck } from 'lucide-react';

export interface SubastaListDto {
  id: number;
  titulo: string;
  urlImagen: string;
  precioBase: number;
  precioActual: number;
  estado: number; // 0=Programada, 1=Activa, 2=Finalizada, 3=Desierta
  fechaFin: string;
  categoriaNombre: string;
  vendedorNombre: string;
  totalOfertas: number;
  esLider?: boolean;
  miOfertaMaxima?: number;
}

interface AuctionCardProps {
  auction: SubastaListDto;
}

export const AuctionCard: React.FC<AuctionCardProps> = ({ auction }) => {
  // Función para determinar el badge según el estado
  // 0=Programada (Azul), 1=Activa (Verde), 2=Finalizada / 3=Desierta (Gris)
  const renderEstadoBadge = () => {
    switch (auction.estado) {
      case 1:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-600/90 text-white backdrop-blur-sm shadow-sm">
            Activa
          </span>
        );
      case 0:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-600/90 text-white backdrop-blur-sm shadow-sm">
            Programada
          </span>
        );
      case 2:
      case 3:
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-600/90 text-white backdrop-blur-sm shadow-sm">
            Finalizada
          </span>
        );
    }
  };

  const formatFechaFin = (fechaIso: string) => {
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

  const formatCurrency = (monto: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(monto);
  };

  return (
    <div className="bg-brand-surface rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 overflow-hidden flex flex-col justify-between group font-sans">
      {/* Imagen Superior con Badge de Estado */}
      <div className="relative w-full h-52 bg-slate-100 overflow-hidden shrink-0">
        <img
          src={auction.urlImagen || '/images/default-subasta.jpg'}
          alt={auction.titulo}
          className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/images/default-subasta.jpg';
          }}
        />
        <div className="absolute top-3 right-3">
          {renderEstadoBadge()}
        </div>
      </div>

      {/* Contenido de la Tarjeta */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Categoría y Vendedor */}
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold mb-1.5 uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              {auction.categoriaNombre || 'General'}
            </span>
            <span className="text-slate-400 capitalize lowercase">
              {auction.vendedorNombre}
            </span>
          </div>

          {/* Título */}
          <h3
            className="text-lg font-bold text-brand-dark tracking-tight line-clamp-2 mb-3 group-hover:text-brand-action transition-colors"
            title={auction.titulo}
          >
            {auction.titulo}
          </h3>
        </div>

        {/* Información Financiera y Cierre */}
        <div className="border-t border-slate-100 pt-3 mt-1 space-y-2.5">
          {/* Oferta Actual Destacada */}
          <div>
            <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">
              {(auction.totalOfertas ?? 0) > 0 ? 'Oferta actual' : 'Precio base'}
            </span>
            <div className="text-2xl font-bold text-brand-action tracking-tight mt-0.5 font-sans">
              {formatCurrency(auction.precioActual || auction.precioBase)}
            </div>
          </div>

          {/* Banner de Liderazgo (solo presente en Mis Actividades cuando la subasta provee esLider) */}
          {auction.esLider && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
              <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-emerald-800 block">¡Estás liderando!</span>
                <span className="text-[11px] text-emerald-600 block truncate">
                  Tu oferta de {formatCurrency(auction.miOfertaMaxima ?? auction.precioActual)} encabeza la subasta.
                </span>
              </div>
            </div>
          )}

          {/* Métricas: Ofertas y Fecha de Cierre */}
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium pt-1">
            <div className="flex items-center gap-1.5" title="Total de ofertas registradas">
              <Gavel className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {auction.totalOfertas ?? 0}{' '}
                {(auction.totalOfertas ?? 0) === 1 ? 'oferta' : 'ofertas'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500" title="Fecha límite de cierre">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{formatFechaFin(auction.fechaFin)}</span>
            </div>
          </div>

          {/* Botón de Entrada a la Sala */}
          <div className="pt-2">
            <Link
              to={`/auctions/${auction.id}`}
              className="w-full py-2.5 px-4 rounded-lg bg-[#1E3A8A] hover:bg-[#1E40AF] text-white text-sm font-semibold text-center transition-colors shadow-sm block active:scale-[0.98]"
            >
              Ingresar a la Sala
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

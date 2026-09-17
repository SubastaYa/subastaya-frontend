import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Clock,
  Tag,
  Gavel,
  ArrowLeft,
  Calendar,
  AlertCircle,
  TrendingUp,
  UserCheck,
  Award,
  DollarSign
} from 'lucide-react';
import { HubConnectionBuilder, HubConnection, HubConnectionState, LogLevel } from '@microsoft/signalr';
import api, { TOKEN_STORAGE_KEY } from '../api/axios';
import { useAuth } from '../context/useAuth';

export interface OfertaResumenDto {
  id: number;
  monto: number;
  fechaHora?: string;
  fechaOferta?: string;
  compradorNombre: string;
}

export interface SubastaDetalleDto {
  id: number;
  titulo: string;
  descripcion: string;
  urlImagen: string;
  precioBase: number;
  precioActual: number;
  incrementoMinimo: number;
  estado: number; // 0=Programada, 1=Activa, 2=Finalizada, 3=Desierta
  fechaInicio: string;
  fechaFin: string;
  categoriaId: number;
  categoriaNombre: string;
  vendedorId: number;
  vendedorNombre: string;
  ultimasOfertas: OfertaResumenDto[];
  postorLiderId?: number | null;
}

interface ReceiveNewOfferPayload {
  amount: number;
  pseudonym: string;
  timestamp: string;
  buyerId?: number;
}

interface TimeExtendedPayload {
  newEndTime: string;
}

export const AuctionRoom: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const [auction, setAuction] = useState<SubastaDetalleDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    const fetchAuctionDetail = async () => {
      if (!id) {
        setErrorMessage('ID de subasta inválido.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      try {
        // Consultar el detalle de la subasta (funciona en /subastas/{id} o /auctions/{id})
        const response = await api.get<SubastaDetalleDto>(`/subastas/${id}`);
        if (isMounted) {
          setAuction(response.data);
        }
      } catch (err: unknown) {
        if (!isMounted) return;
        const axiosError = err as { response?: { status?: number } };
        if (axiosError.response?.status === 404) {
          setErrorMessage('Subasta no encontrada');
        } else {
          setErrorMessage('Ocurrió un error al cargar la información de la subasta.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchAuctionDetail();

    return () => {
      isMounted = false;
    };
  }, [id]);

  // Conexión en tiempo real con SignalR
  useEffect(() => {
    if (!auction?.id) return;

    const auctionId = Number(auction.id);
    const hubUrl = import.meta.env.VITE_HUB_URL || 'http://localhost:5017/hubs/auction';

    const connection: HubConnection = new HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => token || localStorage.getItem(TOKEN_STORAGE_KEY) || '',
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Information)
      .build();

    let isMounted = true;

    // Manejador del evento ReceiveNewOffer
    const handleNewOffer = (data: ReceiveNewOfferPayload) => {
      console.log('SignalR ReceiveNewOffer recibido:', data);
      setAuction((prev) => {
        if (!prev) return prev;
        const nuevaOferta: OfertaResumenDto = {
          id: Date.now(),
          monto: data.amount,
          fechaHora: data.timestamp,
          fechaOferta: data.timestamp,
          compradorNombre: data.pseudonym,
        };
        return {
          ...prev,
          precioActual: data.amount,
          ultimasOfertas: [nuevaOferta, ...(prev.ultimasOfertas || [])],
        };
      });
    };

    // Manejador del evento TimeExtended
    const handleTimeExtended = (data: TimeExtendedPayload) => {
      console.log('SignalR TimeExtended recibido:', data);
      setAuction((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          fechaFin: data.newEndTime,
        };
      });
    };

    // Suscripción a eventos del servidor
    connection.on('ReceiveNewOffer', handleNewOffer);
    connection.on('ReceiveNewBid', handleNewOffer);
    connection.on('TimeExtended', handleTimeExtended);

    connection.onreconnecting(() => {
      if (isMounted) setIsConnected(false);
      console.warn('SignalR: Reconectando al Hub de subastas...');
    });

    connection.onreconnected(async () => {
      if (isMounted) {
        setIsConnected(true);
        console.log('SignalR connection state: Connected');
        try {
          await connection.invoke('JoinAuctionGroup', auctionId);
        } catch (err) {
          console.error('Error al unirse nuevamente al grupo tras reconexión:', err);
        }
      }
    });

    connection.onclose(() => {
      if (isMounted) setIsConnected(false);
      console.log('SignalR: Conexión cerrada');
    });

    // Iniciar conexión y unirse al grupo de la subasta
    connection
      .start()
      .then(async () => {
        if (!isMounted) {
          await connection.stop();
          return;
        }
        setIsConnected(true);
        console.log('SignalR connection state: Connected');
        await connection.invoke('JoinAuctionGroup', auctionId);
        console.log(`Unido exitosamente al grupo de subasta #${auctionId}`);
      })
      .catch((err) => {
        if (isMounted) {
          setIsConnected(false);
          console.error('Error al conectar con SignalR Hub:', err);
        }
      });

    // Cleanup: abandonar grupo y detener la conexión
    return () => {
      isMounted = false;
      const leaveAndStop = async () => {
        try {
          if (connection.state === HubConnectionState.Connected) {
            await connection.invoke('LeaveAuctionGroup', auctionId);
            console.log(`Grupo de subasta #${auctionId} abandonado.`);
          }
        } catch (err) {
          console.error('Error al invocar LeaveAuctionGroup:', err);
        } finally {
          try {
            await connection.stop();
            console.log('Conexión SignalR detenida.');
          } catch (err) {
            console.error('Error al detener conexión SignalR:', err);
          }
        }
      };

      leaveAndStop();
    };
  }, [auction?.id, token]);

  // Formato monetario ARS
  const formatCurrency = (monto: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(monto);
  };

  // Formato de fecha y hora local
  const formatDateTime = (fechaIso?: string) => {
    if (!fechaIso) return '-';
    try {
      const fecha = new Date(fechaIso);
      return fecha.toLocaleString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return fechaIso;
    }
  };

  // Badge según el estado de la subasta
  const renderEstadoBadge = (estado: number) => {
    switch (estado) {
      case 1:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Activa
          </span>
        );
      case 0:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            Programada
          </span>
        );
      case 2:
      case 3:
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-700 border border-slate-300 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-slate-500"></span>
            Finalizada
          </span>
        );
    }
  };

  // Estado de carga elegante
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 font-sans">
        <div className="flex items-center gap-2 mb-8 text-slate-400">
          <div className="w-24 h-5 bg-slate-200 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-6">
            <div className="w-full h-80 bg-slate-200 rounded-2xl animate-pulse"></div>
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <div className="w-1/3 h-6 bg-slate-200 rounded animate-pulse"></div>
              <div className="w-3/4 h-8 bg-slate-200 rounded animate-pulse"></div>
              <div className="w-full h-24 bg-slate-100 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="lg:col-span-5">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
              <div className="w-1/2 h-6 bg-slate-200 rounded animate-pulse"></div>
              <div className="w-3/4 h-12 bg-slate-200 rounded animate-pulse"></div>
              <div className="w-full h-48 bg-slate-100 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Estado de error / 404
  if (errorMessage || !auction) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center font-sans">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-4 shadow-sm">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            {errorMessage || 'Subasta no encontrada'}
          </h2>
          <p className="text-slate-500 mb-6 max-w-md">
            No se pudo encontrar la subasta solicitada o el enlace ingresado no es válido.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#1E3A8A] hover:bg-[#1E40AF] text-white font-semibold text-sm transition-all shadow-sm active:scale-[0.98]"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al Catálogo
          </Link>
        </div>
      </div>
    );
  }

  const ofertas = auction.ultimasOfertas ?? [];
  const tieneOfertas = ofertas.length > 0;
  const precioLider = tieneOfertas ? auction.precioActual : auction.precioBase;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
      {/* Barra de navegación superior / Breadcrumbs */}
      <div className="flex items-center justify-between mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-[#1E3A8A] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al Catálogo
        </Link>
        <div className="flex items-center gap-3">
          {isConnected ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              En vivo
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              Conectando...
            </span>
          )}
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Sala de Subasta #{auction.id}
          </span>
        </div>
      </div>

      {/* Layout de dos columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ================= COLUMNA IZQUIERDA: PRODUCTO Y FICHA TÉCNICA ================= */}
        <div className="lg:col-span-7 space-y-6">
          {/* Imagen Principal del Producto */}
          <div className="relative w-full h-80 sm:h-96 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 shadow-sm group">
            <img
              src={auction.urlImagen || '/images/default-subasta.jpg'}
              alt={auction.titulo}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/images/default-subasta.jpg';
              }}
            />
            {/* Categoría flotante sobre la imagen */}
            <div className="absolute top-4 left-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/95 text-slate-700 shadow-md backdrop-blur-sm border border-slate-200">
                <Tag className="w-3.5 h-3.5 text-[#1E3A8A]" />
                {auction.categoriaNombre || 'General'}
              </span>
            </div>
          </div>

          {/* Ficha Técnica y Detalles */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
            {/* Cabecera del Artículo */}
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                <span className="flex items-center gap-1 text-slate-600">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  Vendedor: <strong className="text-slate-800">{auction.vendedorNombre}</strong>
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {auction.titulo}
              </h1>
            </div>

            {/* Descripción */}
            <div className="border-t border-slate-100 pt-5">
              <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                Descripción del Producto
              </h2>
              <p className="text-slate-600 leading-relaxed text-base whitespace-pre-line selectable-content">
                {auction.descripcion || 'Sin descripción detallada provista por el vendedor.'}
              </p>
            </div>

            {/* Especificaciones y Parámetros */}
            <div className="border-t border-slate-100 pt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Precio Base */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">
                  Precio Base de Salida
                </span>
                <span className="text-lg font-bold text-slate-800 mt-1 block">
                  {formatCurrency(auction.precioBase)}
                </span>
              </div>

              {/* Incremento Mínimo */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">
                  Incremento Mínimo por Oferta
                </span>
                <span className="text-lg font-bold text-slate-800 mt-1 block">
                  +{formatCurrency(auction.incrementoMinimo)}
                </span>
              </div>

              {/* Fecha de Inicio */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 uppercase tracking-wider">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Fecha de Inicio
                </span>
                <span className="text-sm font-semibold text-slate-700 mt-1 block">
                  {formatDateTime(auction.fechaInicio)}
                </span>
              </div>

              {/* Fecha de Cierre */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 uppercase tracking-wider">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Fecha de Cierre
                </span>
                <span className="text-sm font-semibold text-slate-700 mt-1 block">
                  {formatDateTime(auction.fechaFin)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ================= COLUMNA DERECHA: PANEL EN VIVO E HISTORIAL ================= */}
        <div className="lg:col-span-5 space-y-6">
          {/* Tarjeta de Estado y Precio Actual */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-6">
            {/* Encabezado: Estado */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Estado de la Subasta
              </span>
              {renderEstadoBadge(auction.estado)}
            </div>

            {/* Valor Actual Destacado */}
            <div className="bg-gradient-to-br from-slate-50 to-blue-50/40 rounded-xl p-5 border border-slate-100">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                <span>{tieneOfertas ? 'Oferta Actual Más Alta' : 'Precio Inicial de Salida'}</span>
                {tieneOfertas && (
                  <span className="flex items-center gap-1 text-emerald-600 font-semibold lowercase capitalize">
                    <TrendingUp className="w-3.5 h-3.5" />
                    En disputa
                  </span>
                )}
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold text-[#1E3A8A] tracking-tight mt-1 font-sans">
                {formatCurrency(precioLider)}
              </div>

              {/* Próxima oferta mínima sugerida */}
              {auction.estado === 1 && (
                <div className="mt-3 text-xs text-slate-500 flex items-center gap-1.5 pt-2 border-t border-slate-200/60">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>
                    Próxima oferta válida desde:{' '}
                    <strong className="text-slate-700 font-bold">
                      {formatCurrency(precioLider + auction.incrementoMinimo)}
                    </strong>
                  </span>
                </div>
              )}
            </div>

            {/* Historial Cronológico de Ofertas */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Gavel className="w-4 h-4 text-[#1E3A8A]" />
                  Historial de Ofertas
                </h3>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  {ofertas.length} {ofertas.length === 1 ? 'oferta' : 'ofertas'}
                </span>
              </div>

              {tieneOfertas ? (
                <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto pr-1">
                  {ofertas.map((oferta, index) => {
                    const esLider = index === 0;
                    const timestamp = oferta.fechaHora || oferta.fechaOferta;

                    return (
                      <div
                        key={oferta.id || index}
                        className={`py-3 px-3 rounded-xl transition-colors flex items-center justify-between gap-3 ${
                          esLider ? 'bg-emerald-50/50 border border-emerald-100/80 my-1' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                              esLider
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {esLider ? <Award className="w-4 h-4" /> : <Gavel className="w-4 h-4" />}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-slate-800 truncate">
                                {oferta.compradorNombre || 'Postor anónimo'}
                              </span>
                              {esLider && (
                                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                  Líder
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-400 block truncate">
                              {formatDateTime(timestamp)}
                            </span>
                          </div>
                        </div>

                        {/* Monto de la oferta */}
                        <div className="text-right shrink-0">
                          <span
                            className={`text-sm sm:text-base font-bold tracking-tight block ${
                              esLider ? 'text-emerald-700' : 'text-slate-700'
                            }`}
                          >
                            {formatCurrency(oferta.monto)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
                  <div className="w-10 h-10 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                    <Gavel className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-slate-600">
                    No hay ofertas registradas aún
                  </p>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    Esta subasta comenzará con el precio base inicial al recibir la primera puja.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctionRoom;

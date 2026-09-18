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
  DollarSign,
  Hourglass,
  Send,
  ShieldCheck,
  AlertTriangle,
  Banknote,
  Plus,
  CheckCircle,
  LogIn,
  Loader2
} from 'lucide-react';
import { HubConnectionBuilder, HubConnection, HubConnectionState, LogLevel } from '@microsoft/signalr';
import axios from 'axios';
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
  const { token, user, isAuthenticated } = useAuth();
  const [auction, setAuction] = useState<SubastaDetalleDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [tiempoRestante, setTiempoRestante] = useState<string>('');
  const [miUltimaOferta, setMiUltimaOferta] = useState<number | null>(null);
  const [offerAmount, setOfferAmount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [bidFeedback, setBidFeedback] = useState<{
    type: 'success' | 'error' | 'warning';
    title?: string;
    message: string;
  } | null>(null);

  // Contador regresivo en tiempo real vinculado a la fecha de cierre de la subasta
  useEffect(() => {
    if (!auction?.fechaFin) return;

    const actualizarContador = () => {
      const ahora = new Date().getTime();
      const fin = new Date(auction.fechaFin).getTime();
      const diferencia = fin - ahora;

      if (diferencia <= 0) {
        setTiempoRestante('Finalizada');
        return;
      }

      const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
      const horas = Math.floor((diferencia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));
      const segundos = Math.floor((diferencia % (1000 * 60)) / 1000);

      const pad = (n: number) => n.toString().padStart(2, '0');

      if (dias > 0) {
        setTiempoRestante(`${dias}d ${pad(horas)}h ${pad(minutos)}m ${pad(segundos)}s`);
      } else {
        setTiempoRestante(`${pad(horas)}h ${pad(minutos)}m ${pad(segundos)}s`);
      }
    };

    actualizarContador();
    const interval = setInterval(actualizarContador, 1000);

    return () => clearInterval(interval);
  }, [auction?.fechaFin]);

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

  // Inicializar miUltimaOferta si el usuario autenticado es el postor líder actual
  const postorLiderId = auction?.postorLiderId ?? null;
  const precioActualLider = auction?.precioActual ?? 0;
  const userId = user?.id ?? null;
  useEffect(() => {
    if (postorLiderId !== null && userId !== null && postorLiderId === Number(userId)) {
      setMiUltimaOferta(precioActualLider);
    }
  }, [postorLiderId, precioActualLider, userId]);

  // Actualizar offerAmount reactivamente cuando cambia el precio actual
  const precioActualRef = auction?.precioActual ?? 0;
  const incrementoMinimoRef = auction?.incrementoMinimo ?? 0;
  useEffect(() => {
    if (precioActualRef > 0 && incrementoMinimoRef > 0) {
      const minSiguiente = precioActualRef + incrementoMinimoRef;
      setOfferAmount((prev) => (prev < minSiguiente ? minSiguiente : prev));
    }
  }, [precioActualRef, incrementoMinimoRef]);

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
          postorLiderId: data.buyerId !== undefined ? data.buyerId : prev.postorLiderId,
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
      console.warn('SignalR: Reconectando al Hub de subastas...');
    });

    connection.onreconnected(async () => {
      if (isMounted) {
        console.log('SignalR connection state: Connected');
        try {
          await connection.invoke('JoinAuctionGroup', auctionId);
        } catch (err) {
          console.error('Error al unirse nuevamente al grupo tras reconexión:', err);
        }
      }
    });

    connection.onclose(() => {
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
        console.log('SignalR connection state: Connected');
        await connection.invoke('JoinAuctionGroup', auctionId);
        console.log(`Unido exitosamente al grupo de subasta #${auctionId}`);
      })
      .catch((err) => {
        if (isMounted) {
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

  // Enviar oferta al backend
  const handleSubmitOffer = async () => {
    if (!auction || !isAuthenticated || isSubmitting) return;

    const minRequerido = auction.precioActual + auction.incrementoMinimo;
    if (offerAmount < minRequerido) {
      setBidFeedback({
        type: 'error',
        message: `El monto mínimo para ofertar es ${formatCurrency(minRequerido)}.`,
      });
      return;
    }

    setIsSubmitting(true);
    setBidFeedback(null);

    try {
      await api.post(`/subastas/${auction.id}/ofertas`, { amount: offerAmount });
      setMiUltimaOferta(offerAmount);
      setBidFeedback({
        type: 'success',
        title: '¡Oferta confirmada!',
        message: `Tu puja de ${formatCurrency(offerAmount)} fue registrada exitosamente.`,
      });
      setTimeout(() => setBidFeedback(null), 4000);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const detail = (err.response?.data as Record<string, string>)?.detail
          || (err.response?.data as Record<string, string>)?.message;

        if (status === 409) {
          setBidFeedback({
            type: 'warning',
            title: '¡Oferta simultánea detectada!',
            message: detail || 'El precio se ha actualizado por una puja concurrente. Intenta nuevamente con el nuevo valor sugerido.',
          });
        } else if (status === 422) {
          setBidFeedback({
            type: 'error',
            title: 'Fondos insuficientes',
            message: detail || 'No dispones de saldo suficiente en tu billetera para respaldar esta oferta.',
          });
        } else if (status === 400) {
          setBidFeedback({
            type: 'error',
            message: detail || 'Subasta no activa o monto inferior al mínimo requerido.',
          });
        } else {
          setBidFeedback({
            type: 'error',
            message: detail || 'No se pudo procesar la oferta. Intenta nuevamente.',
          });
        }
      } else {
        setBidFeedback({
          type: 'error',
          message: 'Error de conexión con el servidor. Verifica tu red e intenta nuevamente.',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            Activa
          </span>
        );
      case 0:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
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
            Volver a las subastas
          </Link>
        </div>
      </div>
    );
  }

  const ofertas = auction.ultimasOfertas ?? [];
  const tieneOfertas = ofertas.length > 0;
  const precioLider = tieneOfertas ? auction.precioActual : auction.precioBase;
  const esLider = miUltimaOferta !== null && auction.precioActual === miUltimaOferta;
  const fueSuperado = miUltimaOferta !== null && auction.precioActual > miUltimaOferta;
  const subastaActiva = auction.estado === 1;
  const montoMinimo = auction.precioActual + auction.incrementoMinimo;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans">
      {/* Barra de navegación superior / Breadcrumbs */}
      <div className="flex items-center justify-between mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-[#1E3A8A] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a las subastas
        </Link>
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Sala de Subasta #{auction.id}
        </span>
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

          {/* Ficha Técnica y Detalles con fondo verde claro */}
          <div className="bg-[#E6F4EA] rounded-2xl border border-[#C5E8D2] shadow-sm p-6 sm:p-8 space-y-6">
            {/* Cabecera del Artículo */}
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/90 border border-emerald-200/80 shadow-xs">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  Vendedor: <strong className="text-slate-800">{auction.vendedorNombre}</strong>
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {auction.titulo}
              </h1>
            </div>

            {/* Descripción */}
            <div className="border-t border-[#C5E8D2]/80 pt-5">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2.5">
                Descripción del Producto
              </h2>
              <p className="text-slate-700 leading-relaxed text-base whitespace-pre-line selectable-content bg-white/75 p-4 rounded-xl border border-[#C5E8D2]/60">
                {auction.descripcion || 'Sin descripción detallada provista por el vendedor.'}
              </p>
            </div>

            {/* Especificaciones y Parámetros */}
            <div className="border-t border-[#C5E8D2]/80 pt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Precio Base */}
              <div className="bg-white/85 rounded-xl p-4 border border-[#C5E8D2] shadow-xs">
                <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">
                  Precio Base de Salida
                </span>
                <span className="text-lg font-bold text-slate-900 mt-1 block">
                  {formatCurrency(auction.precioBase)}
                </span>
              </div>

              {/* Incremento Mínimo */}
              <div className="bg-white/85 rounded-xl p-4 border border-[#C5E8D2] shadow-xs">
                <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">
                  Incremento Mínimo por Oferta
                </span>
                <span className="text-lg font-bold text-slate-900 mt-1 block">
                  +{formatCurrency(auction.incrementoMinimo)}
                </span>
              </div>

              {/* Fecha de Inicio */}
              <div className="bg-white/85 rounded-xl p-4 border border-[#C5E8D2] shadow-xs">
                <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 uppercase tracking-wider">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Fecha de Inicio
                </span>
                <span className="text-sm font-semibold text-slate-800 mt-1 block">
                  {formatDateTime(auction.fechaInicio)}
                </span>
              </div>

              {/* Fecha de Cierre */}
              <div className="bg-white/85 rounded-xl p-4 border border-[#C5E8D2] shadow-xs">
                <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 uppercase tracking-wider">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Fecha de Cierre
                </span>
                <span className="text-sm font-semibold text-slate-800 mt-1 block">
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
            {/* Encabezado: Estado y Cronómetro */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Estado de la Subasta
              </span>
              <div className="flex items-center gap-2.5">
                {renderEstadoBadge(auction.estado)}

                {/* Reloj de arena animado a la derecha de Activa, sin encapsular */}
                {tiempoRestante && (
                  <div
                    title={`Fecha de cierre: ${formatDateTime(auction.fechaFin)}`}
                    className="flex items-center gap-1.5 text-slate-600 font-mono text-xs font-semibold select-none"
                  >
                    <Hourglass className="w-3.5 h-3.5 text-slate-500 animate-[spin_3s_ease-in-out_infinite]" />
                    <span>{tiempoRestante}</span>
                  </div>
                )}
              </div>
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

            {/* ═══════════ CONSOLA DE PUJA ═══════════ */}
            {subastaActiva ? (
              isAuthenticated ? (
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  {/* Badge de liderazgo */}
                  {esLider && (
                    <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 shadow-sm">
                      <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-sm shrink-0">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-emerald-800 block">¡Eres el postor líder!</span>
                        <span className="text-xs text-emerald-600">Tu oferta de {formatCurrency(miUltimaOferta!)} encabeza la subasta.</span>
                      </div>
                    </div>
                  )}
                  {fueSuperado && (
                    <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 shadow-sm">
                      <div className="w-9 h-9 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-sm shrink-0">
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-amber-800 block">¡Tu oferta fue superada!</span>
                        <span className="text-xs text-amber-700">Puja ahora para recuperar la punta de la subasta.</span>
                      </div>
                    </div>
                  )}

                  {/* Controles de puja */}
                  <div className="space-y-3">
                    <label htmlFor="bid-amount-input" className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                      Tu Oferta
                    </label>

                    {/* Input monetario */}
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm pointer-events-none select-none">$</span>
                      <input
                        id="bid-amount-input"
                        type="number"
                        min={montoMinimo}
                        step={auction.incrementoMinimo}
                        value={offerAmount}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setOfferAmount(val >= 0 ? val : 0);
                        }}
                        disabled={isSubmitting}
                        className="w-full pl-9 pr-4 py-3.5 rounded-xl border border-slate-200 bg-white text-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A] transition-all disabled:opacity-50 disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>

                    {/* Botones de incremento rápido */}
                    <div className="flex gap-2">
                      {[1, 2, 5].map((multiplier) => {
                        const incremento = auction.incrementoMinimo * multiplier;
                        return (
                          <button
                            key={multiplier}
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => setOfferAmount(auction.precioActual + incremento)}
                            className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold border border-slate-200 bg-slate-50 text-slate-700 hover:bg-[#1E3A8A]/5 hover:border-[#1E3A8A]/30 hover:text-[#1E3A8A] transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Plus className="w-3 h-3" />
                            {formatCurrency(incremento)}
                          </button>
                        );
                      })}
                    </div>

                    {/* Botón confirmar oferta */}
                    <button
                      type="button"
                      onClick={handleSubmitOffer}
                      disabled={isSubmitting || offerAmount < montoMinimo}
                      className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-[#1E3A8A] hover:bg-[#1E40AF] text-white font-bold text-sm tracking-wide transition-all shadow-sm hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-sm"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Procesando oferta...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Confirmar Oferta — {offerAmount >= montoMinimo ? formatCurrency(offerAmount) : formatCurrency(montoMinimo)}
                        </>
                      )}
                    </button>
                  </div>

                  {/* Feedback de la oferta */}
                  {bidFeedback && (
                    <div
                      className={`flex items-start gap-3 p-3.5 rounded-xl border text-sm ${
                        bidFeedback.type === 'success'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : bidFeedback.type === 'warning'
                          ? 'bg-amber-50 border-amber-200 text-amber-800'
                          : 'bg-red-50 border-red-200 text-red-800'
                      }`}
                    >
                      <div className="shrink-0 mt-0.5">
                        {bidFeedback.type === 'success' ? (
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                        ) : bidFeedback.type === 'warning' ? (
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                      <div className="min-w-0">
                        {bidFeedback.title && (
                          <span className="font-bold block mb-0.5">{bidFeedback.title}</span>
                        )}
                        <span className="text-xs leading-relaxed block">{bidFeedback.message}</span>
                        {bidFeedback.type === 'error' && bidFeedback.title === 'Fondos insuficientes' && (
                          <Link
                            to="/wallet"
                            className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#1E3A8A] hover:text-[#1E40AF] underline underline-offset-2 transition-colors"
                          >
                            <Banknote className="w-3.5 h-3.5" />
                            Ir a Mi Billetera para recargar
                          </Link>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Usuario no autenticado */
                <div className="border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                      <LogIn className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-slate-700 block">Inicia sesión para ofertar</span>
                      <span className="text-xs text-slate-500">Debes estar registrado para participar en esta subasta.</span>
                    </div>
                  </div>
                </div>
              )
            ) : (
              auction.estado === 0 ? (
                <div className="border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 shrink-0">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-blue-800 block">Subasta programada</span>
                      <span className="text-xs text-blue-600">Las pujas se habilitarán cuando la subasta comience.</span>
                    </div>
                  </div>
                </div>
              ) : null
            )}

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
                        className={`py-3 px-3 rounded-xl transition-colors flex items-center justify-between gap-3 ${esLider ? 'bg-emerald-50/50 border border-emerald-100/80 my-1' : 'hover:bg-slate-50'
                          }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${esLider
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
                            className={`text-sm sm:text-base font-bold tracking-tight block ${esLider ? 'text-emerald-700' : 'text-slate-700'
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

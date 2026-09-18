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
  DollarSign,
  Send,
  ShieldCheck,
  AlertTriangle,
  Banknote,
  Plus,
  CheckCircle,
  LogIn,
  Loader2,
  Zap,
  Trophy,
  X,
  Award,
  FileText
} from 'lucide-react';
import { HubConnectionBuilder, HubConnection, HubConnectionState, LogLevel } from '@microsoft/signalr';
import axios from 'axios';
import { TOKEN_STORAGE_KEY } from '../api/axios';
import { auctionService } from '../services';
import { useAuth } from '../context/useAuth';
import { parseApiDate, formatLocalDateTimeWithSeconds } from '../utils/dateUtils';

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

export interface AuctionClosedPayload {
  auctionId: number;
  status: string; // "Finalizada" | "Desierta"
  winnerPseudonym?: string | null;
  finalAmount?: number | null;
}

export const AuctionRoom: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { token, user, isAuthenticated } = useAuth();
  const [auction, setAuction] = useState<SubastaDetalleDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isCriticalZone, setIsCriticalZone] = useState<boolean>(false);
  const [showAntiSnipingAlert, setShowAntiSnipingAlert] = useState<boolean>(false);
  const [isFinalized, setIsFinalized] = useState<boolean>(false);
  const [closedEventData, setClosedEventData] = useState<AuctionClosedPayload | null>(null);
  const [showClosedModal, setShowClosedModal] = useState<boolean>(false);
  const [isLoadingAllOffers, setIsLoadingAllOffers] = useState<boolean>(false);
  const [hasLoadedAllOffers, setHasLoadedAllOffers] = useState<boolean>(false);
  const [selectedOfferDetail, setSelectedOfferDetail] = useState<OfertaResumenDto | null>(null);
  const [isLoadingOfferDetail, setIsLoadingOfferDetail] = useState<boolean>(false);
  const [showOfferDetailModal, setShowOfferDetailModal] = useState<boolean>(false);
  const [offerDetailError, setOfferDetailError] = useState<string | null>(null);
  const [miUltimaOferta, setMiUltimaOferta] = useState<number | null>(null);
  const [offerAmount, setOfferAmount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [bidFeedback, setBidFeedback] = useState<{
    type: 'success' | 'error' | 'warning';
    title?: string;
    message: string;
  } | null>(null);

  // Contador regresivo en tiempo real segundo a segundo con detección de zona crítica y finalización
  useEffect(() => {
    if (!auction?.fechaFin) return;

    let intervalId: ReturnType<typeof setInterval> | null = null;

    const actualizarContador = () => {
      const ahora = Date.now();
      const fin = parseApiDate(auction.fechaFin).getTime();
      const diferencia = fin - ahora;

      if (diferencia <= 0) {
        setTimeLeft('00:00:00');
        setIsCriticalZone(false);
        setIsFinalized(true);
        if (intervalId) clearInterval(intervalId);
        return;
      }

      setIsFinalized(false);
      // Zona crítica: restan 60 segundos o menos
      setIsCriticalZone(diferencia <= 60000);

      const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
      const horas = Math.floor((diferencia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));
      const segundos = Math.floor((diferencia % (1000 * 60)) / 1000);

      const pad = (n: number) => n.toString().padStart(2, '0');

      if (dias > 0) {
        setTimeLeft(`${dias}d ${pad(horas)}:${pad(minutos)}:${pad(segundos)}`);
      } else {
        setTimeLeft(`${pad(horas)}:${pad(minutos)}:${pad(segundos)}`);
      }
    };

    actualizarContador();
    intervalId = setInterval(actualizarContador, 1000);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
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
        const response = await auctionService.getById(id);
        if (isMounted) {
          setAuction(response.data as SubastaDetalleDto);
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

  // Inicializar y persistir miUltimaOferta en localStorage para mantener el estado tras recargar (F5)
  const postorLiderId = auction?.postorLiderId ?? null;
  const precioActualLider = auction?.precioActual ?? 0;
  const userId = user?.id ?? null;
  const currentAuctionId = auction?.id ?? null;

  useEffect(() => {
    if (!currentAuctionId || !userId) return;
    const storageKey = `subastaya_mi_oferta_${currentAuctionId}_${userId}`;
    const valorGuardado = localStorage.getItem(storageKey);

    if (postorLiderId !== null && postorLiderId === Number(userId)) {
      setMiUltimaOferta(precioActualLider);
      localStorage.setItem(storageKey, String(precioActualLider));
    } else if (valorGuardado) {
      const montoParsed = Number(valorGuardado);
      if (!isNaN(montoParsed) && montoParsed > 0) {
        setMiUltimaOferta(montoParsed);
      }
    }
  }, [postorLiderId, precioActualLider, userId, currentAuctionId]);

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
    const hubUrl =
      import.meta.env.VITE_HUB_URL ||
      (import.meta.env.VITE_API_URL
        ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '/hubs/auction')
        : 'http://localhost:5017/hubs/auction');

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

    // Manejador del evento TimeExtended (Regla Anti-Sniping)
    const handleTimeExtended = (data: TimeExtendedPayload) => {
      console.log('SignalR TimeExtended recibido:', data);
      setAuction((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          fechaFin: data.newEndTime,
        };
      });
      setShowAntiSnipingAlert(true);
      setTimeout(() => {
        setShowAntiSnipingAlert(false);
      }, 5000);
    };

    // Manejador del evento AuctionClosed (Liquidación por Worker o Cierre de Subasta)
    const handleAuctionClosed = (data: AuctionClosedPayload) => {
      console.log('SignalR AuctionClosed recibido en tiempo real:', data);
      const esDesierta = data.status.toLowerCase().includes('desierta');
      setAuction((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          estado: esDesierta ? 3 : 2,
        };
      });
      setIsFinalized(true);
      setTimeLeft('00:00:00');
      setIsCriticalZone(false);
      setClosedEventData(data);
      setShowClosedModal(true);
    };

    // Suscripción a eventos del servidor
    connection.on('ReceiveNewOffer', handleNewOffer);
    connection.on('ReceiveNewBid', handleNewOffer);
    connection.on('TimeExtended', handleTimeExtended);
    connection.on('AuctionClosed', handleAuctionClosed);

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

  // Cargar historial completo de ofertas si hay más de 5
  const fetchFullOfferHistory = async () => {
    if (!auction?.id || isLoadingAllOffers) return;
    setIsLoadingAllOffers(true);
    try {
      const resp = await auctionService.getOffers(auction.id);
      if (Array.isArray(resp.data)) {
        setAuction((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            ultimasOfertas: resp.data as OfertaResumenDto[],
          };
        });
        setHasLoadedAllOffers(true);
      }
    } catch (err) {
      console.error('Error al cargar historial completo de ofertas:', err);
    } finally {
      setIsLoadingAllOffers(false);
    }
  };

  // Consultar comprobante individual de oferta (GET /api/subastas/{id}/ofertas/{ofertaId})
  const handleViewOfferDetail = async (ofertaId: number) => {
    if (!auction?.id) return;
    setIsLoadingOfferDetail(true);
    setOfferDetailError(null);
    setShowOfferDetailModal(true);
    try {
      const resp = await auctionService.getOfferById(auction.id, ofertaId);
      setSelectedOfferDetail(resp.data as OfertaResumenDto);
    } catch (err) {
      console.error('Error al obtener detalle de oferta individual:', err);
      setOfferDetailError('No se pudo recuperar el detalle individual de la oferta.');
    } finally {
      setIsLoadingOfferDetail(false);
    }
  };

  // Enviar oferta al backend
  const handleSubmitOffer = async () => {
    if (!auction || !isAuthenticated || isSubmitting || isFinalized || auction.estado !== 1) return;

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
      await auctionService.submitBid(auction.id, offerAmount);
      setMiUltimaOferta(offerAmount);
      if (user?.id) {
        localStorage.setItem(`subastaya_mi_oferta_${auction.id}_${user.id}`, String(offerAmount));
      }
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

  // Formato de fecha y hora local robusto
  const formatDateTime = (fechaIso?: string) => {
    return formatLocalDateTimeWithSeconds(fechaIso);
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
  const esLider = (auction.postorLiderId !== null && auction.postorLiderId !== undefined && user?.id && auction.postorLiderId === Number(user.id)) ||
    (miUltimaOferta !== null && auction.precioActual === miUltimaOferta);
  const fueSuperado = !esLider && miUltimaOferta !== null && auction.precioActual > miUltimaOferta;
  const subastaActiva = auction.estado === 1 && !isFinalized;
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

      {/* Alerta Anti-Sniping Reactiva */}
      {showAntiSnipingAlert && (
        <div className="mb-6 flex items-center gap-3.5 p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 shadow-sm transition-all duration-300 animate-pulse">
          <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Zap className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="font-bold text-sm text-amber-900 block">
              ¡Regla Anti-Sniping activada!
            </span>
            <span className="text-xs text-amber-700 block">
              El cierre se ha extendido 2 minutos adicionales.
            </span>
          </div>
        </div>
      )}

      {/* Modal / Banner Flotante de Subasta Finalizada en Tiempo Real */}
      {showClosedModal && closedEventData && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 text-center animate-in fade-in zoom-in-95 duration-200 relative">
            <button
              type="button"
              onClick={() => setShowClosedModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              title="Cerrar aviso"
            >
              <X className="w-5 h-5" />
            </button>

            {closedEventData.status.toLowerCase().includes('desierta') ? (
              <>
                <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-4 border border-slate-200">
                  <Gavel className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Subasta Desierta</h3>
                <p className="text-sm text-slate-600 mb-6">
                  El tiempo de la subasta ha concluido sin recibir ofertas válidas registradas.
                </p>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200 shadow-sm">
                  <Trophy className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">¡Subasta Adjudicada!</h3>
                <p className="text-xs text-slate-500 mb-4">
                  La subasta ha concluido y fue liquidada con éxito.
                </p>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 mb-6 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Ganador adjudicado:</span>
                    <strong className="text-slate-800 text-sm font-bold">
                      {closedEventData.winnerPseudonym || 'Postor anónimo'}
                    </strong>
                  </div>
                  {closedEventData.finalAmount && (
                    <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-200">
                      <span>Monto final liquidado:</span>
                      <strong className="text-emerald-700 text-base font-extrabold">
                        {formatCurrency(closedEventData.finalAmount)}
                      </strong>
                    </div>
                  )}
                </div>
              </>
            )}

            <button
              type="button"
              onClick={() => setShowClosedModal(false)}
              className="w-full py-2.5 px-4 rounded-xl bg-[#1E3A8A] hover:bg-[#1E40AF] text-white font-semibold text-sm transition-colors shadow-sm cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Modal de Comprobante / Detalle Individual de Oferta (GET /api/subastas/{id}/ofertas/{ofertaId}) */}
      {showOfferDetailModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 bg-[#E6F4EA] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-slate-900 text-base">
                  Comprobante Oficial de Oferta
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowOfferDetailModal(false)}
                className="text-slate-500 hover:text-slate-800 rounded-lg p-1 transition-colors cursor-pointer"
                title="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {isLoadingOfferDetail ? (
                <div className="flex flex-col items-center justify-center py-10 text-slate-500">
                  <Loader2 className="w-8 h-8 animate-spin text-brand-action mb-2" />
                  <span className="text-xs font-medium">Consultando registro individual en servidor...</span>
                </div>
              ) : offerDetailError ? (
                <div className="text-center py-6">
                  <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
                  <p className="text-sm text-slate-700">{offerDetailError}</p>
                </div>
              ) : selectedOfferDetail ? (
                <div className="space-y-4 text-xs">
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between text-slate-500">
                      <span>ID de Oferta:</span>
                      <span className="font-mono font-bold text-slate-800 text-sm">
                        #{selectedOfferDetail.id}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-500">
                      <span>Subasta:</span>
                      <span className="font-semibold text-slate-800 truncate max-w-[220px]">
                        #{auction.id} - {auction.titulo}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-500">
                      <span>Comprador:</span>
                      <span className="font-mono font-semibold text-slate-800">
                        {selectedOfferDetail.compradorNombre}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-500">
                      <span>Fecha y hora oficial:</span>
                      <span className="font-mono text-slate-700">
                        {formatDateTime(selectedOfferDetail.fechaHora)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                      <span className="font-bold text-slate-700">Monto ofertado:</span>
                      <span className="text-lg font-extrabold text-emerald-700">
                        {formatCurrency(selectedOfferDetail.monto)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl">
                    <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span className="text-[11px] font-medium leading-relaxed">
                      Oferta verificada y respaldada por retención de saldo (escrow) en el ledger del sistema.
                    </span>
                  </div>
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => setShowOfferDetailModal(false)}
                className="mt-6 w-full py-2.5 px-4 rounded-xl bg-brand-action hover:bg-brand-action-hover text-white font-semibold text-xs transition-colors shadow-sm cursor-pointer"
              >
                Cerrar comprobante
              </button>
            </div>
          </div>
        </div>
      )}

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
                {isFinalized || auction.estado === 2 || auction.estado === 3 ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-700 border border-slate-300 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                    SUBASTA FINALIZADA
                  </span>
                ) : (
                  <>
                    {renderEstadoBadge(auction.estado)}

                    {/* Temporizador digital en vivo con detección de zona crítica */}
                    {timeLeft && (
                      <div
                        title={`Fecha de cierre: ${formatDateTime(auction.fechaFin)}`}
                        className={`flex items-center gap-1.5 font-mono text-xs select-none px-2.5 py-1 rounded-lg border transition-all ${
                          isCriticalZone
                            ? 'text-red-600 font-extrabold animate-pulse bg-red-50 border-red-200 shadow-sm ring-1 ring-red-500/20'
                            : 'text-slate-700 font-bold bg-slate-100 border-slate-200'
                        }`}
                      >
                        <Clock className={`w-3.5 h-3.5 ${isCriticalZone ? 'text-red-600 animate-spin' : 'text-slate-500'}`} />
                        <span>{timeLeft}</span>
                      </div>
                    )}
                  </>
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
              ) : (
                <div className="border-t border-slate-100 pt-4">
                  <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                        {auction.estado === 3 ? <Gavel className="w-5 h-5" /> : <Award className="w-5 h-5 text-amber-600" />}
                      </div>
                      <div className="min-w-0">
                        <span className="text-sm font-bold text-slate-800 block">
                          {auction.estado === 3 ? 'Subasta Desierta' : 'Subasta Finalizada'}
                        </span>
                        <span className="text-xs text-slate-500">
                          {auction.estado === 3
                            ? 'Esta subasta ha concluido sin ofertas registradas.'
                            : closedEventData?.winnerPseudonym
                            ? `Adjudicada a ${closedEventData.winnerPseudonym}`
                            : 'Esta subasta ha concluido y ya no acepta nuevas ofertas.'}
                        </span>
                      </div>
                    </div>
                    {closedEventData?.finalAmount && (
                      <div className="text-xs text-slate-600 pt-1 border-t border-slate-200 flex justify-between items-center">
                        <span>Monto adjudicado:</span>
                        <strong className="text-sm font-bold text-emerald-700">
                          {formatCurrency(closedEventData.finalAmount)}
                        </strong>
                      </div>
                    )}
                  </div>
                </div>
              )
            )}

            {/* Historial Cronológico de Ofertas */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Gavel className="w-4 h-4 text-[#1E3A8A]" />
                  Historial de Ofertas
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    {ofertas.length} {ofertas.length === 1 ? 'oferta' : 'ofertas'}
                  </span>
                  {!hasLoadedAllOffers && ofertas.length >= 5 && (
                    <button
                      type="button"
                      onClick={fetchFullOfferHistory}
                      disabled={isLoadingAllOffers}
                      className="text-[11px] font-semibold text-[#1E3A8A] hover:underline cursor-pointer disabled:opacity-50"
                    >
                      {isLoadingAllOffers ? 'Cargando...' : 'Ver todas'}
                    </button>
                  )}
                </div>
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
                            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 p-1.5 ${esLider
                                ? 'bg-emerald-600 shadow-sm ring-2 ring-emerald-200'
                                : 'bg-slate-100 border border-slate-200'
                              }`}
                          >
                            <img
                              src="/bow_tie.png?v=1"
                              alt="Moño"
                              className="w-5.5 h-auto object-contain"
                            />
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

                        {/* Monto de la oferta y botón de comprobante oficial */}
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="text-right">
                            <span
                              className={`text-sm sm:text-base font-bold tracking-tight block ${esLider ? 'text-emerald-700' : 'text-slate-700'
                                }`}
                            >
                              {formatCurrency(oferta.monto)}
                            </span>
                          </div>

                          {oferta.id && (
                            <button
                              type="button"
                              onClick={() => handleViewOfferDetail(oferta.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-brand-action hover:bg-slate-200/60 transition-colors cursor-pointer"
                              title={`Ver comprobante oficial de oferta #${oferta.id}`}
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          )}
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

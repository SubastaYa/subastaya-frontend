import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  RefreshCw,
  Clock,
  User,
  Copy,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { auditService } from '../services';

export interface AuditLogItem {
  id: string;
  accion: string;
  detalles: string;
  entidadAfectada?: string | null;
  entidadId?: string | null;
  usuarioId?: number | null;
  fechaEvento: string;
}

const ACCIONES_SISTEMA: { value: string; label: string }[] = [
  { value: 'ACTIVACION_WORKER', label: 'ACTIVACION_WORKER (Inicio automático)' },
  { value: 'CIERRE_WORKER_VENTA', label: 'CIERRE_WORKER_VENTA (Adjudicación)' },
  { value: 'CIERRE_WORKER_DESIERTA', label: 'CIERRE_WORKER_DESIERTA (Desierta)' },
  { value: 'ACREDITACION_SALDO', label: 'ACREDITACION_SALDO (Depósito)' },
  { value: 'EXTENSION_TIEMPO', label: 'EXTENSION_TIEMPO (Regla anti-sniping)' },
  { value: 'INTENTO_OFERTA_FALLIDO_SALDO', label: 'INTENTO_OFERTA_FALLIDO_SALDO (Saldo insuficiente)' },
  { value: 'INTENTO_OFERTA_FALLIDO_AUTOOFERTA', label: 'INTENTO_OFERTA_FALLIDO_AUTOOFERTA (Auto-puja)' },
  { value: 'INTENTO_OFERTA_FALLIDO_VENDEDOR', label: 'INTENTO_OFERTA_FALLIDO_VENDEDOR (Puja de vendedor)' },
  { value: 'INTENTO_OFERTA_FALLIDO_CONCURRENCIA', label: 'INTENTO_OFERTA_FALLIDO_CONCURRENCIA (Concurrencia)' },
  { value: 'BLOQUEO_ACCION_AUDITOR', label: 'BLOQUEO_ACCION_AUDITOR (Acción restringida)' },
];

export const AuditLogsSection: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filtros
  const [selectedEntidad, setSelectedEntidad] = useState<string>('');
  const [selectedAccion, setSelectedAccion] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const pageSize = 15;

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const params: Record<string, string | number> = {
        page,
        pageSize,
      };
      if (selectedEntidad.trim()) {
        params.entidad = selectedEntidad.trim();
      }
      if (selectedAccion.trim()) {
        params.accion = selectedAccion.trim();
      }

      const response = await auditService.getLogs(params);
      if (Array.isArray(response.data)) {
        setLogs(response.data);
      } else {
        setLogs([]);
      }
    } catch (err) {
      console.error('Error al obtener audit logs:', err);
      setErrorMessage('No se pudieron cargar los registros de auditoría. Intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  }, [page, selectedEntidad, selectedAccion]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getEntityBadgeColor = (entidad?: string | null) => {
    switch (entidad?.toLowerCase()) {
      case 'billetera':
      case 'wallet':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'subasta':
      case 'auction':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'oferta':
      case 'bid':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'usuario':
      case 'user':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const formatDateTime = (isoString?: string) => {
    if (!isoString) return '-';
    try {
      const date = new Date(isoString);
      return date.toLocaleString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const getActionBadgeColor = (accion: string) => {
    if (accion.includes('FALLIDO') || accion.includes('BLOQUEO')) {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    if (accion.includes('VENTA') || accion.includes('ACREDITACION')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (accion.includes('DESIERTA')) {
      return 'bg-amber-50 text-amber-800 border-amber-200';
    }
    if (accion.includes('EXTENSION') || accion.includes('WORKER')) {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    return 'bg-slate-100 text-slate-800 border-slate-200';
  };

  const accionesDisponibles = useMemo(() => {
    const knownValues = new Set(ACCIONES_SISTEMA.map((a) => a.value));
    const dynamicAcciones = logs
      .map((l) => l.accion)
      .filter((a): a is string => Boolean(a) && !knownValues.has(a));

    return [
      ...ACCIONES_SISTEMA,
      ...Array.from(new Set(dynamicAcciones)).map((a) => ({ value: a, label: a })),
    ];
  }, [logs]);

  const entidadesDisponibles = useMemo(() => {
    const defaultEntidades = ['SUBASTA', 'Billetera', 'Oferta', 'Sistema'];
    const fromLogs = logs.map((l) => l.entidadAfectada).filter((e): e is string => Boolean(e));
    return Array.from(new Set([...defaultEntidades, ...fromLogs]));
  }, [logs]);

  return (
    <div className="bg-brand-surface rounded-xl border border-slate-200 shadow-sm overflow-hidden font-sans">
      {/* Barra de Filtros y Actualización */}
      <div className="p-4 sm:px-6 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3 font-sans">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor="filter-entidad" className="text-xs font-semibold text-slate-600 font-sans">
              Entidad:
            </label>
            <select
              id="filter-entidad"
              value={selectedEntidad}
              onChange={(e) => {
                setSelectedEntidad(e.target.value);
                setPage(1);
              }}
              className="text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-action text-slate-700 font-sans cursor-pointer"
            >
              <option value="">Todas las entidades</option>
              {entidadesDisponibles.map((ent) => (
                <option key={ent} value={ent}>
                  {ent}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="filter-accion" className="text-xs font-semibold text-slate-600 font-sans">
              Acción:
            </label>
            <select
              id="filter-accion"
              value={selectedAccion}
              onChange={(e) => {
                setSelectedAccion(e.target.value);
                setPage(1);
              }}
              className="text-xs font-medium bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-action text-slate-700 font-sans cursor-pointer"
            >
              <option value="">Todas las acciones</option>
              {accionesDisponibles.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          {(selectedEntidad || selectedAccion) && (
            <button
              type="button"
              onClick={() => {
                setSelectedEntidad('');
                setSelectedAccion('');
                setPage(1);
              }}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold underline cursor-pointer font-sans"
            >
              Limpiar filtros
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={fetchLogs}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs cursor-pointer disabled:opacity-50 font-sans"
          title="Actualizar registros"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Contenido principal de la tabla */}
      <div className="p-0 font-sans">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500 font-sans">
            <Loader2 className="w-8 h-8 animate-spin text-brand-action mb-2" />
            <span className="text-sm font-medium">Cargando registros de auditoría...</span>
          </div>
        ) : errorMessage ? (
          <div className="p-8 text-center font-sans">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-rose-100 text-rose-600 mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <p className="text-sm text-slate-700 font-semibold">{errorMessage}</p>
            <button
              type="button"
              onClick={fetchLogs}
              className="mt-3 px-4 py-2 text-xs font-semibold text-white bg-brand-action hover:bg-brand-action-hover rounded-lg transition-colors cursor-pointer font-sans"
            >
              Reintentar
            </button>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-slate-500 font-sans">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700 font-sans">No se encontraron eventos de auditoría</p>
            <p className="text-xs text-slate-400 mt-1 font-sans">
              {selectedEntidad || selectedAccion
                ? 'Prueba modificando o limpiando los filtros seleccionados.'
                : 'Aún no se han generado registros en el sistema.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto font-sans">
            <table className="w-full text-left border-collapse text-xs sm:text-sm font-sans">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold text-[11px] font-sans">
                  <th className="py-3.5 px-4 font-sans">Fecha y Hora</th>
                  <th className="py-3.5 px-4 font-sans">Acción</th>
                  <th className="py-3.5 px-4 font-sans">Entidad</th>
                  <th className="py-3.5 px-4 font-sans">Detalles</th>
                  <th className="py-3.5 px-4 font-sans">Usuario ID</th>
                  <th className="py-3.5 px-4 text-right font-sans">ID Evento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors font-sans">
                    <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap font-sans">
                      <div className="flex items-center gap-1.5 font-medium text-xs font-sans">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{formatDateTime(log.fechaEvento)}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-sans">
                      <span
                        className={`inline-block font-semibold text-xs px-2.5 py-1 rounded-md border font-sans ${getActionBadgeColor(
                          log.accion
                        )}`}
                      >
                        {log.accion}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-sans">
                      {log.entidadAfectada ? (
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border font-sans ${getEntityBadgeColor(
                            log.entidadAfectada
                          )}`}
                        >
                          {log.entidadAfectada} {log.entidadId ? `#${log.entidadId}` : ''}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs font-sans">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 max-w-xs md:max-w-md break-words text-xs leading-relaxed font-sans">
                      {log.detalles}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap font-sans">
                      {log.usuarioId ? (
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium text-xs font-sans">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{log.usuarioId}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-xs font-sans">Sistema</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap font-sans">
                      <button
                        type="button"
                        onClick={() => handleCopyId(log.id)}
                        className="inline-flex items-center gap-1 text-[11px] font-sans text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-md border border-slate-200 transition-colors cursor-pointer"
                        title={`Copiar GUID completo: ${log.id}`}
                      >
                        {copiedId === log.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-700 font-medium font-sans">Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-slate-400" />
                            <span className="font-mono text-[11px]">{log.id.substring(0, 8)}...</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Paginador */}
      <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 font-sans">
        <div>
          Página <span className="font-semibold text-slate-800">{page}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || isLoading}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 cursor-pointer font-semibold font-sans transition-colors"
          >
            Anterior
          </button>
          <button
            type="button"
            onClick={() => setPage((p) => p + 1)}
            disabled={logs.length < pageSize || isLoading}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 cursor-pointer font-semibold font-sans transition-colors"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuditLogsSection;

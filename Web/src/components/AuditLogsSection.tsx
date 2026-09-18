import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  RefreshCw,
  PlusCircle,
  Clock,
  User,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  X,
  Send
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

  // Modal para registrar nuevo log manual (POST /api/audit-logs)
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    accion: 'NOTA_AUDITORIA',
    entidadAfectada: 'Sistema',
    entidadId: '',
    detalles: '',
  });

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

  const handleCreateLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.accion.trim() || !formData.detalles.trim()) {
      setModalError('La acción y los detalles son requeridos.');
      return;
    }

    setIsSubmitting(true);
    setModalError(null);

    try {
      await auditService.createLog({
        accion: formData.accion.trim(),
        detalles: formData.detalles.trim(),
        entidadAfectada: formData.entidadAfectada.trim() || null,
        entidadId: formData.entidadId.trim() || null,
      });

      setShowCreateModal(false);
      setFormData({
        accion: 'NOTA_AUDITORIA',
        entidadAfectada: 'Sistema',
        entidadId: '',
        detalles: '',
      });
      // Refrescar lista de auditoría
      fetchLogs();
    } catch (err) {
      console.error('Error al registrar log manual:', err);
      setModalError('No se pudo registrar el evento de auditoría en el backend.');
    } finally {
      setIsSubmitting(false);
    }
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

  return (
    <div className="bg-brand-surface rounded-xl border border-slate-200 shadow-sm overflow-hidden font-sans">
      {/* Encabezado del panel de auditoría */}
      <div className="p-4 sm:p-6 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-900">
              Registro de Actividad
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Registro de eventos, transacciones y acciones del sistema.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchLogs}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
            title="Refrescar lista"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-brand-action hover:bg-brand-action-hover rounded-lg transition-colors shadow-sm cursor-pointer"
            title="Registrar nuevo evento de auditoría"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Registrar Evento</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="p-4 border-b border-slate-100 bg-white flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label htmlFor="filter-entidad" className="text-xs font-medium text-slate-600">
            Entidad:
          </label>
          <select
            id="filter-entidad"
            value={selectedEntidad}
            onChange={(e) => {
              setSelectedEntidad(e.target.value);
              setPage(1);
            }}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-action"
          >
            <option value="">Todas las entidades</option>
            <option value="Billetera">Billetera</option>
            <option value="Subasta">Subasta</option>
            <option value="Oferta">Oferta</option>
            <option value="Sistema">Sistema</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="filter-accion" className="text-xs font-medium text-slate-600">
            Acción:
          </label>
          <select
            id="filter-accion"
            value={selectedAccion}
            onChange={(e) => {
              setSelectedAccion(e.target.value);
              setPage(1);
            }}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-action"
          >
            <option value="">Todas las acciones</option>
            <option value="ACREDITACION_SALDO">ACREDITACION_SALDO</option>
            <option value="CrearOferta">CrearOferta</option>
            <option value="LIQUIDACION_SUBASTA">LIQUIDACION_SUBASTA</option>
            <option value="NOTA_AUDITORIA">NOTA_AUDITORIA</option>
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
            className="text-xs text-rose-600 hover:text-rose-700 font-medium underline ml-auto cursor-pointer"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Contenido principal */}
      <div className="p-0">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-brand-action mb-2" />
            <span className="text-sm font-medium">Cargando registros de auditoría...</span>
          </div>
        ) : errorMessage ? (
          <div className="p-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-rose-100 text-rose-600 mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <p className="text-sm text-slate-700 font-medium">{errorMessage}</p>
            <button
              type="button"
              onClick={fetchLogs}
              className="mt-3 px-4 py-2 text-xs font-semibold text-white bg-brand-action hover:bg-brand-action-hover rounded-lg transition-colors cursor-pointer"
            >
              Reintentar
            </button>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-14 text-center text-slate-500">
            <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-700">No se encontraron eventos de auditoría</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {selectedEntidad || selectedAccion
                ? 'Prueba modificando los filtros seleccionados.'
                : 'Aún no se han generado registros en el sistema.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold text-[11px]">
                  <th className="py-3 px-4">Fecha y Hora</th>
                  <th className="py-3 px-4">Acción</th>
                  <th className="py-3 px-4">Entidad</th>
                  <th className="py-3 px-4">Detalles</th>
                  <th className="py-3 px-4">Usuario ID</th>
                  <th className="py-3 px-4 text-right">ID Evento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{formatDateTime(log.fechaEvento)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {log.accion}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {log.entidadAfectada ? (
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getEntityBadgeColor(
                            log.entidadAfectada
                          )}`}
                        >
                          {log.entidadAfectada} {log.entidadId ? `#${log.entidadId}` : ''}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-700 max-w-xs md:max-w-md break-words">
                      {log.detalles}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {log.usuarioId ? (
                        <div className="flex items-center gap-1 text-slate-600 font-mono">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>{log.usuarioId}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Sistema</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleCopyId(log.id)}
                        className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 rounded transition-colors cursor-pointer"
                        title={`Copiar GUID completo: ${log.id}`}
                      >
                        {copiedId === log.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-700">Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-slate-400" />
                            <span>{log.id.substring(0, 8)}...</span>
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

      {/* Paginador simple */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
        <div>
          Página <span className="font-semibold text-slate-800">{page}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || isLoading}
            className="px-3 py-1 bg-white border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
          >
            Anterior
          </button>
          <button
            type="button"
            onClick={() => setPage((p) => p + 1)}
            disabled={logs.length < pageSize || isLoading}
            className="px-3 py-1 bg-white border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
          >
            Siguiente
          </button>
        </div>
      </div>

      {/* Modal de Registro de Evento de Auditoría (POST /api/audit-logs) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-[#E6F4EA]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-slate-900 text-base">
                  Registrar Evento de Auditoría
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-500 hover:text-slate-800 rounded-lg p-1 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLog} className="p-5 space-y-4 text-xs">
              {modalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Acción *
                </label>
                <input
                  type="text"
                  value={formData.accion}
                  onChange={(e) => setFormData({ ...formData, accion: e.target.value })}
                  placeholder="Ej: NOTA_AUDITORIA, REVISION_SEGURIDAD"
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-action bg-slate-50 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Entidad Afectada
                  </label>
                  <input
                    type="text"
                    value={formData.entidadAfectada}
                    onChange={(e) => setFormData({ ...formData, entidadAfectada: e.target.value })}
                    placeholder="Ej: Subasta, Billetera"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-action bg-slate-50 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Entidad ID
                  </label>
                  <input
                    type="text"
                    value={formData.entidadId}
                    onChange={(e) => setFormData({ ...formData, entidadId: e.target.value })}
                    placeholder="Ej: 2001"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-action bg-slate-50 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Detalles del Evento *
                </label>
                <textarea
                  rows={3}
                  value={formData.detalles}
                  onChange={(e) => setFormData({ ...formData, detalles: e.target.value })}
                  placeholder="Describe la acción o suceso a auditar..."
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-action bg-slate-50 text-slate-900"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-semibold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-action hover:bg-brand-action-hover text-white rounded-lg font-semibold transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Guardar Log</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

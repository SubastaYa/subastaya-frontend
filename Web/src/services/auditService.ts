import api from '../api/axios';

export interface AuditLogParams {
  page?: number;
  pageSize?: number;
  entidad?: string;
  accion?: string;
  entidadId?: string;
}

export interface CreateAuditLogPayload {
  accion: string;
  detalles: string;
  entidadAfectada?: string | null;
  entidadId?: string | null;
}

export const auditService = {
  getLogs: (params?: AuditLogParams) => {
    return api.get('/audit-logs', { params });
  },

  createLog: (payload: CreateAuditLogPayload) => {
    return api.post('/audit-logs', payload);
  },
};

export default auditService;

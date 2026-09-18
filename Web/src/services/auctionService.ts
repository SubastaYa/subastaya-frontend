import api from '../api/axios';

export interface CatalogParams {
  page?: number;
  pageSize?: number;
  tamanioPagina?: number;
  estado?: string;
  categoriaId?: number;
  orden?: string;
  precioMin?: number;
  precioMax?: number;
  busqueda?: string;
}

export interface CreateAuctionPayload {
  titulo: string;
  descripcion: string;
  urlImagen: string;
  precioBase: number;
  incrementoMinimo: number;
  fechaInicio: string;
  fechaFin: string;
  categoriaId: number;
}

export const auctionService = {
  getCatalog: (params?: CatalogParams) => {
    return api.get('/auctions', { params });
  },

  getById: (id: number | string) => {
    return api.get(`/auctions/${id}`);
  },

  create: (data: CreateAuctionPayload) => {
    return api.post('/subastas', data);
  },

  getMyAuctions: () => {
    return api.get('/subastas/mis-publicaciones');
  },

  getMyBids: () => {
    return api.get('/subastas/mis-ofertas');
  },

  getOffers: (auctionId: number | string) => {
    return api.get(`/subastas/${auctionId}/ofertas`);
  },

  getOfferById: (auctionId: number | string, offerId: number | string) => {
    return api.get(`/subastas/${auctionId}/ofertas/${offerId}`);
  },

  submitBid: (auctionId: number | string, amount: number) => {
    return api.post(`/subastas/${auctionId}/ofertas`, { amount });
  },
};

export default auctionService;

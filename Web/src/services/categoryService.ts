import api from '../api/axios';

export const categoryService = {
  getAll: () => {
    return api.get('/categorias');
  },
};

export default categoryService;

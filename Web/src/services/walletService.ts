import api from '../api/axios';

export const walletService = {
  getBalance: () => {
    return api.get('/wallet/balance');
  },

  deposit: (amount: number) => {
    return api.post('/wallet/deposit', { amount });
  },

  getTransactions: () => {
    return api.get('/wallet/movimientos');
  },
};

export default walletService;

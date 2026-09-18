import api from '../api/axios';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  nombre: string;
  password: string;
}

export const authService = {
  login: (credentials: LoginPayload) => {
    return api.post('/auth/login', credentials);
  },

  register: (payload: RegisterPayload) => {
    return api.post('/auth/register', payload);
  },
};

export default authService;

import React, { useState, useEffect, useCallback } from 'react';
import api, { TOKEN_STORAGE_KEY } from '../api/axios';
import { parseJwtPayload, isTokenExpired } from '../utils/jwt';
import { AuthContext, type User, type AuthContextType } from './authContextInstance';

export type { User, AuthContextType };

function getInitialAuth(): { user: User | null; token: string | null } {
  try {
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (storedToken && !isTokenExpired(storedToken)) {
      const payload = parseJwtPayload(storedToken);
      if (payload && payload.sub && payload.email) {
        return {
          user: {
            id: String(payload.sub),
            email: String(payload.email),
          },
          token: storedToken,
        };
      }
    }
    // Si el token es inválido o expiró, limpiamos el storage
    if (storedToken) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
  return { user: null, token: null };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Inicialización perezosa síncrona para evitar renders en cascada y flash de sesión
  const [initial] = useState(() => getInitialAuth());
  const [user, setUser] = useState<User | null>(initial.user);
  const [token, setToken] = useState<string | null>(initial.token);
  const [isLoading] = useState<boolean>(false);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setUser(null);
    setToken(null);
  }, []);

  // Escuchar eventos de sesión caducada emitidos por el interceptor de Axios
  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener('subastaya:auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('subastaya:auth:unauthorized', handleUnauthorized);
    };
  }, [logout]);

  const login = async (email: string, password: string): Promise<void> => {
    const response = await api.post<{ token: string; email: string }>('/auth/login', {
      email,
      password,
    });

    const { token: receivedToken, email: receivedEmail } = response.data;

    // Guardar token en localStorage
    localStorage.setItem(TOKEN_STORAGE_KEY, receivedToken);

    // Decodificar claims del token emitido por el backend .NET
    const payload = parseJwtPayload(receivedToken);
    const userId = payload?.sub ? String(payload.sub) : '';

    setUser({
      id: userId,
      email: receivedEmail,
    });
    setToken(receivedToken);
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: Boolean(user && token),
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

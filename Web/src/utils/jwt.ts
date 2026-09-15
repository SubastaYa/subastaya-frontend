export interface JwtPayload {
  sub?: string;
  email?: string;
  jti?: string;
  exp?: number;
  [key: string]: unknown;
}

/**
 * Decodifica de forma segura la sección payload de un JWT (Base64URL).
 * No requiere paquetes externos ni expone información sensible.
 */
export function parseJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Verifica si el token ha expirado evaluando el claim 'exp'.
 * Retorna true si el token es inválido o su fecha de expiración ya pasó.
 */
export function isTokenExpired(token: string): boolean {
  const payload = parseJwtPayload(token);
  if (!payload || typeof payload.exp !== 'number') {
    return true;
  }
  const nowInSeconds = Math.floor(Date.now() / 1000);
  return payload.exp <= nowInSeconds;
}

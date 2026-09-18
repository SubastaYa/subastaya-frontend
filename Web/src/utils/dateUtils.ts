/**
 * Utilidades para manejo robusto de fechas y zonas horarias.
 * Garantiza que las fechas UTC devueltas por la API (que pueden carecer de la 'Z' final)
 * se interpreten siempre en UTC y se conviertan de forma fiel a la hora local del usuario (Argentina GMT-03:00).
 */

/**
 * Parsea una fecha provista por la API garantizando interpretación UTC.
 * Si el string ISO no contiene indicador de zona (Z o +/-offset), anexa 'Z'.
 */
export const parseApiDate = (dateStr?: string | null): Date => {
  if (!dateStr) return new Date();

  const trimmed = dateStr.trim();
  // Si no tiene 'Z' ni sufijo de offset (+HH:MM o -HH:MM), se asume UTC
  if (!trimmed.endsWith('Z') && !/[+-]\d{2}:\d{2}$/.test(trimmed)) {
    const parsed = new Date(`${trimmed}Z`);
    return isNaN(parsed.getTime()) ? new Date(trimmed) : parsed;
  }

  const parsed = new Date(trimmed);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
};

/**
 * Convierte un objeto Date al formato requerido por inputs HTML5 type="datetime-local":
 * 'YYYY-MM-DDTHH:mm' en la hora local del navegador.
 */
export const toLocalDatetimeInputString = (date: Date = new Date()): string => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * Parsea el valor de un input type="datetime-local" ('YYYY-MM-DDTHH:mm')
 * asegurando la creación de un objeto Date en la zona horaria local exacta.
 */
export const parseLocalInputDate = (inputVal: string): Date => {
  if (!inputVal) return new Date();
  const [dPart, tPart] = inputVal.split('T');
  if (!dPart || !tPart) return new Date(inputVal);

  const [year, month, day] = dPart.split('-').map(Number);
  const [hours, minutes] = tPart.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
};

/**
 * Formatea una fecha de la API a string legible en hora local de Argentina (DD/MM/YYYY HH:mm).
 */
export const formatLocalDateTime = (dateStr?: string | null): string => {
  if (!dateStr) return '-';
  try {
    const d = parseApiDate(dateStr);
    return d.toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
};

/**
 * Formatea una fecha de la API incluyendo segundos (DD/MM/YYYY HH:mm:ss).
 */
export const formatLocalDateTimeWithSeconds = (dateStr?: string | null): string => {
  if (!dateStr) return '-';
  try {
    const d = parseApiDate(dateStr);
    return d.toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return dateStr;
  }
};

/**
 * Formatea solo la fecha (DD/MM/YYYY).
 */
export const formatLocalDate = (dateStr?: string | null): string => {
  if (!dateStr) return '-';
  try {
    const d = parseApiDate(dateStr);
    return d.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
};

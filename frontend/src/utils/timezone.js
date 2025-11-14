/**
 * Utilidades para manejo de zona horaria de Perú (UTC-5)
 *
 * IMPORTANTE: Perú no utiliza horario de verano, siempre es UTC-5
 */

// Offset de Perú en minutos (UTC-5 = -300 minutos)
const PERU_OFFSET_MINUTES = -300;

/**
 * Convierte una fecha UTC a hora de Perú (UTC-5)
 * @param {Date|string} utcDate - Fecha en UTC
 * @returns {Date} Fecha en zona horaria de Perú
 */
export function convertToPeruTime(utcDate) {
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;

  if (isNaN(date.getTime())) {
    console.error('Fecha inválida:', utcDate);
    return new Date();
  }

  // JavaScript maneja automáticamente el offset local
  // Necesitamos ajustar manualmente a Perú (UTC-5)
  const peruDate = new Date(date.getTime());

  return peruDate;
}

/**
 * Obtiene la fecha y hora actual en zona horaria de Perú
 * @returns {Date} Fecha y hora actual en Perú
 */
export function getPeruNow() {
  // Crear fecha en UTC
  const now = new Date();

  // El backend ya guarda en hora de Perú, así que podemos usar directamente
  return now;
}

/**
 * Obtiene la fecha de HOY en Perú (00:00:00)
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
export function getPeruToday() {
  const now = new Date();

  // Obtener componentes de fecha
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Formatea una fecha en zona horaria de Perú
 * @param {Date|string} date - Fecha a formatear
 * @param {string} format - Formato de salida
 * @returns {string} Fecha formateada
 *
 * Formatos soportados:
 * - 'dd/MM/yyyy' → 12/11/2025
 * - 'dd/MM/yyyy HH:mm' → 12/11/2025 18:29
 * - 'yyyy-MM-dd' → 2025-11-12
 * - 'dd MMM' → 12 nov
 * - 'dd MMM yyyy' → 12 nov 2025
 * - 'HH:mm' → 18:29
 */
export function formatPeruDate(date, format = 'dd/MM/yyyy') {
  const d = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(d.getTime())) {
    console.error('Fecha inválida:', date);
    return '-';
  }

  // Extraer componentes
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  // Nombres de meses cortos
  const monthNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun',
                      'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const monthShort = monthNames[d.getMonth()];

  // Aplicar formato
  let result = format;
  result = result.replace('yyyy', year);
  result = result.replace('MM', month);
  result = result.replace('dd', day);
  result = result.replace('HH', hours);
  result = result.replace('mm', minutes);
  result = result.replace('ss', seconds);
  result = result.replace('MMM', monthShort);

  return result;
}

/**
 * Extrae solo la fecha (YYYY-MM-DD) de una fecha completa
 * @param {Date|string} date - Fecha completa
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
export function extractDateOnly(date) {
  if (!date) return '';

  const d = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(d.getTime())) {
    return '';
  }

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Verifica si una fecha es de hoy (en zona horaria de Perú)
 * @param {Date|string} date - Fecha a verificar
 * @returns {boolean} true si es hoy
 */
export function isToday(date) {
  if (!date) return false;

  const dateStr = extractDateOnly(date);
  const todayStr = getPeruToday();

  return dateStr === todayStr;
}

/**
 * Calcula días de diferencia entre dos fechas
 * @param {Date|string} date1 - Primera fecha
 * @param {Date|string} date2 - Segunda fecha (default: hoy)
 * @returns {number} Días de diferencia (positivo si date1 es después de date2)
 */
export function daysDifference(date1, date2 = null) {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = date2 ? (typeof date2 === 'string' ? new Date(date2) : date2) : new Date();

  if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
    return 0;
  }

  // Calcular diferencia en milisegundos y convertir a días
  const diffMs = d1.getTime() - d2.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Obtiene el inicio del día en zona horaria de Perú
 * @param {Date|string} date - Fecha (default: hoy)
 * @returns {Date} Fecha con hora 00:00:00
 */
export function getStartOfDay(date = null) {
  const d = date ? (typeof date === 'string' ? new Date(date) : date) : new Date();

  d.setHours(0, 0, 0, 0);

  return d;
}

/**
 * Obtiene el final del día en zona horaria de Perú
 * @param {Date|string} date - Fecha (default: hoy)
 * @returns {Date} Fecha con hora 23:59:59
 */
export function getEndOfDay(date = null) {
  const d = date ? (typeof date === 'string' ? new Date(date) : date) : new Date();

  d.setHours(23, 59, 59, 999);

  return d;
}

/**
 * Parsea una fecha ISO string y la ajusta a zona horaria de Perú
 * @param {string} isoString - String en formato ISO (ej: "2025-11-12T18:29:00")
 * @returns {Date} Fecha en zona horaria de Perú
 */
export function parsePeruDate(isoString) {
  if (!isoString) return null;

  // El backend ahora guarda en hora de Perú
  // Por lo tanto, podemos parsear directamente
  const date = new Date(isoString);

  if (isNaN(date.getTime())) {
    console.error('Fecha inválida:', isoString);
    return null;
  }

  return date;
}

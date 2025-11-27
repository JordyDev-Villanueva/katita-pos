/**
 * Utilidades para manejo de fechas y horas en zona horaria de Perú
 *
 * El backend almacena en UTC, pero mostramos en hora de Perú (UTC-5)
 */

/**
 * Formatea una fecha UTC a hora de Perú
 * @param {string} utcDateString - Fecha en formato ISO desde el backend
 * @returns {string} - Fecha formateada en hora de Perú
 */
export const formatPeruDateTime = (utcDateString) => {
  if (!utcDateString) return '-';

  try {
    // Crear objeto Date desde la fecha UTC
    const date = new Date(utcDateString);

    // Formatear en zona horaria de Perú (America/Lima)
    const options = {
      timeZone: 'America/Lima',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    };

    const formatter = new Intl.DateTimeFormat('es-PE', options);
    return formatter.format(date);
  } catch (error) {
    console.error('Error formateando fecha:', error);
    return utcDateString;
  }
};

/**
 * Formatea solo la fecha (sin hora) en zona horaria de Perú
 * @param {string} utcDateString - Fecha en formato ISO desde el backend
 * @returns {string} - Fecha formateada (DD/MM/YYYY)
 */
export const formatPeruDate = (utcDateString) => {
  if (!utcDateString) return '-';

  try {
    const date = new Date(utcDateString);

    const options = {
      timeZone: 'America/Lima',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    };

    const formatter = new Intl.DateTimeFormat('es-PE', options);
    return formatter.format(date);
  } catch (error) {
    console.error('Error formateando fecha:', error);
    return utcDateString;
  }
};

/**
 * Formatea solo la hora en zona horaria de Perú
 * @param {string} utcDateString - Fecha en formato ISO desde el backend
 * @returns {string} - Hora formateada (HH:MM AM/PM)
 */
export const formatPeruTime = (utcDateString) => {
  if (!utcDateString) return '-';

  try {
    const date = new Date(utcDateString);

    const options = {
      timeZone: 'America/Lima',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    };

    const formatter = new Intl.DateTimeFormat('es-PE', options);
    return formatter.format(date);
  } catch (error) {
    console.error('Error formateando hora:', error);
    return utcDateString;
  }
};

/**
 * Obtiene la fecha y hora actual de Perú
 * @returns {Date} - Fecha actual en zona horaria de Perú
 */
export const getPeruNow = () => {
  // Convertir la hora actual a zona horaria de Perú
  const now = new Date();
  const peruTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Lima' }));
  return peruTime;
};

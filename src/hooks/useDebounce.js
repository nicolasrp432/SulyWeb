import { useState, useEffect } from 'react';

/**
 * Hook personalizado para debounce - optimiza el rendimiento
 * retrasando la ejecución de funciones hasta que haya pasado
 * un tiempo determinado sin cambios
 * 
 * @param {any} value - Valor a debounce
 * @param {number} delay - Retraso en milisegundos
 * @returns {any} - Valor debounced
 */
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Hook para debounce de funciones callback
 * 
 * @param {Function} callback - Función a ejecutar
 * @param {number} delay - Retraso en milisegundos
 * @param {Array} deps - Dependencias del callback
 * @returns {Function} - Función debounced
 */
export const useDebouncedCallback = (callback, delay, deps = []) => {
  const [debouncedCallback, setDebouncedCallback] = useState(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedCallback(() => callback);
    }, delay);

    return () => {
      clearTimeout(handler);
      setDebouncedCallback(null);
    };
  }, [...deps, delay]);

  return debouncedCallback;
};

export default useDebounce;
import { useState, useEffect, useRef } from 'react';

/**
 * Hook personalizado para Intersection Observer
 * Optimiza el rendimiento detectando cuando un elemento
 * entra o sale del viewport
 * 
 * @param {Object} options - Opciones del Intersection Observer
 * @param {number} options.threshold - Umbral de intersección (0-1)
 * @param {string} options.rootMargin - Margen del root
 * @param {boolean} options.triggerOnce - Si solo debe dispararse una vez
 * @returns {Array} - [ref, isIntersecting, entry]
 */
export const useIntersectionObserver = ({
  threshold = 0.1,
  rootMargin = '0px',
  triggerOnce = false
} = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [entry, setEntry] = useState(null);
  const elementRef = useRef(null);
  const observerRef = useRef(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Si ya se disparó una vez y triggerOnce es true, no crear nuevo observer
    if (triggerOnce && isIntersecting) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        setEntry(entry);
        
        // Si triggerOnce es true y el elemento está visible, desconectar
        if (triggerOnce && entry.isIntersecting) {
          observer.disconnect();
        }
      },
      {
        threshold,
        rootMargin
      }
    );

    observer.observe(element);
    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [threshold, rootMargin, triggerOnce, isIntersecting]);

  return [elementRef, isIntersecting, entry];
};

/**
 * Hook simplificado para lazy loading
 * 
 * @param {Object} options - Opciones del observer
 * @returns {Array} - [ref, isVisible]
 */
export const useLazyLoad = (options = {}) => {
  const [ref, isIntersecting] = useIntersectionObserver({
    triggerOnce: true,
    rootMargin: '50px',
    ...options
  });

  return [ref, isIntersecting];
};

/**
 * Hook para animaciones al scroll
 * 
 * @param {Object} options - Opciones del observer
 * @returns {Array} - [ref, isVisible, entry]
 */
export const useScrollAnimation = (options = {}) => {
  const [ref, isIntersecting, entry] = useIntersectionObserver({
    threshold: 0.2,
    ...options
  });

  return [ref, isIntersecting, entry];
};

export default useIntersectionObserver;
import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook for monitoring and optimizing performance
 */
export const usePerformance = () => {
  const [metrics, setMetrics] = useState({
    fps: 0,
    memoryUsage: 0,
    loadTime: 0,
    renderTime: 0
  });

  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const animationFrame = useRef();

  // FPS monitoring
  const measureFPS = useCallback(() => {
    const now = performance.now();
    frameCount.current++;
    
    if (now - lastTime.current >= 1000) {
      const fps = Math.round((frameCount.current * 1000) / (now - lastTime.current));
      setMetrics(prev => ({ ...prev, fps }));
      frameCount.current = 0;
      lastTime.current = now;
    }
    
    animationFrame.current = requestAnimationFrame(measureFPS);
  }, []);

  // Memory usage monitoring
  const measureMemory = useCallback(() => {
    if ('memory' in performance) {
      const memory = performance.memory;
      const memoryUsage = Math.round(memory.usedJSHeapSize / 1024 / 1024);
      setMetrics(prev => ({ ...prev, memoryUsage }));
    }
  }, []);

  // Page load time
  const measureLoadTime = useCallback(() => {
    if ('navigation' in performance) {
      const navigation = performance.getEntriesByType('navigation')[0];
      const loadTime = Math.round(navigation.loadEventEnd - navigation.fetchStart);
      setMetrics(prev => ({ ...prev, loadTime }));
    }
  }, []);

  useEffect(() => {
    // Start FPS monitoring
    measureFPS();
    
    // Measure memory every 5 seconds
    const memoryInterval = setInterval(measureMemory, 5000);
    
    // Measure load time once
    measureLoadTime();

    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
      clearInterval(memoryInterval);
    };
  }, [measureFPS, measureMemory, measureLoadTime]);

  return metrics;
};

/**
 * Hook for optimizing animations based on device capabilities
 */
export const useAnimationOptimization = () => {
  const [shouldReduceMotion, setShouldReduceMotion] = useState(false);
  const [deviceCapabilities, setDeviceCapabilities] = useState({
    isLowEnd: false,
    isMobile: false,
    supportsWebGL: false,
    connectionSpeed: 'unknown'
  });

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setShouldReduceMotion(mediaQuery.matches);
    
    const handleChange = (e) => setShouldReduceMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);

    // Detect device capabilities
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isLowEnd = navigator.hardwareConcurrency <= 2 || navigator.deviceMemory <= 2;
    
    // Check WebGL support
    const canvas = document.createElement('canvas');
    const supportsWebGL = !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    
    // Check connection speed
    let connectionSpeed = 'unknown';
    if ('connection' in navigator) {
      const connection = navigator.connection;
      if (connection.effectiveType) {
        connectionSpeed = connection.effectiveType;
      }
    }

    setDeviceCapabilities({
      isLowEnd,
      isMobile,
      supportsWebGL,
      connectionSpeed
    });

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  // Animation configuration based on device capabilities
  const getAnimationConfig = useCallback(() => {
    if (shouldReduceMotion) {
      return {
        duration: 0,
        ease: 'linear',
        stagger: 0,
        enabled: false
      };
    }

    if (deviceCapabilities.isLowEnd || deviceCapabilities.connectionSpeed === 'slow-2g') {
      return {
        duration: 0.3,
        ease: 'easeOut',
        stagger: 0.05,
        enabled: true,
        simplified: true
      };
    }

    return {
      duration: 0.6,
      ease: 'easeInOut',
      stagger: 0.1,
      enabled: true,
      simplified: false
    };
  }, [shouldReduceMotion, deviceCapabilities]);

  return {
    shouldReduceMotion,
    deviceCapabilities,
    getAnimationConfig
  };
};

/**
 * Hook for throttling expensive operations
 */
export const useThrottle = (callback, delay) => {
  const lastRun = useRef(Date.now());
  
  return useCallback((...args) => {
    if (Date.now() - lastRun.current >= delay) {
      callback(...args);
      lastRun.current = Date.now();
    }
  }, [callback, delay]);
};

/**
 * Hook for debouncing operations
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
 * Hook for optimizing scroll performance
 */
export const useOptimizedScroll = (callback, options = {}) => {
  const { throttleMs = 16, passive = true } = options;
  const throttledCallback = useThrottle(callback, throttleMs);

  useEffect(() => {
    const handleScroll = (e) => {
      throttledCallback(e);
    };

    window.addEventListener('scroll', handleScroll, { passive });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [throttledCallback, passive]);
};

/**
 * Hook for optimizing resize performance
 */
export const useOptimizedResize = (callback, options = {}) => {
  const { debounceMs = 250 } = options;
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  const debouncedCallback = useCallback(
    useDebounce(() => {
      const newDimensions = {
        width: window.innerWidth,
        height: window.innerHeight
      };
      setDimensions(newDimensions);
      callback?.(newDimensions);
    }, debounceMs),
    [callback, debounceMs]
  );

  useEffect(() => {
    window.addEventListener('resize', debouncedCallback);
    
    return () => {
      window.removeEventListener('resize', debouncedCallback);
    };
  }, [debouncedCallback]);

  return dimensions;
};

/**
 * Hook for lazy loading resources
 */
export const useLazyResource = (resourceLoader, dependencies = []) => {
  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadResource = useCallback(async () => {
    if (loading || resource) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const loadedResource = await resourceLoader();
      setResource(loadedResource);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [resourceLoader, loading, resource]);

  useEffect(() => {
    loadResource();
  }, dependencies);

  return { resource, loading, error, reload: loadResource };
};

/**
 * Hook for managing component visibility and performance
 */
export const useVisibilityOptimization = (ref, options = {}) => {
  const { threshold = 0.1, rootMargin = '0px', freezeOnceVisible = false } = options;
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting;
        setIsVisible(visible);
        
        if (visible && !hasBeenVisible) {
          setHasBeenVisible(true);
        }
        
        // If freezeOnceVisible is true, stop observing after first visibility
        if (visible && freezeOnceVisible) {
          observer.unobserve(element);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [ref, threshold, rootMargin, freezeOnceVisible, hasBeenVisible]);

  return { isVisible, hasBeenVisible };
};
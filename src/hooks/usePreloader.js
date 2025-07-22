import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for managing preloader state and optimizing initial load
 */
export const usePreloader = ({
  minDisplayTime = 1500,
  enablePreloader = true,
  preloadResources = [],
  criticalResources = []
} = {}) => {
  const [isLoading, setIsLoading] = useState(enablePreloader);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [resourcesLoaded, setResourcesLoaded] = useState(false);
  const [criticalLoaded, setCriticalLoaded] = useState(false);

  // Preload critical resources first
  const preloadCriticalResources = useCallback(async () => {
    if (criticalResources.length === 0) {
      setCriticalLoaded(true);
      return;
    }

    try {
      const promises = criticalResources.map(resource => {
        if (typeof resource === 'string') {
          // Preload image
          return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = resolve;
            img.onerror = reject;
            img.src = resource;
          });
        } else if (typeof resource === 'function') {
          // Execute function (e.g., API calls)
          return resource();
        }
        return Promise.resolve();
      });

      await Promise.all(promises);
      setCriticalLoaded(true);
    } catch (error) {
      console.warn('Some critical resources failed to load:', error);
      setCriticalLoaded(true); // Continue anyway
    }
  }, [criticalResources]);

  // Preload additional resources
  const preloadAdditionalResources = useCallback(async () => {
    if (preloadResources.length === 0) {
      setResourcesLoaded(true);
      return;
    }

    try {
      let loaded = 0;
      const total = preloadResources.length;

      const promises = preloadResources.map(async (resource, index) => {
        try {
          if (typeof resource === 'string') {
            // Preload image
            await new Promise((resolve, reject) => {
              const img = new Image();
              img.onload = resolve;
              img.onerror = reject;
              img.src = resource;
            });
          } else if (typeof resource === 'function') {
            // Execute function
            await resource();
          }
          
          loaded++;
          setLoadingProgress((loaded / total) * 100);
        } catch (error) {
          console.warn(`Failed to load resource ${index}:`, error);
          loaded++;
          setLoadingProgress((loaded / total) * 100);
        }
      });

      await Promise.all(promises);
      setResourcesLoaded(true);
    } catch (error) {
      console.warn('Some resources failed to load:', error);
      setResourcesLoaded(true);
    }
  }, [preloadResources]);

  // Handle preloader completion
  const handlePreloaderComplete = useCallback(() => {
    setIsLoading(false);
  }, []);

  // Initialize preloading
  useEffect(() => {
    if (!enablePreloader) {
      setIsLoading(false);
      return;
    }

    const startPreloading = async () => {
      // Start with critical resources
      await preloadCriticalResources();
      
      // Then load additional resources in parallel
      preloadAdditionalResources();
    };

    startPreloading();
  }, [enablePreloader, preloadCriticalResources, preloadAdditionalResources]);

  // Ensure minimum display time
  useEffect(() => {
    if (!enablePreloader) return;

    const timer = setTimeout(() => {
      if (criticalLoaded && resourcesLoaded) {
        setIsLoading(false);
      }
    }, minDisplayTime);

    return () => clearTimeout(timer);
  }, [enablePreloader, criticalLoaded, resourcesLoaded, minDisplayTime]);

  return {
    isLoading,
    loadingProgress,
    resourcesLoaded,
    criticalLoaded,
    handlePreloaderComplete
  };
};

/**
 * Hook for optimizing resource loading based on connection speed
 */
export const useAdaptiveLoading = () => {
  const [connectionSpeed, setConnectionSpeed] = useState('fast');
  const [shouldPreload, setShouldPreload] = useState(true);

  useEffect(() => {
    // Detect connection speed
    if ('connection' in navigator) {
      const connection = navigator.connection;
      const effectiveType = connection.effectiveType;
      
      if (effectiveType === 'slow-2g' || effectiveType === '2g') {
        setConnectionSpeed('slow');
        setShouldPreload(false);
      } else if (effectiveType === '3g') {
        setConnectionSpeed('medium');
        setShouldPreload(true);
      } else {
        setConnectionSpeed('fast');
        setShouldPreload(true);
      }
    }

    // Detect data saver mode
    if ('connection' in navigator && navigator.connection.saveData) {
      setShouldPreload(false);
    }
  }, []);

  return {
    connectionSpeed,
    shouldPreload,
    isSlowConnection: connectionSpeed === 'slow'
  };
};

/**
 * Hook for managing app initialization state
 */
export const useAppInitialization = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initializationSteps, setInitializationSteps] = useState({
    auth: false,
    config: false,
    theme: false,
    analytics: false
  });

  const markStepComplete = useCallback((step) => {
    setInitializationSteps(prev => ({
      ...prev,
      [step]: true
    }));
  }, []);

  const initializeApp = useCallback(async () => {
    try {
      // Initialize theme
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        document.documentElement.classList.toggle('dark', savedTheme === 'dark');
      }
      markStepComplete('theme');

      // Initialize configuration
      await new Promise(resolve => setTimeout(resolve, 100)); // Simulate config load
      markStepComplete('config');

      // Initialize analytics (non-blocking)
      setTimeout(() => {
        markStepComplete('analytics');
      }, 500);

      // Mark auth as complete (or handle actual auth)
      markStepComplete('auth');

    } catch (error) {
      console.error('App initialization error:', error);
      // Mark all as complete to prevent blocking
      setInitializationSteps({
        auth: true,
        config: true,
        theme: true,
        analytics: true
      });
    }
  }, [markStepComplete]);

  // Check if all steps are complete
  useEffect(() => {
    const allComplete = Object.values(initializationSteps).every(Boolean);
    if (allComplete && !isInitialized) {
      setIsInitialized(true);
    }
  }, [initializationSteps, isInitialized]);

  // Start initialization
  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  return {
    isInitialized,
    initializationSteps,
    markStepComplete
  };
};

export default usePreloader;
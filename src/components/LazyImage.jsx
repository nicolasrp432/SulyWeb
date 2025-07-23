import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import imageCache, { getOptimizedUrl, createSrcSet } from '@/utils/imageCache';

const LazyImage = ({ 
  src, 
  alt, 
  className,
  width,
  height,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  quality = 80,
  priority = false,
  enableCache = true,
  enableWebP = true,
  retryAttempts = 2,
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjZjNmNGY2Ii8+CjxwYXRoIGQ9Ik0yMDAgMTUwYzAtMjcuNjE0IDIyLjM4Ni01MCA1MC01MHM1MCAyMi4zODYgNTAgNTAtMjIuMzg2IDUwLTUwIDUwLTUwLTIyLjM4Ni01MC01MHoiIGZpbGw9IiNkMWQ1ZGIiLz4KPC9zdmc+',
  onLoad,
  onError,
  ...props 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const imgRef = useRef(null);
  const containerRef = useRef(null);

  // Memoize optimized image options
  const imageOptions = useMemo(() => ({
    width,
    height,
    quality,
    format: enableWebP ? 'auto' : undefined
  }), [width, height, quality, enableWebP]);

  // Get optimized image URL
  const optimizedSrc = useMemo(() => {
    if (!src) return placeholder;
    return enableCache ? getOptimizedUrl(src, imageOptions) : src;
  }, [src, imageOptions, enableCache, placeholder]);

  // Create responsive srcset
  const srcSet = useMemo(() => {
    if (!src || !enableCache) return undefined;
    return createSrcSet(src, [400, 800, 1200, 1600]);
  }, [src, enableCache]);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || isInView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px'
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [priority, isInView]);

  // Preload image when in view
  useEffect(() => {
    if (!isInView || !enableCache || isLoaded) return;

    let isCancelled = false;

    const preloadImage = async () => {
      try {
        // Check cache first
        const cachedImage = imageCache.getCachedImage(src, imageOptions);
        if (cachedImage && !isCancelled) {
          setIsLoaded(true);
          return;
        }

        // Preload with progress tracking
        await imageCache.preloadImage(src, {
          ...imageOptions,
          onProgress: (progress) => {
            if (!isCancelled) {
              setLoadingProgress(progress);
            }
          }
        });

        if (!isCancelled) {
          setIsLoaded(true);
          setLoadingProgress(100);
        }
      } catch (error) {
        if (!isCancelled) {
          handleImageError(error);
        }
      }
    };

    preloadImage();

    return () => {
      isCancelled = true;
    };
  }, [isInView, src, imageOptions, enableCache, isLoaded]);

  const handleImageError = useCallback((error) => {
    console.warn('Image load error:', error);
    
    if (retryCount < retryAttempts) {
      // Retry after a delay
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        setHasError(false);
        setIsLoaded(false);
      }, 1000 * (retryCount + 1));
    } else {
      setHasError(true);
      setIsLoaded(true);
      onError?.(error);
    }
  }, [retryCount, retryAttempts, onError]);

  const handleLoad = useCallback((event) => {
    setIsLoaded(true);
    setLoadingProgress(100);
    onLoad?.(event);
  }, [onLoad]);

  const handleError = useCallback((event) => {
    handleImageError(new Error('Image failed to load'));
  }, [handleImageError]);

  // Calculate container dimensions for optimization
  const containerDimensions = useMemo(() => {
    if (!containerRef.current) return { width: 800, height: 600 };
    
    const rect = containerRef.current.getBoundingClientRect();
    return {
      width: rect.width || 800,
      height: rect.height || 600
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className={cn(
        'relative overflow-hidden bg-gray-100',
        className
      )}
      {...props}
    >
      {/* Placeholder with blur effect */}
      <img
        src={placeholder}
        alt=""
        className={cn(
          'absolute inset-0 w-full h-full object-cover transition-all duration-500',
          isLoaded ? 'opacity-0 scale-110 blur-sm' : 'opacity-100 scale-100 blur-0'
        )}
        aria-hidden="true"
      />
      
      {/* Actual image */}
      {isInView && (
        <img
          src={hasError ? placeholder : optimizedSrc}
          srcSet={hasError ? undefined : srcSet}
          sizes={sizes}
          alt={alt}
          className={cn(
            'w-full h-full object-cover transition-all duration-500',
            isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          )}
          onLoad={handleLoad}
          onError={handleError}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
        />
      )}
      
      {/* Loading indicator with progress */}
      {!isLoaded && isInView && !hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/10">
          <div className="relative">
            <div className="w-10 h-10 border-3 border-pink-200 border-t-pink-500 rounded-full animate-spin" />
            {loadingProgress > 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-medium text-pink-600">
                  {Math.round(loadingProgress)}%
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error indicator */}
      {hasError && retryCount >= retryAttempts && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center text-gray-500">
            <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-sm">Error al cargar imagen</p>
          </div>
        </div>
      )}

      {/* Retry indicator */}
      {hasError && retryCount < retryAttempts && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <div className="text-center text-white">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-sm">Reintentando... ({retryCount + 1}/{retryAttempts})</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LazyImage;
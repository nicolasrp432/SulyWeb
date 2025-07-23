import React, { useState, useCallback, useMemo } from 'react';
import { useIntersectionObserver } from '../hooks/useIntersectionObserver';
import { SkeletonLoader } from './LoadingSpinner';

/**
 * OptimizedImage component with advanced features:
 * - Lazy loading with intersection observer
 * - WebP format support with fallback
 * - Responsive image sizing
 * - Error handling with retry mechanism
 * - Loading states and placeholders
 */
const OptimizedImage = ({
  src,
  alt,
  className = '',
  width,
  height,
  sizes,
  priority = false,
  placeholder,
  quality = 80,
  format = 'webp',
  fallbackFormat = 'jpg',
  onLoad,
  onError,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [currentSrc, setCurrentSrc] = useState('');
  
  const maxRetries = 2;

  // Generate optimized image URLs
  const imageUrls = useMemo(() => {
    if (!src) return { webp: '', fallback: '' };
    
    // If it's already a full URL, return as is
    if (src.startsWith('http')) {
      return {
        webp: src,
        fallback: src
      };
    }
    
    // For local images, you could implement URL generation logic here
    // This is a placeholder for image optimization service integration
    const baseUrl = src.replace(/\.[^/.]+$/, '');
    return {
      webp: `${baseUrl}.${format}?q=${quality}${width ? `&w=${width}` : ''}${height ? `&h=${height}` : ''}`,
      fallback: `${baseUrl}.${fallbackFormat}?q=${quality}${width ? `&w=${width}` : ''}${height ? `&h=${height}` : ''}`
    };
  }, [src, format, fallbackFormat, quality, width, height]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    setHasError(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    if (retryCount < maxRetries) {
      // Retry with fallback format
      setRetryCount(prev => prev + 1);
      setCurrentSrc(imageUrls.fallback);
    } else {
      setHasError(true);
      onError?.();
    }
  }, [retryCount, maxRetries, imageUrls.fallback, onError]);

  const handleRetry = useCallback(() => {
    setHasError(false);
    setRetryCount(0);
    setCurrentSrc(imageUrls.webp);
  }, [imageUrls.webp]);

  // Intersection observer for lazy loading
  const { elementRef, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '50px'
  });

  // Determine if image should load
  const shouldLoad = priority || isIntersecting;

  // Set current source when should load
  React.useEffect(() => {
    if (shouldLoad && !currentSrc && !hasError) {
      setCurrentSrc(imageUrls.webp);
    }
  }, [shouldLoad, currentSrc, hasError, imageUrls.webp]);

  // Generate srcSet for responsive images
  const srcSet = useMemo(() => {
    if (!width || !shouldLoad) return '';
    
    const breakpoints = [0.5, 1, 1.5, 2]; // Different density ratios
    return breakpoints
      .map(ratio => {
        const scaledWidth = Math.round(width * ratio);
        const url = currentSrc.includes('?') 
          ? currentSrc.replace(/w=\d+/, `w=${scaledWidth}`)
          : `${currentSrc}?w=${scaledWidth}`;
        return `${url} ${ratio}x`;
      })
      .join(', ');
  }, [currentSrc, width, shouldLoad]);

  if (hasError) {
    return (
      <div 
        ref={elementRef}
        className={`flex items-center justify-center bg-gray-100 ${className}`}
        style={{ width, height }}
        {...props}
      >
        <div className="text-center p-4">
          <div className="text-gray-400 mb-2">
            <svg className="w-8 h-8 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-xs text-gray-500 mb-2">Error al cargar imagen</p>
          <button 
            onClick={handleRetry}
            className="text-xs text-blue-500 hover:text-blue-700 underline"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!shouldLoad) {
    return (
      <div 
        ref={elementRef}
        className={`bg-gray-100 ${className}`}
        style={{ width, height }}
        {...props}
      >
        {placeholder || <SkeletonLoader className="w-full h-full" />}
      </div>
    );
  }

  return (
    <div ref={elementRef} className={`relative ${className}`} {...props}>
      {!isLoaded && (
        <div className="absolute inset-0 z-10">
          {placeholder || <SkeletonLoader className="w-full h-full" />}
        </div>
      )}
      
      <picture>
        {/* WebP source for modern browsers */}
        <source 
          srcSet={srcSet || currentSrc} 
          type="image/webp"
          sizes={sizes}
        />
        
        {/* Fallback for older browsers */}
        <img
          src={currentSrc}
          alt={alt}
          width={width}
          height={height}
          sizes={sizes}
          className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${className}`}
          onLoad={handleLoad}
          onError={handleError}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          style={{
            width: width || '100%',
            height: height || 'auto',
            objectFit: 'cover'
          }}
        />
      </picture>
    </div>
  );
};

// Higher-order component for image optimization
export const withImageOptimization = (Component) => {
  return React.forwardRef((props, ref) => {
    const optimizedProps = {
      ...props,
      // Add default optimization settings
      quality: props.quality || 80,
      format: props.format || 'webp',
      loading: props.loading || 'lazy'
    };
    
    return <Component ref={ref} {...optimizedProps} />;
  });
};

// Preset components for common use cases
export const HeroImage = (props) => (
  <OptimizedImage
    {...props}
    priority
    quality={90}
    sizes="100vw"
  />
);

export const ThumbnailImage = (props) => (
  <OptimizedImage
    {...props}
    quality={70}
    width={props.width || 300}
    height={props.height || 200}
  />
);

export const GalleryImage = (props) => (
  <OptimizedImage
    {...props}
    quality={85}
    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  />
);

export default OptimizedImage;
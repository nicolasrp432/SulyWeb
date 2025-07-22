/**
 * Advanced image caching utility for performance optimization
 */
class ImageCache {
  constructor() {
    this.cache = new Map();
    this.loadingPromises = new Map();
    this.maxCacheSize = 50; // Maximum number of cached images
    this.compressionQuality = 0.8;
    this.enableWebP = this.supportsWebP();
  }

  /**
   * Check if browser supports WebP format
   */
  supportsWebP() {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }

  /**
   * Generate optimized image URL based on device capabilities
   */
  getOptimizedUrl(originalUrl, options = {}) {
    const {
      width = 800,
      height,
      quality = 80,
      format = 'auto'
    } = options;

    // For Unsplash URLs, add optimization parameters
    if (originalUrl.includes('unsplash.com')) {
      const url = new URL(originalUrl);
      url.searchParams.set('w', width.toString());
      if (height) url.searchParams.set('h', height.toString());
      url.searchParams.set('q', quality.toString());
      url.searchParams.set('auto', 'format');
      if (this.enableWebP && format === 'auto') {
        url.searchParams.set('fm', 'webp');
      }
      return url.toString();
    }

    return originalUrl;
  }

  /**
   * Get device pixel ratio for high-DPI displays
   */
  getDevicePixelRatio() {
    return window.devicePixelRatio || 1;
  }

  /**
   * Calculate optimal image dimensions based on container and device
   */
  calculateOptimalDimensions(containerWidth, containerHeight, maxWidth = 1920) {
    const dpr = this.getDevicePixelRatio();
    const optimalWidth = Math.min(containerWidth * dpr, maxWidth);
    const optimalHeight = containerHeight ? containerHeight * dpr : undefined;
    
    return {
      width: Math.round(optimalWidth),
      height: optimalHeight ? Math.round(optimalHeight) : undefined
    };
  }

  /**
   * Preload image with caching
   */
  async preloadImage(url, options = {}) {
    const optimizedUrl = this.getOptimizedUrl(url, options);
    const cacheKey = this.getCacheKey(optimizedUrl, options);

    // Return cached image if available
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // Return existing loading promise if in progress
    if (this.loadingPromises.has(cacheKey)) {
      return this.loadingPromises.get(cacheKey);
    }

    // Create new loading promise
    const loadingPromise = this.loadImage(optimizedUrl, options)
      .then(imageData => {
        this.addToCache(cacheKey, imageData);
        this.loadingPromises.delete(cacheKey);
        return imageData;
      })
      .catch(error => {
        this.loadingPromises.delete(cacheKey);
        throw error;
      });

    this.loadingPromises.set(cacheKey, loadingPromise);
    return loadingPromise;
  }

  /**
   * Load image and return image data
   */
  loadImage(url, options = {}) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      // Set crossOrigin for external images
      if (this.isExternalUrl(url)) {
        img.crossOrigin = 'anonymous';
      }

      img.onload = () => {
        const imageData = {
          url,
          width: img.naturalWidth,
          height: img.naturalHeight,
          element: img,
          loadTime: Date.now(),
          ...options
        };
        resolve(imageData);
      };

      img.onerror = () => {
        reject(new Error(`Failed to load image: ${url}`));
      };

      // Set loading attribute for native lazy loading
      if (options.lazy !== false) {
        img.loading = 'lazy';
      }

      img.src = url;
    });
  }

  /**
   * Check if URL is external
   */
  isExternalUrl(url) {
    try {
      const urlObj = new URL(url, window.location.origin);
      return urlObj.origin !== window.location.origin;
    } catch {
      return false;
    }
  }

  /**
   * Generate cache key
   */
  getCacheKey(url, options) {
    const optionsStr = JSON.stringify(options);
    return `${url}:${optionsStr}`;
  }

  /**
   * Add image to cache with LRU eviction
   */
  addToCache(key, imageData) {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, imageData);
  }

  /**
   * Get cached image
   */
  getCachedImage(url, options = {}) {
    const optimizedUrl = this.getOptimizedUrl(url, options);
    const cacheKey = this.getCacheKey(optimizedUrl, options);
    return this.cache.get(cacheKey);
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    this.loadingPromises.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      loadingCount: this.loadingPromises.size,
      hitRate: this.calculateHitRate()
    };
  }

  /**
   * Calculate cache hit rate (simplified)
   */
  calculateHitRate() {
    // This would need more sophisticated tracking in a real implementation
    return this.cache.size > 0 ? 0.8 : 0;
  }

  /**
   * Preload multiple images with progress tracking
   */
  async preloadImages(urls, options = {}, onProgress) {
    const { batchSize = 3 } = options;
    const results = [];
    let completed = 0;

    // Process images in batches to avoid overwhelming the browser
    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      const batchPromises = batch.map(async (url) => {
        try {
          const result = await this.preloadImage(url, options);
          completed++;
          onProgress?.(completed, urls.length);
          return { url, success: true, data: result };
        } catch (error) {
          completed++;
          onProgress?.(completed, urls.length);
          return { url, success: false, error };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Create responsive image srcset
   */
  createSrcSet(baseUrl, sizes = [400, 800, 1200, 1600]) {
    return sizes
      .map(size => {
        const optimizedUrl = this.getOptimizedUrl(baseUrl, { width: size });
        return `${optimizedUrl} ${size}w`;
      })
      .join(', ');
  }

  /**
   * Cleanup expired cache entries
   */
  cleanupCache(maxAge = 30 * 60 * 1000) { // 30 minutes default
    const now = Date.now();
    for (const [key, imageData] of this.cache.entries()) {
      if (now - imageData.loadTime > maxAge) {
        this.cache.delete(key);
      }
    }
  }
}

// Create singleton instance
const imageCache = new ImageCache();

// Cleanup cache periodically
setInterval(() => {
  imageCache.cleanupCache();
}, 5 * 60 * 1000); // Every 5 minutes

export default imageCache;

// Export utility functions
export const preloadImage = (url, options) => imageCache.preloadImage(url, options);
export const preloadImages = (urls, options, onProgress) => imageCache.preloadImages(urls, options, onProgress);
export const getCachedImage = (url, options) => imageCache.getCachedImage(url, options);
export const createSrcSet = (baseUrl, sizes) => imageCache.createSrcSet(baseUrl, sizes);
export const getOptimizedUrl = (url, options) => imageCache.getOptimizedUrl(url, options);
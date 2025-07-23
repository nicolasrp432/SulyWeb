import { useCallback, useMemo, useRef, useEffect } from 'react';

/**
 * Performance optimization utilities
 */

/**
 * Debounce function for performance optimization
 */
export const debounce = (func, wait, immediate = false) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(...args);
  };
};

/**
 * Throttle function for performance optimization
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Memoization utility for expensive calculations
 */
export class MemoCache {
  constructor(maxSize = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key) {
    if (this.cache.has(key)) {
      // Move to end (LRU)
      const value = this.cache.get(key);
      this.cache.delete(key);
      this.cache.set(key, value);
      return value;
    }
    return undefined;
  }

  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  clear() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }
}

/**
 * Performance-aware component wrapper
 */
export const withPerformanceOptimization = (Component) => {
  return React.memo(Component, (prevProps, nextProps) => {
    // Custom comparison logic
    const prevKeys = Object.keys(prevProps);
    const nextKeys = Object.keys(nextProps);
    
    if (prevKeys.length !== nextKeys.length) {
      return false;
    }
    
    for (const key of prevKeys) {
      if (prevProps[key] !== nextProps[key]) {
        // Special handling for functions
        if (typeof prevProps[key] === 'function' && typeof nextProps[key] === 'function') {
          if (prevProps[key].toString() !== nextProps[key].toString()) {
            return false;
          }
        } else {
          return false;
        }
      }
    }
    
    return true;
  });
};

/**
 * Optimized event handler creator
 */
export const createOptimizedHandler = (handler, dependencies = []) => {
  return useCallback(handler, dependencies);
};

/**
 * Batch state updates for better performance
 */
export class StateBatcher {
  constructor() {
    this.updates = new Map();
    this.scheduled = false;
  }

  batch(key, updateFn) {
    this.updates.set(key, updateFn);
    
    if (!this.scheduled) {
      this.scheduled = true;
      requestAnimationFrame(() => {
        this.flush();
      });
    }
  }

  flush() {
    for (const [key, updateFn] of this.updates) {
      updateFn();
    }
    this.updates.clear();
    this.scheduled = false;
  }
}

/**
 * Virtual scrolling utility for large lists
 */
export class VirtualScroller {
  constructor({
    itemHeight,
    containerHeight,
    overscan = 5,
    totalItems = 0
  }) {
    this.itemHeight = itemHeight;
    this.containerHeight = containerHeight;
    this.overscan = overscan;
    this.totalItems = totalItems;
  }

  getVisibleRange(scrollTop) {
    const visibleStart = Math.floor(scrollTop / this.itemHeight);
    const visibleEnd = Math.min(
      visibleStart + Math.ceil(this.containerHeight / this.itemHeight),
      this.totalItems - 1
    );

    const start = Math.max(0, visibleStart - this.overscan);
    const end = Math.min(this.totalItems - 1, visibleEnd + this.overscan);

    return { start, end, visibleStart, visibleEnd };
  }

  getItemStyle(index) {
    return {
      position: 'absolute',
      top: index * this.itemHeight,
      height: this.itemHeight,
      width: '100%'
    };
  }

  getTotalHeight() {
    return this.totalItems * this.itemHeight;
  }
}

/**
 * Resource pool for object reuse
 */
export class ResourcePool {
  constructor(createFn, resetFn, maxSize = 50) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.maxSize = maxSize;
    this.pool = [];
    this.inUse = new Set();
  }

  acquire() {
    let resource;
    
    if (this.pool.length > 0) {
      resource = this.pool.pop();
    } else {
      resource = this.createFn();
    }
    
    this.inUse.add(resource);
    return resource;
  }

  release(resource) {
    if (this.inUse.has(resource)) {
      this.inUse.delete(resource);
      
      if (this.pool.length < this.maxSize) {
        this.resetFn(resource);
        this.pool.push(resource);
      }
    }
  }

  clear() {
    this.pool.length = 0;
    this.inUse.clear();
  }

  getStats() {
    return {
      poolSize: this.pool.length,
      inUse: this.inUse.size,
      maxSize: this.maxSize
    };
  }
}

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = [];
  }

  startMeasure(name) {
    performance.mark(`${name}-start`);
  }

  endMeasure(name) {
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    
    const measure = performance.getEntriesByName(name, 'measure')[0];
    this.recordMetric(name, measure.duration);
    
    // Cleanup
    performance.clearMarks(`${name}-start`);
    performance.clearMarks(`${name}-end`);
    performance.clearMeasures(name);
    
    return measure.duration;
  }

  recordMetric(name, value) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, {
        values: [],
        sum: 0,
        count: 0,
        min: Infinity,
        max: -Infinity
      });
    }
    
    const metric = this.metrics.get(name);
    metric.values.push(value);
    metric.sum += value;
    metric.count++;
    metric.min = Math.min(metric.min, value);
    metric.max = Math.max(metric.max, value);
    
    // Keep only last 100 values
    if (metric.values.length > 100) {
      const removed = metric.values.shift();
      metric.sum -= removed;
      metric.count--;
    }
  }

  getMetrics(name) {
    const metric = this.metrics.get(name);
    if (!metric) return null;
    
    return {
      average: metric.sum / metric.count,
      min: metric.min,
      max: metric.max,
      count: metric.count,
      latest: metric.values[metric.values.length - 1]
    };
  }

  getAllMetrics() {
    const result = {};
    for (const [name, metric] of this.metrics) {
      result[name] = this.getMetrics(name);
    }
    return result;
  }

  observePerformance(callback) {
    this.observers.push(callback);
    
    // Setup performance observer
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          callback(entry);
        }
      });
      
      observer.observe({ entryTypes: ['measure', 'navigation', 'paint'] });
    }
  }

  clear() {
    this.metrics.clear();
  }
}

/**
 * Lazy loading utilities
 */
export const createLazyComponent = (importFn, fallback = null) => {
  return React.lazy(() => {
    return importFn().catch(error => {
      console.error('Failed to load component:', error);
      // Return a fallback component
      return {
        default: () => fallback || React.createElement('div', null, 'Failed to load component')
      };
    });
  });
};

/**
 * Memory management utilities
 */
export class MemoryManager {
  constructor() {
    this.cleanupTasks = new Set();
    this.memoryThreshold = 50 * 1024 * 1024; // 50MB
  }

  addCleanupTask(task) {
    this.cleanupTasks.add(task);
  }

  removeCleanupTask(task) {
    this.cleanupTasks.delete(task);
  }

  cleanup() {
    for (const task of this.cleanupTasks) {
      try {
        task();
      } catch (error) {
        console.warn('Cleanup task failed:', error);
      }
    }
  }

  checkMemoryUsage() {
    if ('memory' in performance) {
      const memInfo = performance.memory;
      const usedMemory = memInfo.usedJSHeapSize;
      
      if (usedMemory > this.memoryThreshold) {
        this.cleanup();
        
        // Force garbage collection if available
        if (window.gc) {
          window.gc();
        }
      }
      
      return {
        used: usedMemory,
        total: memInfo.totalJSHeapSize,
        limit: memInfo.jsHeapSizeLimit,
        percentage: (usedMemory / memInfo.jsHeapSizeLimit) * 100
      };
    }
    
    return null;
  }

  startMemoryMonitoring(interval = 30000) {
    return setInterval(() => {
      this.checkMemoryUsage();
    }, interval);
  }
}

// Create singleton instances
export const performanceMonitor = new PerformanceMonitor();
export const memoryManager = new MemoryManager();
export const stateBatcher = new StateBatcher();

// Export utility functions
export const measurePerformance = (name, fn) => {
  performanceMonitor.startMeasure(name);
  const result = fn();
  performanceMonitor.endMeasure(name);
  return result;
};

export const measureAsyncPerformance = async (name, fn) => {
  performanceMonitor.startMeasure(name);
  const result = await fn();
  performanceMonitor.endMeasure(name);
  return result;
};
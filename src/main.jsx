
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from '@/App';
import '@/index.css';
import { AuthProvider } from '@/contexts/SupabaseAuthContext';
import { BookingCartProvider } from '@/contexts/BookingCartContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import { initSentry } from '@/utils/sentry';
import Preloader from '@/components/Preloader';
import { usePreloader, useAdaptiveLoading, useAppInitialization } from '@/hooks/usePreloader';

// Inicializar Sentry para monitoreo de errores
initSentry();

// Preload critical resources
const criticalResources = [
  // Critical images that appear above the fold
  'https://images.unsplash.com/photo-1604654894610-df63bc536371?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1560066984-138dadb4c035?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
  // Initialize critical services
  () => new Promise(resolve => {
    // Preload fonts
    document.fonts.ready.then(resolve);
  })
];

const additionalResources = [
  // Gallery images
  'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1515688594390-b649af70d282?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
];

const AppWithPreloader = () => {
  const { shouldPreload, isSlowConnection } = useAdaptiveLoading();
  const { isInitialized } = useAppInitialization();
  const { 
    isLoading, 
    loadingProgress, 
    handlePreloaderComplete 
  } = usePreloader({
    enablePreloader: shouldPreload && !isSlowConnection,
    criticalResources,
    preloadResources: isSlowConnection ? [] : additionalResources,
    minDisplayTime: isSlowConnection ? 800 : 1500
  });

  const showPreloader = isLoading || !isInitialized;

  if (showPreloader) {
    return (
      <Preloader 
        onComplete={handlePreloaderComplete}
        showProgress={!isSlowConnection}
        minDisplayTime={isSlowConnection ? 800 : 1500}
        backgroundColor={isSlowConnection ? 'bg-white' : 'bg-gradient-to-br from-pink-50 to-rose-50'}
      />
    );
  }

  return (
    <ErrorBoundary>
      <HelmetProvider>
        <AuthProvider>
          <BookingCartProvider>
            <App />
          </BookingCartProvider>
        </AuthProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppWithPreloader />
  </React.StrictMode>
);

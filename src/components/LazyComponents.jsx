import { lazy } from 'react';

// Lazy loading de páginas principales
export const LazyHome = lazy(() => import('@/pages/Home'));
export const LazyServices = lazy(() => import('@/pages/Services'));
export const LazyBooking = lazy(() => import('@/pages/Booking'));
export const LazyAbout = lazy(() => import('@/pages/About'));
export const LazyContact = lazy(() => import('@/pages/Contact'));
export const LazyGallery = lazy(() => import('@/pages/Gallery'));

// Componente de loading personalizado
export const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-rose-100">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-pink-500 mx-auto mb-4"></div>
      <p className="text-gray-600 text-lg">Cargando...</p>
    </div>
  </div>
);
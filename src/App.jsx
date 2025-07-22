import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from '@/components/ui/toaster';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import WhatsAppButton from '@/components/WhatsAppButton';
import LoadingSpinner from '@/components/LoadingSpinner';

// Lazy loading de páginas para mejorar el rendimiento
const Home = React.lazy(() => import('@/pages/Home'));
const Services = React.lazy(() => import('@/pages/Services'));
const Gallery = React.lazy(() => import('@/pages/Gallery'));
const Booking = React.lazy(() => import('@/pages/Booking'));
const Contact = React.lazy(() => import('@/pages/Contact'));
const AdminServices = React.lazy(() => import('@/pages/AdminServices'));

// Componente de loading optimizado para rutas
const RouteLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-rose-100">
    <LoadingSpinner size="lg" text="Cargando página..." />
  </div>
);

function App() {
  return (
    <HelmetProvider>
      <Router>
        <div className="min-h-screen flex flex-col font-body">
          <Navbar />
          <main className="flex-1">
            <Suspense fallback={<RouteLoader />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/servicios" element={<Services />} />
                <Route path="/galeria" element={<Gallery />} />
                <Route path="/reservas" element={<Booking />} />
                <Route path="/contacto" element={<Contact />} />
                <Route path="/admin/servicios" element={<AdminServices />} />
              </Routes>
            </Suspense>
          </main>
          <Footer />
          <WhatsAppButton phoneNumber="https://wa.link/f3tn6z" />
          <Toaster />
        </div>
      </Router>
    </HelmetProvider>
  );
}

export default App;
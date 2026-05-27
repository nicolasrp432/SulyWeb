import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from '@/components/ui/toaster';

// Public layout
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import WhatsAppButton from '@/components/WhatsAppButton';
import Analytics from '@/components/SEO/Analytics';

// Public pages
import Home from '@/pages/Home';
import Services from '@/pages/Services';
import Gallery from '@/pages/Gallery';
import Booking from '@/pages/Booking';
import Contact from '@/pages/Contact';

// Admin components
import ProtectedRoute from '@/components/admin/ProtectedRoute';
import AdminLayout from '@/components/admin/AdminLayout';

// Admin pages
import LoginPage from '@/pages/admin/LoginPage';
import Dashboard from '@/pages/admin/Dashboard';
import CalendarPage from '@/pages/admin/CalendarPage';
import BookingsPage from '@/pages/admin/BookingsPage';
import CustomersPage from '@/pages/admin/CustomersPage';
import AdminServices from '@/pages/AdminServices';
import SettingsPage from '@/pages/admin/SettingsPage';
import GalleryAdminPage from '@/pages/admin/GalleryAdminPage';

const PublicLayout = () => (
  <div className="min-h-screen flex flex-col font-body">
    <Navbar />
    <main className="flex-1">
      <Outlet />
    </main>
    <Footer />
    <WhatsAppButton phoneNumber="https://wa.link/f3tn6z" />
    <Toaster />
  </div>
);

const AdminProtectedLayout = () => (
  <ProtectedRoute>
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  </ProtectedRoute>
);

function App() {
  return (
    <HelmetProvider>
      <Router>
        <Analytics />
        <Routes>
          {/* Admin login — standalone, no layout */}
          <Route path="/admin/login" element={<LoginPage />} />

          {/* Admin routes — protected with AdminLayout */}
          <Route element={<AdminProtectedLayout />}>
            <Route path="/admin" element={<Dashboard />} />
            <Route path="/admin/calendario" element={<CalendarPage />} />
            <Route path="/admin/citas" element={<BookingsPage />} />
            <Route path="/admin/clientes" element={<CustomersPage />} />
            <Route path="/admin/servicios" element={<AdminServices />} />
            <Route path="/admin/configuracion" element={<SettingsPage />} />
            <Route path="/admin/galeria" element={<GalleryAdminPage />} />
          </Route>

          {/* Public routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/servicios" element={<Services />} />
            <Route path="/galeria" element={<Gallery />} />
            <Route path="/reservas" element={<Booking />} />
            <Route path="/contacto" element={<Contact />} />
          </Route>
        </Routes>
      </Router>
    </HelmetProvider>
  );
}

export default App;

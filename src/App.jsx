import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Home from '@/pages/Home';
import Services from '@/pages/Services';
import Gallery from '@/pages/Gallery';
import Booking from '@/pages/Booking';
import Contact from '@/pages/Contact';
import WhatsAppButton from '@/components/WhatsAppButton';

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col font-body">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/servicios" element={<Services />} />
            <Route path="/galeria" element={<Gallery />} />
            <Route path="/reservas" element={<Booking />} />
            <Route path="/contacto" element={<Contact />} />
          </Routes>
        </main>
        <Footer />
        <WhatsAppButton phoneNumber="https://wa.link/f3tn6z" />
        <Toaster />
      </div>
    </Router>
  );
}

export default App;
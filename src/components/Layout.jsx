import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BookingCartIndicator from '@/components/BookingCartIndicator';
import WhatsAppButton from '@/components/WhatsAppButton';

const Layout = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow">{children}</main>
      <BookingCartIndicator />
      <WhatsAppButton phoneNumber="https://wa.me/34123456789" />
      <Footer />
    </div>
  );
};

export default Layout;
import React from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import SEOHead from '@/components/SEOHead';

const BookingPage = () => {
  const { toast } = useToast();

  const handleRequestFeature = () => {
    toast({
      title: "🚧 ¡Sistema de reservas en desarrollo!",
      description: "Pronto podrás agendar tu cita online de forma fácil y rápida. 🚀",
    });
  };

  return (
    <>
      <SEOHead />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 text-center">
        <h1 className="text-4xl md:text-5xl font-sans font-bold mb-4">Reserva tu Cita</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          Estamos afinando nuestro calendario interactivo para que agendar tu momento de belleza sea más fácil que nunca.
        </p>
        <Button onClick={handleRequestFeature}>Quiero ser el primero en reservar</Button>
      </div>
    </>
  );
};

export default BookingPage;
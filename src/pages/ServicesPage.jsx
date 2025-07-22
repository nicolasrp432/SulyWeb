import React from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import SEOHead from '@/components/SEOHead';

const ServicesPage = () => {
  const { toast } = useToast();

  const handleRequestFeature = () => {
    toast({
      title: "🚧 ¡Página en construcción!",
      description: "Estamos detallando nuestros servicios. ¡Vuelve pronto para verlos! 🚀",
    });
  };

  return (
    <>
      <SEOHead />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 text-center min-h-screen flex flex-col justify-center">
        <h1 className="text-4xl md:text-5xl font-sans font-bold mb-4">Nuestros Servicios</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          Estamos preparando una lista completa de todos los tratamientos que ofrecemos para cuidarte.
        </p>
        <Button onClick={handleRequestFeature}>Notificarme cuando esté listo</Button>
      </div>
    </>
  );
};

export default ServicesPage;
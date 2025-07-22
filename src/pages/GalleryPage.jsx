import React from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import SEOHead from '@/components/SEOHead';

const GalleryPage = () => {
  const { toast } = useToast();

  const handleRequestFeature = () => {
    toast({
      title: "🚧 ¡Galería en camino!",
      description: "Estamos seleccionando nuestras mejores fotos. ¡Prepárate para inspirarte! 🚀",
    });
  };

  return (
    <>
      <SEOHead />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 text-center">
        <h1 className="text-4xl md:text-5xl font-sans font-bold mb-4">Galería de Trabajos</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          Pronto podrás ver una colección de nuestros diseños y transformaciones. ¡El arte está por llegar!
        </p>
        <Button onClick={handleRequestFeature}>Avisarme cuando esté disponible</Button>
      </div>
    </>
  );
};

export default GalleryPage;
import React from 'react';
import { Helmet } from 'react-helmet';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';

const ContactPage = () => {
  const { toast } = useToast();

  const handleRequestFeature = () => {
    toast({
      title: "🚧 ¡Formulario de contacto en creación!",
      description: "Pronto podrás enviarnos tus dudas directamente desde aquí. 🚀",
    });
  };

  return (
    <>
      <Helmet>
        <title>Contacto - Suly Pretty Nails</title>
        <meta name="description" content="¿Tienes preguntas? Ponte en contacto con Suly Pretty Nails. Encuentra nuestra ubicación y datos de contacto." />
      </Helmet>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 text-center">
        <h1 className="text-4xl md:text-5xl font-sans font-bold mb-4">Ponte en Contacto</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          Estamos preparando nuestro formulario de contacto y mapa de ubicación. ¡Muy pronto podrás encontrarnos fácilmente!
        </p>
        <Button onClick={handleRequestFeature}>Solicitar más información</Button>
      </div>
    </>
  );
};

export default ContactPage;
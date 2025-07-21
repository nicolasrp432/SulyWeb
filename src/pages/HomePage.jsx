import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { ArrowRight, Sparkles, Brush, Gem } from 'lucide-react';

const HomePage = () => {
  const { toast } = useToast();

  const handleUnimplementedClick = (e) => {
    e.preventDefault();
    toast({
      title: '🚧 ¡En construcción!',
      description: 'Esta sección estará disponible muy pronto. ¡Gracias por tu paciencia! 🚀',
      variant: 'destructive',
    });
  };

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  return (
    <>
      <Helmet>
        <title>Suly Pretty Nails - Salón de Manicura y Pedicura Profesional</title>
        <meta name="description" content="Descubre el arte en tus uñas. En Suly Pretty Nails ofrecemos servicios de manicura, pedicura, diseños personalizados y mucho más. ¡Reserva tu cita hoy!" />
      </Helmet>
      <div className="overflow-x-hidden">
        {/* Hero Section */}
        <section className="relative min-h-[80vh] flex items-center bg-pink-50">
          <div className="absolute inset-0 opacity-20">
            <img  class="w-full h-full object-cover" alt="Fondo abstracto con texturas de esmalte de uñas en tonos pastel" src="https://images.unsplash.com/photo-1597773026935-df49538167e4" />
          </div>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 z-10">
            <motion.div
              className="max-w-2xl text-center md:text-left"
              initial="hidden"
              animate="visible"
              variants={{
                visible: {
                  transition: {
                    staggerChildren: 0.2,
                  },
                },
              }}
            >
              <motion.h1 variants={fadeIn} className="text-4xl md:text-6xl font-bold text-gray-800 font-serif">
                El Arte de la Belleza <br /> en tus Manos
              </motion.h1>
              <motion.p variants={fadeIn} className="mt-4 text-lg text-gray-600">
                En Suly Pretty Nails, transformamos tus uñas en una obra de arte. Calidad, creatividad y cuidado en cada detalle.
              </motion.p>
              <motion.div variants={fadeIn} className="mt-8 flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                <Button size="lg" asChild>
                  <Link to="/reservas" onClick={handleUnimplementedClick}>
                    Reservar Cita <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/servicios" onClick={handleUnimplementedClick}>Ver Servicios</Link>
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* About Us Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.5 }} transition={{ duration: 0.7 }}>
                <h2 className="text-3xl font-bold text-gray-800 font-serif">Bienvenida a tu Espacio de Belleza</h2>
                <p className="mt-4 text-gray-600">
                  Suly Pretty Nails nació de la pasión por el detalle y el arte de la manicura. Nuestro objetivo es ofrecerte una experiencia única y relajante, donde la calidad de nuestros productos y la profesionalidad de nuestro equipo garantizan resultados espectaculares.
                </p>
                <p className="mt-4 text-gray-600">
                  Creemos que cada cliente es único, y por eso nos dedicamos a escuchar tus ideas y a asesorarte para encontrar el estilo que mejor te represente.
                </p>
              </motion.div>
              <motion.div initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, amount: 0.5 }} transition={{ duration: 0.7 }}>
                <div className="rounded-lg overflow-hidden shadow-xl">
                  <img  class="w-full h-full object-cover" alt="Interior del salón Suly Pretty Nails, con estaciones de manicura modernas y ambiente acogedor" src="https://images.unsplash.com/photo-1633681926019-03bd9325ec20" />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Featured Services Section */}
        <section className="py-20 bg-pink-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-gray-800 font-serif">Nuestros Servicios Estrella</h2>
            <p className="mt-4 max-w-2xl mx-auto text-gray-600">
              Desde una manicura clásica hasta los diseños más atrevidos, tenemos el servicio perfecto para ti.
            </p>
            <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-lg shadow-md text-center">
                <div className="inline-block p-4 bg-primary/10 rounded-full">
                  <Brush className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-gray-800">Manicura y Pedicura</h3>
                <p className="mt-2 text-gray-600">Clásica, semipermanente, o con gel. Uñas perfectas por más tiempo.</p>
              </div>
              <div className="bg-white p-8 rounded-lg shadow-md text-center">
                <div className="inline-block p-4 bg-primary/10 rounded-full">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-gray-800">Diseños Personalizados</h3>
                <p className="mt-2 text-gray-600">Trae tu inspiración y la haremos realidad. ¡El límite es tu imaginación!</p>
              </div>
              <div className="bg-white p-8 rounded-lg shadow-md text-center">
                <div className="inline-block p-4 bg-primary/10 rounded-full">
                  <Gem className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-gray-800">Tratamientos de Belleza</h3>
                <p className="mt-2 text-gray-600">Lifting de pestañas, diseño de cejas y mucho más para realzar tu mirada.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default HomePage;
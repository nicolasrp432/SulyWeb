import React, { useMemo, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  Calendar, 
  Award, 
  Heart,
  ArrowRight,
  CheckCircle,
  MapPin
} from 'lucide-react';
import CommonNinjaReviews from "../components/CommonNinjaReviews";
import CommonNinjaMap from "../components/CommonNinjaMap";
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import LazyImage from '../components/LazyImage';
import { SkeletonLoader } from '../components/LoadingSpinner';

// Memoized feature item component
const FeatureItem = React.memo(({ feature, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 50 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay: index * 0.1 }}
    viewport={{ once: true }}
    className="text-center group"
  >
    <div className="relative inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
      <feature.icon className="h-10 w-10 text-white" />
      <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-rose-500 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>
    </div>
    <h3 className="text-xl font-semibold text-gray-800 mb-3">
      {feature.title}
    </h3>
    <p className="text-gray-600 leading-relaxed">
      {feature.description}
    </p>
  </motion.div>
));

FeatureItem.displayName = 'FeatureItem';

// Memoized service item component
const ServiceItem = React.memo(({ service, index, onServiceClick }) => {
  const handleClick = useCallback(() => onServiceClick(), [onServiceClick]);
  
  // Memoize image URL mapping
  const imageUrl = useMemo(() => {
    const imageMap = {
      'A close up of a woman\'s hands with a fresh pink manicure': 'https://images.unsplash.com/photo-1604654894610-df63bc536371?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1887&q=80',
      'A woman receiving a relaxing pedicure treatment': 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
      'A close up of an eye with long, curled eyelashes after a lifting treatment': 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80'
    };
    return imageMap[service.image] || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2069&q=80';
  }, [service.image]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      viewport={{ once: true }}
      className="group cursor-pointer service-card-hover"
      onClick={handleClick}
    >
      <div className="relative overflow-hidden rounded-2xl bg-white shadow-lg group-hover:shadow-2xl transition-all duration-300">
        <div className="aspect-w-4 aspect-h-3 relative">
          <LazyImage
            src={imageUrl}
            alt={service.description}
            className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
            placeholder={<SkeletonLoader className="w-full h-64" />}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>
        
        <div className="p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-2 group-hover:text-pink-600 transition-colors">
            {service.title}
          </h3>
          <p className="text-gray-600 mb-4">
            {service.description}
          </p>
          <div className="flex justify-between items-center">
            <span className="text-2xl font-bold gradient-text">
              {service.price}
            </span>
            <ArrowRight className="h-5 w-5 text-pink-500 group-hover:translate-x-2 transition-transform duration-300" />
          </div>
        </div>
      </div>
    </motion.div>
  );
});

ServiceItem.displayName = 'ServiceItem';

const Home = () => {
  const { toast } = useToast();

  // Memoize static data
  const features = useMemo(() => [
    {
      icon: Award,
      title: 'Profesionales Certificadas',
      description: 'Equipo especializado con años de experiencia en el sector.'
    },
    {
      icon: Sparkles,
      title: 'Productos Premium',
      description: 'Utilizamos solo las mejores marcas y productos de calidad.'
    },
    {
      icon: Heart,
      title: 'Atención Personalizada',
      description: 'Cada cliente recibe un trato único y especial en nuestras sedes.'
    },
    {
      icon: MapPin,
      title: 'Dos Sedes para Ti',
      description: 'Encuéntranos en Basauri y Galdakao para tu comodidad.'
    }
  ], []);

  const services = useMemo(() => [
    {
      title: 'Manicuras',
      description: 'Gel, semipermanente y diseños únicos.',
      image: 'A close up of a woman\'s hands with a fresh pink manicure',
      price: 'Desde 9,90€'
    },
    {
      title: 'Pedicuras',
      description: 'Relajantes pedicuras spa y tratamientos.',
      image: 'A woman receiving a relaxing pedicure treatment',
      price: 'Desde 14,90€'
    },
    {
      title: 'Lifting de Pestañas',
      description: 'Realza tu mirada de forma natural.',
      image: 'A close up of an eye with long, curled eyelashes after a lifting treatment',
      price: '30€'
    },
    {
      title: 'Depilación',
      description: 'Cejas, bigote, axilas y rostro.',
      image: 'A woman getting her eyebrows shaped professionally',
      price: 'Desde 5€'
    }
  ], []);

  // Memoize event handlers
  const handleServiceClick = useCallback(() => {
    toast({
      title: "🚧 Redirigiendo a Servicios",
      description: "Explora todos nuestros tratamientos y elige el tuyo. 🚀",
      duration: 3000,
    });
  }, [toast]);

  return (
    <>
      <Helmet>
        <title>Suly Pretty Nails - Salón de Manicura en Basauri y Galdakao</title>
        <meta name="description" content="Salón de belleza en Basauri y Galdakao, especializado en manicura, pedicura, diseños, lifting de pestañas y depilación. Reserva tu cita online." />
      </Helmet>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <LazyImage
            src="https://images.unsplash.com/photo-1633681926019-03bd9325ec20?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
            alt="Elegant nail salon interior with modern pink and gold decor"
            className="w-full h-full object-cover"
            placeholder={<SkeletonLoader className="w-full h-full" />}
            priority
          />
          <div className="absolute inset-0 hero-gradient"></div>
        </div>

        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-20 left-10 w-20 h-20 bg-pink-300/20 rounded-full blur-xl floating-animation"
            style={{ animationDelay: '0s' }}
          />
          <motion.div
            className="absolute top-40 right-20 w-32 h-32 bg-rose-300/20 rounded-full blur-xl floating-animation"
            style={{ animationDelay: '2s' }}
          />
          <motion.div
            className="absolute bottom-40 left-20 w-24 h-24 bg-yellow-300/20 rounded-full blur-xl floating-animation"
            style={{ animationDelay: '4s' }}
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                duration: 0.8, 
                delay: 0.3,
                ease: [0.25, 0.46, 0.45, 0.94]
              }}
              className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 text-white"
            >
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="h-5 w-5" />
              </motion.div>
              <span className="text-sm font-medium">Salón de Belleza Premium</span>
            </motion.div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
              <span className="block">Belleza y</span>
              <span className="block gradient-text">Elegancia</span>
              <span className="block">en tus Manos</span>
            </h1>

            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
              Descubre la experiencia única en Suly Pretty Nails. Tus especialistas en Basauri y Galdakao.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
              <Button 
                asChild
                size="lg"
                className="bg-white text-pink-600 hover:bg-gray-50 px-8 py-4 rounded-full text-lg font-semibold shadow-2xl hover:shadow-3xl transition-all duration-300 pulse-glow"
              >
                <Link to="/reservas" className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Reservar Cita</span>
                </Link>
              </Button>
              
              <Button 
                asChild
                variant="outline"
                size="lg"
                className="border-2 border-white text-white hover:bg-white hover:text-pink-600 px-8 py-4 rounded-full text-lg font-semibold backdrop-blur-sm transition-all duration-300"
              >
                <Link to="/servicios" className="flex items-center space-x-2">
                  <span>Ver Servicios</span>
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center"
          >
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1 h-3 bg-white/70 rounded-full mt-2"
            />
          </motion.div>
        </motion.div>
      </section>

      <section className="py-20 bg-gradient-to-br from-pink-50 to-rose-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold gradient-text mb-6">
              ¿Por qué Elegirnos?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Nos distinguimos por nuestra pasión, profesionalismo y dedicación 
              para brindarte la mejor experiencia de belleza.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <FeatureItem key={index} feature={feature} index={index} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold gradient-text mb-6">
              Servicios Estrella
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Descubre nuestros tratamientos más populares y déjate consentir por nuestras expertas.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.map((service, index) => (
              <ServiceItem 
                key={index} 
                service={service} 
                index={index} 
                onServiceClick={handleServiceClick}
              />
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Button 
              asChild
              size="lg"
              className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white px-8 py-4 rounded-full text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Link to="/servicios">Ver Todos los Servicios</Link>
            </Button>
          </motion.div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-br from-gray-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold gradient-text mb-6">
              Lo que Dicen Nuestras Clientas
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              La satisfacción de nuestras clientas es nuestra mayor recompensa.
            </p>
          </motion.div>

          {/* Reseñas con CommonNinja */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <CommonNinjaReviews />
          </motion.div>

          {/* Se eliminó la sección de Testimonios Destacados */}
        </div>
      </section>

      <section className="py-20 bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">
              ¿Lista para Lucir Espectacular?
            </h2>
            <p className="text-xl text-white/90 max-w-3xl mx-auto">
              Reserva tu cita hoy mismo en tu sede más cercana y déjate consentir.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                asChild
                size="lg"
                className="bg-white text-pink-600 hover:bg-gray-50 px-8 py-4 rounded-full text-lg font-semibold shadow-2xl hover:shadow-3xl transition-all duration-300"
              >
                <Link to="/reservas" className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Reservar Ahora</span>
                </Link>
              </Button>
              
              <Button 
                asChild
                variant="outline"
                size="lg"
                className="border-2 border-white text-white hover:bg-white hover:text-pink-600 px-8 py-4 rounded-full text-lg font-semibold backdrop-blur-sm transition-all duration-300"
              >
                <Link to="/contacto" className="flex items-center space-x-2">
                  <span>Contáctanos</span>
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            </div>

            <div className="flex flex-wrap justify-center items-center gap-8 pt-8 text-white/80">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5" />
                <span>Profesionales Certificadas</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5" />
                <span>Productos Premium</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5" />
                <span>Dos Sedes Disponibles</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default Home;
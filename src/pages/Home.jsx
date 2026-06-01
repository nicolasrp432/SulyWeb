import React, { useState, useEffect } from 'react';
import { motion, LayoutGroup, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Calendar,
  ArrowRight,
  CheckCircle,
  MapPin,
  Star,
  Clock,
  Heart,
  Sparkles
} from 'lucide-react';
import CommonNinjaReviews from "../components/CommonNinjaReviews";
import SEOHead from '../components/SEO/SEOHead';
import WhyChooseUsSlider from '../components/WhyChooseUsSlider';
import { Button } from '@/components/ui/button';
import { TextRotate } from '@/components/ui/text-rotate';
import { supabase } from '@/lib/customSupabaseClient';

/* ── Animation helpers ─────────────────────────── */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 32 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] },
});

/* ── Hero Image Carousel (Premium Crossfade Slider) ── */
const HERO_IMAGES = [
  "/serviciosimg/manicura-expres.jpg",
  "/serviciosimg/pedicura-completa.jpg",
  "/serviciosimg/lifting-pestañas.jpg",
  "/serviciosimg/depilar-cejas.jpg"
];

const HeroImageCarousel = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-[300px] sm:h-[380px] md:h-[420px] lg:h-[460px] rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white/90 bg-brand-rose-50 select-none">
      <AnimatePresence mode="wait">
        <motion.img
          key={index}
          src={HERO_IMAGES[index]}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          alt="Suly Pretty Nails - Tratamiento de belleza"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </AnimatePresence>
      
      {/* Soft overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/20 via-transparent to-transparent pointer-events-none" />
    </div>
  );
};

const Home = () => {
  const [minPrices, setMinPrices] = useState({
    manicura: 'Desde 9,90€',
    pedicura: 'Desde 14,90€',
    lifting: 'Desde 35€',
    depilacion: 'Desde 5€'
  });

  useEffect(() => {
    supabase
      .from('services')
      .select('*')
      .eq('active', true)
      .then(({ data }) => {
        if (data && data.length > 0) {
          // Manicuras: incluye manicura, acrílica, gel, baby boomer, limar, etc.
          const manicuras = data.filter(
            (s) =>
              s.name.toLowerCase().includes('manicura') ||
              s.name.toLowerCase().includes('cortar') ||
              s.name.toLowerCase().includes('gel') ||
              s.name.toLowerCase().includes('acrílic') ||
              s.name.toLowerCase().includes('uñas')
          );
          // Pedicuras
          const pedicuras = data.filter(
            (s) =>
              s.name.toLowerCase().includes('pedicura') ||
              s.name.toLowerCase().includes('pies')
          );
          // Lifting
          const lifting = data.find((s) => s.name.toLowerCase().includes('lifting'));
          // Depilación
          const depilacion = data.filter(
            (s) =>
              s.name.toLowerCase().includes('depilac') ||
              s.name.toLowerCase().includes('depilar') ||
              s.name.toLowerCase().includes('cejas') ||
              s.name.toLowerCase().includes('bigote') ||
              s.name.toLowerCase().includes('axila') ||
              s.name.toLowerCase().includes('rostro')
          );

          const getMinPriceString = (list, defaultVal) => {
            if (!list || list.length === 0) return defaultVal;
            const prices = list
              .map((s) => {
                const num = parseFloat(
                  (s.price ?? '').replace(',', '.').replace(/[^0-9.]/g, '')
                );
                return isNaN(num) ? Infinity : num;
              });
            const min = Math.min(...prices);
            return min === Infinity ? defaultVal : `Desde ${min.toString().replace('.', ',')}€`;
          };

          setMinPrices({
            manicura: getMinPriceString(manicuras, 'Desde 9,90€'),
            pedicura: getMinPriceString(pedicuras, 'Desde 14,90€'),
            lifting: lifting ? `Desde ${lifting.price}` : 'Desde 35€',
            depilacion: getMinPriceString(depilacion, 'Desde 5€'),
          });
        }
      });
  }, []);

  const services = [
    {
      title: 'Manicuras',
      description: 'Gel, semipermanente y diseños únicos.',
      image: '/serviciosimg/manicura-expres.jpg',
      price: minPrices.manicura,
    },
    {
      title: 'Pedicuras',
      description: 'Relajantes pedicuras spa y tratamientos.',
      image: '/serviciosimg/pedicura-completa.jpg',
      price: minPrices.pedicura,
    },
    {
      title: 'Lifting de Pestañas',
      description: 'Realza tu mirada de forma natural.',
      image: '/serviciosimg/lifting-pestañas.jpg',
      price: minPrices.lifting,
    },
    {
      title: 'Depilación',
      description: 'Cejas, bigote, axilas y rostro.',
      image: '/serviciosimg/depilar-cejas.jpg',
      price: minPrices.depilacion,
    },
  ];

  const trustBadges = [
    'Profesionales Certificadas',
    'Productos Premium',
    'Dos Sedes Disponibles',
  ];

  return (
    <>
      <SEOHead
        page="home"
        customTitle="Suly Pretty Nails - Mejor Salón de Uñas en Bilbao | Manicura Basauri y Galdakao"
        customDescription="Salón de uñas líder en Bilbao. Manicura profesional, pedicura spa, uñas de gel y lifting de pestañas en Basauri y Galdakao. ¡Reserva tu cita online desde 9,90€!"
        customKeywords="salón uñas Bilbao, manicura Basauri, pedicura Galdakao, uñas gel Bilbao, centro belleza Vizcaya, manicura profesional Bilbao, salón belleza Basauri"
        canonicalUrl="/"
      />

      {/* ===== NEW HERO - Inspired by Relaxe Spa ===== */}
      <section className="hero-relaxe">
        {/* Soft gradient background */}
        <div className="hero-relaxe-bg" />
        
        {/* Decorative blur shapes */}
        <div className="hero-relaxe-shape hero-relaxe-shape-1" />
        <div className="hero-relaxe-shape hero-relaxe-shape-2" />
        <div className="hero-relaxe-shape hero-relaxe-shape-3" />

        {/* Content */}
        <div className="hero-relaxe-content">
          {/* Left: Text content */}
          <motion.div
            className="hero-relaxe-text"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1 className="hero-relaxe-heading">
              <span className="hero-relaxe-heading-line">Relaja tu cuerpo</span>
              <span className="hero-relaxe-heading-line">y alma en</span>
              <span className="text-brand-rose block sm:inline-block">
                <TextRotate
                  texts={[
                    "Suly Pretty",
                    "tu salón",
                    "buenas manos",
                    "tu confianza",
                  ]}
                  mainClassName="overflow-hidden text-brand-rose inline-flex"
                  staggerDuration={0.05}
                  splitBy="words"
                  rotationInterval={3000}
                  transition={{ type: "spring", damping: 28, stiffness: 280 }}
                />
              </span>
            </h1>

            <motion.p 
              className="hero-relaxe-desc"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              Te ofrecemos la comodidad de consentirte con tratamientos profesionales de manicura, pedicura y belleza en nuestros salones de Basauri y Galdakao.
            </motion.p>

            <motion.div 
              className="hero-relaxe-buttons"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <Button
                asChild
                variant="gradient"
                size="lg"
                className="px-8 py-6 rounded-full text-base font-bold shadow-rose-sm hover:shadow-rose-md hover:scale-105 transition-all duration-300"
              >
                <Link to="/reservas" className="flex items-center gap-2">
                  <Calendar size={18} />
                  Reservar Cita
                </Link>
              </Button>
              
              <Button
                asChild
                variant="outline"
                size="lg"
                className="px-8 py-6 rounded-full text-base font-semibold hover:scale-105 transition-all duration-300 border-2 border-brand-rose/30 text-brand-rose hover:border-brand-rose hover:bg-brand-rose-50/50"
              >
                <Link to="/servicios" className="flex items-center gap-2">
                  <ArrowRight size={18} />
                  Ver Servicios
                </Link>
              </Button>
            </motion.div>

            {/* Feature pills - hidden on mobile */}
            <motion.div 
              className="hero-relaxe-features hidden lg:flex"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.5 }}
            >
              <div className="hero-feature-pill">
                <Heart size={16} className="text-brand-rose" />
                <div>
                  <span className="hero-feature-title">Relajación</span>
                  <span className="hero-feature-sub">Calma tu cuerpo y mente</span>
                </div>
              </div>
              <div className="hero-feature-pill">
                <Star size={16} className="text-brand-rose" />
                <div>
                  <span className="hero-feature-title">Satisfacción</span>
                  <span className="hero-feature-sub">Clientas felices siempre</span>
                </div>
              </div>
              <div className="hero-feature-pill">
                <Sparkles size={16} className="text-brand-rose" />
                <div>
                  <span className="hero-feature-title">Belleza</span>
                  <span className="hero-feature-sub">Resultados profesionales</span>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right: Hero image (mobile-first carousel) */}
          <motion.div
            className="flex lg:hidden items-center justify-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="hero-relaxe-image-wrapper w-full max-w-[290px] sm:max-w-sm">
              <HeroImageCarousel />
            </div>
          </motion.div>

          <motion.div
            className="hero-relaxe-visual hidden lg:flex"
            initial={{ opacity: 0, scale: 0.95, x: 40 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="hero-relaxe-image-wrapper">
              <HeroImageCarousel />
              <motion.div 
                className="hero-floating-card hidden md:block"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="hero-floating-card-inner">
                  <div className="hero-floating-stat">
                    <span className="hero-floating-num">500+</span>
                    <span className="hero-floating-label">Clientas</span>
                  </div>
                  <div className="hero-floating-divider" />
                  <div className="hero-floating-stat">
                    <span className="hero-floating-num">4.9</span>
                    <span className="hero-floating-label flex items-center gap-1">
                      <Star size={12} className="fill-brand-gold text-brand-gold" />
                      Rating
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>


      </section>

      {/* ===== WHY CHOOSE US — Slider ===== */}
      <WhyChooseUsSlider />

      {/* ===== SERVICIOS ESTRELLA ===== */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp()} className="text-center mb-14 sm:mb-16">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-rose mb-4">
              <span className="w-6 h-px bg-brand-rose" />
              Lo Mejor de Suly
              <span className="w-6 h-px bg-brand-rose" />
            </span>
            <h2 className="gradient-text mb-4">Servicios Estrella</h2>
            <p className="text-brand-mid max-w-2xl mx-auto leading-relaxed">
              Descubre nuestros tratamientos más populares y déjate consentir por nuestras expertas.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {services.map((service, i) => (
              <motion.div
                key={i}
                {...fadeUp(i * 0.08)}
                className="group"
              >
                <Link to="/servicios" className="block rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1.5">
                  {/* Image */}
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={service.image}
                      alt={service.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Always-visible gradient at bottom */}
                    <div className="absolute inset-0 bg-gradient-card" />
                    {/* Price badge */}
                    <span className="absolute bottom-3 left-3 badge-pill bg-white/90 text-brand-rose text-xs font-bold shadow-sm">
                      {service.price}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="p-4 bg-white">
                    <h3 className="font-bold text-brand-dark text-sm sm:text-base mb-1 group-hover:text-brand-rose transition-colors">
                      {service.title}
                    </h3>
                    <p className="text-xs text-brand-mid leading-relaxed">
                      {service.description}
                    </p>
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-rose">
                      Ver más <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          <motion.div {...fadeUp(0.3)} className="text-center mt-10 sm:mt-12">
            <Button
              asChild
              variant="gradient"
              size="lg"
              className="rounded-full px-10 shadow-rose-md"
            >
              <Link to="/servicios">
                Ver Todos los Servicios
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ===== TESTIMONIALS / REVIEWS ===== */}
      <section className="py-20 bg-gradient-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div {...fadeUp()} className="text-center mb-14">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-rose mb-4">
              <span className="w-6 h-px bg-brand-rose" />
              Opiniones Reales
              <span className="w-6 h-px bg-brand-rose" />
            </span>
            <h2 className="gradient-text mb-4">Lo que Dicen Nuestras Clientas</h2>
            <p className="text-brand-mid max-w-2xl mx-auto leading-relaxed">
              La satisfacción de nuestras clientas es nuestra mayor recompensa.
            </p>
          </motion.div>

          <motion.div {...fadeUp(0.1)}>
            <CommonNinjaReviews />
          </motion.div>
        </div>
      </section>

      {/* ===== CTA FINAL - Unified ===== */}
      <section className="relative py-20 sm:py-28 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-rose via-rose-600 to-brand-rose-dark" />
        {/* SVG decorative pattern */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="absolute inset-0 bg-black/10" />

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div {...fadeUp()} className="space-y-6 sm:space-y-8">
            <h2 className="font-sans font-bold text-white leading-tight" style={{ fontSize: 'clamp(1.75rem, 4.5vw, 3rem)' }}>
              ¿Lista para Lucir Espectacular?
            </h2>
            <p className="text-white/85 text-lg max-w-xl mx-auto leading-relaxed">
              Reserva tu cita hoy mismo en tu sede más cercana y déjate consentir.
            </p>

            <div className="flex justify-center">
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <Button
                  asChild
                  size="lg"
                  className="bg-white text-brand-rose hover:bg-brand-rose-50 px-8 rounded-full font-bold shadow-xl hover:shadow-2xl"
                >
                  <Link to="/reservas" className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Reservar Ahora
                  </Link>
                </Button>
              </motion.div>
            </div>

            <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 pt-2">
              {trustBadges.map((b) => (
                <span key={b} className="flex items-center gap-1.5 text-white/75 text-sm">
                  <CheckCircle className="h-4 w-4 text-brand-gold" />
                  {b}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default Home;

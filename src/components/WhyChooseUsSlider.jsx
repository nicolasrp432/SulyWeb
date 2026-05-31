import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Award, Sparkles, Heart, MapPin, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const FEATURES = [
  {
    icon: Award,
    title: 'Profesionales Certificadas',
    description: 'Equipo especializado con años de experiencia y formación continua en las últimas tendencias.',
    stat: '+8 años',
    statLabel: 'de experiencia',
  },
  {
    icon: Sparkles,
    title: 'Productos Premium',
    description: 'Trabajamos exclusivamente con las mejores marcas del mercado para garantizar resultados duraderos.',
    stat: '100%',
    statLabel: 'calidad certificada',
  },
  {
    icon: Heart,
    title: 'Atención Personalizada',
    description: 'Cada clienta recibe un trato único y especial, adaptado a sus gustos y necesidades.',
    stat: '500+',
    statLabel: 'clientas felices',
  },
  {
    icon: MapPin,
    title: 'Dos Sedes para Ti',
    description: 'Encuéntranos en Basauri y Galdakao. Elige la sede más cercana a ti y disfruta.',
    stat: '2',
    statLabel: 'ubicaciones',
  },
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 32 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] },
});

const FeatureCard = ({ feature, index }) => {
  const Icon = feature.icon;

  return (
    <motion.div
      className="why-card-new flex-shrink-0 w-[280px] sm:w-auto"
      {...fadeUp(index * 0.1)}
    >
      {/* Icon */}
      <div className="why-card-icon-new">
        <Icon size={24} strokeWidth={2} />
      </div>

      {/* Content */}
      <h3 className="why-card-title-new">{feature.title}</h3>
      <p className="why-card-desc-new">{feature.description}</p>

      {/* Stat */}
      <div className="why-card-stat-new">
        <span className="why-card-stat-num-new">{feature.stat}</span>
        <span className="why-card-stat-label-new">{feature.statLabel}</span>
      </div>
    </motion.div>
  );
};

const WhyChooseUsSlider = () => {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Check scroll position
  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll);
      return () => el.removeEventListener('scroll', checkScroll);
    }
  }, []);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section className="why-section-new">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="text-center mb-12 lg:mb-16"
          {...fadeUp()}
        >
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-rose mb-4">
            <span className="w-6 h-px bg-brand-rose" />
            Nuestras Fortalezas
            <span className="w-6 h-px bg-brand-rose" />
          </span>
          <h2 className="gradient-text mb-4">¿Por qué Elegirnos?</h2>
          <p className="text-brand-mid max-w-2xl mx-auto leading-relaxed">
            Nos distinguimos por nuestra pasión, profesionalismo y dedicación para brindarte la mejor experiencia de belleza.
          </p>
        </motion.div>

        {/* Mobile: Horizontal Slider */}
        <div className="sm:hidden relative">
          {/* Scroll buttons */}
          {canScrollLeft && (
            <button
              onClick={() => scroll('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center text-brand-rose hover:bg-white transition-colors"
              aria-label="Anterior"
            >
              <ChevronLeft size={20} />
            </button>
          )}
          {canScrollRight && (
            <button
              onClick={() => scroll('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center text-brand-rose hover:bg-white transition-colors"
              aria-label="Siguiente"
            >
              <ChevronRight size={20} />
            </button>
          )}

          {/* Scrollable container */}
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {FEATURES.map((feature, i) => (
              <div key={i} className="snap-start">
                <FeatureCard feature={feature} index={i} />
              </div>
            ))}
          </div>

          {/* Scroll indicator dots */}
          <div className="flex justify-center gap-2 mt-4">
            {FEATURES.map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-brand-rose/30"
              />
            ))}
          </div>
        </div>

        {/* Desktop: Grid */}
        <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {FEATURES.map((feature, i) => (
            <FeatureCard key={i} feature={feature} index={i} />
          ))}
        </div>

        {/* CTA */}
        <motion.div 
          className="text-center mt-12 lg:mt-16"
          {...fadeUp(0.4)}
        >
          <Link 
            to="/reservas" 
            className="inline-flex items-center gap-2 text-brand-rose font-semibold hover:gap-3 transition-all duration-300"
          >
            Reserva tu cita ahora
            <ArrowRight size={18} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default WhyChooseUsSlider;

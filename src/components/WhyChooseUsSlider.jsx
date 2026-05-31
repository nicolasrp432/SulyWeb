import React from 'react';
import { motion } from 'framer-motion';
import { Award, Sparkles, Heart, MapPin, ArrowRight } from 'lucide-react';
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
      className="why-card-new"
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

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
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

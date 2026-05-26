import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { Award, Sparkles, Heart, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';

const FEATURES = [
  {
    icon: Award,
    title: 'Profesionales Certificadas',
    description: 'Equipo especializado con años de experiencia y formación continua en las últimas tendencias.',
    stat: '+8 años',
    statLabel: 'de experiencia',
    color: '#E91E63',
    accent: '#FCE4EC',
  },
  {
    icon: Sparkles,
    title: 'Productos Premium',
    description: 'Trabajamos exclusivamente con las mejores marcas del mercado para garantizar resultados duraderos.',
    stat: '100%',
    statLabel: 'calidad certificada',
    color: '#D4AF37',
    accent: '#FFF8E1',
  },
  {
    icon: Heart,
    title: 'Atención Personalizada',
    description: 'Cada clienta recibe un trato único y especial, adaptado a sus gustos y necesidades.',
    stat: '500+',
    statLabel: 'clientas felices',
    color: '#E91E63',
    accent: '#FCE4EC',
  },
  {
    icon: MapPin,
    title: 'Dos Sedes para Ti',
    description: 'Encuéntranos en Basauri y Galdakao. Elige la sede más cercana a ti y disfruta.',
    stat: '2',
    statLabel: 'ubicaciones',
    color: '#D4AF37',
    accent: '#FFF8E1',
  },
];

const CARD_WIDTH = 340;
const CARD_GAP = 24;
const CARD_TOTAL = CARD_WIDTH + CARD_GAP;

const FeatureCard = ({ feature, index }) => {
  const Icon = feature.icon;

  return (
    <motion.div
      className="why-slider-card"
      style={{
        width: CARD_WIDTH,
        minWidth: CARD_WIDTH,
        '--card-color': feature.color,
        '--card-accent': feature.accent,
      }}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      viewport={{ once: true }}
    >
      {/* Glow background */}
      <div className="why-card-glow" />

      {/* Icon */}
      <div className="why-card-icon-wrap">
        <div className="why-card-icon-bg">
          <Icon size={28} color="#fff" strokeWidth={2} />
        </div>
      </div>

      {/* Content */}
      <h3 className="why-card-title">{feature.title}</h3>
      <p className="why-card-desc">{feature.description}</p>

      {/* Stat badge */}
      <div className="why-card-stat">
        <span className="why-card-stat-number">{feature.stat}</span>
        <span className="why-card-stat-label">{feature.statLabel}</span>
      </div>
    </motion.div>
  );
};

const WhyChooseUsSlider = () => {
  const trackRef = useRef(null);
  const containerRef = useRef(null);
  const x = useMotionValue(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [maxIndex, setMaxIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Calculate max scroll index based on container width
  const calcMaxIndex = useCallback(() => {
    if (!containerRef.current) return;
    const containerW = containerRef.current.offsetWidth;
    const totalCards = FEATURES.length;
    const visibleCards = Math.floor(containerW / CARD_TOTAL) || 1;
    setMaxIndex(Math.max(0, totalCards - visibleCards));
  }, []);

  useEffect(() => {
    calcMaxIndex();
    window.addEventListener('resize', calcMaxIndex);
    return () => window.removeEventListener('resize', calcMaxIndex);
  }, [calcMaxIndex]);

  const goTo = useCallback((idx) => {
    const clamped = Math.max(0, Math.min(idx, maxIndex));
    setActiveIndex(clamped);
    animate(x, -clamped * CARD_TOTAL, {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    });
  }, [maxIndex, x]);

  const handleDragEnd = (_, info) => {
    setIsDragging(false);
    const offset = info.offset.x;
    const velocity = info.velocity.x;
    const swipeThreshold = CARD_TOTAL / 3;

    let newIndex = activeIndex;
    if (offset < -swipeThreshold || velocity < -500) {
      newIndex = activeIndex + 1;
    } else if (offset > swipeThreshold || velocity > 500) {
      newIndex = activeIndex - 1;
    }
    goTo(newIndex);
  };

  // Progress bar
  const progress = maxIndex > 0 ? activeIndex / maxIndex : 0;

  return (
    <section className="why-choose-section">
      <div className="why-choose-inner">
        {/* Header */}
        <motion.div
          className="why-choose-header"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
        >
          <span className="why-choose-badge">
            <Sparkles size={14} />
            Nuestras Fortalezas
          </span>
          <h2 className="why-choose-title">
            ¿Por qué <span className="gradient-text">Elegirnos</span>?
          </h2>
          <p className="why-choose-subtitle">
            Nos distinguimos por nuestra pasión, profesionalismo y dedicación
            para brindarte la mejor experiencia de belleza.
          </p>
        </motion.div>

        {/* Slider */}
        <div className="why-slider-container" ref={containerRef}>
          <motion.div
            ref={trackRef}
            className="why-slider-track"
            style={{ x }}
            drag="x"
            dragConstraints={{
              left: -maxIndex * CARD_TOTAL,
              right: 0,
            }}
            dragElastic={0.1}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={handleDragEnd}
          >
            {FEATURES.map((feature, i) => (
              <FeatureCard key={i} feature={feature} index={i} />
            ))}
          </motion.div>
        </div>

        {/* Controls */}
        <div className="why-slider-controls">
          {/* Progress bar */}
          <div className="why-slider-progress-bar">
            <motion.div
              className="why-slider-progress-fill"
              animate={{ width: `${((activeIndex + 1) / FEATURES.length) * 100}%` }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          </div>

          {/* Arrows */}
          <div className="why-slider-arrows">
            <button
              className="why-slider-arrow"
              onClick={() => goTo(activeIndex - 1)}
              disabled={activeIndex === 0}
              aria-label="Anterior"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="why-slider-counter">
              {activeIndex + 1} / {FEATURES.length}
            </span>
            <button
              className="why-slider-arrow"
              onClick={() => goTo(activeIndex + 1)}
              disabled={activeIndex >= maxIndex}
              aria-label="Siguiente"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUsSlider;

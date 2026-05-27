import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Calendar,
  Award,
  Heart,
  ArrowRight,
  CheckCircle,
  MapPin,
  Star,
  Clock,
  Shield
} from 'lucide-react';
import CommonNinjaReviews from "../components/CommonNinjaReviews";
import SEOHead from '../components/SEO/SEOHead';
import WhyChooseUsSlider from '../components/WhyChooseUsSlider';
import { Button } from '@/components/ui/button';

/* ── Animation helpers ─────────────────────────── */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 32 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] },
});

const Home = () => {
  const services = [
    {
      title: 'Manicuras',
      description: 'Gel, semipermanente y diseños únicos.',
      image: '/serviciosimg/manicura-expres.jpg',
      price: 'Desde 9,90€',
    },
    {
      title: 'Pedicuras',
      description: 'Relajantes pedicuras spa y tratamientos.',
      image: '/serviciosimg/pedicura-completa.jpg',
      price: 'Desde 14,90€',
    },
    {
      title: 'Lifting de Pestañas',
      description: 'Realza tu mirada de forma natural.',
      image: '/serviciosimg/lifting-pestañas.jpg',
      price: 'Desde 35€',
    },
    {
      title: 'Depilación',
      description: 'Cejas, bigote, axilas y rostro.',
      image: '/serviciosimg/depilar-cejas.jpg',
      price: 'Desde 5€',
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
        customDescription="✨ Salón de uñas líder en Bilbao. Manicura profesional, pedicura spa, uñas de gel y lifting de pestañas en Basauri y Galdakao. ¡Reserva tu cita online desde 9,90€!"
        customKeywords="salón uñas Bilbao, manicura Basauri, pedicura Galdakao, uñas gel Bilbao, centro belleza Vizcaya, manicura profesional Bilbao, salón belleza Basauri"
        canonicalUrl="/"
      />

      {/* ===== HERO v2 ===== */}
      <section className="hero-v2">
        {/* Background image */}
        <div className="hero-v2-bg">
          <img
            src="https://images.unsplash.com/photo-1633681926019-03bd9325ec20?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
            alt="Elegant nail salon interior with modern pink and gold decor"
            loading="eager"
          />
          <div className="hero-v2-overlay" />
        </div>

        {/* Floating particles */}
        <motion.div
          className="hero-v2-particle"
          style={{ top: '15%', left: '8%', width: 80, height: 80, background: 'radial-gradient(circle, rgba(248,180,196,0.4), transparent)' }}
          animate={{ y: [0, -25, 0], x: [0, 10, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="hero-v2-particle"
          style={{ top: '60%', right: '5%', width: 120, height: 120, background: 'radial-gradient(circle, rgba(212,175,55,0.25), transparent)' }}
          animate={{ y: [0, 20, 0], x: [0, -15, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="hero-v2-particle"
          style={{ bottom: '20%', left: '30%', width: 60, height: 60, background: 'radial-gradient(circle, rgba(233,30,99,0.2), transparent)' }}
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />

        {/* Content grid */}
        <div className="hero-v2-content">
          {/* Left: text */}
          <motion.div
            className="hero-v2-text"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Badge */}
            <motion.div
              className="hero-v2-badge"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
            >
              <Sparkles size={14} />
              Salón de Belleza Premium
            </motion.div>

            <h1 className="hero-v2-heading">
              Tu Belleza,{' '}
              <span className="accent">Nuestra Pasión</span>
            </h1>

            <p className="hero-v2-desc">
              Descubre la experiencia única en <strong>Suly Pretty Nails</strong>.
              El mejor salón de uñas en <strong>Bilbao</strong>, con sedes en{' '}
              <strong>Basauri</strong> y <strong>Galdakao</strong>.
            </p>

            <div className="hero-v2-buttons">
              <Button
                asChild
                variant="gradient"
                size="lg"
                className="px-8 rounded-full text-base font-bold shadow-rose-lg hover:shadow-rose-xl pulse-glow"
              >
                <Link to="/reservas" className="flex items-center gap-2">
                  <Calendar size={18} />
                  Reservar Cita
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                className="border-2 border-white/70 bg-white/12 text-white hover:bg-white hover:text-brand-rose px-8 rounded-full text-base font-bold backdrop-blur-sm transition-all duration-200"
              >
                <Link to="/servicios" className="flex items-center gap-2">
                  Ver Servicios
                  <ArrowRight size={18} />
                </Link>
              </Button>
            </div>

            {/* Stats strip */}
            <motion.div
              className="hero-v2-stats"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <div className="hero-v2-stat">
                <span className="hero-v2-stat-num">500+</span>
                <span className="hero-v2-stat-label">Clientas</span>
              </div>
              <div className="hero-v2-stat">
                <span className="hero-v2-stat-num">4.9★</span>
                <span className="hero-v2-stat-label">Valoración</span>
              </div>
              <div className="hero-v2-stat">
                <span className="hero-v2-stat-num">2</span>
                <span className="hero-v2-stat-label">Sedes</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right: glass card */}
          <motion.div
            className="hero-v2-visual"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.8, type: 'spring' }}
          >
            <motion.div
              className="hero-v2-card"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div className="hero-v2-card-ring" />
              <Star size={32} color="#D4AF37" style={{ margin: '0 auto 1rem' }} />
              <h3>Experiencia Premium</h3>
              <p>
                Servicio de primera con productos de máxima calidad y un ambiente diseñado para ti.
              </p>
              <div className="hero-v2-card-features">
                <div className="hero-v2-card-feature">
                  <CheckCircle size={16} />
                  <span>Productos certificados</span>
                </div>
                <div className="hero-v2-card-feature">
                  <Clock size={16} />
                  <span>Reserva en 2 minutos</span>
                </div>
                <div className="hero-v2-card-feature">
                  <Shield size={16} />
                  <span>Profesionales expertas</span>
                </div>
                <div className="hero-v2-card-feature">
                  <MapPin size={16} />
                  <span>Basauri y Galdakao</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ width: 24, height: 40, border: '2px solid rgba(255,255,255,0.4)', borderRadius: 9999, display: 'flex', justifyContent: 'center' }}
          >
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ width: 4, height: 12, background: 'rgba(255,255,255,0.6)', borderRadius: 9999, marginTop: 8 }}
            />
          </motion.div>
        </motion.div>
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

      {/* ===== CTA FINAL ===== */}
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

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
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

              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <Button
                  asChild
                  size="lg"
                  className="border-2 border-white/60 bg-white/10 text-white hover:bg-white hover:text-brand-rose px-8 rounded-full font-bold backdrop-blur-sm"
                >
                  <Link to="/contacto" className="flex items-center gap-2">
                    Contáctanos
                    <ArrowRight className="h-4 w-4" />
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

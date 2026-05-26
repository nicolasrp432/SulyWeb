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
import CommonNinjaMap from "../components/CommonNinjaMap";
import SEOHead from '../components/SEO/SEOHead';
import WhyChooseUsSlider from '../components/WhyChooseUsSlider';

const Home = () => {

  const services = [
    {
      title: 'Manicuras',
      description: 'Gel, semipermanente y diseños únicos.',
      image: '/serviciosimg/manicura-expres.jpg',
      price: 'Desde 9,90€'
    },
    {
      title: 'Pedicuras',
      description: 'Relajantes pedicuras spa y tratamientos.',
      image: '/serviciosimg/pedicura-completa.jpg',
      price: 'Desde 14,90€'
    },
    {
      title: 'Lifting de Pestañas',
      description: 'Realza tu mirada de forma natural.',
      image: '/serviciosimg/lifting-pestañas.jpg',
      price: 'Desde 35€'
    },
    {
      title: 'Depilación',
      description: 'Tenemos para cejas, bigote, axilas y rostro.',
      image: '/serviciosimg/depilar-cejas.jpg',
      price: 'Desde 5€'
    }
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
              <Link to="/reservas" className="hero-v2-btn-primary">
                <Calendar size={18} />
                Reservar Cita
              </Link>
              <Link to="/servicios" className="hero-v2-btn-secondary">
                Ver Servicios
                <ArrowRight size={18} />
              </Link>
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
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group cursor-pointer service-card-hover"
              >
                <Link to="/servicios" className="block">
                  <div className="relative overflow-hidden rounded-2xl bg-white shadow-lg group-hover:shadow-2xl transition-all duration-300">
                    <div className="aspect-w-4 aspect-h-3 relative">
                      <img  
                        className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500" 
                        alt={service.description} 
                        src={service.image} 
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
                </Link>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Link
              to="/servicios"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white px-8 py-4 rounded-full text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Ver Todos los Servicios
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ===== TESTIMONIALS / REVIEWS ===== */}
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
        </div>
      </section>

      {/* ===== CTA FINAL ===== */}
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
              <Link
                to="/reservas"
                className="inline-flex items-center gap-2 bg-white text-pink-600 hover:bg-gray-50 px-8 py-4 rounded-full text-lg font-semibold shadow-2xl hover:shadow-3xl transition-all duration-300"
              >
                <Calendar className="h-5 w-5" />
                <span>Reservar Ahora</span>
              </Link>
              
              <Link
                to="/contacto"
                className="inline-flex items-center gap-2 border-2 border-white text-white hover:bg-white hover:text-pink-600 px-8 py-4 rounded-full text-lg font-semibold backdrop-blur-sm transition-all duration-300"
              >
                <span>Contáctanos</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
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
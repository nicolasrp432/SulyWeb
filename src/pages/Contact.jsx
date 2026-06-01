import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Send,
  Instagram,
  MessageCircle,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { sendContactNotificationToAdmin, sendContactConfirmationToUser } from '../lib/emailService';
import { supabase } from '@/lib/customSupabaseClient';
import { useContactForm } from '@/hooks/useFormValidation';
import MapComponent from '@/components/MapComponent';

const Contact = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Usar el hook de validación
  const {
    register,
    handleSubmit,
    getFieldError,
    hasFieldError,
    reset,
    errors
  } = useContactForm({
    name: '',
    email: '',
    message: ''
  });

  const locations = [
    { 
      name: 'Sede Basauri', 
      address: 'Kareaga Goikoa Kalea, 28, 48970 Basauri, Bizkaia',
      mapLink: 'https://www.google.com/maps/search/?api=1&query=Kareaga+Goikoa+Kalea,+28,+48970+Basauri,+Bizkaia'
    },
    { 
      name: 'Sede Galdakao', 
      address: 'Juan Bautista Uriarte Kalea, 27, 48960 Galdakao, Bizkaia',
      mapLink: 'https://www.google.com/maps/search/?api=1&query=Juan+Bautista+Uriarte+Kalea,+27,+48960+Galdakao,+Bizkaia'
    }
  ];

  const onSubmit = async (formData) => {
    setIsSubmitting(true);

    try {
      // Guardar en localStorage (como antes)
      const messages = JSON.parse(localStorage.getItem('contactMessages') || '[]');
      messages.push({ id: Date.now(), ...formData, timestamp: new Date().toISOString() });
      localStorage.setItem('contactMessages', JSON.stringify(messages));

      // Guardar en base de datos (tabla contact_messages)
      try {
        const { error: dbError } = await supabase
          .from('contact_messages')
          .insert([{ name: formData.name, email: formData.email, phone: formData.phone || null, message: formData.message }]);
        if (dbError) console.error('Error al guardar mensaje de contacto en DB:', dbError);
      } catch (dbCatchErr) {
        console.error('Excepción al guardar en DB:', dbCatchErr);
      }

      // Enviar correos: a admin y confirmación al usuario en paralelo
      const [adminEmail, userEmail] = await Promise.allSettled([
        sendContactNotificationToAdmin(formData),
        sendContactConfirmationToUser(formData)
      ]);

      const adminOk = adminEmail.status === 'fulfilled' && adminEmail.value?.success;
      const userOk = userEmail.status === 'fulfilled' && userEmail.value?.success;

      if (adminOk && userOk) {
        toast({
          title: '¡Mensaje enviado!',
          description: 'Hemos recibido tu mensaje y te hemos enviado una confirmación por email.'
        });
      } else if (adminOk || userOk) {
        toast({
          title: '¡Mensaje enviado!',
          description: 'Tu mensaje se ha enviado. Si no recibes confirmación por email, revisa tu correo o inténtalo más tarde.'
        });
      } else {
        toast({
          title: '¡Mensaje guardado!',
          description: 'Tu mensaje se ha guardado correctamente. Te responderemos pronto.'
        });
      }

      reset();
    } catch (error) {
      console.error('Error al procesar el formulario:', error);
      toast({ 
        title: "Error", 
        description: "Hubo un problema al enviar tu mensaje. Inténtalo de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Contacto - Suly Pretty Nails | Nuestras Sedes</title>
        <meta name="description" content="Contacta con Suly Pretty Nails en Basauri y Galdakao. Encuentra nuestras direcciones, horarios y teléfono." />
      </Helmet>

      {/* Page header */}
      <section className="relative pt-28 pb-12 bg-gradient-cream overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-rose/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/3 pointer-events-none" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-rose mb-4">
              <span className="w-6 h-px bg-brand-rose" />Estamos aquí para ti<span className="w-6 h-px bg-brand-rose" />
            </span>
            <h1 className="gradient-text">Contáctanos</h1>
            <p className="text-brand-mid max-w-2xl mx-auto mt-4 leading-relaxed">
              Estamos aquí para ayudarte. Visítanos en nuestras sedes o envíanos un mensaje.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Form + Maps */}
      <section className="py-14 sm:py-18 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-14">

            {/* ── Left: Contact form ── */}
            <motion.div
              initial={{ opacity: 0, x: -32 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="lg:col-span-2"
            >
              <div className="bg-brand-rose-50/50 border border-brand-rose-100 rounded-2xl p-7 sm:p-8 h-full">
                <h2 className="text-xl font-bold text-brand-dark mb-1">Envíanos un Mensaje</h2>
                <p className="text-sm text-brand-mid mb-6">Te responderemos lo antes posible.</p>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  {/* Name */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide text-brand-mid mb-1.5">Nombre *</label>
                    <input
                      type="text"
                      {...register('name')}
                      className={`w-full px-4 py-3 text-base md:text-sm bg-white border rounded-xl outline-none transition-all duration-200 ${
                        hasFieldError('name')
                          ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                          : 'border-brand-rose-100 focus:border-brand-rose focus:ring-2 focus:ring-brand-rose/15'
                      }`}
                      placeholder="Tu nombre completo"
                    />
                    {hasFieldError('name') && <p className="mt-1.5 text-xs text-red-500">{getFieldError('name')}</p>}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide text-brand-mid mb-1.5">Email *</label>
                    <input
                      type="email"
                      {...register('email')}
                      className={`w-full px-4 py-3 text-base md:text-sm bg-white border rounded-xl outline-none transition-all duration-200 ${
                        hasFieldError('email')
                          ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                          : 'border-brand-rose-100 focus:border-brand-rose focus:ring-2 focus:ring-brand-rose/15'
                      }`}
                      placeholder="tu@email.com"
                    />
                    {hasFieldError('email') && <p className="mt-1.5 text-xs text-red-500">{getFieldError('email')}</p>}
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wide text-brand-mid mb-1.5">Mensaje *</label>
                    <textarea
                      {...register('message')}
                      rows={5}
                      className={`w-full px-4 py-3 text-base md:text-sm bg-white border rounded-xl outline-none transition-all duration-200 resize-none ${
                        hasFieldError('message')
                          ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                          : 'border-brand-rose-100 focus:border-brand-rose focus:ring-2 focus:ring-brand-rose/15'
                      }`}
                      placeholder="Cuéntanos en qué podemos ayudarte..."
                    />
                    {hasFieldError('message') && <p className="mt-1.5 text-xs text-red-500">{getFieldError('message')}</p>}
                  </div>

                  <Button
                    type="submit"
                    variant="gradient"
                    size="lg"
                    className="w-full rounded-xl"
                    disabled={isSubmitting}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {isSubmitting ? 'Enviando...' : 'Enviar Mensaje'}
                  </Button>
                </form>

                {/* Quick contact */}
                <div className="mt-8 pt-6 border-t border-brand-rose-100 space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-brand-mid mb-3">O contáctanos directamente</p>
                  <a href="https://wa.link/f3tn6z" target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm text-brand-mid hover:text-brand-rose transition-colors group">
                    <span className="w-8 h-8 rounded-lg bg-brand-rose/10 flex items-center justify-center">
                      <MessageCircle className="h-4 w-4 text-brand-rose" />
                    </span>
                    631 119 686 (WhatsApp)
                  </a>
                  <a href="mailto:sulyprettynails@gmail.com"
                    className="flex items-center gap-3 text-sm text-brand-mid hover:text-brand-rose transition-colors group">
                    <span className="w-8 h-8 rounded-lg bg-brand-rose/10 flex items-center justify-center">
                      <Mail className="h-4 w-4 text-brand-rose" />
                    </span>
                    sulyprettynails@gmail.com
                  </a>
                  <a href="https://www.instagram.com/suly_prettynails/" target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 text-sm text-brand-mid hover:text-brand-rose transition-colors group">
                    <span className="w-8 h-8 rounded-lg bg-brand-rose/10 flex items-center justify-center">
                      <Instagram className="h-4 w-4 text-brand-rose" />
                    </span>
                    @suly_prettynails
                  </a>
                </div>
              </div>
            </motion.div>

            {/* ── Right: Maps ── */}
            <motion.div
              initial={{ opacity: 0, x: 32 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="lg:col-span-3 space-y-6"
            >
              {/* Basauri */}
              <div className="bg-white border border-brand-rose-100 rounded-2xl shadow-card overflow-hidden">
                <div className="px-6 pt-5 pb-3 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-6 h-6 rounded-full bg-brand-rose flex items-center justify-center">
                        <MapPin className="h-3 w-3 text-white" />
                      </span>
                      <h3 className="font-bold text-brand-dark">Sede Basauri</h3>
                    </div>
                    <p className="text-sm text-brand-mid ml-8">Kareaga Goikoa Kalea, 28, 48970 Basauri</p>
                  </div>
                  <a href="https://www.google.com/maps/search/?api=1&query=Kareaga+Goikoa+Kalea,+28,+48970+Basauri,+Bizkaia"
                    target="_blank" rel="noopener noreferrer"
                    className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-brand-rose hover:underline ml-4">
                    <ExternalLink className="h-3.5 w-3.5" /> Maps
                  </a>
                </div>
                <MapComponent
                  latitude={43.3000}
                  longitude={-2.9900}
                  title="Suly Pretty Nails - Basauri"
                  address="Kareaga Goikoa Kalea, 28, 48970 Basauri, Bizkaia"
                  height="220px"
                />
              </div>

              {/* Galdakao */}
              <div className="bg-white border border-brand-rose-100 rounded-2xl shadow-card overflow-hidden">
                <div className="px-6 pt-5 pb-3 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-6 h-6 rounded-full bg-brand-rose flex items-center justify-center">
                        <MapPin className="h-3 w-3 text-white" />
                      </span>
                      <h3 className="font-bold text-brand-dark">Sede Galdakao</h3>
                    </div>
                    <p className="text-sm text-brand-mid ml-8">Juan Bautista Uriarte Kalea, 27, 48960 Galdakao</p>
                  </div>
                  <a href="https://www.google.com/maps/search/?api=1&query=Juan+Bautista+Uriarte+Kalea,+27,+48960+Galdakao,+Bizkaia"
                    target="_blank" rel="noopener noreferrer"
                    className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-brand-rose hover:underline ml-4">
                    <ExternalLink className="h-3.5 w-3.5" /> Maps
                  </a>
                </div>
                <MapComponent
                  latitude={43.2350}
                  longitude={-2.9800}
                  title="Suly Pretty Nails - Galdakao"
                  address="Juan Bautista Uriarte Kalea, 27, 48960 Galdakao, Bizkaia"
                  height="220px"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Info cards */}
      <section className="py-14 sm:py-18 bg-gradient-cream">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-center gradient-text mb-10">Información General</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Clock,
                title: 'Horarios',
                lines: ['Lunes: 10:00 - 17:00', 'Mar – Vie: 10:00 - 20:00', 'Sábados: 09:00 - 14:00'],
              },
              {
                icon: Phone,
                title: 'Teléfono',
                links: [
                  { href: 'tel:631925725', text: '631 92 57 25' },
                  { href: 'tel:631119686', text: '631 11 96 86' },
                ],
              },
              {
                icon: Mail,
                title: 'Email',
                lines: ['sulyprettynails@gmail.com'],
              },
            ].map((card) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="bg-white border border-brand-rose-100 rounded-2xl p-6 flex flex-col items-center text-center shadow-card"
              >
                <div className="w-14 h-14 bg-brand-rose/10 rounded-2xl flex items-center justify-center mb-4">
                  <card.icon className="h-6 w-6 text-brand-rose" />
                </div>
                <h3 className="font-bold text-brand-dark mb-3">{card.title}</h3>
                <div className="space-y-1">
                  {card.lines?.map((l) => (
                    <p key={l} className="text-sm text-brand-mid">{l}</p>
                  ))}
                  {card.links?.map((l) => (
                    <a key={l.href} href={l.href} className="block text-sm text-brand-mid hover:text-brand-rose transition-colors">{l.text}</a>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

    </>
  );
};

export default Contact;
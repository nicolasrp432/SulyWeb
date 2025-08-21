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

      <section className="relative pt-32 pb-16 bg-gradient-to-br from-pink-50 to-rose-100">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold gradient-text">Contáctanos</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mt-6">
              Estamos aquí para ayudarte. Visítanos en nuestras sedes o envíanos un mensaje.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true }}>
              <div className="bg-white rounded-2xl shadow-lg p-8 h-full">
                <h2 className="text-3xl font-bold gradient-text mb-6">Envíanos un Mensaje</h2>


                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombre *</label>
                    <input 
                      type="text" 
                      {...register('name')}
                      className={`w-full px-4 py-3 border rounded-lg ${
                        hasFieldError('name') 
                          ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                          : 'border-gray-300 focus:ring-pink-500 focus:border-pink-500'
                      }`}
                      placeholder="Tu nombre completo"
                    />
                    {hasFieldError('name') && (
                      <p className="mt-1 text-sm text-red-600">{getFieldError('name')}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                    <input 
                      type="email" 
                      {...register('email')}
                      className={`w-full px-4 py-3 border rounded-lg ${
                        hasFieldError('email') 
                          ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                          : 'border-gray-300 focus:ring-pink-500 focus:border-pink-500'
                      }`}
                      placeholder="tu@email.com"
                    />
                    {hasFieldError('email') && (
                      <p className="mt-1 text-sm text-red-600">{getFieldError('email')}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mensaje *</label>
                    <textarea 
                      {...register('message')}
                      rows={5} 
                      className={`w-full px-4 py-3 border rounded-lg ${
                        hasFieldError('message') 
                          ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                          : 'border-gray-300 focus:ring-pink-500 focus:border-pink-500'
                      }`}
                      placeholder="Cuéntanos en qué podemos ayudarte..."
                    />
                    {hasFieldError('message') && (
                      <p className="mt-1 text-sm text-red-600">{getFieldError('message')}</p>
                    )}
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-3 rounded-lg font-medium flex items-center justify-center space-x-2"
                    disabled={isSubmitting}
                  >
                    <Send className="h-5 w-5" />
                    <span>{isSubmitting ? 'Enviando...' : 'Enviar'}</span>
                  </Button>
                </form>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }} viewport={{ once: true }} className="space-y-8">
              <div className="grid gap-8">
                {/* Mapa Basauri */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2 flex items-center">
                      <MapPin className="h-5 w-5 mr-2 text-pink-500" />
                      Sede Basauri
                    </h3>
                    <p className="text-gray-600 mb-4">Kareaga Goikoa Kalea, 28, 48970 Basauri, Bizkaia</p>
                  </div>
                  <MapComponent
                    latitude={43.3000}
                    longitude={-2.9900}
                    title="Suly Pretty Nails - Basauri"
                    address="Kareaga Goikoa Kalea, 28, 48970 Basauri, Bizkaia"
                    height="256px"
                  />
                  <div className="p-6">
                    <Button asChild className="bg-gradient-to-r from-pink-500 to-rose-500 text-white w-full">
                      <a href="https://www.google.com/maps/search/?api=1&query=Kareaga+Goikoa+Kalea,+28,+48970+Basauri,+Bizkaia" target="_blank" rel="noopener noreferrer">Ver en Google Maps</a>
                    </Button>
                  </div>
                </div>

                {/* Mapa Galdakao */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2 flex items-center">
                      <MapPin className="h-5 w-5 mr-2 text-pink-500" />
                      Sede Galdakao
                    </h3>
                    <p className="text-gray-600 mb-4">Juan Bautista Uriarte Kalea, 27, 48960 Galdakao, Bizkaia</p>
                  </div>
                  <MapComponent
                    latitude={43.2350}
                    longitude={-2.9800}
                    title="Suly Pretty Nails - Galdakao"
                    address="Juan Bautista Uriarte Kalea, 27, 48960 Galdakao, Bizkaia"
                    height="256px"
                  />
                  <div className="p-6">
                    <Button asChild className="bg-gradient-to-r from-pink-500 to-rose-500 text-white w-full">
                      <a href="https://www.google.com/maps/search/?api=1&query=Juan+Bautista+Uriarte+Kalea,+27,+48960+Galdakao,+Bizkaia" target="_blank" rel="noopener noreferrer">Ver en Google Maps</a>
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
             <h2 className="text-3xl font-bold gradient-text mb-8">Información General</h2>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md mb-4"><Clock className="h-8 w-8 text-pink-500"/></div>
                    <h3 className="text-lg font-semibold mb-2">Horarios</h3>
                    <p className="text-gray-600">Lunes: 10:00 - 17:00</p>
                    <p className="text-gray-600">Martes a Viernes: 10:00 - 20:00</p>
                    <p className="text-gray-600">Sábados: 09:00 - 14:00</p>
                </div>
                 <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md mb-4"><Phone className="h-8 w-8 text-pink-500"/></div>
                    <h3 className="text-lg font-semibold mb-2">Teléfono</h3>
                    <a href="tel:631925725" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-pink-600">631 92 57 25</a>
                    <a href="tel:631119686" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-pink-600 mt-1">631 11 96 86</a>
                </div>
                 <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md mb-4"><Mail className="h-8 w-8 text-pink-500"/></div>
                    <h3 className="text-lg font-semibold mb-2">Email</h3>
                    <p className="text-gray-600">sulyprettynails@gmail.com</p>
                </div>
             </div>
        </div>
      </section>

    </>
  );
};

export default Contact;
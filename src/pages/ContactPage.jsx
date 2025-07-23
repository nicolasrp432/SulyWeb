import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { sendContactNotificationToAdmin } from '@/lib/emailService';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { VALIDATION } from '@/constants';
import MapComponent from '@/components/MapComponent';

// Esquema de validación específico para ContactPage
const contactPageSchema = z.object({
  name: z
    .string()
    .min(VALIDATION.NAME_MIN_LENGTH, `El nombre debe tener al menos ${VALIDATION.NAME_MIN_LENGTH} caracteres`)
    .max(VALIDATION.NAME_MAX_LENGTH, `El nombre no puede exceder ${VALIDATION.NAME_MAX_LENGTH} caracteres`)
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo puede contener letras y espacios'),
  
  email: z
    .string()
    .email('Por favor, introduce un email válido')
    .regex(VALIDATION.EMAIL_REGEX, 'Formato de email inválido'),
  
  phone: z
    .string()
    .optional()
    .refine((val) => {
      if (!val || val.trim() === '') return true; // Campo opcional
      return VALIDATION.PHONE_REGEX.test(val);
    }, 'Formato de teléfono inválido (mínimo 9 dígitos)'),
  
  message: z
    .string()
    .min(10, 'El mensaje debe tener al menos 10 caracteres')
    .max(1000, 'El mensaje no puede exceder 1000 caracteres')
});

const ContactPage = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(contactPageSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      message: ''
    }
  });

  const onSubmit = async (formData) => {
    setIsSubmitting(true);

    try {
      // Insertar en Supabase
      const { error } = await supabase
        .from('contact_messages')
        .insert([{
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          message: formData.message,
          created_at: new Date().toISOString()
        }]);

      if (error) {
        throw error;
      }

      // Enviar notificación al administrador
      try {
        const emailResult = await sendContactNotificationToAdmin(formData);
        if (emailResult.success) {
          toast({
            title: "¡Mensaje enviado!",
            description: "Hemos recibido tu mensaje y te responderemos pronto. También hemos notificado a nuestro equipo."
          });
        } else {
          toast({
            title: "¡Mensaje guardado!",
            description: "Tu mensaje se ha guardado correctamente. Te responderemos pronto."
          });
        }
      } catch (emailError) {
        console.error('Error al enviar email:', emailError);
        toast({
          title: "¡Mensaje guardado!",
          description: "Tu mensaje se ha guardado correctamente. Te responderemos pronto."
        });
      }

      reset();
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      toast({
        title: "Error",
        description: "Hubo un problema al enviar tu mensaje. Por favor, inténtalo de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Contacto - Suly Pretty Nails</title>
        <meta name="description" content="¿Tienes preguntas? Ponte en contacto con Suly Pretty Nails. Encuentra nuestra ubicación y datos de contacto." />
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Ponte en Contacto</h1>
            <p className="text-xl max-w-2xl mx-auto">
              Estamos aquí para ayudarte. Contáctanos para reservas, consultas o cualquier pregunta.
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl text-center">Envíanos un Mensaje</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre completo *
                      </label>
                      <Input
                        id="name"
                        type="text"
                        {...register('name')}
                        placeholder="Tu nombre completo"
                        className={errors.name ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}
                      />
                      {errors.name && (
                        <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <Input
                        id="email"
                        type="email"
                        {...register('email')}
                        placeholder="tu@email.com"
                        className={errors.email ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}
                      />
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                        Teléfono
                      </label>
                      <Input
                        id="phone"
                        type="tel"
                        {...register('phone')}
                        placeholder="Tu número de teléfono (opcional)"
                        className={errors.phone ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}
                      />
                      {errors.phone && (
                        <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                        Mensaje *
                      </label>
                      <Textarea
                        id="message"
                        {...register('message')}
                        placeholder="Cuéntanos en qué podemos ayudarte..."
                        rows={5}
                        className={errors.message ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}
                      />
                      {errors.message && (
                        <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>
                      )}
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Enviando...' : 'Enviar Mensaje'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Contact Info */}
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl text-center">Información de Contacto</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center">
                      <Phone className="h-6 w-6 text-pink-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Teléfono</h3>
                      <p className="text-gray-600">+34 123 456 789</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center">
                      <Mail className="h-6 w-6 text-pink-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Email</h3>
                      <p className="text-gray-600">sulyprettynails@gmail.com</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center">
                      <Clock className="h-6 w-6 text-pink-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Horarios</h3>
                      <p className="text-gray-600">Lun-Sáb: 9:00 - 20:00</p>
                      <p className="text-gray-600">Dom: 10:00 - 18:00</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Locations Section */}
          <div className="mt-16">
            <h2 className="text-3xl font-bold text-center mb-12">Nuestras Ubicaciones</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {/* Basauri Location */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MapPin className="h-5 w-5 text-pink-600" />
                    <span>Basauri</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-gray-600">
                      C. Kareaga Goikoa, 28<br />
                      48970 Basauri, Vizcaya
                    </p>
                    <MapComponent
                      latitude={43.3000}
                      longitude={-2.9900}
                      title="Suly Pretty Nails - Basauri"
                      address="C. Kareaga Goikoa, 28, 48970 Basauri, Vizcaya"
                      height="256px"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Galdakao Location */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MapPin className="h-5 w-5 text-pink-600" />
                    <span>Galdakao</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-gray-600">
                      C. Juan Bautista Uriarte, 27<br />
                      48960 Galdakao, Vizcaya
                    </p>
                    <MapComponent
                      latitude={43.2350}
                      longitude={-2.9800}
                      title="Suly Pretty Nails - Galdakao"
                      address="Juan Bautista Uriarte Kalea, 27, 48960 Galdakao, Bizkaia"
                      height="256px"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ContactPage;
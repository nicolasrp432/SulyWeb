import React, { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import SEOHead from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Phone, Mail } from 'lucide-react';
import MapComponent from '@/components/MapComponent';
import { supabase } from '@/lib/customSupabaseClient';

const ContactPage = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('contact_messages')
        .insert([
          {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            message: formData.message,
            created_at: new Date().toISOString()
          }
        ]);

      if (error) {
        throw error;
      }

      toast({
        title: "¡Mensaje enviado!",
        description: "Gracias por contactarnos. Te responderemos pronto.",
      });

      setFormData({
        name: '',
        email: '',
        phone: '',
        message: ''
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error al enviar",
        description: "Hubo un problema al enviar tu mensaje. Inténtalo de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <SEOHead />
      
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
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre completo *
                      </label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Tu nombre completo"
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="tu@email.com"
                      />
                    </div>

                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                        Teléfono
                      </label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="Tu número de teléfono"
                      />
                    </div>

                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                        Mensaje *
                      </label>
                      <Textarea
                        id="message"
                        name="message"
                        required
                        value={formData.message}
                        onChange={handleInputChange}
                        placeholder="Cuéntanos en qué podemos ayudarte..."
                        rows={5}
                      />
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
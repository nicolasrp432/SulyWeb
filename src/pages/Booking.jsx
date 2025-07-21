
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  MessageSquare,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  MapPin,
  Sparkles,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';

const Booking = () => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [bookingData, setBookingData] = useState({
    location: '',
    service: '',
    date: '',
    time: '',
    name: '',
    phone: '',
    email: '',
    notes: ''
  });
  const [locations, setLocations] = useState([]);
  const [services, setServices] = useState([]);
  const [blockedSlots, setBlockedSlots] = useState([]);
  const [loading, setLoading] = useState({
    locations: true,
    services: true,
    slots: false
  });

  const timeSlots = [
    '09:00', '10:00', '11:00', '12:00', '15:00', '16:00', '17:00', '18:00', '19:00'
  ];

  const generateAvailableDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 1; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      if (date.getDay() !== 0) { // Skip Sundays
        dates.push({
          date: date.toISOString().split('T')[0],
          display: date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
        });
      }
    }
    return dates;
  };

  const availableDates = useMemo(() => generateAvailableDates(), []);

  const fetchLocations = useCallback(async () => {
    setLoading(prev => ({ ...prev, locations: true }));
    const { data, error } = await supabase.from('locations').select('*');
    if (error) {
      toast({ title: "Error", description: "No se pudieron cargar las sedes." });
    } else {
      setLocations(data);
    }
    setLoading(prev => ({ ...prev, locations: false }));
  }, [toast]);

  const fetchServices = useCallback(async () => {
    setLoading(prev => ({ ...prev, services: true }));
    const { data, error } = await supabase.from('services').select('*');
    if (error) {
      toast({ title: "Error", description: "No se pudieron cargar los servicios." });
    } else {
      setServices(data);
    }
    setLoading(prev => ({ ...prev, services: false }));
  }, [toast]);

  useEffect(() => {
    fetchLocations();
    fetchServices();
  }, [fetchLocations, fetchServices]);

  const getBlockedSlots = useCallback(async (locationId, date) => {
    if (!locationId || !date) return;
    setLoading(prev => ({ ...prev, slots: true }));
    const { data, error } = await supabase
      .from('bookings')
      .select('booking_time')
      .eq('location_id', locationId)
      .eq('booking_date', date);
    
    if (error) {
      toast({ title: "Error", description: "No se pudieron verificar los horarios." });
      setBlockedSlots([]);
    } else {
      setBlockedSlots(data.map(b => b.booking_time));
    }
    setLoading(prev => ({ ...prev, slots: false }));
  }, [toast]);

  const handleInputChange = (field, value) => {
    const newData = { ...bookingData, [field]: value };
    
    if (field === 'date') {
      getBlockedSlots(newData.location, value);
      newData.time = '';
    }
    if (field === 'location') {
        newData.service = '';
        newData.date = '';
        newData.time = '';
        setBlockedSlots([]);
    }

    setBookingData(newData);
  };

  const handleNextStep = () => {
    if (isStepValid()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmitBooking = async () => {
    setLoading(prev => ({ ...prev, submit: true }));
    const { error } = await supabase.from('bookings').insert([
      {
        location_id: bookingData.location,
        service_id: bookingData.service,
        booking_date: bookingData.date,
        booking_time: bookingData.time,
        client_name: bookingData.name,
        client_phone: bookingData.phone,
        client_email: bookingData.email,
        notes: bookingData.notes,
      },
    ]);
    setLoading(prev => ({ ...prev, submit: false }));

    if (error) {
      toast({
        variant: "destructive",
        title: "¡Error en la reserva!",
        description: "El horario seleccionado ya no está disponible. Por favor, elige otro.",
      });
      getBlockedSlots(bookingData.location, bookingData.date);
      setBookingData(prev => ({ ...prev, time: '' }));
      setCurrentStep(3);
    } else {
      toast({
        title: "¡Reserva confirmada!",
        description: `Gracias ${bookingData.name}, hemos recibido tu solicitud. Te contactaremos pronto.`,
        duration: 5000,
      });
      setCurrentStep(5);
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return 'Elige tu Sede';
      case 2: return 'Selecciona tu Servicio';
      case 3: return 'Elige Fecha y Hora';
      case 4: return 'Tus Datos Personales';
      case 5: return '¡Reserva Realizada!';
      default: return '';
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1: return !!bookingData.location;
      case 2: return !!bookingData.service;
      case 3: return !!bookingData.date && !!bookingData.time;
      case 4: return !!bookingData.name && !!bookingData.phone && !!bookingData.email;
      default: return false;
    }
  };

  const resetBooking = () => {
    setBookingData({ location: '', service: '', date: '', time: '', name: '', phone: '', email: '', notes: '' });
    setCurrentStep(1);
  }

  return (
    <>
      <Helmet>
        <title>Reservas - Suly Pretty Nails | Reserva tu Cita Online</title>
        <meta name="description" content="Reserva tu cita en Suly Pretty Nails (Basauri y Galdakao). Sistema de reservas fácil para todos nuestros servicios." />
      </Helmet>

      <section className="relative pt-20 pb-16 bg-gradient-to-br from-pink-50 to-rose-100 overflow-hidden">
         <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold gradient-text">{getStepTitle()}</h1>
            </motion.div>
         </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {currentStep <= 4 && (
            <div className="w-full bg-gray-200 rounded-full h-2 mb-12">
              <div
                className="bg-gradient-to-r from-pink-500 to-rose-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
              ></div>
            </div>
          )}

          <motion.div key={currentStep} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="bg-gray-50 rounded-2xl p-8">
            {currentStep === 1 && (
              loading.locations ? <Loader2 className="mx-auto h-12 w-12 animate-spin text-pink-500" /> :
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {locations.map((loc) => (
                  <motion.div key={loc.id} whileHover={{ scale: 1.02 }} onClick={() => handleInputChange('location', loc.id)} className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 ${bookingData.location === loc.id ? 'border-pink-500 bg-pink-50 shadow-lg' : 'border-gray-200 bg-white hover:border-pink-300'}`}>
                    <MapPin className="h-8 w-8 text-pink-500 mb-4" />
                    <h3 className="font-semibold text-xl text-gray-800 mb-2">{loc.name}</h3>
                    <p className="text-gray-600">{loc.address}</p>
                  </motion.div>
                ))}
              </div>
            )}
            {currentStep === 2 && (
              loading.services ? <Loader2 className="mx-auto h-12 w-12 animate-spin text-pink-500" /> :
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map((service) => (
                  <motion.div key={service.id} whileHover={{ scale: 1.02 }} onClick={() => handleInputChange('service', service.id)} className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 ${bookingData.service === service.id ? 'border-pink-500 bg-pink-50 shadow-lg' : 'border-gray-200 bg-white hover:border-pink-300'}`}>
                    <Sparkles className="h-6 w-6 text-pink-500 mb-2" />
                    <h3 className="font-semibold text-gray-800 mb-2">{service.name}</h3>
                    <div className="flex justify-between items-center text-sm text-gray-600">
                      <span><Clock className="h-4 w-4 inline mr-1" />{service.duration}</span>
                      <span className="font-bold text-pink-600">{service.price}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
            {currentStep === 3 && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center"><Calendar className="h-5 w-5 mr-2 text-pink-500" />Selecciona una Fecha</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto pr-2">
                    {availableDates.map((d) => (
                      <motion.button key={d.date} whileHover={{ scale: 1.02 }} onClick={() => handleInputChange('date', d.date)} className={`p-3 rounded-lg text-left transition-all duration-300 ${bookingData.date === d.date ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg' : 'bg-white border'}`}>
                        <div className="text-sm font-medium capitalize">{d.display}</div>
                      </motion.button>
                    ))}
                  </div>
                </div>
                {bookingData.date && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center"><Clock className="h-5 w-5 mr-2 text-pink-500" />Selecciona una Hora</h3>
                    {loading.slots ? <Loader2 className="mx-auto h-8 w-8 animate-spin text-pink-500" /> :
                    <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                      {timeSlots.map((time) => {
                          const isBlocked = blockedSlots.includes(time);
                          return (
                            <motion.button key={time} whileHover={{ scale: 1.05 }} onClick={() => !isBlocked && handleInputChange('time', time)} disabled={isBlocked} className={`p-3 rounded-lg font-medium transition-all duration-300 ${isBlocked ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : bookingData.time === time ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg' : 'bg-white border'}`}>
                              {time}
                            </motion.button>
                          )
                        })}
                    </div>}
                  </div>
                )}
              </div>
            )}
            {currentStep === 4 && (
              <div className="space-y-6">
                 <div className="bg-white rounded-xl p-6 border-2 border-pink-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Resumen de tu Reserva</h3>
                  <div className="space-y-3">
                    <p><strong>Sede:</strong> {locations.find(l => l.id === bookingData.location)?.name}</p>
                    <p><strong>Servicio:</strong> {services.find(s => s.id === bookingData.service)?.name}</p>
                    <p><strong>Fecha:</strong> {availableDates.find(d => d.date === bookingData.date)?.display} a las {bookingData.time}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2"><User className="h-4 w-4 inline mr-2" />Nombre *</label>
                    <input type="text" value={bookingData.name} onChange={(e) => handleInputChange('name', e.target.value)} className="w-full px-4 py-3 border rounded-lg" placeholder="Tu nombre" required/>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2"><Phone className="h-4 w-4 inline mr-2" />Teléfono *</label>
                    <input type="tel" value={bookingData.phone} onChange={(e) => handleInputChange('phone', e.target.value)} className="w-full px-4 py-3 border rounded-lg" placeholder="Tu teléfono" required/>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2"><Mail className="h-4 w-4 inline mr-2" />Email *</label>
                  <input type="email" value={bookingData.email} onChange={(e) => handleInputChange('email', e.target.value)} className="w-full px-4 py-3 border rounded-lg" placeholder="tu@email.com" required/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2"><MessageSquare className="h-4 w-4 inline mr-2" />Notas</label>
                  <textarea value={bookingData.notes} onChange={(e) => handleInputChange('notes', e.target.value)} rows={3} className="w-full px-4 py-3 border rounded-lg" placeholder="Alergias, preferencias..."/>
                </div>
              </div>
            )}
            {currentStep === 5 && (
                <div className="text-center">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <p className="text-gray-600 mb-8 max-w-md mx-auto">Tu solicitud de reserva ha sido enviada. Recibirás una confirmación por WhatsApp en breve. ¡Gracias por confiar en nosotras!</p>
                    <Button onClick={resetBooking} className="bg-gradient-to-r from-pink-500 to-rose-500 text-white">
                        Hacer Otra Reserva
                    </Button>
                </div>
            )}
          </motion.div>

          {currentStep <= 4 && (
            <div className="flex justify-between mt-8">
              <Button onClick={handlePrevStep} variant="outline" disabled={currentStep === 1} className="flex items-center space-x-2">
                <ArrowLeft className="h-4 w-4" /><span>Anterior</span>
              </Button>
              {currentStep < 4 ? (
                <Button onClick={handleNextStep} disabled={!isStepValid()} className="bg-gradient-to-r from-pink-500 to-rose-500 text-white flex items-center space-x-2">
                  <span>Siguiente</span><ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleSubmitBooking} disabled={loading.submit} className="bg-gradient-to-r from-pink-500 to-rose-500 text-white flex items-center space-x-2">
                  {loading.submit ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                  <span>Confirmar Reserva</span>
                </Button>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default Booking;

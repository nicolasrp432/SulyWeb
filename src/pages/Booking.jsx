
import React, { useReducer, useMemo, useEffect, useCallback, memo } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { 
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { sendBookingNotificationToAdmin } from '@/lib/emailService';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useBookingCart } from '@/contexts/BookingCartContext';
import { CONFIG, MESSAGES } from '@/constants';
import { 
  LocationStep, 
  ServicesStep, 
  DateTimeStep, 
  PersonalDataStep, 
  ConfirmationStep 
} from '@/components/BookingSteps';

// Reducer para el estado del booking
const bookingReducer = (state, action) => {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: action.payload };
    case 'SET_BOOKING_DATA':
      return { ...state, bookingData: { ...state.bookingData, ...action.payload } };
    case 'SET_LOCATIONS':
      return { ...state, locations: action.payload };
    case 'SET_SERVICES':
      return { ...state, services: action.payload };
    case 'SET_BLOCKED_SLOTS':
      return { ...state, blockedSlots: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: { ...state.loading, ...action.payload } };
    case 'RESET_BOOKING':
      return {
        ...state,
        currentStep: CONFIG.BOOKING.STEPS.LOCATION,
        bookingData: {
          location: '',
          services: [],
          date: '',
          time: '',
          name: '',
          phone: '',
          email: '',
          notes: ''
        },
        blockedSlots: []
      };
    default:
      return state;
  }
};

const initialState = {
  currentStep: CONFIG.BOOKING.STEPS.LOCATION,
  bookingData: {
    location: '',
    services: [],
    date: '',
    time: '',
    name: '',
    phone: '',
    email: '',
    notes: ''
  },
  locations: [],
  services: [],
  blockedSlots: [],
  loading: {
    locations: true,
    services: true,
    slots: false,
    submit: false
  }
};

const Booking = () => {
  const { toast } = useToast();
  const { selectedServices, removeService, clearServices } = useBookingCart();
  const [state, dispatch] = useReducer(bookingReducer, initialState);
  const { currentStep, bookingData, locations, services, blockedSlots, loading } = state;

  // Usar constantes para time slots
  const timeSlots = CONFIG.BOOKING.TIME_SLOTS;

  const generateAvailableDates = useCallback(() => {
    const dates = [];
    const today = new Date();
    for (let i = 1; i <= CONFIG.BOOKING.MAX_ADVANCE_DAYS; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      if (!CONFIG.BOOKING.EXCLUDED_DAYS.includes(date.getDay())) {
        dates.push({
          date: date.toISOString().split('T')[0],
          display: date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
        });
      }
    }
    return dates;
  }, []);

  const availableDates = useMemo(() => generateAvailableDates(), [generateAvailableDates]);

  const fetchLocations = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: { locations: true } });
    try {
      const { data, error } = await supabase.from('locations').select('*');
      if (error) throw error;
      dispatch({ type: 'SET_LOCATIONS', payload: data });
    } catch (error) {
      toast({ 
        title: "Error", 
        description: MESSAGES.ERRORS.LOAD_LOCATIONS,
        variant: "destructive",
        duration: CONFIG.TOAST.ERROR_DURATION
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { locations: false } });
    }
  }, [toast]);

  const fetchServices = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: { services: true } });
    try {
      // Asegurarse de obtener todos los servicios sin filtros
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('id', { ascending: true });
        
      if (error) {
        console.error('Error al cargar servicios (detalle):', error);
        throw error;
      }
      
      // Verificar si todos los servicios del esquema están presentes
      console.log('Servicios cargados:', data?.length || 0);
      console.log('Primeros 3 servicios:', data?.slice(0, 3));
      
      if (!data || data.length === 0) {
        console.warn('No se encontraron servicios en la base de datos');
      }
      
      dispatch({ type: 'SET_SERVICES', payload: data || [] });
      
      // Si hay servicios seleccionados en el carrito, usarlos
      if (selectedServices.length > 0) {
        console.log('Usando servicios del carrito:', selectedServices.length);
        dispatch({ 
          type: 'SET_BOOKING_DATA', 
          payload: { services: selectedServices.map(service => service.id) }
        });
      }
    } catch (error) {
      console.error('Error al cargar servicios:', error);
      toast({ 
        title: "Error", 
        description: MESSAGES.ERRORS.LOAD_SERVICES,
        variant: "destructive",
        duration: CONFIG.TOAST.ERROR_DURATION
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { services: false } });
    }
  }, [toast, selectedServices]);

  useEffect(() => {
    fetchLocations();
    fetchServices();
  }, [fetchLocations, fetchServices]);

  const getBlockedSlots = useCallback(async (locationId, date) => {
    if (!locationId || !date) return;
    dispatch({ type: 'SET_LOADING', payload: { slots: true } });
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('booking_time')
        .eq('location_id', locationId)
        .eq('booking_date', date);
      
      if (error) throw error;
      dispatch({ type: 'SET_BLOCKED_SLOTS', payload: data.map(b => b.booking_time) });
    } catch (error) {
      toast({ 
        title: "Error", 
        description: MESSAGES.ERRORS.VERIFY_SLOTS,
        variant: "destructive",
        duration: CONFIG.TOAST.ERROR_DURATION
      });
      dispatch({ type: 'SET_BLOCKED_SLOTS', payload: [] });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { slots: false } });
    }
  }, [toast]);

  const handleInputChange = useCallback((field, value) => {
    const updates = { [field]: value };
    
    if (field === 'date') {
      getBlockedSlots(bookingData.location, value);
      updates.time = '';
    }
    if (field === 'location') {
      updates.date = '';
      updates.time = '';
      dispatch({ type: 'SET_BLOCKED_SLOTS', payload: [] });
    }
    if (field === 'service') {
      // Para servicios individuales desde la página de reserva
      const currentServices = bookingData.services;
      if (!currentServices.includes(value)) {
        updates.services = [...currentServices, value];
      } else {
        updates.services = currentServices.filter(id => id !== value);
      }
    }

    dispatch({ type: 'SET_BOOKING_DATA', payload: updates });
  }, [bookingData.location, bookingData.services, getBlockedSlots]);
  
  const handleRemoveService = useCallback((serviceId) => {
    dispatch({ 
      type: 'SET_BOOKING_DATA', 
      payload: { services: bookingData.services.filter(id => id !== serviceId) }
    });
    // También eliminar del contexto global si existe
    removeService(serviceId);
  }, [bookingData.services, removeService]);

  const isStepValid = useCallback(() => {
    switch (currentStep) {
      case CONFIG.BOOKING.STEPS.LOCATION: return !!bookingData.location;
      case CONFIG.BOOKING.STEPS.SERVICES: return bookingData.services.length > 0;
      case CONFIG.BOOKING.STEPS.DATETIME: return !!bookingData.date && !!bookingData.time;
      case CONFIG.BOOKING.STEPS.PERSONAL_DATA: return !!bookingData.name && !!bookingData.phone && !!bookingData.email;
      default: return false;
    }
  }, [currentStep, bookingData]);

  const handleNextStep = useCallback(() => {
    if (isStepValid()) {
      dispatch({ type: 'SET_STEP', payload: currentStep + 1 });
    }
  }, [currentStep, isStepValid]);

  const handlePrevStep = useCallback(() => {
    if (currentStep > 1) {
      dispatch({ type: 'SET_STEP', payload: currentStep - 1 });
    }
  }, [currentStep]);

  const handleSubmitBooking = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: { submit: true } });
    
    try {
      console.log('Iniciando proceso de reserva...');
      console.log('Datos de reserva:', JSON.stringify(bookingData));
      
      // Validar que todos los campos requeridos estén completos
      const requiredFields = ['name', 'email', 'phone', 'location', 'date', 'time', 'services'];
      const missingFields = requiredFields.filter(field => {
        if (field === 'services') return !bookingData[field] || bookingData[field].length === 0;
        return !bookingData[field];
      });
      
      if (missingFields.length > 0) {
        console.warn('Campos requeridos faltantes:', missingFields);
        toast({
          variant: "destructive",
          title: MESSAGES.ERRORS.MISSING_FIELDS,
          description: MESSAGES.ERRORS.COMPLETE_REQUIRED,
          duration: CONFIG.TOAST.ERROR_DURATION
        });
        return;
      }
      
      // Crear una reserva principal
      console.log('Creando reserva en la base de datos...');
      const { data: newBooking, error: bookingError } = await supabase.from('bookings').insert([{
        location_id: bookingData.location,
        booking_date: bookingData.date,
        booking_time: bookingData.time,
        client_name: bookingData.name,
        client_phone: bookingData.phone,
        client_email: bookingData.email,
        notes: bookingData.notes
      }]).select();
      
      if (bookingError) {
        console.error('Error al crear reserva:', bookingError);
        toast({
          variant: "destructive",
          title: "¡Error en la reserva!",
          description: bookingError.message || MESSAGES.ERRORS.BOOKING_UNAVAILABLE,
          duration: CONFIG.TOAST.ERROR_DURATION
        });
        getBlockedSlots(bookingData.location, bookingData.date);
        dispatch({ type: 'SET_BOOKING_DATA', payload: { time: '' } });
        dispatch({ type: 'SET_STEP', payload: CONFIG.BOOKING.STEPS.DATETIME });
        return;
      }
      
      if (!newBooking || newBooking.length === 0) {
        console.error('No se recibió ID de reserva');
        throw new Error('No se pudo crear la reserva');
      }
      
      console.log('Reserva creada exitosamente:', newBooking);
      
      // Insertar los servicios en la tabla booking_services
      if (bookingData.services.length > 0 && newBooking && newBooking.length > 0) {
        console.log('Guardando servicios para la reserva...');
        const bookingId = newBooking[0].id;
        const serviceEntries = bookingData.services.map(serviceId => ({
          booking_id: bookingId,
          service_id: serviceId
        }));
        
        console.log('Servicios a guardar:', serviceEntries);
        
        const { error: servicesError } = await supabase
          .from('booking_services')
          .insert(serviceEntries);
          
        if (servicesError) {
          console.error('Error al guardar servicios:', servicesError);
          // Continuamos aunque haya error en los servicios, ya que la reserva principal se creó
        } else {
          console.log('Servicios guardados correctamente');
        }
      } else {
        console.warn('No hay servicios seleccionados para guardar');
      }
      
      // Obtener datos de ubicación y servicios seleccionados
      const locationData = locations.find(loc => loc.id === bookingData.location);
      const selectedServicesData = services.filter(service => 
        bookingData.services.includes(service.id)
      );
      
      // Enviar notificación al administrador sobre la nueva reserva
      try {
        const adminNotificationResult = await sendBookingNotificationToAdmin(
          bookingData,
          selectedServicesData || [],
          locationData
        );
        
        if (adminNotificationResult.success) {
          console.log('✅ Notificación al administrador procesada correctamente');
        } else {
          console.error('❌ Error al procesar notificación al administrador:', adminNotificationResult.error);
        }
      } catch (adminEmailError) {
        console.error('❌ Error al enviar notificación al administrador:', adminEmailError);
      }

      // Reserva creada exitosamente
      console.log('Proceso de reserva completado con éxito');
      toast({
        title: MESSAGES.SUCCESS.BOOKING_CONFIRMED,
        description: MESSAGES.INFO.BOOKING_DESCRIPTION.replace('{name}', bookingData.name),
        duration: CONFIG.TOAST.SUCCESS_DURATION,
      });
      
      clearServices(); // Limpiar el carrito
      dispatch({ type: 'SET_STEP', payload: CONFIG.BOOKING.STEPS.CONFIRMATION });
      
    } catch (error) {
      console.error('Error inesperado en el proceso de reserva:', error);
      toast({
        variant: "destructive",
        title: "Error inesperado",
        description: error.message || MESSAGES.ERRORS.GENERIC,
        duration: CONFIG.TOAST.ERROR_DURATION
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { submit: false } });
    }
  }, [bookingData, toast, getBlockedSlots, clearServices]);

  const getStepTitle = useMemo(() => {
    const titles = {
      [CONFIG.BOOKING.STEPS.LOCATION]: 'Elige tu Sede',
      [CONFIG.BOOKING.STEPS.SERVICES]: 'Selecciona tu Servicio',
      [CONFIG.BOOKING.STEPS.DATETIME]: 'Elige Fecha y Hora',
      [CONFIG.BOOKING.STEPS.PERSONAL_DATA]: 'Tus Datos Personales',
      [CONFIG.BOOKING.STEPS.CONFIRMATION]: '¡Reserva Realizada!'
    };
    return titles[currentStep] || '';
  }, [currentStep]);

  const resetBooking = useCallback(() => {
    dispatch({ type: 'RESET_BOOKING' });
    clearServices(); // Limpiar el carrito global
  }, [clearServices]);

  return (
    <>
      <Helmet>
        <title>Reservas - Suly Pretty Nails | Reserva tu Cita Online</title>
        <meta name="description" content="Reserva tu cita en Suly Pretty Nails (Basauri y Galdakao). Sistema de reservas fácil para todos nuestros servicios." />
      </Helmet>

      <section className="relative pt-20 pb-16 bg-gradient-to-br from-pink-50 to-rose-100 overflow-hidden">
         <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold gradient-text">{getStepTitle}</h1>
            </motion.div>
         </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {currentStep <= CONFIG.BOOKING.STEPS.PERSONAL_DATA && (
            <div className="w-full bg-gray-200 rounded-full h-2 mb-12">
              <div
                className="bg-gradient-to-r from-pink-500 to-rose-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
              ></div>
            </div>
          )}

          <motion.div key={currentStep} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="bg-gray-50 rounded-2xl p-8">
            {currentStep === CONFIG.BOOKING.STEPS.LOCATION && (
              <LocationStep
                locations={locations}
                loading={loading.locations}
                selectedLocation={bookingData.location}
                onLocationSelect={(locationId) => handleInputChange('location', locationId)}
              />
            )}
            {currentStep === CONFIG.BOOKING.STEPS.SERVICES && (
              <ServicesStep
                services={services}
                selectedServices={selectedServices}
                selectedServiceIds={bookingData.services}
                loading={loading.services}
                onServiceSelect={(serviceId) => handleInputChange('service', serviceId)}
                onServiceRemove={handleRemoveService}
              />
            )}
            {currentStep === CONFIG.BOOKING.STEPS.DATETIME && (
              <DateTimeStep
                availableDates={availableDates}
                timeSlots={timeSlots}
                selectedDate={bookingData.date}
                selectedTime={bookingData.time}
                blockedSlots={blockedSlots}
                loading={loading.slots}
                onDateSelect={(date) => handleInputChange('date', date)}
                onTimeSelect={(time) => handleInputChange('time', time)}
              />
            )}
            {currentStep === CONFIG.BOOKING.STEPS.PERSONAL_DATA && (
              <PersonalDataStep
                bookingData={bookingData}
                locations={locations}
                services={services}
                selectedServices={selectedServices}
                availableDates={availableDates}
                onInputChange={handleInputChange}
              />
            )}
            {currentStep === CONFIG.BOOKING.STEPS.CONFIRMATION && (
              <ConfirmationStep onResetBooking={() => {
                dispatch({ type: 'RESET_BOOKING' });
                clearServices();
              }} />
            )}
          </motion.div>

          {currentStep <= CONFIG.BOOKING.STEPS.PERSONAL_DATA && (
            <div className="flex justify-between mt-8">
              <Button onClick={handlePrevStep} variant="outline" disabled={currentStep === CONFIG.BOOKING.STEPS.LOCATION} className="flex items-center space-x-2">
                <ArrowLeft className="h-4 w-4" /><span>Anterior</span>
              </Button>
              {currentStep < CONFIG.BOOKING.STEPS.PERSONAL_DATA ? (
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

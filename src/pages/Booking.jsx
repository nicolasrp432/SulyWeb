import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check, ChevronLeft, ChevronRight, Calendar, Clock, Scissors, User,
  MapPin, ArrowRight, Loader2, CheckCircle, Sparkles, Phone, Mail, MessageSquare
} from 'lucide-react';
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth,
  eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isToday,
  isBefore, startOfDay, addDays, parseISO, isSameDay,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/lib/customSupabaseClient';
import { sendBookingNotificationToAdmin, sendBookingConfirmationToUser } from '@/lib/emailService';
import SEOHead from '@/components/SEO/SEOHead';

/* ── Time slot grid ──────────────────────────── */
const TIME_SLOTS = [];
for (let h = 9; h < 19; h++) {
  TIME_SLOTS.push(`${String(h).padStart(2, '0')}:00`);
  TIME_SLOTS.push(`${String(h).padStart(2, '0')}:30`);
}

/* ── Category labels ────────────────────────── */
const CATEGORY_LABELS = {
  all:    'Todos',
  nails:  'Manicura y Pedicura',
  beauty: 'Pestañas y Depilación',
  paquetes: 'Paquetes',
};

/* ── Step progress indicator ────────────────── */
const StepIndicator = ({ step }) => {
  const steps = [
    { id: 1, label: 'Servicio', icon: Scissors },
    { id: 2, label: 'Fecha',    icon: Calendar },
    { id: 3, label: 'Tus datos',icon: User },
  ];
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((s, i) => (
        <React.Fragment key={s.id}>
          <div className="flex flex-col items-center gap-1">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
              step > s.id ? 'bg-gradient-rose-gold text-white shadow-rose-sm'
              : step === s.id ? 'bg-gradient-rose-gold text-white shadow-rose-md scale-110'
              : 'bg-brand-rose-100 text-brand-mid'
            }`}>
              {step > s.id ? <Check className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
            </div>
            <span className={`text-[10px] font-semibold hidden sm:block ${step === s.id ? 'text-brand-rose' : 'text-brand-mid'}`}>
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`h-0.5 w-12 sm:w-20 mx-1 rounded transition-all duration-500 ${step > s.id + 1 ? 'bg-gradient-rose-gold' : step > s.id ? 'bg-brand-rose-200' : 'bg-brand-rose-100'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

/* ── Service card ───────────────────────────── */
const ServiceCard = ({ service, selected, onToggle }) => (
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={() => onToggle(service)}
    className={`relative text-left w-full rounded-2xl overflow-hidden shadow-card transition-all duration-200 ${
      selected ? 'ring-2 ring-brand-rose shadow-rose-md' : 'hover:shadow-card-hover'
    }`}
  >
    {selected && (
      <div className="absolute top-2.5 right-2.5 z-10 w-6 h-6 rounded-full bg-gradient-rose-gold flex items-center justify-center shadow-rose-sm">
        <Check className="h-3.5 w-3.5 text-white" />
      </div>
    )}
    <div className="relative aspect-[4/3] overflow-hidden bg-brand-rose-50">
      <img
        src={service.image_url || '/serviciosimg/manicura-expres.jpg'}
        alt={service.name}
        className="w-full h-full object-cover"
        onError={(e) => { e.target.src = '/serviciosimg/manicura-expres.jpg'; }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
    </div>
    <div className={`p-3 transition-colors ${selected ? 'bg-brand-rose-50' : 'bg-white'}`}>
      <p className={`text-sm font-bold leading-tight transition-colors ${selected ? 'text-brand-rose' : 'text-brand-dark'}`}>
        {service.name}
      </p>
      <div className="flex items-center justify-between mt-1 gap-2">
        {service.duration_minutes && (
          <span className="flex items-center gap-1 text-[11px] text-brand-mid">
            <Clock className="h-3 w-3" /> {service.duration_minutes} min
          </span>
        )}
        {service.price && (
          <span className="text-sm font-bold gradient-text">{service.price}</span>
        )}
      </div>
    </div>
  </motion.button>
);

/* ── Mini calendar ──────────────────────────── */
const MiniCalendar = ({ selectedDate, blockedDates, businessHours, onSelect }) => {
  const [calDate, setCalDate] = useState(new Date());
  const today = startOfDay(new Date());
  const maxDate = addDays(today, 60);

  const calStart = startOfWeek(startOfMonth(calDate), { weekStartsOn: 1 });
  const calEnd   = endOfWeek(endOfMonth(calDate),   { weekStartsOn: 1 });
  const days     = eachDayOfInterval({ start: calStart, end: calEnd });

  const isDisabled = (d) => {
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[d.getDay()];
    const isDayClosed = businessHours?.[dayName]?.closed ?? (d.getDay() === 0);

    return isBefore(d, today) ||
      isBefore(maxDate, d) ||
      isDayClosed ||
      blockedDates.some((bd) => isSameDay(parseISO(bd), d));
  };

  return (
    <div className="bg-white rounded-2xl border border-brand-rose-100 shadow-card overflow-hidden">
      {/* Month header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-rose-gold text-white">
        <button
          onClick={() => setCalDate((d) => subMonths(d, 1))}
          className="p-1 rounded-lg hover:bg-white/20 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-bold capitalize">{format(calDate, 'MMMM yyyy', { locale: es })}</span>
        <button
          onClick={() => setCalDate((d) => addMonths(d, 1))}
          className="p-1 rounded-lg hover:bg-white/20 transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-brand-rose-100">
        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => (
          <div key={d} className="py-2 text-center text-[11px] font-bold text-brand-mid uppercase">{d}</div>
        ))}
      </div>
      {/* Days grid */}
      <div className="grid grid-cols-7 p-2 gap-0.5">
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const disabled = isDisabled(day);
          const inMonth = isSameMonth(day, calDate);
          const todayDay = isToday(day);
          const isSelected = selectedDate && format(selectedDate, 'yyyy-MM-dd') === key;

          return (
            <button
              key={key}
              disabled={disabled}
              onClick={() => onSelect(day)}
              className={`aspect-square flex items-center justify-center rounded-xl text-xs font-semibold transition-all duration-150
                ${!inMonth ? 'opacity-25' : ''}
                ${disabled ? 'cursor-not-allowed text-brand-mid/40' : 'hover:bg-brand-rose-100 cursor-pointer'}
                ${isSelected ? 'bg-gradient-rose-gold text-white shadow-rose-sm scale-110' : ''}
                ${todayDay && !isSelected ? 'ring-1 ring-brand-rose text-brand-rose' : ''}
                ${!isSelected && !disabled && !todayDay ? 'text-brand-dark' : ''}
              `}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>
    </div>
  );
};

/* ── Main Booking component ─────────────────── */
const Booking = () => {
  const [step, setStep] = useState(1);
  const [services, setServices] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [blockedDates, setBlockedDates] = useState([]);
  const [bookedTimes, setBookedTimes] = useState([]);
  const [blockedTimes, setBlockedTimes] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null);

  const [businessHours, setBusinessHours] = useState({
    monday: { open: '10:00', close: '20:00', closed: false },
    tuesday: { open: '10:00', close: '20:00', closed: false },
    wednesday: { open: '10:00', close: '20:00', closed: false },
    thursday: { open: '10:00', close: '20:00', closed: false },
    friday: { open: '10:00', close: '20:00', closed: false },
    saturday: { open: '10:00', close: '17:00', closed: false },
    sunday: { open: '10:00', close: '20:00', closed: true }
  });

  const getAvailableTimeSlots = useCallback((date) => {
    if (!date) return [];
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayKey = dayNames[date.getDay()];
    const config = businessHours[dayKey] || { open: '10:00', close: '20:00', closed: false };

    if (config.closed) return [];

    const slots = [];
    try {
      const [openHour, openMin] = config.open.split(':').map(Number);
      const [closeHour, closeMin] = config.close.split(':').map(Number);

      const openMinutes = openHour * 60 + openMin;
      const closeMinutes = closeHour * 60 + closeMin;

      for (let minutes = openMinutes; minutes < closeMinutes; minutes += 30) {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
      }
    } catch (e) {
      console.error("Error generating time slots:", e);
    }
    
    return slots;
  }, [businessHours]);

  /* Fetch services and locations on mount with real-time subscription */
  useEffect(() => {
    const fetchServices = () => {
      supabase.from('services').select('*').eq('active', true)
        .order('display_order').order('name')
        .then(({ data }) => {
          if (data && data.length > 0) setServices(data);
        });
    };

    fetchServices();

    supabase.from('locations').select('id, name').then(({ data }) => {
      setLocations(data ?? []);
      if (data && data.length > 0) setSelectedLocation(data[0]);
    });

    const channel = supabase
      .channel('booking-services-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'services' }, () => {
        fetchServices();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  /* Fetch and subscribe to business hours */
  useEffect(() => {
    const fetchBusinessHours = () => {
      supabase
        .from('settings')
        .select('value')
        .eq('key', 'business_hours')
        .single()
        .then(({ data }) => {
          if (data && data.value) {
            setBusinessHours(data.value);
          }
        });
    };

    fetchBusinessHours();

    const channel = supabase
      .channel('booking-settings-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, () => {
        fetchBusinessHours();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  /* Fetch blocked full-day dates when location changes and subscribe */
  useEffect(() => {
    if (!selectedLocation) return;
    
    const fetchBlockedDays = () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const maxDay = format(addDays(new Date(), 60), 'yyyy-MM-dd');
      supabase
        .from('schedule_blocks')
        .select('block_date')
        .gte('block_date', today)
        .lte('block_date', maxDay)
        .is('start_time', null)
        .or(`location_id.eq.${selectedLocation.id},location_id.is.null`)
        .then(({ data }) => setBlockedDates((data ?? []).map((b) => b.block_date)));
    };

    fetchBlockedDays();

    const channel = supabase
      .channel('booking-day-blocks-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'schedule_blocks' }, () => {
        fetchBlockedDays();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedLocation]);

  /* Fetch booked + blocked times when date + location change */
  const loadSlots = useCallback(async () => {
    if (!selectedDate || !selectedLocation) return;
    setLoadingSlots(true);
    const dateStr = format(selectedDate, 'yyyy-MM-dd');

    const [{ data: bookingData }, { data: blockData }] = await Promise.all([
      supabase
        .from('bookings')
        .select('booking_time')
        .eq('booking_date', dateStr)
        .eq('location_id', selectedLocation.id)
        .neq('status', 'cancelled'),
      supabase
        .from('schedule_blocks')
        .select('start_time, end_time')
        .eq('block_date', dateStr)
        .not('start_time', 'is', null)
        .or(`location_id.eq.${selectedLocation.id},location_id.is.null`),
    ]);

    setBookedTimes((bookingData ?? []).map((b) => b.booking_time?.slice(0, 5)));
    setBlockedTimes(blockData ?? []);
    setLoadingSlots(false);
  }, [selectedDate, selectedLocation]);

  useEffect(() => { loadSlots(); }, [loadSlots]);

  /* Subscribe to slot updates in real-time */
  useEffect(() => {
    if (!selectedDate || !selectedLocation) return;

    const channel = supabase
      .channel('booking-slots-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => loadSlots())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'schedule_blocks' }, () => loadSlots())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedDate, selectedLocation, loadSlots]);

  const isTimeBlocked = (slot) => {
    return blockedTimes.some((b) => b.start_time <= slot + ':00' && (b.end_time ?? '23:59') > slot + ':00');
  };

  const isTimeUnavailable = (slot) => bookedTimes.includes(slot) || isTimeBlocked(slot);

  /* Service toggle */
  const toggleService = (svc) => {
    setSelectedServices((prev) =>
      prev.some((s) => s.id === svc.id)
        ? prev.filter((s) => s.id !== svc.id)
        : [...prev, svc]
    );
  };

  /* Computed totals */
  const totalPrice = selectedServices
    .map((s) => parseFloat((s.price ?? '').replace(',', '.').replace('€', '').trim()) || 0)
    .reduce((a, b) => a + b, 0);
  const totalDuration = selectedServices
    .map((s) => s.duration_minutes ?? 0)
    .reduce((a, b) => a + b, 0);

  /* Available categories from loaded services */
  const categories = ['all', ...new Set(services.map((s) => s.category).filter(Boolean))];
  const filteredServices = categoryFilter === 'all' ? services : services.filter((s) => s.category === categoryFilter);

  /* Submit booking */
  const handleSubmit = async () => {
    if (!form.name || !form.phone || !selectedLocation || !selectedDate || !selectedTime) return;
    setSubmitting(true);

    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const bookingPayload = {
      location_id: selectedLocation.id,
      booking_date: dateStr,
      booking_time: selectedTime + ':00',
      client_name: form.name,
      client_phone: form.phone,
      client_email: form.email || null,
      notes: form.notes || null,
      status: 'confirmed',
      origin: 'online',
    };

    const { data: booking, error: bookingErr } = await supabase
      .from('bookings')
      .insert([bookingPayload])
      .select()
      .single();

    if (bookingErr) {
      setSubmitting(false);
      alert('Error al crear la reserva: ' + bookingErr.message);
      return;
    }

    /* Insert booking_services */
    if (selectedServices.length > 0) {
      await supabase.from('booking_services').insert(
        selectedServices.map((s) => ({ booking_id: booking.id, service_id: s.id }))
      );
    }

    /* Email notifications — emailService expects (bookingData, services[], location) */
    try {
      const bookingEmailData = {
        name: form.name,
        email: form.email || '',
        phone: form.phone,
        date: format(selectedDate, 'yyyy-MM-dd'),
        time: selectedTime,
        notes: form.notes || '',
      };
      await sendBookingNotificationToAdmin(bookingEmailData, selectedServices, selectedLocation);
      if (form.email) {
        await sendBookingConfirmationToUser(bookingEmailData, selectedServices, selectedLocation);
      }
    } catch (_) { /* email failure is non-critical */ }

    setSubmitted({ booking, date: selectedDate, time: selectedTime, location: selectedLocation, services: selectedServices, name: form.name });
    setSubmitting(false);
  };

  /* ── Success screen ─────────────────────── */
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-cream flex items-center justify-center p-4 pt-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white rounded-3xl shadow-rose-lg p-8 sm:p-10 max-w-md w-full text-center border border-brand-rose-100"
        >
          <div className="w-16 h-16 rounded-full bg-gradient-rose-gold flex items-center justify-center mx-auto mb-5 shadow-rose-md">
            <CheckCircle className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-brand-dark mb-2">¡Reserva Confirmada!</h1>
          <p className="text-brand-mid mb-6 leading-relaxed">
            Hemos recibido tu cita, {submitted.name}. Te contactaremos por WhatsApp para confirmar.
          </p>
          <div className="bg-brand-rose-50 rounded-2xl p-4 text-left space-y-2.5 mb-6 border border-brand-rose-100">
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-brand-rose shrink-0" />
              <span className="text-sm text-brand-dark font-medium capitalize">
                {format(submitted.date, "EEEE, d 'de' MMMM", { locale: es })}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-brand-rose shrink-0" />
              <span className="text-sm text-brand-dark font-medium">{submitted.time}</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-brand-rose shrink-0" />
              <span className="text-sm text-brand-dark font-medium">{submitted.location.name}</span>
            </div>
            {submitted.services.length > 0 && (
              <div className="flex items-start gap-3">
                <Scissors className="h-4 w-4 text-brand-rose shrink-0 mt-0.5" />
                <span className="text-sm text-brand-dark">{submitted.services.map((s) => s.name).join(', ')}</span>
              </div>
            )}
          </div>
          <button
            onClick={() => {
              setSubmitted(null); setStep(1);
              setSelectedServices([]); setSelectedDate(null); setSelectedTime(null);
              setForm({ name: '', phone: '', email: '', notes: '' });
            }}
            className="w-full h-12 bg-gradient-rose-gold text-white font-bold rounded-2xl shadow-rose-sm hover:brightness-105 transition-all"
          >
            Hacer otra reserva
          </button>
        </motion.div>
      </div>
    );
  }

  /* ── Main render ───────────────────────── */
  return (
    <>
      <SEOHead
        page="booking"
        customTitle="Reservar Cita — Suly Pretty Nails"
        customDescription="Reserva tu cita de manicura, pedicura o pestañas online. Elige tu servicio, fecha y hora en segundos. Dos sedes en Basauri y Galdakao."
        canonicalUrl="/reservas"
      />
      <Helmet><title>Reservar Cita — Suly Pretty Nails</title></Helmet>

      <div className="min-h-screen bg-gradient-cream pt-20 pb-28 lg:pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="text-center mb-8 pt-6">
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-rose mb-3">
              <span className="w-6 h-px bg-brand-rose" />
              <Sparkles className="h-3.5 w-3.5" />
              Reserva Online
              <span className="w-6 h-px bg-brand-rose" />
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold text-brand-dark mb-2">Tu cita en segundos</h1>
            <p className="text-brand-mid">Sin llamadas, sin espera — elige y listo.</p>
          </div>

          <StepIndicator step={step} />

          <AnimatePresence mode="wait">
            {/* ──────────────────────────────── STEP 1 — Services */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.3 }}
              >
                <div className="bg-white rounded-3xl shadow-card border border-brand-rose-100 overflow-hidden flex flex-col max-h-[calc(100vh-300px)]">
                  <div className="px-5 py-4 border-b border-brand-rose-100 shrink-0">
                    <h2 className="font-bold text-brand-dark text-base">¿Qué servicio quieres?</h2>
                    <p className="text-sm text-brand-mid mt-0.5">Puedes elegir más de uno</p>
                  </div>

                  {/* Category filter */}
                  {categories.length > 1 && (
                    <div className="px-4 py-3 flex gap-2 overflow-x-auto border-b border-brand-rose-100 scrollbar-none shrink-0">
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setCategoryFilter(cat)}
                          className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 shrink-0 ${
                            categoryFilter === cat
                              ? 'bg-gradient-rose-gold text-white shadow-rose-sm'
                              : 'bg-brand-rose-50 text-brand-mid hover:bg-brand-rose-100'
                          }`}
                        >
                          {CATEGORY_LABELS[cat] ?? cat}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Services grid — scrollable area */}
                  <div className="p-4 overflow-y-auto flex-1 min-h-0">
                    {services.length === 0 ? (
                      <div className="flex items-center justify-center py-12 gap-3 text-brand-mid">
                        <Loader2 className="h-5 w-5 animate-spin text-brand-rose" />
                        <span className="text-sm">Cargando servicios...</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pb-1">
                        {filteredServices.map((svc) => (
                          <ServiceCard
                            key={svc.id}
                            service={svc}
                            selected={selectedServices.some((s) => s.id === svc.id)}
                            onToggle={toggleService}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer with total + continue */}
                  <div className="px-5 py-4 border-t border-brand-rose-100 bg-brand-rose-50/50 flex items-center justify-between gap-4 shrink-0">
                    <div className="min-w-0">
                      {selectedServices.length > 0 ? (
                        <>
                          <p className="text-sm font-bold text-brand-dark">
                            {selectedServices.length} {selectedServices.length === 1 ? 'servicio' : 'servicios'} seleccionado{selectedServices.length > 1 ? 's' : ''}
                          </p>
                          <p className="text-xs text-brand-mid">
                            {totalDuration > 0 ? `${totalDuration} min` : ''}
                            {totalDuration > 0 && totalPrice > 0 ? ' · ' : ''}
                            {totalPrice > 0 ? `${totalPrice.toFixed(2).replace('.', ',')}€` : ''}
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-brand-mid">Selecciona al menos un servicio</p>
                      )}
                    </div>
                    <button
                      onClick={() => setStep(2)}
                      disabled={selectedServices.length === 0}
                      className="flex items-center gap-2 px-6 py-2.5 bg-gradient-rose-gold text-white font-bold text-sm rounded-2xl shadow-rose-sm hover:brightness-105 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
                    >
                      Continuar <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ──────────────────────────────── STEP 2 — Date & Time */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                {/* Location selector */}
                <div className="bg-white rounded-3xl shadow-card border border-brand-rose-100 p-5">
                  <h2 className="font-bold text-brand-dark text-base mb-3">¿En qué sede?</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {locations.map((loc) => (
                      <button
                        key={loc.id}
                        onClick={() => { setSelectedLocation(loc); setSelectedDate(null); setSelectedTime(null); }}
                        className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 text-left transition-all duration-200 ${
                          selectedLocation?.id === loc.id
                            ? 'border-brand-rose bg-brand-rose-50 shadow-rose-sm'
                            : 'border-brand-rose-100 hover:border-brand-rose-200 hover:bg-brand-rose-50/50'
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          selectedLocation?.id === loc.id ? 'bg-gradient-rose-gold shadow-rose-sm' : 'bg-brand-rose-100'
                        }`}>
                          <MapPin className={`h-4 w-4 ${selectedLocation?.id === loc.id ? 'text-white' : 'text-brand-rose'}`} />
                        </div>
                        <span className={`text-sm font-bold ${selectedLocation?.id === loc.id ? 'text-brand-rose' : 'text-brand-dark'}`}>
                          {loc.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Calendar */}
                <div className="bg-white rounded-3xl shadow-card border border-brand-rose-100 p-5">
                  <h2 className="font-bold text-brand-dark text-base mb-3">¿Qué día?</h2>
                  <MiniCalendar
                    selectedDate={selectedDate}
                    blockedDates={blockedDates}
                    businessHours={businessHours}
                    onSelect={setSelectedDate}
                  />
                </div>

                {/* Time slots */}
                {selectedDate && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl shadow-card border border-brand-rose-100 p-5"
                  >
                    <h2 className="font-bold text-brand-dark text-base mb-1">¿A qué hora?</h2>
                    <p className="text-xs text-brand-mid mb-4 capitalize">
                      {format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })}
                    </p>
                    {loadingSlots ? (
                      <div className="flex items-center justify-center py-8 gap-2 text-brand-mid">
                        <Loader2 className="h-4 w-4 animate-spin text-brand-rose" />
                        <span className="text-sm">Comprobando disponibilidad...</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                        {getAvailableTimeSlots(selectedDate).map((slot) => {
                          const unavailable = isTimeUnavailable(slot);
                          const selected = selectedTime === slot;
                          return (
                            <button
                              key={slot}
                              disabled={unavailable}
                              onClick={() => setSelectedTime(slot)}
                              className={`py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                                selected
                                  ? 'bg-gradient-rose-gold text-white shadow-rose-sm scale-105'
                                  : unavailable
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed line-through'
                                  : 'bg-brand-rose-50 text-brand-dark hover:bg-brand-rose-100 hover:text-brand-rose'
                              }`}
                            >
                              {slot}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Navigation */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(1)}
                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-brand-mid border border-brand-rose-100 rounded-2xl hover:bg-brand-rose-50 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" /> Atrás
                  </button>
                  <button
                    onClick={() => setStep(3)}
                    disabled={!selectedDate || !selectedTime}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-rose-gold text-white font-bold text-sm rounded-2xl shadow-rose-sm hover:brightness-105 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    Continuar <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ──────────────────────────────── STEP 3 — Contact */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.3 }}
                className="grid lg:grid-cols-5 gap-4"
              >
                {/* Summary panel */}
                <div className="lg:col-span-2">
                  <div className="bg-gradient-rose-gold rounded-3xl p-5 text-white shadow-rose-md sticky top-24">
                    <p className="text-xs font-bold uppercase tracking-widest text-white/70 mb-4">Tu reserva</p>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 shrink-0 text-white/80" />
                        <p className="text-sm font-semibold capitalize">
                          {selectedDate ? format(selectedDate, "EEEE, d MMM", { locale: es }) : '—'}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Clock className="h-4 w-4 shrink-0 text-white/80" />
                        <p className="text-sm font-semibold">{selectedTime ?? '—'}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <MapPin className="h-4 w-4 shrink-0 text-white/80" />
                        <p className="text-sm font-semibold">{selectedLocation?.name ?? '—'}</p>
                      </div>
                      {selectedServices.length > 0 && (
                        <div className="pt-2 border-t border-white/25">
                          <p className="text-xs text-white/70 mb-2">Servicios</p>
                          {selectedServices.map((s) => (
                            <div key={s.id} className="flex justify-between text-sm mb-1.5">
                              <span className="font-medium">{s.name}</span>
                              <span className="text-white/80">{s.price}</span>
                            </div>
                          ))}
                          {totalPrice > 0 && (
                            <div className="flex justify-between text-sm font-bold mt-2 pt-2 border-t border-white/25">
                              <span>Total aprox.</span>
                              <span>{totalPrice.toFixed(2).replace('.', ',')}€</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Form */}
                <div className="lg:col-span-3 bg-white rounded-3xl shadow-card border border-brand-rose-100 p-5 sm:p-6 space-y-4">
                  <div>
                    <h2 className="font-bold text-brand-dark text-base">Tus datos</h2>
                    <p className="text-sm text-brand-mid">Solo necesitamos lo esencial</p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-brand-mid uppercase tracking-wider mb-1.5">
                        Nombre *
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-mid/50" />
                        <input
                          value={form.name}
                          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                          placeholder="Tu nombre"
                          className="w-full pl-9 pr-3 py-2.5 bg-brand-rose-50 border border-brand-rose-100 rounded-xl text-sm text-brand-dark placeholder:text-brand-mid/40 focus:outline-none focus:border-brand-rose focus:ring-2 focus:ring-brand-rose/15 transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-brand-mid uppercase tracking-wider mb-1.5">
                        Teléfono *
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-mid/50" />
                        <input
                          type="tel"
                          value={form.phone}
                          onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                          placeholder="612 345 678"
                          className="w-full pl-9 pr-3 py-2.5 bg-brand-rose-50 border border-brand-rose-100 rounded-xl text-sm text-brand-dark placeholder:text-brand-mid/40 focus:outline-none focus:border-brand-rose focus:ring-2 focus:ring-brand-rose/15 transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-brand-mid uppercase tracking-wider mb-1.5">
                        Email <span className="font-normal text-brand-mid/60">(opcional)</span>
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-mid/50" />
                        <input
                          type="email"
                          value={form.email}
                          onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                          placeholder="tu@email.com"
                          className="w-full pl-9 pr-3 py-2.5 bg-brand-rose-50 border border-brand-rose-100 rounded-xl text-sm text-brand-dark placeholder:text-brand-mid/40 focus:outline-none focus:border-brand-rose focus:ring-2 focus:ring-brand-rose/15 transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-brand-mid uppercase tracking-wider mb-1.5">
                        Notas <span className="font-normal text-brand-mid/60">(opcional)</span>
                      </label>
                      <div className="relative">
                        <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-brand-mid/50" />
                        <textarea
                          value={form.notes}
                          onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                          placeholder="Alergias, preferencias, dudas..."
                          rows={2}
                          className="w-full pl-9 pr-3 py-2.5 bg-brand-rose-50 border border-brand-rose-100 rounded-xl text-sm text-brand-dark placeholder:text-brand-mid/40 focus:outline-none focus:border-brand-rose focus:ring-2 focus:ring-brand-rose/15 transition-colors resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setStep(2)}
                      className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-brand-mid border border-brand-rose-100 rounded-2xl hover:bg-brand-rose-50 transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4" /> Atrás
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={!form.name || !form.phone || submitting}
                      className="flex-1 flex items-center justify-center gap-2 h-12 bg-gradient-rose-gold text-white font-bold text-sm rounded-2xl shadow-rose-sm hover:brightness-105 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      {submitting
                        ? <><Loader2 className="h-4 w-4 animate-spin" /> Confirmando...</>
                        : <><CheckCircle className="h-4 w-4" /> Confirmar Reserva</>
                      }
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
};

export default Booking;

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { addMissingServices, missingServices } from '@/scripts/addMissingServices';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter, 
  DialogClose 
} from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  Plus, 
  Trash2, 
  Edit3, 
  Calendar, 
  Clock, 
  Settings, 
  Scissors, 
  TrendingUp, 
  DollarSign, 
  ShieldAlert, 
  Phone, 
  Eye, 
  EyeOff, 
  Key, 
  Search, 
  X, 
  UserPlus, 
  CalendarRange, 
  Unlock, 
  Lock, 
  Sparkles,
  RefreshCw,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const supabaseUrl = 'https://qeuqspjpwybaxppqgehm.supabase.co';

const AdminServices = () => {
  const { toast } = useToast();
  
  // Auth Shield State
  const [adminKey, setAdminKey] = useState(() => localStorage.getItem('suly_admin_key') || '');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [authError, setAuthError] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [verifyingKey, setVerifyingKey] = useState(false);
  
  // Tabs State
  const [activeTab, setActiveTab] = useState('overview'); // overview, appointments, blocks, settings, services
  
  // Dashboard Data State
  const [bookings, setBookings] = useState([]);
  const [services, setServices] = useState([]);
  const [locations, setLocations] = useState([]);
  const [salonSettings, setSalonSettings] = useState({
    max_advance_days: 30,
    excluded_days: [0],
    time_slots: [
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
      '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
      '18:00', '18:30', '19:00', '19:30', '20:00'
    ]
  });
  const [loadingData, setLoadingData] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  
  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all'); // all, today, tomorrow, week, custom
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  
  // Modal / Form States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  
  const [newBooking, setNewBooking] = useState({
    client_name: '',
    client_phone: '',
    client_email: '',
    location_id: '',
    booking_date: '',
    booking_time: '',
    notes: '',
    selectedServices: []
  });
  
  const [editingBooking, setEditingBooking] = useState(null);
  
  const getTodayLocalStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(getTodayLocalStr());

  const formatDateLocalStr = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getCalendarDays = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    let startDayOfWeek = firstDayOfMonth.getDay();
    startDayOfWeek = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;
    
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({
        date: d,
        isCurrentMonth: false,
        dateStr: formatDateLocalStr(d)
      });
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      days.push({
        date: d,
        isCurrentMonth: true,
        dateStr: formatDateLocalStr(d)
      });
    }
    
    let nextMonthDay = 1;
    while (days.length < 42) {
      const d = new Date(year, month + 1, nextMonthDay++);
      days.push({
        date: d,
        isCurrentMonth: false,
        dateStr: formatDateLocalStr(d)
      });
    }
    
    return days;
  };

  const getDayStats = (dateStr) => {
    const dayBookings = bookings.filter(b => {
      if (b.booking_date !== dateStr) return false;
      if (locationFilter !== 'all' && b.location_id?.toString() !== locationFilter) return false;
      return true;
    });
    
    const activeBookings = dayBookings.filter(b => b.client_name !== '[BLOQUEADO]');
    const blockedBookings = dayBookings.filter(b => b.client_name === '[BLOQUEADO]');
    
    return {
      bookingsCount: activeBookings.length,
      blocksCount: blockedBookings.length,
      bookings: activeBookings,
      blocks: blockedBookings
    };
  };

  const getMonthStats = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const startStr = formatDateLocalStr(new Date(year, month, 1));
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const endStr = formatDateLocalStr(new Date(year, month, daysInMonth));
    
    const monthBookings = bookings.filter(b => {
      if (b.booking_date < startStr || b.booking_date > endStr) return false;
      if (locationFilter !== 'all' && b.location_id?.toString() !== locationFilter) return false;
      return true;
    });
    
    const active = monthBookings.filter(b => b.client_name !== '[BLOQUEADO]');
    const blocks = monthBookings.filter(b => b.client_name === '[BLOQUEADO]');
    const totalEarnings = active.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
    
    return {
      totalBookings: active.length,
      totalBlocks: blocks.length,
      estimatedEarnings: totalEarnings
    };
  };

  const formatMonthYear = (date) => {
    return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
      .replace(/^\w/, (c) => c.toUpperCase());
  };
  
  const [serviceForm, setServiceForm] = useState({
    id: null,
    name: '',
    duration: '45 min',
    price: '15,00€',
    category: 'nails'
  });

  // Block Slots Form State
  const [blockLocation, setBlockLocation] = useState('');
  const [blockDate, setBlockDate] = useState('');
  const [blockingActionLoading, setBlockingActionLoading] = useState(false);
  const [selectedBlockSlots, setSelectedBlockSlots] = useState([]);
  // WhatsApp Custom templates state
  const [waModalOpen, setWaModalOpen] = useState(false);
  const [selectedWaBooking, setSelectedWaBooking] = useState(null);
  const [selectedWaTemplate, setSelectedWaTemplate] = useState('standard');
  const [customWaMessage, setCustomWaMessage] = useState('');

  // Dynamic Supabase Client based on entered Service Role Key
  const getSupabaseClient = useCallback(() => {
    if (adminKey) {
      return createClient(supabaseUrl, adminKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
    }
    return supabase;
  }, [adminKey]);

  // Auth Key Verification
  const handleVerifyKey = async (keyToVerify) => {
    if (!keyToVerify) {
      setAuthError('Por favor introduce una clave.');
      return;
    }
    setVerifyingKey(true);
    setAuthError('');
    try {
      const tempClient = createClient(supabaseUrl, keyToVerify, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
      
      // Intentamos leer una tabla protegida/cualquiera para validar permisos
      const { data, error } = await tempClient.from('salon_settings').select('*').limit(1);
      if (error) throw error;
      
      localStorage.setItem('suly_admin_key', keyToVerify);
      setAdminKey(keyToVerify);
      setIsAdmin(true);
      setIsReadOnly(false);
      setAuthError('');
      
      toast({
        title: "¡Acceso Concedido!",
        description: "Se ha validado la clave de administrador correctamente.",
        duration: 3000
      });
    } catch (err) {
      console.error('Error al verificar clave:', err);
      setAuthError('La clave ingresada no es válida o no tiene permisos de administrador.');
      toast({
        variant: "destructive",
        title: "Error de Validación",
        description: "No se pudo conectar a Supabase con la clave proporcionada.",
        duration: 4000
      });
    } finally {
      setVerifyingKey(false);
    }
  };

  // Logout/Reset Key
  const handleResetAuth = () => {
    localStorage.removeItem('suly_admin_key');
    setAdminKey('');
    setIsAdmin(false);
    setIsReadOnly(false);
    setActiveTab('overview');
    toast({
      title: "Sesión Cerrada",
      description: "Has salido del panel administrativo.",
      duration: 3000
    });
  };

  // Silent verification on load
  useEffect(() => {
    if (adminKey) {
      handleVerifyKey(adminKey);
    } else {
      setIsReadOnly(true); // Default to read only if no key
    }
  }, []);

  // Main Data Fetcher
  const fetchData = async () => {
    setLoadingData(true);
    const client = getSupabaseClient();
    try {
      // 1. Fetch Locations
      const { data: locationsData, error: locError } = await client.from('locations').select('*');
      if (locError) throw locError;
      setLocations(locationsData || []);
      
      if (locationsData && locationsData.length > 0 && !blockLocation) {
        setBlockLocation(locationsData[0].id.toString());
      }

      // 2. Fetch Services
      const { data: servicesData, error: servError } = await client.from('services').select('*').order('name');
      if (servError) throw servError;
      setServices(servicesData || []);

      // 3. Fetch Salon Settings (id = 1)
      const { data: settingsData, error: setError } = await client.from('salon_settings').select('*').eq('id', 1).maybeSingle();
      if (settingsData) {
        setSalonSettings({
          max_advance_days: settingsData.max_advance_days ?? 30,
          excluded_days: settingsData.excluded_days ?? [0],
          time_slots: settingsData.time_slots ?? []
        });
      }

      // 4. Fetch Bookings & Booking Services mapping
      const { data: bookingsData, error: bookError } = await client
        .from('bookings')
        .select('*, locations(name)')
        .order('booking_date', { ascending: false });
      if (bookError) throw bookError;

      const { data: bsData, error: bsError } = await client
        .from('booking_services')
        .select('*, services(*)');
      
      if (bookingsData) {
        const mapped = bookingsData.map(b => {
          const related = bsData?.filter(bs => bs.booking_id === b.id) || [];
          const matchedServices = related.map(r => r.services).filter(Boolean);
          const totalPrice = matchedServices.reduce((sum, s) => {
            const clean = parseFloat((s.price || "0").replace('€', '').replace(',', '.').trim());
            return sum + (isNaN(clean) ? 0 : clean);
          }, 0);
          return {
            ...b,
            services: matchedServices,
            totalPrice
          };
        });
        setBookings(mapped);
      }
    } catch (err) {
      console.error("Error fetching admin data:", err);
      toast({
        variant: "destructive",
        title: "Error al Cargar Datos",
        description: err.message || "No se pudieron obtener los datos de la agenda.",
        duration: 5000
      });
    } finally {
      setLoadingData(false);
    }
  };

  // Trigger fetch when access level changes
  useEffect(() => {
    if (isAdmin || isReadOnly) {
      fetchData();
    }
  }, [isAdmin, isReadOnly]);

  // Date Formatting Helper
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  // WhatsApp Message Builders and Action Handlers
  const getWaTemplateText = (templateType, booking) => {
    if (!booking) return '';
    const dateFormatted = new Date(booking.booking_date).toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
    const locationName = booking.locations?.name || 'Suly Pretty Nails';
    const servicesName = booking.services?.map(s => s.name).join(', ') || 'nuestros servicios';
    
    if (templateType === 'standard') {
      return `Hola ${booking.client_name}, te recordamos tu cita en Suly Pretty Nails el día ${dateFormatted} a las ${booking.booking_time} en nuestra sede ${locationName}. ¡Te esperamos!`;
    } else if (templateType === 'modified') {
      return `Hola ${booking.client_name}, tu cita en Suly Pretty Nails ha sido confirmada para el día ${dateFormatted} a las ${booking.booking_time} en la sede ${locationName}. Si tienes alguna duda o necesitas reagendar, por favor contáctanos. ¡Gracias!`;
    } else if (templateType === 'thanks') {
      return `¡Hola ${booking.client_name}! Gracias por confiar en Suly Pretty Nails para consentir tus manos. Esperamos que hayas amado el resultado de tus servicios (${servicesName}). ¡Que tengas un hermoso día!`;
    }
    return '';
  };

  const handleOpenWaModal = (booking) => {
    setSelectedWaBooking(booking);
    setSelectedWaTemplate('standard');
    const msg = getWaTemplateText('standard', booking);
    setCustomWaMessage(msg);
    setWaModalOpen(true);
  };

  const handleSwitchWaTemplate = (templateType) => {
    setSelectedWaTemplate(templateType);
    if (selectedWaBooking) {
      const msg = getWaTemplateText(templateType, selectedWaBooking);
      setCustomWaMessage(msg);
    }
  };

  const handleSendWhatsApp = () => {
    if (!selectedWaBooking || !customWaMessage) return;
    let phone = selectedWaBooking.client_phone || '';
    phone = phone.replace(/\s+/g, '').replace(/[^\d+]/g, '');
    if (!phone.startsWith('+')) {
      if (phone.length === 9 && (phone.startsWith('6') || phone.startsWith('7') || phone.startsWith('9'))) {
        phone = '34' + phone;
      }
    } else {
      phone = phone.replace('+', '');
    }
    
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(customWaMessage)}`;
    window.open(url, '_blank');
    setWaModalOpen(false);
  };

  const handleQuickBook = (time, locationId) => {
    if (!isAdmin) {
      toast({
        variant: "destructive",
        title: "Acceso Restringido",
        description: "Necesitas tu clave de administrador para agendar manualmente.",
        duration: 3500
      });
      return;
    }
    setNewBooking({
      ...newBooking,
      booking_date: selectedDate,
      booking_time: time,
      location_id: locationId ? locationId.toString() : (locationFilter !== 'all' ? locationFilter : (locations[0]?.id?.toString() || ''))
    });
    setShowCreateModal(true);
  };

  const handleQuickBlock = async (time, locationId) => {
    if (!isAdmin) {
      toast({
        variant: "destructive",
        title: "Acceso Restringido",
        description: "Necesitas tu clave de administrador para realizar bloqueos.",
        duration: 3500
      });
      return;
    }
    
    const targetLoc = locationId ? locationId.toString() : (locationFilter !== 'all' ? locationFilter : '');
    if (!targetLoc) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Selecciona o filtra por una sede específica para realizar el bloqueo administrativo.",
        duration: 3500
      });
      return;
    }
    
    setBlockingActionLoading(true);
    try {
      const client = getSupabaseClient();
      const { error } = await client.from('bookings').insert({
        client_name: '[BLOQUEADO]',
        client_phone: 'N/A',
        client_email: 'admin@sulyprettynails.com',
        location_id: targetLoc,
        booking_date: selectedDate,
        booking_time: time,
        notes: 'Bloqueado desde vista rápida de agenda.'
      });
      if (error) throw error;
      
      toast({
        title: "Bloqueo Creado",
        description: `Se bloqueó el horario de las ${time} el día ${selectedDate}.`,
        duration: 3000
      });
      fetchData();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || "No se pudo crear el bloqueo.",
        duration: 5000
      });
    } finally {
      setBlockingActionLoading(false);
    }
  };

  const getTimelineSlotsForTime = (time) => {
    if (locationFilter !== 'all') {
      const b = bookings.find(x => 
        x.booking_date === selectedDate && 
        x.booking_time === time && 
        x.location_id?.toString() === locationFilter
      );
      return [{
        time,
        location: locations.find(l => l.id.toString() === locationFilter),
        booking: b,
        isFree: !b
      }];
    }
    
    return locations.map(loc => {
      const b = bookings.find(x => 
        x.booking_date === selectedDate && 
        x.booking_time === time && 
        x.location_id === loc.id
      );
      return {
        time,
        location: loc,
        booking: b,
        isFree: !b
      };
    });
  };

  // Income Calculator
  const totalStats = useMemo(() => {
    const active = bookings.filter(b => b.client_name !== '[BLOQUEADO]');
    const blocks = bookings.filter(b => b.client_name === '[BLOQUEADO]');
    const revenue = active.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
    
    // Sede preferida calculation
    const counts = {};
    active.forEach(b => {
      const locName = b.locations?.name || 'Desconocida';
      counts[locName] = (counts[locName] || 0) + 1;
    });
    let preferred = 'Ninguna';
    let max = 0;
    Object.entries(counts).forEach(([k, v]) => {
      if (v > max) {
        max = v;
        preferred = k;
      }
    });

    return {
      activeCount: active.length,
      blocksCount: blocks.length,
      revenue,
      preferredLocation: preferred
    };
  }, [bookings]);

  // Next 5 Upcoming bookings
  const upcomingBookings = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return bookings
      .filter(b => b.booking_date >= todayStr && b.client_name !== '[BLOQUEADO]')
      .sort((a, b) => {
        const da = `${a.booking_date}T${a.booking_time}`;
        const db = `${b.booking_date}T${b.booking_time}`;
        return da.localeCompare(db);
      })
      .slice(0, 5);
  }, [bookings]);

  // Filtered Bookings for List Tab
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      // 1. Text Search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const clientName = (b.client_name || '').toLowerCase();
        const clientPhone = (b.client_phone || '').toLowerCase();
        const clientEmail = (b.client_email || '').toLowerCase();
        const notes = (b.notes || '').toLowerCase();
        if (!clientName.includes(query) && !clientPhone.includes(query) && !clientEmail.includes(query) && !notes.includes(query)) {
          return false;
        }
      }

      // 2. Location Filter
      if (locationFilter !== 'all') {
        if (b.location_id?.toString() !== locationFilter) return false;
      }

      // 3. Date Filter
      if (dateFilter !== 'all') {
        const todayStr = new Date().toISOString().split('T')[0];
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        
        if (dateFilter === 'today') {
          if (b.booking_date !== todayStr) return false;
        } else if (dateFilter === 'tomorrow') {
          if (b.booking_date !== tomorrowStr) return false;
        } else if (dateFilter === 'week') {
          const nextWeek = new Date();
          nextWeek.setDate(nextWeek.getDate() + 7);
          const nextWeekStr = nextWeek.toISOString().split('T')[0];
          if (b.booking_date < todayStr || b.booking_date > nextWeekStr) return false;
        } else if (dateFilter === 'custom') {
          if (customStartDate && b.booking_date < customStartDate) return false;
          if (customEndDate && b.booking_date > customEndDate) return false;
        }
      }

      return true;
    });
  }, [bookings, searchQuery, locationFilter, dateFilter, customStartDate, customEndDate]);

  // Create Manual Booking
  const handleCreateBooking = async () => {
    if (!newBooking.client_name || !newBooking.client_phone || !newBooking.location_id || !newBooking.booking_date || !newBooking.booking_time) {
      toast({
        variant: "destructive",
        title: "Campos Requeridos",
        description: "Por favor completa el nombre, teléfono, sede, fecha y hora.",
        duration: 3000
      });
      return;
    }

    if (newBooking.selectedServices.length === 0) {
      toast({
        variant: "destructive",
        title: "Servicios Requeridos",
        description: "Selecciona al menos un servicio para la cita.",
        duration: 3000
      });
      return;
    }

    setBulkLoading(true);
    const client = getSupabaseClient();
    try {
      // 1. Insert standard booking
      const { data: bData, error: bError } = await client
        .from('bookings')
        .insert([{
          client_name: newBooking.client_name,
          client_phone: newBooking.client_phone,
          client_email: newBooking.client_email || 'manual@sulyprettynails.com',
          location_id: newBooking.location_id,
          booking_date: newBooking.booking_date,
          booking_time: newBooking.booking_time,
          notes: newBooking.notes || 'Cita manual desde panel'
        }])
        .select()
        .single();

      if (bError) throw bError;

      // 2. Insert related services
      const serviceLinks = newBooking.selectedServices.map(sid => ({
        booking_id: bData.id,
        service_id: sid
      }));

      const { error: linksError } = await client.from('booking_services').insert(serviceLinks);
      if (linksError) throw linksError;

      toast({
        title: "Cita Registrada",
        description: `Se ha agendado la cita para ${newBooking.client_name} con éxito.`,
        duration: 3000
      });

      setShowCreateModal(false);
      setNewBooking({
        client_name: '',
        client_phone: '',
        client_email: '',
        location_id: '',
        booking_date: '',
        booking_time: '',
        notes: '',
        selectedServices: []
      });
      fetchData();
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Error al Guardar Cita",
        description: err.message,
        duration: 4000
      });
    } finally {
      setBulkLoading(false);
    }
  };

  // Delete/Cancel Booking
  const handleDeleteBooking = async (bookingId) => {
    if (!window.confirm("¿Estás absolutamente seguro de que deseas cancelar esta cita? Esta acción no se puede deshacer y liberará el horario de inmediato.")) {
      return;
    }

    const client = getSupabaseClient();
    try {
      // Las relaciones en cascada o eliminaciones directas de booking_services deben ejecutarse primero si no están configuradas en CASCADE
      await client.from('booking_services').delete().eq('booking_id', bookingId);
      const { error } = await client.from('bookings').delete().eq('id', bookingId);
      if (error) throw error;

      toast({
        title: "Cita Cancelada",
        description: "La reserva ha sido eliminada y el horario liberado con éxito.",
        duration: 3000
      });
      fetchData();
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Error al Eliminar",
        description: err.message,
        duration: 4000
      });
    }
  };

  // Edit / Update Booking
  const handleUpdateBooking = async () => {
    if (!editingBooking.client_name || !editingBooking.client_phone || !editingBooking.location_id || !editingBooking.booking_date || !editingBooking.booking_time) {
      toast({
        variant: "destructive",
        title: "Campos Requeridos",
        description: "Por favor completa el nombre, teléfono, sede, fecha y hora.",
        duration: 3000
      });
      return;
    }

    if (editingBooking.selectedServices.length === 0) {
      toast({
        variant: "destructive",
        title: "Servicios Requeridos",
        description: "Selecciona al menos un servicio para la cita.",
        duration: 3000
      });
      return;
    }

    setBulkLoading(true);
    const client = getSupabaseClient();
    try {
      // 1. Update standard booking details
      const { error: bError } = await client
        .from('bookings')
        .update({
          client_name: editingBooking.client_name,
          client_phone: editingBooking.client_phone,
          client_email: editingBooking.client_email || 'manual@sulyprettynails.com',
          location_id: editingBooking.location_id,
          booking_date: editingBooking.booking_date,
          booking_time: editingBooking.booking_time,
          notes: editingBooking.notes || 'Cita manual desde panel'
        })
        .eq('id', editingBooking.id);

      if (bError) throw bError;

      // 2. Delete existing service mappings
      await client.from('booking_services').delete().eq('booking_id', editingBooking.id);

      // 3. Re-insert new service links
      const serviceLinks = editingBooking.selectedServices.map(sid => ({
        booking_id: editingBooking.id,
        service_id: sid
      }));

      const { error: linksError } = await client.from('booking_services').insert(serviceLinks);
      if (linksError) throw linksError;

      toast({
        title: "Cita Actualizada",
        description: "La cita ha sido modificada y guardada con éxito.",
        duration: 3000
      });

      setShowEditModal(false);
      setEditingBooking(null);
      fetchData();
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Error al Actualizar Cita",
        description: err.message,
        duration: 4000
      });
    } finally {
      setBulkLoading(false);
    }
  };



  // Quick Release Blocked Slot
  const handleQuickReleaseBlock = async (bookingId) => {
    const client = getSupabaseClient();
    try {
      await client.from('booking_services').delete().eq('booking_id', bookingId);
      const { error } = await client.from('bookings').delete().eq('id', bookingId);
      if (error) throw error;
      toast({
        title: "Bloqueo Liberado",
        description: "El horario se ha liberado con éxito.",
        duration: 3000
      });
      fetchData();
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Error al Liberar Bloqueo",
        description: err.message,
        duration: 4000
      });
    }
  };

  // Block Mass Slots
  const handleApplyBlockSlots = async () => {
    if (!blockLocation || !blockDate || selectedBlockSlots.length === 0) {
      toast({
        variant: "destructive",
        title: "Selección Incompleta",
        description: "Por favor selecciona la sede, la fecha y al menos una hora para bloquear.",
        duration: 3000
      });
      return;
    }

    setBlockingActionLoading(true);
    const client = getSupabaseClient();
    try {
      const inserts = selectedBlockSlots.map(time => ({
        client_name: '[BLOQUEADO]',
        client_phone: '000000000',
        client_email: 'bloqueo@sulyprettynails.com',
        location_id: blockLocation,
        booking_date: blockDate,
        booking_time: time,
        notes: 'Bloqueo administrativo de agenda'
      }));

      const { error } = await client.from('bookings').insert(inserts);
      if (error) throw error;

      toast({
        title: "Bloqueos Aplicados",
        description: `Se han bloqueado ${inserts.length} slots con éxito en la fecha seleccionada.`,
        duration: 3000
      });
      setSelectedBlockSlots([]);
      fetchData();
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Error de Bloqueo",
        description: err.message,
        duration: 4000
      });
    } finally {
      setBlockingActionLoading(false);
    }
  };

  // Edit / Save Settings
  const handleSaveSettings = async () => {
    setBulkLoading(true);
    const client = getSupabaseClient();
    try {
      const { error } = await client
        .from('salon_settings')
        .upsert({
          id: 1,
          max_advance_days: salonSettings.max_advance_days,
          excluded_days: salonSettings.excluded_days,
          time_slots: salonSettings.time_slots,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Configuración Guardada",
        description: "Los parámetros globales de la agenda se han actualizado y aplicado.",
        duration: 3000
      });
      fetchData();
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Error al Guardar Ajustes",
        description: err.message,
        duration: 4000
      });
    } finally {
      setBulkLoading(false);
    }
  };

  // Add / Edit Service Submit
  const handleSaveService = async () => {
    if (!serviceForm.name || !serviceForm.duration || !serviceForm.price) {
      toast({
        variant: "destructive",
        title: "Campos incompletos",
        description: "Completa el nombre, precio y duración.",
        duration: 3000
      });
      return;
    }

    setBulkLoading(true);
    const client = getSupabaseClient();
    try {
      const slug = serviceForm.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-');

      const payload = {
        name: serviceForm.name,
        slug,
        duration: serviceForm.duration,
        price: serviceForm.price,
        category: serviceForm.category
      };

      if (serviceForm.id) {
        // UPDATE
        const { error } = await client.from('services').update(payload).eq('id', serviceForm.id);
        if (error) throw error;
        toast({ title: "Servicio Actualizado", description: "El servicio se editó con éxito." });
      } else {
        // INSERT
        // Auto increments or UUID dynamic inserts
        const { data: lastService } = await client.from('services').select('id').order('id', { ascending: false }).limit(1);
        let nextId = 1;
        if (lastService && lastService.length > 0) {
          const currentId = lastService[0].id;
          if (typeof currentId === 'number') {
            nextId = currentId + 1;
          } else {
            // Generate UUID
            nextId = crypto.randomUUID();
          }
        }
        
        const { error } = await client.from('services').insert([{ id: nextId, ...payload }]);
        if (error) throw error;
        toast({ title: "Servicio Creado", description: "El servicio se añadió con éxito." });
      }

      setShowServiceModal(false);
      setServiceForm({ id: null, name: '', duration: '45 min', price: '15,00€', category: 'nails' });
      fetchData();
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Error al Guardar Servicio",
        description: err.message,
        duration: 4000
      });
    } finally {
      setBulkLoading(false);
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (!window.confirm("¿Seguro que deseas eliminar permanentemente este servicio? Puede afectar a las citas existentes en su historial.")) {
      return;
    }

    const client = getSupabaseClient();
    try {
      const { error } = await client.from('services').delete().eq('id', serviceId);
      if (error) throw error;
      toast({ title: "Servicio Eliminado", description: "Tratamiento removido con éxito." });
      fetchData();
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Error al Eliminar", description: err.message });
    }
  };

  const handleBulkInsertMissing = async () => {
    setBulkLoading(true);
    try {
      const response = await addMissingServices();
      toast({
        variant: response.success ? "default" : "destructive",
        title: response.success ? "Servicios Agregados" : "Error en Inserción Masiva",
        description: response.message,
        duration: 5000
      });
      fetchData();
    } catch (err) {
      console.error(err);
    } finally {
      setBulkLoading(false);
    }
  };

  // WhatsApp Sender Helper
  const sendWhatsAppConfirmation = (booking) => {
    const cleanPhone = booking.client_phone.replace(/\s+/g, '').replace('+', '');
    // Prepend Spanish code if is local
    const finalPhone = cleanPhone.startsWith('34') || cleanPhone.length > 9 ? cleanPhone : `34${cleanPhone}`;
    const servicesList = booking.services?.map(s => s.name).join(', ') || 'su sesión';
    const locationName = booking.locations?.name || 'Suly Pretty Nails';
    
    const message = `Hola *${booking.client_name}*! Te escribimos de *Suly Pretty Nails* 💅 para recordarte tu cita programada de *${servicesList}* el día *${formatDate(booking.booking_date)}* a las *${booking.booking_time}* en nuestra sede de *${locationName}*. ¿Nos confirmas tu asistencia? ¡Muchísimas gracias! 💕`;
    
    const waUrl = `https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

  // Day Name Helper
  const getDayName = (dayNumber) => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[dayNumber];
  };

  // Toggle excluded day helper
  const handleToggleExcludedDay = (day) => {
    const current = [...salonSettings.excluded_days];
    const index = current.indexOf(day);
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(day);
    }
    setSalonSettings({ ...salonSettings, excluded_days: current.sort() });
  };

  // Toggle global active time slot
  const handleToggleGlobalSlot = (slot) => {
    const current = [...salonSettings.time_slots];
    const index = current.indexOf(slot);
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(slot);
    }
    setSalonSettings({ ...salonSettings, time_slots: current.sort() });
  };

  // Grid for block slots calculation
  const blockedSlotsForSelectedDate = useMemo(() => {
    if (!blockDate || !blockLocation) return [];
    return bookings
      .filter(b => b.booking_date === blockDate && b.location_id?.toString() === blockLocation)
      .map(b => ({
        time: b.booking_time,
        isBlock: b.client_name === '[BLOQUEADO]',
        bookingId: b.id
      }));
  }, [bookings, blockDate, blockLocation]);

  return (
    <>
      <Helmet>
        <title>Panel de Administración | Suly Pretty Nails</title>
      </Helmet>

      {/* Main Admin UI Wrapper */}
      <div className="min-h-screen bg-gradient-to-tr from-rose-50/70 via-white to-pink-50/50 py-10 px-4 md:px-8 relative overflow-hidden">
        
        {/* Subtle decorative glows */}
        <div className="absolute top-[-10%] right-[-10%] w-[40rem] h-[40rem] bg-pink-200/30 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[35rem] h-[35rem] bg-rose-200/30 rounded-full blur-[120px] pointer-events-none" />

        {/* Lock Shield Overlay if no Key loaded */}
        <AnimatePresence>
          {!isAdmin && !isReadOnly && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-white/95 border border-pink-100 rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden text-center"
              >
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-pink-500 via-rose-500 to-pink-400" />
                <div className="w-16 h-16 rounded-2xl bg-pink-50 border border-pink-100 flex items-center justify-center mx-auto mb-6 text-pink-500">
                  <Key className="h-8 w-8 animate-pulse" />
                </div>
                
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Panel Administrativo</h2>
                <p className="text-gray-500 text-sm mb-6">
                  Introduce la clave de acceso de administrador para desbloquear la edición completa de la agenda.
                </p>

                <div className="space-y-4 mb-6">
                  <div className="relative text-left">
                    <Label htmlFor="auth-key" className="text-xs font-semibold text-gray-600 block mb-1">Clave de Supabase (Service Role Key)</Label>
                    <div className="relative">
                      <Input
                        id="auth-key"
                        type={showKeyInput ? 'text' : 'password'}
                        placeholder="sb_service_role_..."
                        className="pr-10 border-pink-200 focus-visible:ring-pink-400 rounded-xl"
                        value={adminKey}
                        onChange={(e) => setAdminKey(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleVerifyKey(adminKey)}
                      />
                      <button 
                        onClick={() => setShowKeyInput(!showKeyInput)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-pink-500 transition-colors"
                      >
                        {showKeyInput ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {authError && (
                    <div className="text-xs text-red-500 bg-red-50 border border-red-100 p-3 rounded-lg flex items-start gap-2 text-left">
                      <ShieldAlert className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                      <span>{authError}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <Button 
                    onClick={() => handleVerifyKey(adminKey)} 
                    disabled={verifyingKey}
                    className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-xl py-6 font-semibold shadow-lg shadow-pink-500/20"
                  >
                    {verifyingKey ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Validando permisos...
                      </>
                    ) : 'Acceder con Control Total'}
                  </Button>

                  <button 
                    onClick={() => {
                      setIsReadOnly(true);
                      toast({
                        title: "Modo Solo Lectura",
                        description: "Puedes navegar por el panel pero las modificaciones no se guardarán.",
                        duration: 4000
                      });
                    }}
                    className="text-gray-500 hover:text-pink-600 font-medium text-sm block mx-auto py-2 transition-colors"
                  >
                    Continuar en Modo Solo Lectura
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dashboard Frame */}
        <div className="max-w-7xl mx-auto relative z-10">
          
          {/* Header Banner */}
          <div className="bg-white/70 backdrop-blur-md border border-pink-100/60 rounded-3xl p-6 md:p-8 shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-500 text-white flex items-center justify-center shadow-lg shadow-pink-500/10 shrink-0">
                <Sparkles className="h-7 w-7" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">Suly Pretty Nails</h1>
                  <span className="text-xs px-2.5 py-1 bg-pink-100 text-pink-600 font-semibold rounded-full uppercase tracking-wider">
                    Admin
                  </span>
                  {isAdmin ? (
                    <span className="text-xs px-2.5 py-1 bg-green-100 text-green-700 font-semibold rounded-full flex items-center gap-1">
                      <Lock className="h-3 w-3" /> Control Total
                    </span>
                  ) : (
                    <span className="text-xs px-2.5 py-1 bg-amber-100 text-amber-700 font-semibold rounded-full flex items-center gap-1">
                      <Unlock className="h-3 w-3" /> Solo Lectura
                    </span>
                  )}
                </div>
                <p className="text-gray-500 text-sm mt-1">Control integral de reservas, agenda global, bloqueos y catálogo de servicios.</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button 
                onClick={fetchData} 
                variant="outline" 
                size="icon" 
                className="rounded-xl border-pink-100 hover:bg-pink-50 hover:text-pink-500 h-11 w-11 shadow-sm"
              >
                <RefreshCw className={`h-4 w-4 ${loadingData ? 'animate-spin' : ''}`} />
              </Button>

              {isAdmin ? (
                <Button 
                  onClick={handleResetAuth} 
                  variant="outline" 
                  className="rounded-xl border-red-200 hover:bg-red-50 text-red-600 hover:text-red-700 font-semibold px-4 h-11 shadow-sm"
                >
                  Cerrar Sesión
                </Button>
              ) : (
                <Button 
                  onClick={() => setIsAdmin(false) || setIsReadOnly(false)} 
                  className="rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-semibold px-5 h-11 shadow-md shadow-pink-500/10"
                >
                  Introducir Clave
                </Button>
              )}
            </div>
          </div>

          {/* Dynamic Loading Overlay */}
          {loadingData && bookings.length === 0 ? (
            <div className="bg-white/60 border rounded-3xl p-20 flex flex-col items-center justify-center text-center shadow-lg backdrop-blur-sm">
              <Loader2 className="h-12 w-12 animate-spin text-pink-500 mb-4" />
              <p className="text-gray-600 font-medium">Sincronizando información de agenda...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
              
              {/* Left Navigation bar */}
              <div className="lg:col-span-1 bg-white/80 border border-pink-100/60 rounded-3xl p-4 shadow-xl space-y-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-2">Pestañas de control</p>
                
                <button 
                  onClick={() => setActiveTab('overview')}
                  className={`w-full text-left px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center gap-3 ${
                    activeTab === 'overview' 
                      ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/10' 
                      : 'text-gray-600 hover:bg-pink-50/50 hover:text-pink-500'
                  }`}
                >
                  <TrendingUp className="h-4.5 w-4.5" />
                  <span>Resumen General</span>
                </button>

                <button 
                  onClick={() => setActiveTab('appointments')}
                  className={`w-full text-left px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center gap-3 ${
                    activeTab === 'appointments' 
                      ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/10' 
                      : 'text-gray-600 hover:bg-pink-50/50 hover:text-pink-500'
                  }`}
                >
                  <Calendar className="h-4.5 w-4.5" />
                  <span>Citas y Agenda</span>
                </button>

                <button 
                  onClick={() => setActiveTab('blocks')}
                  className={`w-full text-left px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center gap-3 ${
                    activeTab === 'blocks' 
                      ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/10' 
                      : 'text-gray-600 hover:bg-pink-50/50 hover:text-pink-500'
                  }`}
                >
                  <ShieldAlert className="h-4.5 w-4.5" />
                  <span>Bloquear Horas</span>
                </button>

                <button 
                  onClick={() => setActiveTab('settings')}
                  className={`w-full text-left px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center gap-3 ${
                    activeTab === 'settings' 
                      ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/10' 
                      : 'text-gray-600 hover:bg-pink-50/50 hover:text-pink-500'
                  }`}
                >
                  <Settings className="h-4.5 w-4.5" />
                  <span>Ajustes Agenda</span>
                </button>

                <button 
                  onClick={() => setActiveTab('services')}
                  className={`w-full text-left px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center gap-3 ${
                    activeTab === 'services' 
                      ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/10' 
                      : 'text-gray-600 hover:bg-pink-50/50 hover:text-pink-500'
                  }`}
                >
                  <Scissors className="h-4.5 w-4.5" />
                  <span>Servicios</span>
                </button>

                <div className="border-t border-gray-100 my-4 pt-4 px-3">
                  <div className="p-3 bg-pink-50/40 rounded-xl border border-pink-100/50">
                    <p className="text-[10px] font-bold text-pink-600 uppercase tracking-widest mb-1">Nota Administrativa</p>
                    <p className="text-gray-500 text-[11px] leading-relaxed">
                      El modo de solo lectura te permite auditar las citas. Para editar, guardar bloqueos o crear citas usa la llave de Supabase.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Panel Main Board */}
              <div className="lg:col-span-3">
                <AnimatePresence mode="wait">
                  
                  {/* TAB 1: OVERVIEW */}
                  {activeTab === 'overview' && (
                    <motion.div 
                      key="overview"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      className="space-y-8"
                    >
                      {/* Grid Stats */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        
                        {/* Stats Card 1 */}
                        <div className="bg-white border border-pink-100/50 rounded-2xl p-5 shadow-md flex items-center gap-4 relative overflow-hidden">
                          <div className="w-12 h-12 rounded-xl bg-pink-50 flex items-center justify-center text-pink-500 shrink-0">
                            <Calendar className="h-6 w-6" />
                          </div>
                          <div>
                            <p className="text-gray-400 text-xs font-semibold">Citas Activas</p>
                            <p className="text-2xl font-bold text-gray-900 mt-0.5">{totalStats.activeCount}</p>
                          </div>
                          <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-5 pointer-events-none">
                            <Calendar className="h-24 w-24 text-pink-500" />
                          </div>
                        </div>

                        {/* Stats Card 2 */}
                        <div className="bg-white border border-pink-100/50 rounded-2xl p-5 shadow-md flex items-center gap-4 relative overflow-hidden">
                          <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
                            <DollarSign className="h-6 w-6" />
                          </div>
                          <div>
                            <p className="text-gray-400 text-xs font-semibold">Ingresos Estimados</p>
                            <p className="text-2xl font-bold text-gray-900 mt-0.5">{totalStats.revenue.toFixed(2)}€</p>
                          </div>
                          <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-5 pointer-events-none">
                            <DollarSign className="h-24 w-24 text-rose-500" />
                          </div>
                        </div>

                        {/* Stats Card 3 */}
                        <div className="bg-white border border-pink-100/50 rounded-2xl p-5 shadow-md flex items-center gap-4 relative overflow-hidden">
                          <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500 shrink-0">
                            <Lock className="h-6 w-6" />
                          </div>
                          <div>
                            <p className="text-gray-400 text-xs font-semibold">Horas Bloqueadas</p>
                            <p className="text-2xl font-bold text-gray-900 mt-0.5">{totalStats.blocksCount}</p>
                          </div>
                          <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-5 pointer-events-none">
                            <Lock className="h-24 w-24 text-gray-500" />
                          </div>
                        </div>

                        {/* Stats Card 4 */}
                        <div className="bg-white border border-pink-100/50 rounded-2xl p-5 shadow-md flex items-center gap-4 relative overflow-hidden">
                          <div className="w-12 h-12 rounded-xl bg-pink-50 flex items-center justify-center text-pink-500 shrink-0">
                            <Sparkles className="h-6 w-6" />
                          </div>
                          <div>
                            <p className="text-gray-400 text-xs font-semibold">Sede Principal</p>
                            <p className="text-lg font-bold text-gray-900 mt-1 truncate">{totalStats.preferredLocation}</p>
                          </div>
                          <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-5 pointer-events-none">
                            <Sparkles className="h-24 w-24 text-pink-500" />
                          </div>
                        </div>
                      </div>

                      {/* Next Bookings & Fast Action */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        
                        {/* Upcoming Bookings table */}
                        <div className="md:col-span-2 bg-white border border-pink-100/60 rounded-3xl p-6 shadow-lg">
                          <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                              <CalendarRange className="h-5 w-5 text-pink-500" /> Próximas 5 Citas Agendadas
                            </h3>
                            <button 
                              onClick={() => setActiveTab('appointments')}
                              className="text-pink-500 hover:text-pink-600 font-semibold text-xs transition-colors"
                            >
                              Ver todas
                            </button>
                          </div>

                          <div className="space-y-4">
                            {upcomingBookings.length === 0 ? (
                              <div className="text-center py-8 bg-gray-50/50 border border-dashed rounded-2xl">
                                <p className="text-gray-400 text-sm">No hay próximas citas programadas.</p>
                              </div>
                            ) : (
                              upcomingBookings.map((b) => (
                                <div key={b.id} className="p-4 border rounded-2xl flex justify-between items-center hover:bg-pink-50/20 transition-all duration-300">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <p className="font-bold text-gray-900 text-sm">{b.client_name}</p>
                                      <span className="text-[10px] px-2 py-0.5 bg-pink-100 text-pink-600 rounded-full font-medium">
                                        {b.locations?.name || 'Sede'}
                                      </span>
                                    </div>
                                    <p className="text-xs text-gray-500 flex items-center gap-1">
                                      <Calendar className="h-3 w-3" /> {formatDate(b.booking_date)}
                                      <Clock className="h-3 w-3 ml-2" /> {b.booking_time}
                                    </p>
                                    <p className="text-xs text-pink-500 font-medium truncate max-w-xs md:max-w-md">
                                      {b.services?.map(s => s.name).join(', ')}
                                    </p>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <Button 
                                      onClick={() => sendWhatsAppConfirmation(b)} 
                                      size="icon" 
                                      className="rounded-xl bg-green-500 hover:bg-green-600 text-white h-9 w-9 shadow-sm"
                                    >
                                      <Phone className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        {/* Fast info card */}
                        <div className="bg-gradient-to-tr from-pink-500 to-rose-500 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden flex flex-col justify-between h-full min-h-[300px]">
                          <div className="absolute top-0 right-0 translate-x-4 -translate-y-4 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
                          <div className="space-y-4">
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white">
                              <Sparkles className="h-5 w-5" />
                            </div>
                            <h3 className="text-xl font-bold">Reserva al Instante</h3>
                            <p className="text-white/80 text-xs leading-relaxed">
                              Registra citas recibidas por llamada o mensajes directamente en el sistema para evitar solapamientos y sincronizar con los clientes.
                            </p>
                          </div>

                          <Button 
                            onClick={() => {
                              if (!isAdmin) {
                                toast({
                                  variant: "destructive",
                                  title: "Control Restringido",
                                  description: "Para crear citas necesitas acceder con tu clave de administrador.",
                                  duration: 4000
                                });
                                return;
                              }
                              setShowCreateModal(true);
                            }}
                            className="bg-white hover:bg-pink-50 text-pink-600 rounded-xl font-bold py-6 w-full shadow-lg"
                          >
                            <UserPlus className="h-4.5 w-4.5 mr-2" /> Agendar Cita Manual
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* TAB 2: APPOINTMENTS */}
                  {activeTab === 'appointments' && (
                    <motion.div 
                      key="appointments"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      className="space-y-6"
                    >
                      {/* Search Bar / Top Filters */}
                      <div className="bg-white border border-pink-100/60 rounded-3xl p-5 md:p-6 shadow-md space-y-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <h3 className="text-xl font-extrabold text-gray-900">Agenda de Turnos</h3>
                            <p className="text-xs text-gray-500">Visualiza el calendario mensual, gestiona las reservas diarias y bloquea horarios.</p>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            {/* Manual booking button */}
                            <Button 
                              onClick={() => {
                                if (!isAdmin) {
                                  toast({
                                    variant: "destructive",
                                    title: "Acceso Restringido",
                                    description: "Necesitas tu clave de administrador para agendar manualmente.",
                                    duration: 3500
                                  });
                                  return;
                                }
                                setShowCreateModal(true);
                              }}
                              className="bg-pink-500 hover:bg-pink-600 text-white rounded-xl shadow-md transition-all duration-300"
                            >
                              <Plus className="h-4 w-4 mr-2" /> Nueva Cita Manual
                            </Button>
                          </div>
                        </div>

                        {/* Filter criteria */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Sede picker */}
                          <div>
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Filtrar por Sede</Label>
                            <Select value={locationFilter} onValueChange={setLocationFilter}>
                              <SelectTrigger className="border-pink-100 rounded-xl bg-gray-50/50">
                                <SelectValue placeholder="Todas las sedes" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">Todas las sedes</SelectItem>
                                {locations.map(loc => (
                                  <SelectItem key={loc.id} value={loc.id.toString()}>{loc.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Search bar */}
                          <div className="md:col-span-2">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Buscar Turnos (Global)</Label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                <Search className="h-4 w-4" />
                              </span>
                              <Input 
                                type="text" 
                                placeholder="Buscar por cliente, teléfono, notas..."
                                className="pl-9 border-pink-100 focus-visible:ring-pink-400 rounded-xl bg-gray-50/50"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                              />
                              {searchQuery && (
                                <button 
                                  onClick={() => setSearchQuery('')}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* DOUBLE COLUMN LAYOUT OR SEARCH RESULTS */}
                      {searchQuery ? (
                        /* MODE A: SEARCH RESULTS ACTIVE */
                        <div className="bg-white border border-pink-100/60 rounded-3xl p-6 shadow-md space-y-6">
                          <div className="flex items-center justify-between border-b pb-4">
                            <div className="flex items-center gap-2">
                              <Search className="h-5 w-5 text-pink-500" />
                              <span className="font-extrabold text-gray-900">Resultados de Búsqueda</span>
                              <span className="px-2.5 py-0.5 bg-pink-100 text-pink-600 rounded-full text-xs font-bold">
                                {filteredBookings.length}
                              </span>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setSearchQuery('')} className="text-gray-500 hover:text-pink-600 text-xs">
                              Limpiar Búsqueda
                            </Button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {filteredBookings.length === 0 ? (
                              <div className="col-span-1 md:col-span-2 text-center py-20 bg-gray-50/50 border border-dashed rounded-3xl">
                                <p className="text-gray-400 font-semibold">No se encontraron citas con la búsqueda especificada.</p>
                              </div>
                            ) : (
                              filteredBookings.map((b) => {
                                const isBlock = b.client_name === '[BLOQUEADO]';
                                return (
                                  <div 
                                    key={b.id} 
                                    className={`bg-white border rounded-2xl shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md ${
                                      isBlock ? 'border-red-100 bg-red-50/20' : 'border-pink-100/50'
                                    }`}
                                  >
                                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${isBlock ? 'bg-red-400' : 'bg-pink-500'}`} />

                                    <div className="p-5 pl-6 space-y-4">
                                      <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <h4 className="font-extrabold text-gray-900 text-base">
                                              {isBlock ? 'Bloqueo Administrativo' : b.client_name}
                                            </h4>
                                            <span className="text-[10px] px-2.5 py-0.5 bg-pink-100 text-pink-600 rounded-full font-bold">
                                              {b.locations?.name || 'Sede'}
                                            </span>
                                          </div>
                                          <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-1 font-semibold">
                                            <Calendar className="h-3.5 w-3.5 text-pink-500" /> {formatDate(b.booking_date)}
                                            <Clock className="h-3.5 w-3.5 text-pink-500 ml-2" /> {b.booking_time}
                                          </p>
                                        </div>

                                        <div className="flex items-center gap-1 shrink-0">
                                          {!isBlock && (
                                            <Button 
                                              onClick={() => handleOpenWaModal(b)}
                                              size="icon" 
                                              className="bg-green-500 hover:bg-green-600 text-white rounded-lg h-8 w-8 shadow-sm"
                                              title="Enviar plantilla WhatsApp"
                                            >
                                              <Phone className="h-4 w-4" />
                                            </Button>
                                          )}
                                          
                                          <Button 
                                            onClick={() => handleDeleteBooking(b.id)}
                                            disabled={!isAdmin}
                                            size="icon" 
                                            variant="outline"
                                            className="border-red-100 hover:bg-red-50 text-red-500 rounded-lg h-8 w-8 shrink-0"
                                            title={isBlock ? "Eliminar Bloqueo" : "Cancelar Cita"}
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </div>

                                      {!isBlock && (
                                        <div className="bg-pink-50/20 rounded-xl p-3 border border-pink-100/30 text-xs space-y-2">
                                          <div>
                                            <span className="text-gray-400">Teléfono:</span>{' '}
                                            <a href={`tel:${b.client_phone}`} className="font-bold text-gray-800 hover:underline">
                                              {b.client_phone}
                                            </a>
                                          </div>
                                          <div>
                                            <span className="text-gray-400">Correo:</span>{' '}
                                            <span className="text-gray-700 font-semibold">{b.client_email}</span>
                                          </div>
                                          {b.notes && (
                                            <div>
                                              <span className="text-gray-400 block mb-0.5">Notas:</span>
                                              <span className="text-gray-600 italic bg-white px-2 py-1 border rounded block mt-0.5">
                                                "{b.notes}"
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      )}

                                      {!isBlock && (
                                        <div className="flex justify-between items-center border-t border-gray-100 pt-3">
                                          <div className="text-[11px] text-gray-500 font-semibold max-w-[70%]">
                                            Servicios: {b.services?.map(s => s.name).join(', ')}
                                          </div>
                                          <div className="text-right">
                                            <p className="text-[10px] text-gray-400 font-semibold">Total a pagar</p>
                                            <p className="text-sm font-extrabold text-pink-600">{(b.totalPrice || 0).toFixed(2)}€</p>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      ) : (
                        /* MODE B: DOUBLE COLUMN INTERACTIVE CALENDAR + TIMELINE */
                        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
                          
                          {/* COLUMN 1: INTERACTIVE CALENDAR & STATS (xl:col-span-5) */}
                          <div className="xl:col-span-5 space-y-6">
                            
                            {/* Interactive Calendar Card */}
                            <div className="bg-white border border-pink-100/60 rounded-3xl p-5 md:p-6 shadow-md">
                              {/* Header navigation */}
                              <div className="flex items-center justify-between mb-6">
                                <h3 className="font-extrabold text-gray-900 text-base">
                                  {formatMonthYear(currentMonth)}
                                </h3>
                                
                                <div className="flex items-center gap-1">
                                  <Button 
                                    variant="outline" 
                                    size="icon" 
                                    className="h-8 w-8 rounded-lg border-pink-100 hover:bg-pink-50"
                                    onClick={() => {
                                      const prev = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
                                      setCurrentMonth(prev);
                                    }}
                                  >
                                    <ChevronLeft className="h-4 w-4 text-pink-500" />
                                  </Button>
                                  
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-8 rounded-lg border-pink-100 text-pink-600 hover:bg-pink-50 text-xs font-bold px-2.5"
                                    onClick={() => {
                                      const today = new Date();
                                      setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
                                      setSelectedDate(getTodayLocalStr());
                                    }}
                                  >
                                    Hoy
                                  </Button>
                                  
                                  <Button 
                                    variant="outline" 
                                    size="icon" 
                                    className="h-8 w-8 rounded-lg border-pink-100 hover:bg-pink-50"
                                    onClick={() => {
                                      const next = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
                                      setCurrentMonth(next);
                                    }}
                                  >
                                    <ChevronRight className="h-4 w-4 text-pink-500" />
                                  </Button>
                                </div>
                              </div>

                              {/* Weekdays row */}
                              <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-gray-400 mb-3">
                                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
                                  <span key={d}>{d}</span>
                                ))}
                              </div>

                              {/* Calendar days grid */}
                              <div className="grid grid-cols-7 gap-1.5">
                                {getCalendarDays(currentMonth).map((d) => {
                                  const dayStats = getDayStats(d.dateStr);
                                  const isSelected = d.dateStr === selectedDate;
                                  const isToday = d.dateStr === getTodayLocalStr();
                                  
                                  return (
                                    <button
                                      key={d.dateStr}
                                      onClick={() => setSelectedDate(d.dateStr)}
                                      className={`aspect-square rounded-2xl flex flex-col items-center justify-between p-1.5 border transition-all duration-300 relative ${
                                        isSelected 
                                          ? 'bg-pink-500 border-pink-500 text-white shadow-md shadow-pink-500/25 font-bold scale-105 z-10' 
                                          : isToday
                                          ? 'bg-pink-50 border-pink-300 text-pink-700 font-extrabold'
                                          : d.isCurrentMonth
                                          ? 'bg-white border-gray-100 hover:bg-pink-50/50 hover:border-pink-200 text-gray-700 font-medium'
                                          : 'bg-gray-50/40 border-transparent text-gray-300'
                                      }`}
                                    >
                                      {/* Day Number */}
                                      <span className="text-xs">{d.date.getDate()}</span>
                                      
                                      {/* Mini Indicators */}
                                      <div className="flex justify-center gap-0.5 w-full mt-0.5">
                                        {dayStats.bookingsCount > 0 && (
                                          <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-pink-500'}`} />
                                        )}
                                        {dayStats.blocksCount > 0 && (
                                          <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-red-200' : 'bg-red-400'}`} />
                                        )}
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Monthly Summary Card */}
                            <div className="bg-white border border-pink-100/60 rounded-3xl p-5 shadow-md">
                              <h4 className="font-extrabold text-gray-900 text-sm mb-4 flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-pink-500" /> Resumen de {formatMonthYear(currentMonth)}
                              </h4>
                              
                              {(() => {
                                const mStats = getMonthStats();
                                return (
                                  <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-pink-50/40 border border-pink-100/40 rounded-2xl p-3 text-center">
                                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Citas</p>
                                      <p className="text-lg font-extrabold text-pink-600">{mStats.totalBookings}</p>
                                    </div>
                                    
                                    <div className="bg-red-50/20 border border-red-100/30 rounded-2xl p-3 text-center">
                                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Bloqueos</p>
                                      <p className="text-lg font-extrabold text-red-500">{mStats.totalBlocks}</p>
                                    </div>
                                    
                                    <div className="bg-emerald-50/20 border border-emerald-100/30 rounded-2xl p-3 text-center">
                                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Estimado</p>
                                      <p className="text-base font-extrabold text-emerald-600 truncate">{mStats.estimatedEarnings.toFixed(0)}€</p>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>

                          {/* COLUMN 2: DAY AGENDA & TIMELINE (xl:col-span-7) */}
                          <div className="xl:col-span-7 bg-white border border-pink-100/60 rounded-3xl p-5 md:p-6 shadow-md space-y-6">
                            
                            {/* Date detail header */}
                            <div className="border-b pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div>
                                <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">Agenda del Día Seleccionado</p>
                                <h3 className="font-extrabold text-gray-900 text-base mt-0.5">
                                  {(() => {
                                    const dateObj = new Date(selectedDate + 'T00:00:00');
                                    const dayName = dateObj.toLocaleDateString('es-ES', { weekday: 'long' });
                                    const dayNum = dateObj.getDate();
                                    const monthName = dateObj.toLocaleDateString('es-ES', { month: 'long' });
                                    const yearNum = dateObj.getFullYear();
                                    return `${dayName.charAt(0).toUpperCase() + dayName.slice(1)}, ${dayNum} de ${monthName} de ${yearNum}`;
                                  })()}
                                </h3>
                              </div>
                              
                              {/* Location filter summary banner */}
                              {locationFilter !== 'all' && (
                                <span className="text-[10px] px-2.5 py-1 bg-pink-50 text-pink-600 border border-pink-100 rounded-full font-bold self-start">
                                  Filtrado: {locations.find(l => l.id.toString() === locationFilter)?.name}
                                </span>
                              )}
                            </div>

                            {/* Chronological timeline */}
                            <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                              {(salonSettings.time_slots || []).length === 0 ? (
                                <div className="text-center py-12">
                                  <p className="text-gray-400 text-xs">No hay franjas horarias configuradas en la administración.</p>
                                </div>
                              ) : (
                                (salonSettings.time_slots || []).map((time) => {
                                  const slots = getTimelineSlotsForTime(time);
                                  
                                  return (
                                    <div key={time} className="relative pl-6 pb-6 border-l border-pink-100 last:pb-0 last:border-transparent">
                                      {/* Hour dot */}
                                      <div className="absolute -left-1.5 top-1.5 w-3.5 h-3.5 rounded-full bg-pink-400 border-4 border-white shadow-sm" />
                                      
                                      <div className="flex flex-col md:flex-row md:items-start gap-4">
                                        {/* Time badge */}
                                        <div className="flex items-center gap-1 font-extrabold text-gray-800 text-sm w-16 shrink-0 pt-1">
                                          <Clock className="h-3.5 w-3.5 text-pink-500" />
                                          {time}
                                        </div>

                                        {/* Slots list */}
                                        <div className="flex-1 space-y-3">
                                          {slots.map((slot, index) => {
                                            const b = slot.booking;
                                            const isFree = slot.isFree;
                                            const isBlock = b && b.client_name === '[BLOQUEADO]';

                                            if (b && !isBlock) {
                                              return (
                                                <div 
                                                  key={b.id || index}
                                                  className="bg-white border border-pink-100/50 rounded-2xl shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md p-4"
                                                >
                                                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-pink-500" />
                                                  
                                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                    <div className="space-y-1">
                                                      <div className="flex items-center gap-2 flex-wrap">
                                                        <h4 className="font-extrabold text-gray-900 text-sm">
                                                          {b.client_name}
                                                        </h4>
                                                        <span className="text-[9px] px-2 py-0.5 bg-pink-100 text-pink-600 rounded-full font-bold">
                                                          {slot.location?.name || 'Sede'}
                                                        </span>
                                                      </div>
                                                      
                                                      <div className="text-xs text-gray-500 flex flex-wrap gap-x-3 gap-y-1 font-semibold">
                                                        <a href={`tel:${b.client_phone}`} className="hover:underline flex items-center gap-1 text-gray-700">
                                                          <Phone className="h-3 w-3 text-pink-500" /> {b.client_phone}
                                                        </a>
                                                        <span className="text-gray-300">|</span>
                                                        <span>{b.client_email}</span>
                                                      </div>
                                                      
                                                      {b.notes && (
                                                        <p className="text-xs text-gray-500 italic bg-gray-50/50 px-2.5 py-1 rounded border border-gray-100 mt-1 inline-block">
                                                          "{b.notes}"
                                                        </p>
                                                      )}
                                                      
                                                      <div className="text-[10px] text-gray-500 font-bold mt-1">
                                                        Servicios: {b.services?.map(s => s.name).join(', ')}
                                                      </div>
                                                    </div>
                                                    
                                                    {/* Actions & Price */}
                                                    <div className="flex sm:flex-col items-end gap-2 shrink-0 justify-between sm:justify-start">
                                                      <div className="text-right">
                                                        <p className="text-[9px] text-gray-400 font-semibold leading-none">Total</p>
                                                        <p className="text-sm font-extrabold text-pink-600">{(b.totalPrice || 0).toFixed(2)}€</p>
                                                      </div>
                                                      
                                                      <div className="flex items-center gap-1.5">
                                                        <Button 
                                                          onClick={() => handleOpenWaModal(b)}
                                                          size="icon" 
                                                          className="bg-green-500 hover:bg-green-600 text-white rounded-lg h-7.5 w-7.5 shadow-sm transition-colors"
                                                          title="Enviar plantilla WhatsApp"
                                                        >
                                                          <Phone className="h-3.5 w-3.5" />
                                                        </Button>
                                                        
                                                        <Button 
                                                          onClick={() => handleDeleteBooking(b.id)}
                                                          disabled={!isAdmin}
                                                          size="icon" 
                                                          variant="outline"
                                                          className="border-red-100 hover:bg-red-50 text-red-500 rounded-lg h-7.5 w-7.5 transition-colors"
                                                          title="Cancelar Cita"
                                                        >
                                                          <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                      </div>
                                                    </div>
                                                  </div>
                                                </div>
                                              );
                                            } else if (isBlock) {
                                              return (
                                                <div 
                                                  key={b.id || index}
                                                  className="bg-red-50/10 border border-red-100/50 rounded-2xl relative overflow-hidden p-3.5 pl-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3"
                                                >
                                                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-400" />
                                                  
                                                  <div className="space-y-0.5">
                                                    <div className="flex items-center gap-2">
                                                      <Lock className="h-3.5 w-3.5 text-red-500 shrink-0" />
                                                      <span className="font-extrabold text-gray-800 text-xs">Cierre Administrativo</span>
                                                      <span className="text-[9px] px-2 py-0.5 bg-red-100 text-red-600 rounded-full font-bold">
                                                        {slot.location?.name || 'Sede'}
                                                      </span>
                                                    </div>
                                                    <p className="text-[11px] text-gray-500 italic">
                                                      {b.notes || 'Horario bloqueado por la administración.'}
                                                    </p>
                                                  </div>
                                                  
                                                  <Button 
                                                    onClick={() => handleDeleteBooking(b.id)}
                                                    disabled={!isAdmin}
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg text-xs font-semibold px-2.5 h-8 gap-1 self-start sm:self-center transition-colors"
                                                  >
                                                    <Unlock className="h-3.5 w-3.5" /> Liberar
                                                  </Button>
                                                </div>
                                              );
                                            } else {
                                              return (
                                                <div 
                                                  key={index}
                                                  className="border border-dashed border-gray-200 bg-gray-50/20 rounded-2xl p-3 flex flex-col sm:flex-row justify-between sm:items-center gap-2.5 transition-all hover:bg-pink-50/10 hover:border-pink-200/50"
                                                >
                                                  <div className="flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                                    <span className="text-xs font-bold text-gray-500">Disponible</span>
                                                    <span className="text-[9px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full font-semibold">
                                                      {slot.location?.name || 'Sede'}
                                                    </span>
                                                  </div>
                                                  
                                                  <div className="flex items-center gap-1.5 self-end sm:self-center">
                                                    <Button 
                                                      onClick={() => handleQuickBook(time, slot.location?.id)}
                                                      disabled={!isAdmin}
                                                      size="sm"
                                                      className="bg-white hover:bg-pink-50 text-pink-600 border border-pink-100 rounded-lg text-xs font-semibold px-3 h-7.5 transition-colors"
                                                    >
                                                      <Plus className="h-3 w-3 mr-1" /> Agendar
                                                    </Button>
                                                    <Button 
                                                      onClick={() => handleQuickBlock(time, slot.location?.id)}
                                                      disabled={!isAdmin}
                                                      size="sm"
                                                      variant="outline"
                                                      className="border-gray-200 hover:bg-red-50 hover:text-red-500 text-gray-500 rounded-lg text-xs font-semibold px-3 h-7.5 transition-colors"
                                                    >
                                                      <Lock className="h-3 w-3 mr-1" /> Bloquear
                                                    </Button>
                                                  </div>
                                                </div>
                                              );
                                            }
                                          })}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* TAB 3: BLOCKS */}
                  {activeTab === 'blocks' && (
                    <motion.div 
                      key="blocks"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      className="space-y-8"
                    >
                      {/* Blocking builder card */}
                      <div className="bg-white border border-pink-100/60 rounded-3xl p-6 shadow-md space-y-6">
                        <div className="border-b pb-4">
                          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Lock className="h-5 w-5 text-pink-500" /> Cierre de Horarios en Agenda
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">Bloquea slots específicos para un día e inhabilita que los clientes reserven esas horas online.</p>
                        </div>

                        {/* Top picker fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label className="font-semibold text-gray-700">Sede</Label>
                            <Select value={blockLocation} onValueChange={setBlockLocation}>
                              <SelectTrigger className="border-pink-100 rounded-xl">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {locations.map(loc => (
                                  <SelectItem key={loc.id} value={loc.id.toString()}>{loc.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label className="font-semibold text-gray-700">Fecha a Bloquear</Label>
                            <Input 
                              type="date" 
                              className="border-pink-100 rounded-xl"
                              value={blockDate} 
                              onChange={(e) => {
                                setBlockDate(e.target.value);
                                setSelectedBlockSlots([]);
                              }} 
                            />
                          </div>
                        </div>

                        {/* Slots grid selector */}
                        {blockLocation && blockDate && (
                          <div className="space-y-4 border-t pt-6">
                            <h4 className="font-bold text-gray-800 text-sm">Selecciona las horas a bloquear/liberar:</h4>
                            
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                              {salonSettings.time_slots.map(time => {
                                const exist = blockedSlotsForSelectedDate.find(bs => bs.time === time);
                                const isBlockedByAdmin = exist && exist.isBlock;
                                const isOccupied = exist && !exist.isBlock;
                                const isHighlighted = selectedBlockSlots.includes(time);

                                return (
                                  <button
                                    key={time}
                                    onClick={() => {
                                      if (isOccupied) return;
                                      if (selectedBlockSlots.includes(time)) {
                                        setSelectedBlockSlots(selectedBlockSlots.filter(s => s !== time));
                                      } else {
                                        setSelectedBlockSlots([...selectedBlockSlots, time]);
                                      }
                                    }}
                                    disabled={isOccupied}
                                    className={`p-3 rounded-xl text-center text-xs font-semibold border transition-all duration-200 ${
                                      isOccupied 
                                        ? 'bg-gray-100 text-gray-400 border-gray-100 cursor-not-allowed'
                                        : isBlockedByAdmin
                                          ? 'bg-red-500 text-white border-red-500 shadow-md shadow-red-500/10'
                                          : isHighlighted
                                            ? 'bg-pink-500 text-white border-pink-500 shadow-md shadow-pink-500/10'
                                            : 'bg-white text-gray-700 hover:bg-pink-50 hover:border-pink-300'
                                    }`}
                                  >
                                    <p className="font-bold text-sm">{time}</p>
                                    <p className="text-[9px] opacity-75 mt-0.5">
                                      {isOccupied ? 'Cita' : isBlockedByAdmin ? 'Bloqueado' : isHighlighted ? 'Sel.' : 'Libre'}
                                    </p>
                                  </button>
                                );
                              })}
                            </div>

                            {/* Buttons actions */}
                            <div className="flex items-center gap-4 pt-4 border-t">
                              <Button 
                                onClick={handleApplyBlockSlots}
                                disabled={selectedBlockSlots.length === 0 || blockingActionLoading || !isAdmin}
                                className="bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl py-5 px-6 font-bold shadow-lg shadow-pink-500/10"
                              >
                                {blockingActionLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
                                Bloquear Horas Seleccionadas
                              </Button>

                              <p className="text-xs text-gray-400 font-medium">
                                * Las horas con badge "Bloqueado" ya están inhabilitadas. Las horas ocupadas por citas de clientes no se pueden alterar desde esta pestaña.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Active Blocks list */}
                      <div className="bg-white border border-pink-100/60 rounded-3xl p-6 shadow-md">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Lista de Bloqueos Activos</h3>
                        
                        {bookings.filter(b => b.client_name === '[BLOQUEADO]').length === 0 ? (
                          <div className="text-center py-10 bg-gray-50 border border-dashed rounded-2xl">
                            <p className="text-gray-400 text-sm">No hay horarios inhabilitados actualmente en la base de datos.</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {bookings
                              .filter(b => b.client_name === '[BLOQUEADO]')
                              .sort((a,b) => `${a.booking_date}T${a.booking_time}`.localeCompare(`${b.booking_date}T${b.booking_time}`))
                              .map(b => (
                                <div key={b.id} className="p-4 border rounded-xl bg-red-50/10 border-red-100 flex items-center justify-between">
                                  <div>
                                    <span className="text-xs font-extrabold text-red-500 block uppercase tracking-wider">Inhabilitado</span>
                                    <span className="font-extrabold text-sm text-gray-900 block mt-0.5">{b.locations?.name || 'Sede'}</span>
                                    <span className="text-xs text-gray-500 block mt-0.5">
                                      {formatDate(b.booking_date)} a las <strong className="text-gray-700">{b.booking_time}</strong>
                                    </span>
                                  </div>

                                  <Button 
                                    onClick={() => handleDeleteBooking(b.id)}
                                    disabled={!isAdmin}
                                    size="icon" 
                                    variant="outline"
                                    className="border-red-100 hover:bg-red-50 text-red-500 rounded-lg h-9 w-9"
                                    title="Desbloquear Hora"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))
                            }
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* TAB 4: SETTINGS */}
                  {activeTab === 'settings' && (
                    <motion.div 
                      key="settings"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      className="space-y-6"
                    >
                      <div className="bg-white border border-pink-100/60 rounded-3xl p-6 shadow-md space-y-8">
                        <div className="border-b pb-4">
                          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Settings className="h-5 w-5 text-pink-500" /> Parámetros de Agenda Global
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">Configura las reglas dinámicas generales de tu agenda y salón en Supabase.</p>
                        </div>

                        {/* Max advance */}
                        <div className="space-y-2 max-w-xs">
                          <Label className="font-semibold text-gray-700">Días máximos de antelación</Label>
                          <Input 
                            type="number" 
                            className="border-pink-100 rounded-xl"
                            value={salonSettings.max_advance_days} 
                            onChange={(e) => setSalonSettings({...salonSettings, max_advance_days: parseInt(e.target.value) || 30})}
                          />
                          <p className="text-[10px] text-gray-400">Los clientes sólo podrán reservar citas en los próximos N días.</p>
                        </div>

                        {/* Excluded days checklist */}
                        <div className="space-y-3">
                          <Label className="font-semibold text-gray-700 block">Días de Descanso (Excluidos de Agenda)</Label>
                          <div className="flex flex-wrap gap-3">
                            {[1, 2, 3, 4, 5, 6, 0].map(dayNum => {
                              const isExcluded = salonSettings.excluded_days.includes(dayNum);
                              return (
                                <button
                                  key={dayNum}
                                  onClick={() => handleToggleExcludedDay(dayNum)}
                                  className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all duration-200 ${
                                    isExcluded 
                                      ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/10' 
                                      : 'bg-white text-gray-700 border-gray-200 hover:bg-pink-50'
                                  }`}
                                >
                                  {getDayName(dayNum)}
                                </button>
                              );
                            })}
                          </div>
                          <p className="text-[10px] text-gray-400">Los días seleccionados no se mostrarán en absoluto en la selección del cliente.</p>
                        </div>

                        {/* Active time slots list global */}
                        <div className="space-y-3 pt-4 border-t">
                          <Label className="font-semibold text-gray-700 block">Turnos de Tiempo Habilitados (Globales)</Label>
                          
                          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                            {[
                              '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
                              '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
                              '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
                              '20:00', '20:30', '21:00'
                            ].map(slot => {
                              const isEnabled = salonSettings.time_slots.includes(slot);
                              return (
                                <button
                                  key={slot}
                                  onClick={() => handleToggleGlobalSlot(slot)}
                                  className={`p-2.5 rounded-lg text-xs font-bold border transition-all duration-200 ${
                                    isEnabled 
                                      ? 'bg-pink-500 text-white border-pink-500 shadow-md' 
                                      : 'bg-white text-gray-500 border-gray-200 hover:bg-pink-50/50'
                                  }`}
                                >
                                  {slot}
                                </button>
                              );
                            })}
                          </div>
                          <p className="text-[10px] text-gray-400">Desactiva los turnos que no ofreces en general para evitar citas en horas inactivas.</p>
                        </div>

                        <div className="flex gap-4 pt-6 border-t">
                          <Button 
                            onClick={handleSaveSettings}
                            disabled={bulkLoading || !isAdmin}
                            className="bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl px-8 py-6 font-bold shadow-lg shadow-pink-500/10"
                          >
                            {bulkLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                            Guardar Configuración General
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* TAB 5: SERVICES */}
                  {activeTab === 'services' && (
                    <motion.div 
                      key="services"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      className="space-y-6"
                    >
                      {/* Services list panel */}
                      <div className="bg-white border border-pink-100/60 rounded-3xl p-6 shadow-md space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">Catálogo de Servicios y Tratamientos</h3>
                            <p className="text-xs text-gray-500 mt-0.5">Controla la lista de precios, duración y categorías de tus servicios en la base de datos.</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <Button 
                              onClick={handleBulkInsertMissing}
                              disabled={bulkLoading || !isAdmin}
                              variant="outline" 
                              className="border-pink-200 hover:bg-pink-50 rounded-xl"
                            >
                              <FileSpreadsheet className="h-4 w-4 mr-2 text-pink-500" />
                              Cargar Servicios Iniciales
                            </Button>
                            <Button 
                              onClick={() => {
                                if (!isAdmin) {
                                  toast({ variant: "destructive", title: "Restringido", description: "Requiere clave admin." });
                                  return;
                                }
                                setServiceForm({ id: null, name: '', duration: '45 min', price: '15,00€', category: 'nails' });
                                setShowServiceModal(true);
                              }}
                              className="bg-pink-500 hover:bg-pink-600 text-white rounded-xl shadow-md"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Añadir Servicio
                            </Button>
                          </div>
                        </div>

                        {/* Listing grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2">
                          {services.length === 0 ? (
                            <div className="col-span-1 md:col-span-2 text-center py-10 bg-gray-50 border border-dashed rounded-2xl">
                              <p className="text-gray-400">No se encontraron servicios guardados. Puedes cargarlos en un click usando el botón "Cargar Servicios Iniciales".</p>
                            </div>
                          ) : (
                            services.map(s => (
                              <div key={s.id} className="p-4 border border-pink-100/30 bg-pink-50/5 hover:bg-pink-50/20 rounded-xl flex items-center justify-between transition-all duration-300 hover:border-pink-200">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-extrabold text-gray-900 text-sm">{s.name}</p>
                                    <span className="text-[9px] font-bold px-2 py-0.5 bg-pink-100 text-pink-600 rounded-full uppercase">
                                      {s.category || 'Nails'}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-2 font-medium">
                                    <span>Duración: <strong>{s.duration}</strong></span>
                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-200" />
                                    <span>Precio: <strong className="text-pink-600">{s.price}</strong></span>
                                  </p>
                                </div>

                                <div className="flex items-center gap-1 shrink-0">
                                  <Button 
                                    onClick={() => {
                                      if (!isAdmin) {
                                        toast({ variant: "destructive", title: "Restringido", description: "Requiere clave admin." });
                                        return;
                                      }
                                      setServiceForm({
                                        id: s.id,
                                        name: s.name,
                                        duration: s.duration,
                                        price: s.price,
                                        category: s.category || 'nails'
                                      });
                                      setShowServiceModal(true);
                                    }}
                                    size="icon" 
                                    variant="outline"
                                    className="border-pink-100 hover:bg-pink-50 text-gray-500 hover:text-pink-600 rounded-lg h-8 w-8"
                                  >
                                    <Edit3 className="h-4 w-4" />
                                  </Button>

                                  <Button 
                                    onClick={() => handleDeleteService(s.id)}
                                    disabled={!isAdmin}
                                    size="icon" 
                                    variant="outline"
                                    className="border-red-100 hover:bg-red-50 text-red-500 rounded-lg h-8 w-8"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: CREATE MANUAL BOOKING */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border-pink-100 p-6 md:p-8">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">Agendar Nueva Cita Manual</DialogTitle>
            <DialogDescription className="text-xs">Introduce la información del cliente para agendar una reserva de forma directa.</DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            
            {/* Form row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-gray-700">Nombre del Cliente</Label>
                <Input 
                  placeholder="Ej: Sofia Loren"
                  value={newBooking.client_name}
                  onChange={(e) => setNewBooking({...newBooking, client_name: e.target.value})}
                  className="border-pink-100 rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-gray-700">Teléfono (con prefijo opc.)</Label>
                <Input 
                  placeholder="Ej: 600123456"
                  value={newBooking.client_phone}
                  onChange={(e) => setNewBooking({...newBooking, client_phone: e.target.value})}
                  className="border-pink-100 rounded-xl"
                />
              </div>
            </div>

            {/* Email & location selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-gray-700">Correo Electrónico</Label>
                <Input 
                  type="email"
                  placeholder="Ej: sofia@mail.com"
                  value={newBooking.client_email}
                  onChange={(e) => setNewBooking({...newBooking, client_email: e.target.value})}
                  className="border-pink-100 rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-gray-700">Sede</Label>
                <Select value={newBooking.location_id} onValueChange={(value) => setNewBooking({...newBooking, location_id: value})}>
                  <SelectTrigger className="border-pink-100 rounded-xl">
                    <SelectValue placeholder="Selecciona Sede" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map(loc => (
                      <SelectItem key={loc.id} value={loc.id.toString()}>{loc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Date and time fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-gray-700">Fecha</Label>
                <Input 
                  type="date"
                  value={newBooking.booking_date}
                  onChange={(e) => setNewBooking({...newBooking, booking_date: e.target.value})}
                  className="border-pink-100 rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-gray-700">Hora</Label>
                <Select value={newBooking.booking_time} onValueChange={(value) => setNewBooking({...newBooking, booking_time: value})}>
                  <SelectTrigger className="border-pink-100 rounded-xl">
                    <SelectValue placeholder="Selecciona Hora" />
                  </SelectTrigger>
                  <SelectContent>
                    {salonSettings.time_slots.map(slot => (
                      <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Services Checklist */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-gray-700 block">Servicios a Incluir</Label>
              <div className="border rounded-xl p-4 max-h-[160px] overflow-y-auto space-y-2">
                {services.map(s => {
                  const isChecked = newBooking.selectedServices.includes(s.id);
                  return (
                    <label key={s.id} className="flex items-center gap-3 text-xs font-medium text-gray-700 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setNewBooking({
                              ...newBooking,
                              selectedServices: newBooking.selectedServices.filter(id => id !== s.id)
                            });
                          } else {
                            setNewBooking({
                              ...newBooking,
                              selectedServices: [...newBooking.selectedServices, s.id]
                            });
                          }
                        }}
                        className="rounded border-gray-300 text-pink-600 focus:ring-pink-500 h-4 w-4"
                      />
                      <span>{s.name} - <strong>{s.price}</strong> ({s.duration})</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-gray-700">Notas / Comentarios Internos</Label>
              <textarea 
                className="border border-pink-100 rounded-xl p-3 w-full text-xs min-h-[60px] focus:outline-none focus:ring-2 focus:ring-pink-400"
                placeholder="Detalles particulares de la manicura..."
                value={newBooking.notes}
                onChange={(e) => setNewBooking({...newBooking, notes: e.target.value})}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline" className="rounded-xl border-pink-100">Cancelar</Button>
            </DialogClose>
            <Button 
              onClick={handleCreateBooking} 
              disabled={bulkLoading}
              className="bg-pink-500 hover:bg-pink-600 text-white rounded-xl"
            >
              {bulkLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              Guardar Turno
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: EDIT MANUAL BOOKING */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border-pink-100 p-6 md:p-8">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">Editar Cita / Turno</DialogTitle>
            <DialogDescription className="text-xs">Modifica la información del cliente, sede, fecha u horario de la reserva.</DialogDescription>
          </DialogHeader>

          {editingBooking && (
            <div className="space-y-5 py-4">
              
              {/* Form row 1 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-gray-700">Nombre del Cliente</Label>
                  <Input 
                    placeholder="Ej: Sofia Loren"
                    value={editingBooking.client_name}
                    onChange={(e) => setEditingBooking({...editingBooking, client_name: e.target.value})}
                    className="border-pink-100 rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-gray-700">Teléfono (con prefijo opc.)</Label>
                  <Input 
                    placeholder="Ej: 600123456"
                    value={editingBooking.client_phone}
                    onChange={(e) => setEditingBooking({...editingBooking, client_phone: e.target.value})}
                    className="border-pink-100 rounded-xl"
                  />
                </div>
              </div>

              {/* Email & location selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-gray-700">Correo Electrónico</Label>
                  <Input 
                    type="email"
                    placeholder="Ej: sofia@mail.com"
                    value={editingBooking.client_email || ''}
                    onChange={(e) => setEditingBooking({...editingBooking, client_email: e.target.value})}
                    className="border-pink-100 rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-gray-700">Sede</Label>
                  <Select 
                    value={editingBooking.location_id?.toString()} 
                    onValueChange={(value) => setEditingBooking({...editingBooking, location_id: value})}
                  >
                    <SelectTrigger className="border-pink-100 rounded-xl">
                      <SelectValue placeholder="Selecciona Sede" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map(loc => (
                        <SelectItem key={loc.id} value={loc.id.toString()}>{loc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Date and time fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-gray-700">Fecha</Label>
                  <Input 
                    type="date"
                    value={editingBooking.booking_date}
                    onChange={(e) => setEditingBooking({...editingBooking, booking_date: e.target.value})}
                    className="border-pink-100 rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-gray-700">Hora</Label>
                  <Select 
                    value={editingBooking.booking_time} 
                    onValueChange={(value) => setEditingBooking({...editingBooking, booking_time: value})}
                  >
                    <SelectTrigger className="border-pink-100 rounded-xl">
                      <SelectValue placeholder="Selecciona Hora" />
                    </SelectTrigger>
                    <SelectContent>
                      {salonSettings.time_slots.map(slot => (
                        <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Services Checklist */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-700 block">Servicios a Incluir</Label>
                <div className="border rounded-xl p-4 max-h-[160px] overflow-y-auto space-y-2">
                  {services.map(s => {
                    const isChecked = editingBooking.selectedServices.includes(s.id);
                    return (
                      <label key={s.id} className="flex items-center gap-3 text-xs font-medium text-gray-700 cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setEditingBooking({
                                ...editingBooking,
                                selectedServices: editingBooking.selectedServices.filter(id => id !== s.id)
                              });
                            } else {
                              setEditingBooking({
                                ...editingBooking,
                                selectedServices: [...editingBooking.selectedServices, s.id]
                              });
                            }
                          }}
                          className="rounded border-gray-300 text-pink-600 focus:ring-pink-500 h-4 w-4"
                        />
                        <span>{s.name} - <strong>{s.price}</strong> ({s.duration})</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-gray-700">Notas / Comentarios Internos</Label>
                <textarea 
                  className="border border-pink-100 rounded-xl p-3 w-full text-xs min-h-[60px] focus:outline-none focus:ring-2 focus:ring-pink-400"
                  placeholder="Detalles particulares de la manicura..."
                  value={editingBooking.notes || ''}
                  onChange={(e) => setEditingBooking({...editingBooking, notes: e.target.value})}
                />
              </div>

              <DialogFooter className="gap-2 pt-2">
                <DialogClose asChild>
                  <Button variant="outline" className="rounded-xl border-pink-100">Cancelar</Button>
                </DialogClose>
                <Button 
                  onClick={handleUpdateBooking} 
                  disabled={bulkLoading}
                  className="bg-pink-500 hover:bg-pink-600 text-white rounded-xl"
                >
                  {bulkLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                  Guardar Cambios
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL: CREATE OR EDIT SERVICE */}
      <Dialog open={showServiceModal} onOpenChange={setShowServiceModal}>
        <DialogContent className="max-w-md rounded-3xl border-pink-100 p-6 md:p-8">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">
              {serviceForm.id ? 'Editar Servicio' : 'Añadir Nuevo Servicio'}
            </DialogTitle>
            <DialogDescription className="text-xs">Rellena los detalles para el catálogo de Supabase.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-gray-700">Nombre del Tratamiento</Label>
              <Input 
                placeholder="Ej: Manicura Rusa"
                value={serviceForm.name}
                onChange={(e) => setServiceForm({...serviceForm, name: e.target.value})}
                className="border-pink-100 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-gray-700">Duración</Label>
                <Input 
                  placeholder="Ej: 50 min"
                  value={serviceForm.duration}
                  onChange={(e) => setServiceForm({...serviceForm, duration: e.target.value})}
                  className="border-pink-100 rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-gray-700">Precio</Label>
                <Input 
                  placeholder="Ej: 21,90€"
                  value={serviceForm.price}
                  onChange={(e) => setServiceForm({...serviceForm, price: e.target.value})}
                  className="border-pink-100 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-gray-700">Categoría</Label>
              <Select value={serviceForm.category} onValueChange={(val) => setServiceForm({...serviceForm, category: val})}>
                <SelectTrigger className="border-pink-100 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nails">Uñas</SelectItem>
                  <SelectItem value="beauty">Belleza</SelectItem>
                  <SelectItem value="paquetes">Paquetes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline" className="rounded-xl border-pink-100">Cancelar</Button>
            </DialogClose>
            <Button 
              onClick={handleSaveService} 
              disabled={bulkLoading}
              className="bg-pink-500 hover:bg-pink-600 text-white rounded-xl"
            >
              {bulkLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              Guardar Tratamiento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: WHATSAPP TEMPLATE SENDER */}
      <Dialog open={waModalOpen} onOpenChange={setWaModalOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border-pink-100 p-6 md:p-8">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Phone className="h-5 w-5 text-green-500" />
              Enviar Recordatorio por WhatsApp
            </DialogTitle>
            <DialogDescription className="text-xs">
              Elige una de las plantillas predefinidas y personaliza el texto antes de enviar.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            {/* Info Summary */}
            {selectedWaBooking && (
              <div className="bg-pink-50/30 border border-pink-100/40 rounded-2xl p-4 text-xs space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-gray-400 block font-semibold">Cliente</span>
                    <span className="text-gray-800 font-extrabold text-sm">{selectedWaBooking.client_name}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block font-semibold">Teléfono</span>
                    <span className="text-gray-800 font-bold">{selectedWaBooking.client_phone}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block font-semibold">Sede</span>
                    <span className="text-gray-800 font-bold">{selectedWaBooking.locations?.name || 'Sede'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block font-semibold">Fecha y Hora</span>
                    <span className="text-gray-800 font-bold">{selectedWaBooking.booking_date} a las {selectedWaBooking.booking_time}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Template Selector Tabs */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-gray-700">Seleccionar Plantilla</Label>
              <div className="grid grid-cols-3 gap-2 bg-gray-50 p-1 rounded-xl border border-gray-100">
                <button
                  type="button"
                  onClick={() => handleSwitchWaTemplate('standard')}
                  className={`py-2 text-xs font-extrabold rounded-lg transition-all ${
                    selectedWaTemplate === 'standard'
                      ? 'bg-pink-500 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Estándar
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchWaTemplate('modified')}
                  className={`py-2 text-xs font-extrabold rounded-lg transition-all ${
                    selectedWaTemplate === 'modified'
                      ? 'bg-pink-500 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Modificación
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchWaTemplate('thanks')}
                  className={`py-2 text-xs font-extrabold rounded-lg transition-all ${
                    selectedWaTemplate === 'thanks'
                      ? 'bg-pink-500 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Agradecimiento
                </button>
              </div>
            </div>

            {/* Textarea for custom message */}
            <div className="space-y-1">
              <Label className="text-xs font-bold text-gray-700">Contenido del Mensaje</Label>
              <textarea
                rows={5}
                className="w-full border border-pink-100 rounded-xl p-3 text-xs focus:ring-2 focus:ring-pink-400 focus:border-pink-400 outline-none resize-none font-medium text-gray-700 bg-gray-50/20"
                placeholder="Escribe tu mensaje personalizado aquí..."
                value={customWaMessage}
                onChange={(e) => setCustomWaMessage(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline" className="rounded-xl border-pink-100 text-xs">Cancelar</Button>
            </DialogClose>
            <Button 
              onClick={handleSendWhatsApp}
              className="bg-green-500 hover:bg-green-600 text-white rounded-xl text-xs font-extrabold"
            >
              <Phone className="h-4 w-4 mr-2" /> Enviar por WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminServices;
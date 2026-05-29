import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  CalendarDays,
  CalendarRange,
  Calendar as CalendarIcon,
  List,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Lock,
  Unlock,
  Plus,
  Search,
  Loader2,
  Phone,
  Mail,
  MessageCircle,
  Clock3,
  AlertCircle,
  X,
  Sliders,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { CONFIG } from '@/constants';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const VIEW_MODES = {
  day: 'day',
  week: 'week',
  month: 'month',
  agenda: 'agenda'
};

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'confirmed', label: 'Confirmada' },
  { value: 'rescheduled', label: 'Reprogramada' },
  { value: 'cancelled', label: 'Cancelada' },
  { value: 'completed', label: 'Completada' },
  { value: 'no_show', label: 'No asistió' }
];

const SOURCE_OPTIONS = [
  { value: 'online', label: 'Online (web)' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'presencial', label: 'Presencial' },
  { value: 'admin', label: 'Admin' }
];

const VIEW_LABELS = {
  [VIEW_MODES.day]: 'Día',
  [VIEW_MODES.week]: 'Semana',
  [VIEW_MODES.month]: 'Mes',
  [VIEW_MODES.agenda]: 'Agenda'
};

const DEFAULT_BOOKING_META = {
  status: 'pending',
  assigned_to: '',
  duration_minutes: 30,
  appointment_type: '',
  internal_notes: '',
  source: 'online'
};

const STATUS_STYLES = {
  confirmed: 'bg-emerald-500/10 text-emerald-600 border-emerald-200/50',
  rescheduled: 'bg-amber-500/10 text-amber-600 border-amber-200/50',
  cancelled: 'bg-rose-500/10 text-rose-600 border-rose-200/50',
  completed: 'bg-blue-500/10 text-blue-600 border-blue-200/50',
  no_show: 'bg-zinc-500/10 text-zinc-600 border-zinc-200/50',
  pending: 'bg-pink-500/10 text-pink-600 border-pink-200/50'
};

const SOURCE_LABELS = {
  web: 'Web',
  phone: 'Teléfono',
  whatsapp: 'WhatsApp',
  admin: 'Admin'
};

function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function pad2(value) {
  return String(value).padStart(2, '0');
}

function timeToMinutes(time) {
  const [h, m] = (time || '00:00').split(':').map(Number);
  return (h * 60) + m;
}

function minutesToTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${pad2(hours)}:${pad2(minutes)}`;
}

function addMinutes(time, minutes) {
  return minutesToTime(timeToMinutes(time) + minutes);
}

function formatHumanDate(dateInput, options = { weekday: 'short', day: 'numeric', month: 'short' }) {
  const date = typeof dateInput === 'string' ? new Date(`${dateInput}T00:00:00`) : dateInput;
  return date.toLocaleDateString('es-ES', options);
}

function getWeekStart(date) {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function getRangeForView(viewMode, anchorDate) {
  const date = new Date(anchorDate);

  if (viewMode === VIEW_MODES.day) {
    return { start: toISODate(date), end: toISODate(date) };
  }

  if (viewMode === VIEW_MODES.week) {
    const weekStart = getWeekStart(date);
    const weekEnd = addDays(weekStart, 6);
    return { start: toISODate(weekStart), end: toISODate(weekEnd) };
  }

  if (viewMode === VIEW_MODES.month) {
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return { start: toISODate(monthStart), end: toISODate(monthEnd) };
  }

  const start = new Date(date);
  const end = addDays(start, 30);
  return { start: toISODate(start), end: toISODate(end) };
}

function buildMonthGrid(anchorDate) {
  const firstDay = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1);
  const gridStart = getWeekStart(firstDay);
  return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
}

const CalendarPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();

  const [viewMode, setViewMode] = useState(VIEW_MODES.week);
  const [currentDate, setCurrentDate] = useState(new Date());

  const [locations, setLocations] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [bookingServicesMap, setBookingServicesMap] = useState({});
  const [bookingMetaMap, setBookingMetaMap] = useState({});
  const [timeBlocks, setTimeBlocks] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);

  const [loading, setLoading] = useState(false);
  const [realtimeConnected, setRealtimeConnected] = useState(false);

  const [metaTableAvailable, setMetaTableAvailable] = useState(true);
  const [blocksTableAvailable, setBlocksTableAvailable] = useState(true);
  const [staffTableAvailable, setStaffTableAvailable] = useState(true);

  const [filterSearch, setFilterSearch] = useState('');
  const [filterLocation, setFilterLocation] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterResponsible, setFilterResponsible] = useState('all');

  const [draggedBookingId, setDraggedBookingId] = useState(null);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);

  const [detailForm, setDetailForm] = useState({
    id: null,
    location_id: '',
    booking_date: '',
    booking_time: '',
    client_name: '',
    client_phone: '',
    client_email: '',
    notes: '',
    ...DEFAULT_BOOKING_META
  });

  const [isCreatingBooking, setIsCreatingBooking] = useState(false);
  const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < 768 : false));

  // UX Form states
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Horarios de Apertura states
  const [isHoursDialogOpen, setIsHoursDialogOpen] = useState(false);
  const [businessHours, setBusinessHours] = useState({
    monday: { open: '10:00', close: '20:00', closed: false },
    tuesday: { open: '10:00', close: '20:00', closed: false },
    wednesday: { open: '10:00', close: '20:00', closed: false },
    thursday: { open: '10:00', close: '20:00', closed: false },
    friday: { open: '10:00', close: '20:00', closed: false },
    saturday: { open: '10:00', close: '17:00', closed: false },
    sunday: { open: '10:00', close: '20:00', closed: true }
  });

  // WhatsApp Custom templates state
  const [waModalOpen, setWaModalOpen] = useState(false);
  const [selectedWaBooking, setSelectedWaBooking] = useState(null);
  const [selectedWaTemplate, setSelectedWaTemplate] = useState('standard');
  const [customWaMessage, setCustomWaMessage] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const onResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (isMobile && viewMode === VIEW_MODES.week) {
      setViewMode(VIEW_MODES.agenda);
    }
  }, [isMobile, viewMode]);

  const dateRange = useMemo(() => getRangeForView(viewMode, currentDate), [viewMode, currentDate]);

  const bookingMetaById = useCallback((bookingId) => {
    return bookingMetaMap[bookingId] || DEFAULT_BOOKING_META;
  }, [bookingMetaMap]);

  const locationNameById = useMemo(() => {
    return locations.reduce((acc, location) => {
      acc[location.id] = location.name;
      return acc;
    }, {});
  }, [locations]);

  const enrichedBookings = useMemo(() => {
    return bookings.map((booking) => ({
      ...booking,
      services: bookingServicesMap[booking.id] || [],
      meta: bookingMetaById(booking.id)
    }));
  }, [bookings, bookingServicesMap, bookingMetaById]);

  const filteredBookings = useMemo(() => {
    const query = filterSearch.trim().toLowerCase();

    return enrichedBookings.filter((booking) => {
      const locationMatch = filterLocation === 'all' || String(booking.location_id) === filterLocation;
      const statusMatch = filterStatus === 'all' || booking.meta.status === filterStatus;
      const responsibleMatch = filterResponsible === 'all' || (booking.meta.assigned_to || '') === filterResponsible;

      if (!locationMatch || !statusMatch || !responsibleMatch) return false;

      if (!query) return true;

      const servicesText = booking.services.map((service) => service.name).join(' ').toLowerCase();
      const haystack = [
        booking.client_name,
        booking.client_phone,
        booking.client_email,
        booking.notes,
        booking.meta.internal_notes,
        booking.meta.assigned_to,
        servicesText
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [enrichedBookings, filterLocation, filterResponsible, filterSearch, filterStatus]);

  const bookingsByDay = useMemo(() => {
    return filteredBookings.reduce((acc, booking) => {
      if (!acc[booking.booking_date]) acc[booking.booking_date] = [];
      acc[booking.booking_date].push(booking);
      return acc;
    }, {});
  }, [filteredBookings]);

  const blocksByDay = useMemo(() => {
    return timeBlocks.reduce((acc, block) => {
      if (!acc[block.block_date]) acc[block.block_date] = [];
      acc[block.block_date].push(block);
      return acc;
    }, {});
  }, [timeBlocks]);

  const timeSlots = useMemo(() => {
    const slotSet = new Set(CONFIG.BOOKING.TIME_SLOTS);

    filteredBookings.forEach((booking) => slotSet.add(booking.booking_time?.slice(0, 5)));
    timeBlocks.forEach((block) => slotSet.add(block.start_time?.slice(0, 5)));

    return Array.from(slotSet).sort((a, b) => timeToMinutes(a) - timeToMinutes(b));
  }, [filteredBookings, timeBlocks]);

  const responsibleOptions = useMemo(() => {
    const fromMeta = filteredBookings
      .map((booking) => booking.meta.assigned_to)
      .filter(Boolean);

    const fromTable = staffMembers.map((member) => member.full_name).filter(Boolean);
    return Array.from(new Set([...fromMeta, ...fromTable])).sort((a, b) => a.localeCompare(b));
  }, [filteredBookings, staffMembers]);

  const activeBooking = useMemo(() => {
    if (!selectedBookingId) return null;
    return filteredBookings.find((booking) => booking.id === selectedBookingId) ||
      enrichedBookings.find((booking) => booking.id === selectedBookingId) ||
      null;
  }, [selectedBookingId, filteredBookings, enrichedBookings]);

  const weekDays = useMemo(() => {
    const start = getWeekStart(currentDate);
    return Array.from({ length: 7 }, (_, index) => addDays(start, index));
  }, [currentDate]);

  const monthGridDays = useMemo(() => buildMonthGrid(currentDate), [currentDate]);

  const fetchLocations = useCallback(async () => {
    const { data, error } = await supabase
      .from('locations')
      .select('id,name,address')
      .order('id', { ascending: true });

    if (error) throw error;
    setLocations(data || []);
  }, []);

  const fetchStaffMembers = useCallback(async () => {
    if (!staffTableAvailable) return;

    const { data, error } = await supabase
      .from('admin_staff')
      .select('id,full_name,is_active')
      .eq('is_active', true)
      .order('full_name', { ascending: true });

    if (error) {
      if (error.message?.toLowerCase().includes('admin_staff')) {
        setStaffTableAvailable(false);
        return;
      }
      throw error;
    }

    setStaffMembers(data || []);
  }, [staffTableAvailable]);

  const fetchCalendarData = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('id,location_id,booking_date,booking_time,client_name,client_phone,client_email,notes,notes_admin,status,assigned_to,duration_minutes,appointment_type,origin,created_at')
        .gte('booking_date', dateRange.start)
        .lte('booking_date', dateRange.end)
        .order('booking_date', { ascending: true })
        .order('booking_time', { ascending: true });

      if (bookingsError) throw bookingsError;

      const safeBookings = bookingsData || [];
      setBookings(safeBookings);

      // Booking metadata now lives directly on the bookings row (single source of truth).
      const metaMap = safeBookings.reduce((acc, row) => {
        acc[row.id] = {
          status: row.status || DEFAULT_BOOKING_META.status,
          assigned_to: row.assigned_to || '',
          duration_minutes: row.duration_minutes || DEFAULT_BOOKING_META.duration_minutes,
          appointment_type: row.appointment_type || '',
          internal_notes: row.notes_admin || '',
          source: row.origin || DEFAULT_BOOKING_META.source
        };
        return acc;
      }, {});
      setBookingMetaMap(metaMap);

      const bookingIds = safeBookings.map((booking) => booking.id);

      if (bookingIds.length > 0) {
        const { data: servicesData, error: servicesError } = await supabase
          .from('booking_services')
          .select('booking_id,service_id,services(id,name,price,duration_minutes)')
          .in('booking_id', bookingIds);

        if (servicesError) throw servicesError;

        const servicesMap = (servicesData || []).reduce((acc, row) => {
          if (!acc[row.booking_id]) acc[row.booking_id] = [];
          if (row.services) acc[row.booking_id].push(row.services);
          return acc;
        }, {});

        setBookingServicesMap(servicesMap);
      } else {
        setBookingServicesMap({});
      }

      if (blocksTableAvailable) {
        const { data: blocksData, error: blocksError } = await supabase
          .from('schedule_blocks')
          .select('id,location_id,block_date,start_time,end_time,reason,created_at')
          .gte('block_date', dateRange.start)
          .lte('block_date', dateRange.end)
          .order('block_date', { ascending: true })
          .order('start_time', { ascending: true });

        if (blocksError) {
          if (blocksError.message?.toLowerCase().includes('schedule_blocks')) {
            setBlocksTableAvailable(false);
            setTimeBlocks([]);
          } else {
            throw blocksError;
          }
        } else {
          setTimeBlocks(blocksData || []);
        }
      }
    } catch (error) {
      console.error('Error loading admin calendar:', error);
      toast({
        variant: 'destructive',
        title: 'Error al cargar calendario',
        description: error.message || 'No se pudieron cargar las citas'
      });
    } finally {
      setLoading(false);
    }
  }, [blocksTableAvailable, dateRange.end, dateRange.start, metaTableAvailable, user, toast]);

  useEffect(() => {
    if (!user) return;

    fetchLocations();
    fetchStaffMembers();

    // Fetch opening hours configuration
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
  }, [fetchLocations, fetchStaffMembers, user]);

  useEffect(() => {
    fetchCalendarData();
  }, [fetchCalendarData]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('admin-calendar-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => fetchCalendarData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'booking_services' }, () => fetchCalendarData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'schedule_blocks' }, () => fetchCalendarData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, () => {
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
      })
      .subscribe((status) => {
        setRealtimeConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
      setRealtimeConnected(false);
    };
  }, [fetchCalendarData, user]);

  const saveBusinessHours = useCallback(async () => {
    try {
      const { error } = await supabase
        .from('settings')
        .upsert([{
          key: 'business_hours',
          value: businessHours,
          updated_at: new Date().toISOString()
        }], { onConflict: 'key' });

      if (error) throw error;

      toast({ title: 'Horarios guardados', description: 'Los horarios del salón se actualizaron correctamente.' });
      setIsHoursDialogOpen(false);
    } catch (error) {
      console.error('Error saving business hours:', error);
      toast({
        variant: 'destructive',
        title: 'Error al guardar horarios',
        description: error.message
      });
    }
  }, [businessHours, toast]);

  const openBookingDetail = useCallback((booking) => {
    const meta = bookingMetaById(booking.id);
    setIsCreatingBooking(false);
    setShowAdvanced(false);
    setSelectedBookingId(booking.id);
    setIsDetailDialogOpen(true);
    setDetailForm({
      id: booking.id,
      location_id: String(booking.location_id),
      booking_date: booking.booking_date,
      booking_time: booking.booking_time?.slice(0, 5),
      client_name: booking.client_name || '',
      client_phone: booking.client_phone || '',
      client_email: booking.client_email || '',
      notes: booking.notes || '',
      status: meta.status || DEFAULT_BOOKING_META.status,
      assigned_to: meta.assigned_to || '',
      duration_minutes: meta.duration_minutes || DEFAULT_BOOKING_META.duration_minutes,
      appointment_type: meta.appointment_type || '',
      internal_notes: meta.internal_notes || '',
      source: meta.source || DEFAULT_BOOKING_META.source
    });
  }, [bookingMetaById]);

  useEffect(() => {
    if (!activeBooking || isCreatingBooking) return;

    const meta = bookingMetaById(activeBooking.id);
    setDetailForm((prev) => ({
      ...prev,
      id: activeBooking.id,
      location_id: String(activeBooking.location_id),
      booking_date: activeBooking.booking_date,
      booking_time: activeBooking.booking_time?.slice(0, 5),
      client_name: activeBooking.client_name || '',
      client_phone: activeBooking.client_phone || '',
      client_email: activeBooking.client_email || '',
      notes: activeBooking.notes || '',
      status: meta.status || DEFAULT_BOOKING_META.status,
      assigned_to: meta.assigned_to || '',
      duration_minutes: meta.duration_minutes || DEFAULT_BOOKING_META.duration_minutes,
      appointment_type: meta.appointment_type || '',
      internal_notes: meta.internal_notes || '',
      source: meta.source || DEFAULT_BOOKING_META.source
    }));
  }, [activeBooking, bookingMetaById, isCreatingBooking]);

  const resetDetailDialog = useCallback(() => {
    setSelectedBookingId(null);
    setIsCreatingBooking(false);
    setShowAdvanced(false);
    setIsDetailDialogOpen(false);
    setDetailForm({
      id: null,
      location_id: locations[0] ? String(locations[0].id) : '',
      booking_date: toISODate(new Date()),
      booking_time: CONFIG.BOOKING.TIME_SLOTS[0],
      client_name: '',
      client_phone: '',
      client_email: '',
      notes: '',
      ...DEFAULT_BOOKING_META
    });
  }, [locations]);

  const saveBookingDetails = useCallback(async () => {
    if (!detailForm.location_id || !detailForm.booking_date || !detailForm.booking_time || !detailForm.client_name) {
      toast({
        variant: 'destructive',
        title: 'Campos incompletos',
        description: 'Completa sede, fecha, hora y nombre del cliente'
      });
      return;
    }

    try {
      const bookingRow = {
        location_id: detailForm.location_id,
        booking_date: detailForm.booking_date,
        booking_time: detailForm.booking_time + ':00',
        client_name: detailForm.client_name,
        client_phone: detailForm.client_phone,
        client_email: detailForm.client_email || null,
        notes: detailForm.notes || null,
        notes_admin: detailForm.internal_notes || null,
        status: detailForm.status,
        assigned_to: detailForm.assigned_to || null,
        duration_minutes: Number(detailForm.duration_minutes) || 30,
        appointment_type: detailForm.appointment_type || null,
        origin: detailForm.source || 'admin'
      };

      if (isCreatingBooking) {
        const { error: createError } = await supabase
          .from('bookings')
          .insert([bookingRow]);

        if (createError) throw createError;

        toast({ title: 'Cita creada', description: 'La cita fue creada correctamente' });
      } else if (detailForm.id) {
        const { error: bookingError } = await supabase
          .from('bookings')
          .update(bookingRow)
          .eq('id', detailForm.id);

        if (bookingError) throw bookingError;

        toast({ title: 'Cita actualizada', description: 'Los cambios se guardaron correctamente' });
      }

      resetDetailDialog();
      fetchCalendarData();
    } catch (error) {
      console.error('Error saving booking:', error);
      toast({
        variant: 'destructive',
        title: 'No se pudo guardar la cita',
        description: error.message || 'Error inesperado'
      });
    }
  }, [detailForm, fetchCalendarData, isCreatingBooking, metaTableAvailable, resetDetailDialog, toast]);

  const updateBookingStatus = useCallback(async (bookingId, status) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', bookingId);
      if (error) throw error;

      fetchCalendarData();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'No se pudo cambiar el estado',
        description: error.message
      });
    }
  }, [fetchCalendarData, toast]);

  const moveBooking = useCallback(async (bookingId, bookingDate, bookingTime) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ booking_date: bookingDate, booking_time: bookingTime + ':00' })
        .eq('id', bookingId);

      if (error) throw error;

      await updateBookingStatus(bookingId, 'rescheduled');
      toast({ title: 'Cita movida', description: `Nueva hora: ${bookingDate} a las ${bookingTime}` });
      fetchCalendarData();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'No se pudo mover la cita',
        description: error.message
      });
    }
  }, [fetchCalendarData, toast, updateBookingStatus]);

  const createTimeBlock = useCallback(async (date, time) => {
    if (!blocksTableAvailable) {
      toast({
        variant: 'destructive',
        title: 'Migración pendiente',
        description: 'La tabla schedule_blocks no está disponible.'
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('schedule_blocks')
        .insert([{
          block_date: date,
          start_time: time + ':00',
          end_time: addMinutes(time, 30) + ':00',
          location_id: filterLocation === 'all' ? null : filterLocation,
          reason: 'Bloqueo manual desde calendario'
        }]);

      if (error) throw error;

      toast({ title: 'Horario bloqueado', description: `${date} ${time}` });
      fetchCalendarData();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'No se pudo bloquear la hora',
        description: error.message
      });
    }
  }, [blocksTableAvailable, fetchCalendarData, filterLocation, toast]);

  const removeTimeBlock = useCallback(async (blockId) => {
    if (!blockId) return;

    try {
      const { error } = await supabase
        .from('schedule_blocks')
        .delete()
        .eq('id', blockId);

      if (error) throw error;

      toast({ title: 'Bloqueo eliminado', description: 'El horario vuelve a estar disponible' });
      fetchCalendarData();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'No se pudo eliminar el bloqueo',
        description: error.message
      });
    }
  }, [fetchCalendarData, toast]);

  const getHeaderLabel = useMemo(() => {
    if (viewMode === VIEW_MODES.day) return formatHumanDate(currentDate, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    if (viewMode === VIEW_MODES.week) {
      const start = weekDays[0];
      const end = weekDays[6];
      return `${formatHumanDate(start, { day: 'numeric', month: 'short' })} - ${formatHumanDate(end, { day: 'numeric', month: 'short', year: 'numeric' })}`;
    }
    if (viewMode === VIEW_MODES.month) return formatHumanDate(currentDate, { month: 'long', year: 'numeric' });
    return `Próximos 30 días · desde ${formatHumanDate(currentDate, { day: 'numeric', month: 'short' })}`;
  }, [currentDate, viewMode, weekDays]);

  const moveCalendarCursor = useCallback((direction) => {
    const step = direction === 'prev' ? -1 : 1;
    const nextDate = new Date(currentDate);

    if (viewMode === VIEW_MODES.day) {
      nextDate.setDate(nextDate.getDate() + step);
    } else if (viewMode === VIEW_MODES.week) {
      nextDate.setDate(nextDate.getDate() + (7 * step));
    } else if (viewMode === VIEW_MODES.month) {
      nextDate.setMonth(nextDate.getMonth() + step);
    } else {
      nextDate.setDate(nextDate.getDate() + (30 * step));
    }

    setCurrentDate(nextDate);
  }, [currentDate, viewMode]);

  const getBookingsForSlot = useCallback((date, time) => {
    return (bookingsByDay[date] || []).filter((booking) => booking.booking_time?.slice(0, 5) === time);
  }, [bookingsByDay]);

  const getBlocksForSlot = useCallback((date, time) => {
    return (blocksByDay[date] || []).filter((block) => block.start_time?.slice(0, 5) === time);
  }, [blocksByDay]);

  const handleDropOnSlot = useCallback(async (date, time) => {
    if (!draggedBookingId) return;

    const booking = enrichedBookings.find((item) => item.id === draggedBookingId);
    if (!booking) return;

    setDraggedBookingId(null);

    if (booking.booking_date === date && booking.booking_time?.slice(0, 5) === time) return;

    await moveBooking(draggedBookingId, date, time);
  }, [draggedBookingId, enrichedBookings, moveBooking]);

  const handleDropOnMonthDay = useCallback(async (date) => {
    if (!draggedBookingId) return;

    const booking = enrichedBookings.find((item) => item.id === draggedBookingId);
    if (!booking) return;

    setDraggedBookingId(null);

    if (booking.booking_date === date) return;

    await moveBooking(draggedBookingId, date, booking.booking_time?.slice(0, 5));
  }, [draggedBookingId, enrichedBookings, moveBooking]);

  const beginCreateBooking = useCallback((date = toISODate(currentDate), time = CONFIG.BOOKING.TIME_SLOTS[0]) => {
    setIsCreatingBooking(true);
    setSelectedBookingId(null);
    setShowAdvanced(false);
    setIsDetailDialogOpen(true);
    setDetailForm({
      id: null,
      location_id: locations[0] ? String(locations[0].id) : '',
      booking_date: date,
      booking_time: time,
      client_name: '',
      client_phone: '',
      client_email: '',
      notes: '',
      status: 'pending',
      assigned_to: '',
      duration_minutes: 30,
      appointment_type: '',
      internal_notes: '',
      source: 'admin'
    });
  }, [currentDate, locations]);

  // WhatsApp recordatorios template builder
  const getWaTemplateText = (templateType, booking) => {
    if (!booking) return '';
    const dateFormatted = new Date(booking.booking_date + 'T00:00:00').toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
    const locationName = locationNameById[booking.location_id] || 'Suly Pretty Nails';
    const servicesName = booking.services?.map(s => s.name).join(', ') || 'nuestros servicios';

    if (templateType === 'standard') {
      return `Hola ${booking.client_name}, te recordamos tu cita en Suly Pretty Nails el día ${dateFormatted} a las ${booking.booking_time?.slice(0, 5)} en nuestra sede de ${locationName}. ¡Te esperamos!`;
    } else if (templateType === 'modified') {
      return `Hola ${booking.client_name}, tu cita en Suly Pretty Nails ha sido agendada para el día ${dateFormatted} a las ${booking.booking_time?.slice(0, 5)} en nuestra sede de ${locationName}. Si necesitas cambiarla, avísanos. ¡Gracias!`;
    } else if (templateType === 'thanks') {
      return `¡Hola ${booking.client_name}! Gracias por elegir Suly Pretty Nails. Esperamos que te haya encantado el resultado de tus servicios (${servicesName}). ¡Que tengas un gran día!`;
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

  const renderBookingCard = (booking) => {
    const bookingStatus = booking.meta.status || 'pending';
    const statusLabel = STATUS_OPTIONS.find((option) => option.value === bookingStatus)?.label || 'Pendiente';
    const servicesText = booking.services.length > 0
      ? booking.services.map((service) => service.name).join(', ')
      : 'Sin servicios';

    return (
      <div
        key={booking.id}
        draggable
        onDragStart={() => setDraggedBookingId(booking.id)}
        onDragEnd={() => setDraggedBookingId(null)}
        onClick={(e) => {
          e.stopPropagation();
          openBookingDetail(booking);
        }}
        className={`rounded-xl border p-2.5 cursor-grab active:cursor-grabbing hover:shadow-md transition-all ${STATUS_STYLES[bookingStatus] || STATUS_STYLES.pending} border-l-4 border-l-current flex items-center justify-between gap-3`}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-xs font-bold truncate max-w-[140px]">{booking.client_name}</p>
            <span className="text-[8px] font-extrabold px-1.5 py-0.2 rounded bg-white/60 border border-current/25 tracking-wide uppercase shrink-0">
              {statusLabel}
            </span>
          </div>
          <p className="text-[10px] opacity-90 mt-1 font-semibold truncate">
            {booking.booking_time?.slice(0, 5)} · {locationNameById[booking.location_id] || 'Sede'}
          </p>
          <p className="text-[10px] opacity-80 mt-0.5 truncate italic">{servicesText}</p>
          {booking.meta.assigned_to ? (
            <p className="text-[9px] mt-1 font-bold text-gray-700 bg-white/50 inline-block px-1.5 py-0.5 rounded border border-gray-300/40">
              👤 {booking.meta.assigned_to}
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-0.5 shrink-0 bg-white/50 p-0.5 rounded-lg border border-current/10" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="h-6 w-6 p-0 flex items-center justify-center text-green-600 hover:bg-green-100/60 rounded transition-colors"
            onClick={() => handleOpenWaModal(booking)}
            title="Recordatorio WhatsApp"
          >
            <MessageCircle className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className="h-6 w-6 p-0 flex items-center justify-center text-admin-muted hover:text-admin-text hover:bg-gray-100 rounded transition-colors"
            onClick={() => openBookingDetail(booking)}
            title="Detalles / Editar"
          >
            <Search className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className="h-6 w-6 p-0 flex items-center justify-center text-rose-600 hover:bg-rose-50 rounded transition-colors"
            onClick={() => {
              if (confirm(`¿Seguro que deseas cancelar la cita de ${booking.client_name}?`)) {
                updateBookingStatus(booking.id, 'cancelled');
              }
            }}
            title="Cancelar cita"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  };

  const renderTimeSlot = (date, time) => {
    const bookingsInSlot = getBookingsForSlot(date, time);
    const blocksInSlot = getBlocksForSlot(date, time);

    return (
      <div
        key={`${date}-${time}`}
        onDragOver={(event) => event.preventDefault()}
        onDrop={() => handleDropOnSlot(date, time)}
        className="grid grid-cols-[60px_1fr] gap-3 border-t border-admin-border/50 py-3 first:border-t-0 hover:bg-admin-surface/10 transition-colors px-1"
      >
        <div className="text-xs font-bold text-admin-muted pt-1.5 text-right pr-2">{time}</div>
        <div className="space-y-2 min-h-[44px]">
          {bookingsInSlot.map((booking) => renderBookingCard(booking))}

          {blocksInSlot.map((block) => (
            <div key={block.id} className="rounded-xl border border-zinc-200 bg-[linear-gradient(45deg,#f4f4f5_25%,transparent_25%,transparent_50%,#f4f4f5_50%,#f4f4f5_75%,transparent_75%,transparent)] bg-[length:15px_15px] bg-zinc-100 p-2.5 text-xs text-zinc-700 shadow-sm border-l-4 border-l-zinc-500 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="font-bold text-zinc-800 flex items-center gap-1.5">
                  🚫 Horario Bloqueado
                </span>
                <p className="text-[10px] text-zinc-500 mt-0.5">{block.start_time?.slice(0, 5)} - {block.end_time?.slice(0, 5)} · {block.reason || 'Bloqueo manual'}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2.5 text-[10px] font-bold text-zinc-700 border-zinc-300 hover:bg-zinc-200/80 bg-white rounded-lg shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTimeBlock(block.id);
                }}
              >
                <Unlock className="h-3 w-3 mr-1" /> Habilitar
              </Button>
            </div>
          ))}

          {bookingsInSlot.length === 0 && blocksInSlot.length === 0 ? (
            <div className="flex items-center gap-2 opacity-40 hover:opacity-100 transition-opacity">
              <button
                type="button"
                className="h-7 px-3 text-[10px] text-brand-rose border border-brand-rose/30 hover:border-brand-rose rounded-lg transition-all flex items-center gap-1.5 bg-white hover:bg-brand-rose/5 font-semibold cursor-pointer"
                onClick={() => beginCreateBooking(date, time)}
              >
                <Plus className="h-3 w-3" /> Reservar
              </button>
              <button
                type="button"
                className="h-7 px-3 text-[10px] text-zinc-500 border border-zinc-300 hover:border-zinc-500 rounded-lg transition-all flex items-center gap-1.5 bg-white hover:bg-zinc-50 font-semibold cursor-pointer"
                onClick={() => createTimeBlock(date, time)}
              >
                <Lock className="h-3 w-3" /> Bloquear
              </button>
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const dayISO = toISODate(currentDate);

    return (
      <div className="rounded-2xl border border-admin-border bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-bold capitalize text-admin-text">
            {formatHumanDate(currentDate, { weekday: 'long', day: 'numeric', month: 'long' })}
          </h3>
          <Button variant="outline" size="sm" onClick={() => beginCreateBooking(dayISO)} className="border-brand-rose text-brand-rose hover:bg-brand-rose/5">
            <Plus className="h-4 w-4 mr-1" /> Nueva cita
          </Button>
        </div>

        <div className="max-h-[65vh] overflow-y-auto pr-2 divide-y divide-admin-border/30">
          {timeSlots.map((time) => renderTimeSlot(dayISO, time))}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
        {weekDays.map((dayDate) => {
          const dayISO = toISODate(dayDate);
          const isTodayDate = dayISO === toISODate(new Date());

          return (
            <div key={dayISO} className={`rounded-2xl border ${isTodayDate ? 'border-brand-rose ring-1 ring-brand-rose/10 bg-brand-rose-50/5' : 'border-admin-border bg-white'} p-3 min-h-[480px] flex flex-col shadow-sm`}>
              <div className="pb-3 border-b border-admin-border/50 mb-3 shrink-0">
                <button
                  className="text-left w-full hover:opacity-80 transition-opacity"
                  onClick={() => {
                    setCurrentDate(dayDate);
                    setViewMode(VIEW_MODES.day);
                  }}
                >
                  <p className="text-[10px] text-admin-muted uppercase font-bold tracking-wider">{formatHumanDate(dayDate, { weekday: 'short' })}</p>
                  <p className="font-bold text-sm text-admin-text mt-0.5">{formatHumanDate(dayDate, { day: 'numeric', month: 'short' })}</p>
                </button>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto max-h-[55vh] pr-1">
                {timeSlots.map((time) => {
                  const bookingsInSlot = getBookingsForSlot(dayISO, time);
                  const blocksInSlot = getBlocksForSlot(dayISO, time);

                  return (
                    <div key={`${dayISO}-${time}`} className="border-t border-admin-border/20 pt-2 first:border-t-0">
                      <div className="text-[9px] font-bold text-admin-muted mb-1">{time}</div>
                      <div
                        className="min-h-[40px] space-y-1.5 rounded-lg border border-dashed border-transparent hover:border-admin-border/40 hover:bg-admin-surface/5 transition-colors p-1"
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={() => handleDropOnSlot(dayISO, time)}
                        onClick={() => {
                          if (bookingsInSlot.length === 0 && blocksInSlot.length === 0) {
                            beginCreateBooking(dayISO, time);
                          }
                        }}
                      >
                        {bookingsInSlot.map((booking) => renderBookingCard(booking))}
                        {blocksInSlot.map((block) => (
                          <div key={block.id} className="rounded-lg border border-zinc-200 bg-zinc-50 p-1.5 text-[9px] shadow-sm flex items-center justify-between gap-1">
                            <span className="truncate font-medium">{block.reason || 'Bloqueo'}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeTimeBlock(block.id);
                              }}
                              className="text-zinc-400 hover:text-zinc-600"
                            >
                              <Unlock className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderMonthView = () => {
    const currentMonth = currentDate.getMonth();

    return (
      <div className="rounded-2xl border border-admin-border bg-white p-4 shadow-sm overflow-hidden">
        <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-bold text-admin-muted uppercase tracking-wider px-1 pb-3 border-b border-admin-border/50">
          {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map((dayName) => (
            <div key={dayName} className="truncate">{dayName}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2 mt-2">
          {monthGridDays.map((dayDate) => {
            const iso = toISODate(dayDate);
            const dayBookings = bookingsByDay[iso] || [];
            const dayBlocks = blocksByDay[iso] || [];
            const isOtherMonth = dayDate.getMonth() !== currentMonth;
            const isToday = iso === toISODate(new Date());

            return (
              <div
                key={iso}
                className={`min-h-[110px] rounded-xl border p-2 flex flex-col justify-between transition-all ${
                  isOtherMonth ? 'bg-zinc-50/50 text-admin-muted border-zinc-200/50' : 'bg-white border-admin-border'
                } ${isToday ? 'border-brand-rose ring-1 ring-brand-rose/25 bg-brand-rose-50/5 shadow-rose-xs' : 'hover:shadow-sm'}`}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => handleDropOnMonthDay(iso)}
              >
                <div className="flex items-center justify-between shrink-0 mb-1.5">
                  <button
                    type="button"
                    className={`text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center ${
                      isToday ? 'bg-brand-rose text-white shadow-rose-xs' : 'text-admin-text hover:bg-admin-surface'
                    }`}
                    onClick={() => {
                      setSelectedDay(iso);
                      setCurrentDate(dayDate);
                    }}
                  >
                    {dayDate.getDate()}
                  </button>
                  <button
                    type="button"
                    className="text-[9px] font-bold text-brand-rose hover:bg-brand-rose-100/50 px-1 rounded transition-colors"
                    onClick={() => beginCreateBooking(iso)}
                  >
                    + cita
                  </button>
                </div>

                <div className="space-y-1 flex-1 overflow-y-auto max-h-[80px] scrollbar-none">
                  {dayBookings.slice(0, 2).map((booking) => {
                    const status = booking.meta.status || 'pending';
                    return (
                      <div
                        key={booking.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          openBookingDetail(booking);
                        }}
                        className={`text-[9px] px-1.5 py-0.5 rounded truncate font-medium border border-current/10 cursor-pointer ${STATUS_STYLES[status] || STATUS_STYLES.pending}`}
                      >
                        {booking.booking_time?.slice(0, 5)} {booking.client_name}
                      </div>
                    );
                  })}
                  {dayBookings.length > 2 ? (
                    <p className="text-[9px] text-admin-muted font-semibold text-center mt-0.5">
                      +{dayBookings.length - 2} más
                    </p>
                  ) : null}
                  {dayBlocks.length > 0 && dayBookings.length === 0 ? (
                    <p className="text-[9px] text-zinc-500 font-semibold italic text-center">
                      🚫 {dayBlocks.length} bloqueo(s)
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderAgendaView = () => {
    const agendaBookings = [...filteredBookings].sort((a, b) => {
      if (a.booking_date === b.booking_date) return timeToMinutes(a.booking_time) - timeToMinutes(b.booking_time);
      return a.booking_date.localeCompare(b.booking_date);
    });

    return (
      <div className="rounded-2xl border border-admin-border bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-admin-text">Agenda de citas</h3>
          <Button variant="outline" size="sm" onClick={() => beginCreateBooking()} className="border-brand-rose text-brand-rose hover:bg-brand-rose/5">
            <Plus className="h-4 w-4 mr-1" /> Nueva cita
          </Button>
        </div>

        <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
          {agendaBookings.length === 0 ? (
            <div className="text-sm text-admin-muted py-10 text-center font-medium">No hay citas con los filtros actuales.</div>
          ) : agendaBookings.map((booking) => {
            const bookingStatus = booking.meta.status || 'pending';
            return (
              <div key={booking.id} className="border border-admin-border rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:shadow-sm transition-shadow">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-admin-text text-sm">{booking.client_name}</p>
                    <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border ${STATUS_STYLES[bookingStatus] || STATUS_STYLES.pending}`}>
                      {STATUS_OPTIONS.find((s) => s.value === bookingStatus)?.label || 'Pendiente'}
                    </span>
                  </div>
                  <p className="text-xs text-admin-muted mt-1">
                    📅 {formatHumanDate(booking.booking_date, { weekday: 'long', day: 'numeric', month: 'long' })} · ⏰ {booking.booking_time?.slice(0, 5)}
                  </p>
                  <p className="text-xs text-admin-text mt-0.5">
                    📍 Sede: <strong className="font-semibold">{locationNameById[booking.location_id] || 'N/A'}</strong>
                    {booking.meta.assigned_to ? ` · 👤 Responsable: ${booking.meta.assigned_to}` : ''}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0 self-start md:self-auto">
                  <Button size="sm" variant="outline" onClick={() => openBookingDetail(booking)}>Ver detalle</Button>
                  <Button size="sm" variant="outline" className="border-emerald-200 text-emerald-600 hover:bg-emerald-50" onClick={() => updateBookingStatus(booking.id, 'completed')}>Completar</Button>
                  <Button size="sm" variant="outline" className="border-rose-200 text-rose-600 hover:bg-rose-50" onClick={() => updateBookingStatus(booking.id, 'cancelled')}>Cancelar</Button>
                  <Button size="sm" variant="outline" className="border-green-200 text-green-600 hover:bg-green-50" onClick={() => handleOpenWaModal(booking)}>Recordatorio</Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderCalendarBody = () => {
    if (loading) {
      return (
        <div className="rounded-2xl border border-admin-border bg-white p-16 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-rose" />
        </div>
      );
    }

    if (viewMode === VIEW_MODES.day) return renderDayView();
    if (viewMode === VIEW_MODES.week) return renderWeekView();
    if (viewMode === VIEW_MODES.month) return renderMonthView();
    return renderAgendaView();
  };

  const dayDialogBookings = selectedDay ? (bookingsByDay[selectedDay] || []) : [];
  const dayDialogBlocks = selectedDay ? (blocksByDay[selectedDay] || []) : [];

  return (
    <>
      <Helmet>
        <title>Calendario — Admin Suly</title>
        <meta
          name="description"
          content="Panel administrativo para gestionar citas, bloqueos y responsables en tiempo real."
        />
      </Helmet>

      <div className="max-w-7xl mx-auto space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-admin-text">Calendario</h1>
            <p className="text-sm text-admin-muted mt-0.5">Control de agenda, disponibilidad y responsables.</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-bold px-2 py-1 rounded-full border transition-all ${
              realtimeConnected
                ? 'text-emerald-600 border-emerald-200/50 bg-emerald-50'
                : 'text-amber-600 border-amber-200/50 bg-amber-50 animate-pulse'
            }`}>
              {realtimeConnected ? '🟢 Tiempo real' : '🟡 Reconectando...'}
            </span>
            <Button variant="outline" size="sm" onClick={fetchCalendarData}>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Actualizar
            </Button>
          </div>
        </div>

        {(!metaTableAvailable || !blocksTableAvailable || !staffTableAvailable) ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800 flex items-start gap-3 shadow-sm">
            <AlertCircle className="h-5 w-5 mt-0.5 text-amber-600 shrink-0" />
            <div>
              <p className="font-bold text-sm">Modo de compatibilidad activo</p>
              <p className="mt-1 leading-relaxed">
                Faltan algunas tablas avanzadas en la base de datos de Supabase. Ejecuta la migración en <code>supabase/migrations/20260524_admin_calendar.sql</code> en tu editor SQL de Supabase para desbloquear las funciones persistentes de asignación de responsables, bloqueos manuales de horas y estados extendidos.
              </p>
            </div>
          </div>
        ) : null}

        <div className="rounded-2xl border border-admin-border bg-white p-4 space-y-4 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => moveCalendarCursor('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => moveCalendarCursor('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" className="h-8" onClick={() => setCurrentDate(new Date())}>Hoy</Button>
              <span className="text-sm font-bold text-admin-text capitalize ml-2">{getHeaderLabel}</span>
            </div>

            <div className="flex items-center gap-1 bg-admin-bg p-0.5 rounded-lg border border-admin-border">
              {[VIEW_MODES.day, VIEW_MODES.week, VIEW_MODES.month, VIEW_MODES.agenda].map((mode) => (
                <Button
                  key={mode}
                  size="sm"
                  variant="ghost"
                  className={`h-7 px-3 text-xs font-semibold rounded-md transition-all ${
                    viewMode === mode
                      ? 'bg-gradient-rose-gold text-white shadow-rose-sm'
                      : 'text-admin-muted hover:text-admin-text'
                  }`}
                  onClick={() => setViewMode(mode)}
                >
                  {mode === VIEW_MODES.day ? <CalendarIcon className="h-3.5 w-3.5 mr-1" /> : null}
                  {mode === VIEW_MODES.week ? <CalendarRange className="h-3.5 w-3.5 mr-1" /> : null}
                  {mode === VIEW_MODES.month ? <CalendarDays className="h-3.5 w-3.5 mr-1" /> : null}
                  {mode === VIEW_MODES.agenda ? <List className="h-3.5 w-3.5 mr-1" /> : null}
                  {VIEW_LABELS[mode]}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="lg:col-span-2 relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-admin-muted" />
              <Input
                className="pl-9 h-9 text-xs"
                placeholder="Buscar por cliente, teléfono, email, responsable..."
                value={filterSearch}
                onChange={(event) => setFilterSearch(event.target.value)}
              />
            </div>

            <select
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              className="px-3 h-9 bg-admin-sidebar border border-admin-border rounded-xl text-admin-text text-xs focus:outline-none focus:border-brand-rose transition-colors"
            >
              <option value="all">Todas las sedes</option>
              {locations.map((l) => <option key={l.id} value={String(l.id)}>{l.name}</option>)}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 h-9 bg-admin-sidebar border border-admin-border rounded-xl text-admin-text text-xs focus:outline-none focus:border-brand-rose transition-colors"
            >
              <option value="all">Todos los estados</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>

            <select
              value={filterResponsible}
              onChange={(e) => setFilterResponsible(e.target.value)}
              className="px-3 h-9 bg-admin-sidebar border border-admin-border rounded-xl text-admin-text text-xs focus:outline-none focus:border-brand-rose transition-colors"
            >
              <option value="all">Responsable: Todos</option>
              {responsibleOptions.map((resp) => (
                <option key={resp} value={resp}>{resp}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-admin-muted pt-1 border-t border-admin-border/30">
            <div className="flex flex-wrap items-center gap-3">
              <span>Citas filtradas: <strong className="text-admin-text">{filteredBookings.length}</strong></span>
              <span>· Bloqueos manuales: <strong className="text-admin-text">{timeBlocks.length}</strong></span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button size="sm" variant="outline" className="h-8 border-zinc-300 text-zinc-700 hover:bg-zinc-50 font-bold" onClick={() => setIsHoursDialogOpen(true)}>
                <Clock3 className="h-3.5 w-3.5 mr-1.5 text-zinc-500 shrink-0" /> Horarios del Salón
              </Button>
              <Button size="sm" className="h-8 bg-gradient-rose-gold text-white font-bold" onClick={() => beginCreateBooking()}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Nueva cita manual
              </Button>
            </div>
          </div>
        </div>

        {renderCalendarBody()}
      </div>

      {/* Appointment Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={(open) => { if (!open) resetDetailDialog(); }}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto rounded-2xl border border-admin-border bg-white shadow-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-admin-text">
              {isCreatingBooking ? 'Crear Nueva Cita' : 'Detalle de Cita'}
            </DialogTitle>
            <DialogDescription className="text-xs text-admin-muted">
              Gestiona todos los detalles, estado y responsable de la reserva en un único panel.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-admin-text">Nombre del cliente *</Label>
              <Input
                value={detailForm.client_name}
                onChange={(event) => setDetailForm((prev) => ({ ...prev, client_name: event.target.value }))}
                placeholder="Nombre completo"
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold text-admin-text">Teléfono / Móvil *</Label>
              <Input
                value={detailForm.client_phone}
                onChange={(event) => setDetailForm((prev) => ({ ...prev, client_phone: event.target.value }))}
                placeholder="Ej: 612 345 678"
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold text-admin-text">Email</Label>
              <Input
                type="email"
                value={detailForm.client_email}
                onChange={(event) => setDetailForm((prev) => ({ ...prev, client_email: event.target.value }))}
                placeholder="ejemplo@correo.com"
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold text-admin-text">Sede *</Label>
              <select
                value={detailForm.location_id}
                onChange={(e) => setDetailForm((prev) => ({ ...prev, location_id: e.target.value }))}
                className="w-full px-3 h-9 bg-admin-sidebar border border-admin-border rounded-xl text-admin-text text-xs focus:outline-none focus:border-brand-rose transition-colors"
              >
                <option value="">Selecciona sede</option>
                {locations.map((location) => (
                  <option key={location.id} value={String(location.id)}>{location.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold text-admin-text">Fecha *</Label>
              <Input
                type="date"
                value={detailForm.booking_date}
                onChange={(event) => setDetailForm((prev) => ({ ...prev, booking_date: event.target.value }))}
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold text-admin-text">Hora *</Label>
              <Input
                type="time"
                value={detailForm.booking_time}
                onChange={(event) => setDetailForm((prev) => ({ ...prev, booking_time: event.target.value }))}
                className="h-9 text-xs"
              />
            </div>
          </div>

          <div className="space-y-3 mt-3">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-admin-text">Tipo / Nombre del Servicio</Label>
              <Input
                value={detailForm.appointment_type}
                onChange={(event) => setDetailForm((prev) => ({ ...prev, appointment_type: event.target.value }))}
                placeholder="Ej: Uñas acrílicas + diseño"
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold text-admin-text">Notas del cliente</Label>
              <textarea
                value={detailForm.notes}
                onChange={(event) => setDetailForm((prev) => ({ ...prev, notes: event.target.value }))}
                className="w-full min-h-[50px] rounded-xl border border-admin-border px-3 py-2 text-xs focus:outline-none focus:border-brand-rose resize-none text-gray-700 bg-gray-50/30"
                placeholder="Comentarios o solicitudes especiales del cliente..."
              />
            </div>
          </div>

          <div className="mt-4 pt-1">
            <button
              type="button"
              className="text-xs font-bold text-brand-rose hover:text-brand-rose/85 transition-colors flex items-center gap-1.5 focus:outline-none"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? '🔼 Opciones básicas' : '🔽 Más opciones (Especialista, Estado, Notas internas...)'}
            </button>
          </div>

          {showAdvanced && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 pt-3 border-t border-admin-border/30 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-admin-text">Especialista Responsable</Label>
                <Input
                  list="staff-options"
                  value={detailForm.assigned_to}
                  onChange={(event) => setDetailForm((prev) => ({ ...prev, assigned_to: event.target.value }))}
                  placeholder="Escribe el nombre del especialista"
                  className="h-9 text-xs"
                />
                <datalist id="staff-options">
                  {responsibleOptions.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-admin-text">Estado</Label>
                <select
                  value={detailForm.status}
                  onChange={(e) => setDetailForm((prev) => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 h-9 bg-admin-sidebar border border-admin-border rounded-xl text-admin-text text-xs focus:outline-none focus:border-brand-rose transition-colors"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-admin-text">Duración (minutos)</Label>
                <Input
                  type="number"
                  min="15"
                  step="5"
                  value={detailForm.duration_minutes}
                  onChange={(event) => setDetailForm((prev) => ({ ...prev, duration_minutes: Number(event.target.value || 30) }))}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-admin-text">Origen</Label>
                <select
                  value={detailForm.source}
                  onChange={(e) => setDetailForm((prev) => ({ ...prev, source: e.target.value }))}
                  className="w-full px-3 h-9 bg-admin-sidebar border border-admin-border rounded-xl text-admin-text text-xs focus:outline-none focus:border-brand-rose transition-colors"
                >
                  {SOURCE_OPTIONS.map((source) => (
                    <option key={source.value} value={source.value}>{source.label}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2 space-y-1">
                <Label className="text-xs font-bold text-admin-text">Notas internas (privadas)</Label>
                <textarea
                  value={detailForm.internal_notes}
                  onChange={(event) => setDetailForm((prev) => ({ ...prev, internal_notes: event.target.value }))}
                  className="w-full min-h-[60px] rounded-xl border border-admin-border px-3 py-2 text-xs focus:outline-none focus:border-brand-rose resize-none text-gray-700 bg-gray-50/30"
                  placeholder="Comentarios de uso interno para el salón o especialista..."
                />
              </div>
            </div>
          )}

          {/* Quick Actions Footer */}
          {!isCreatingBooking ? (
            <div className="mt-4 pt-3 border-t border-admin-border/50 flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" className="h-8 text-xs hover:text-brand-rose border-admin-border bg-gray-50/20" onClick={() => setDetailForm((p) => ({ ...p, status: 'confirmed' }))}>Confirmar</Button>
              <Button variant="outline" size="sm" className="h-8 text-xs hover:text-emerald-600 border-admin-border bg-gray-50/20" onClick={() => setDetailForm((p) => ({ ...p, status: 'completed' }))}>Completar</Button>
              <Button variant="outline" size="sm" className="h-8 text-xs hover:text-rose-600 border-admin-border bg-gray-50/20" onClick={() => setDetailForm((p) => ({ ...p, status: 'cancelled' }))}>Cancelar</Button>

              {detailForm.client_phone ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs border-green-200 text-green-600 hover:bg-green-50"
                    onClick={() => {
                      const currentBooking = enrichedBookings.find(b => b.id === selectedBookingId);
                      if (currentBooking) handleOpenWaModal(currentBooking);
                    }}
                  >
                    <MessageCircle className="h-4 w-4 mr-1 shrink-0" /> WhatsApp
                  </Button>
                  <a href={`tel:${detailForm.client_phone.replace(/\s+/g, '')}`} className="inline-flex">
                    <Button variant="outline" size="sm" className="h-8 text-xs border-admin-border bg-gray-50/20">
                      <Phone className="h-4 w-4 mr-1 shrink-0 text-admin-muted" /> Llamar
                    </Button>
                  </a>
                </>
              ) : null}

              {detailForm.client_email ? (
                <a href={`mailto:${detailForm.client_email}`} className="inline-flex">
                  <Button variant="outline" size="sm" className="h-8 text-xs border-admin-border bg-gray-50/20">
                    <Mail className="h-4 w-4 mr-1 shrink-0 text-admin-muted" /> Email
                  </Button>
                </a>
              ) : null}
            </div>
          ) : null}

          <DialogFooter className="mt-5 gap-2 border-t border-admin-border/30 pt-3">
            <Button variant="outline" className="h-9" onClick={resetDetailDialog}>Cerrar</Button>
            <Button className="bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold h-9 shadow-rose-sm" onClick={saveBookingDetails}>
              {isCreatingBooking ? 'Crear cita' : 'Guardar cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Day Overview Detail Dialog */}
      <Dialog open={Boolean(selectedDay)} onOpenChange={(open) => { if (!open) setSelectedDay(null); }}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto rounded-2xl border border-admin-border bg-white shadow-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-admin-text">
              Resumen del Día {selectedDay ? formatHumanDate(selectedDay, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : ''}
            </DialogTitle>
            <DialogDescription className="text-xs text-admin-muted">
              Listado completo de todas las reservas y bloqueos para una mejor supervisión.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-admin-muted bg-admin-surface/30 p-2 rounded-xl border border-admin-border/50">
              <Clock3 className="h-4 w-4 text-brand-rose" />
              <span>Citas agendadas: {dayDialogBookings.length} · Bloqueos activos: {dayDialogBlocks.length}</span>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-admin-text uppercase tracking-wider">Citas</h4>
              {dayDialogBookings.length === 0 ? (
                <p className="text-xs text-admin-muted italic p-2 border border-dashed rounded-xl">No hay citas registradas para este día.</p>
              ) : (
                <div className="space-y-2">
                  {dayDialogBookings.map((booking) => (
                    <div key={booking.id} className="border border-admin-border/50 rounded-xl p-3 flex items-center justify-between gap-3 bg-white hover:shadow-sm transition-shadow">
                      <div>
                        <p className="font-bold text-admin-text text-xs">{booking.client_name}</p>
                        <p className="text-[10px] text-admin-muted mt-0.5">
                          ⏰ {booking.booking_time?.slice(0, 5)} · 👤 {booking.meta.assigned_to || 'Sin responsable'}
                        </p>
                      </div>
                      <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => openBookingDetail(booking)}>Gestionar</Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2 pt-2 border-t border-admin-border/30">
              <h4 className="text-xs font-bold text-admin-text uppercase tracking-wider">Bloqueos de horario</h4>
              {dayDialogBlocks.length === 0 ? (
                <p className="text-xs text-admin-muted italic p-2 border border-dashed rounded-xl">No hay bloqueos manuales en este día.</p>
              ) : (
                <div className="space-y-2">
                  {dayDialogBlocks.map((block) => (
                    <div key={block.id} className="border border-zinc-200 bg-zinc-50 rounded-xl p-3 flex items-center justify-between gap-3 shadow-sm">
                      <div>
                        <p className="font-bold text-zinc-700 text-xs">{block.reason || 'Bloqueo manual'}</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">🚫 {block.start_time?.slice(0, 5)} - {block.end_time?.slice(0, 5)}</p>
                      </div>
                      <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => removeTimeBlock(block.id)}>
                        <Unlock className="h-3 w-3 mr-1" /> Habilitar
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="mt-5 gap-2 border-t border-admin-border/30 pt-3">
            <Button variant="outline" className="h-9" onClick={() => setSelectedDay(null)}>Cerrar</Button>
            {selectedDay ? (
              <Button className="bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold h-9 shadow-rose-sm" onClick={() => {
                setSelectedDay(null);
                beginCreateBooking(selectedDay);
              }}>
                <Plus className="h-4 w-4 mr-1.5" /> Nueva cita este día
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* WhatsApp Template Message Send Dialog */}
      <Dialog open={waModalOpen} onOpenChange={setWaModalOpen}>
        <DialogContent className="max-w-md rounded-2xl border border-admin-border bg-white shadow-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-admin-text">
              Enviar Recordatorio de WhatsApp
            </DialogTitle>
            <DialogDescription className="text-xs text-admin-muted">
              Selecciona una plantilla predefinida o escribe un mensaje personalizado para enviar al cliente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-3">
            <div className="flex gap-2">
              {[
                { type: 'standard', label: 'Estándar' },
                { type: 'modified', label: 'Modificado' },
                { type: 'thanks', label: 'Agradecer' }
              ].map((template) => (
                <button
                  key={template.type}
                  type="button"
                  onClick={() => handleSwitchWaTemplate(template.type)}
                  className={`flex-1 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                    selectedWaTemplate === template.type
                      ? 'bg-gradient-rose-gold text-white border-transparent shadow-rose-xs scale-105'
                      : 'bg-admin-bg text-admin-muted border-admin-border hover:bg-admin-surface'
                  }`}
                >
                  {template.label}
                </button>
              ))}
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-admin-text">Previsualización del mensaje</Label>
              <textarea
                className="w-full min-h-[100px] border border-admin-border rounded-xl p-3 text-xs focus:ring-2 focus:ring-brand-rose focus:border-brand-rose outline-none resize-none font-medium text-gray-700 bg-gray-50/50"
                placeholder="Escribe tu mensaje..."
                value={customWaMessage}
                onChange={(e) => setCustomWaMessage(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="mt-5 gap-2 border-t border-admin-border/30 pt-3">
            <Button variant="outline" className="h-9" onClick={() => setWaModalOpen(false)}>Cancelar</Button>
            <Button
              onClick={handleSendWhatsApp}
              className="bg-green-500 hover:bg-green-600 text-white font-bold h-9 shadow-sm"
            >
              <MessageCircle className="h-4 w-4 mr-2" /> Enviar por WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Business Hours Settings Dialog */}
      <Dialog open={isHoursDialogOpen} onOpenChange={setIsHoursDialogOpen}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto rounded-2xl border border-admin-border bg-white shadow-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-admin-text flex items-center gap-2">
              <Clock3 className="h-5 w-5 text-brand-rose" /> Horarios Comerciales del Salón
            </DialogTitle>
            <DialogDescription className="text-xs text-admin-muted">
              Configura las horas de apertura, cierre y días de inactividad. Los cambios se sincronizarán en tiempo real con la web del cliente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4 divide-y divide-admin-border/30">
            {Object.entries({
              monday: 'Lunes',
              tuesday: 'Martes',
              wednesday: 'Miércoles',
              thursday: 'Jueves',
              friday: 'Viernes',
              saturday: 'Sábado',
              sunday: 'Domingo'
            }).map(([dayKey, dayLabel]) => {
              const config = businessHours[dayKey] || { open: '10:00', close: '20:00', closed: false };

              return (
                <div key={dayKey} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 first:pt-0">
                  <div className="flex items-center gap-3 shrink-0">
                    <input
                      type="checkbox"
                      id={`closed-${dayKey}`}
                      checked={!config.closed}
                      onChange={(e) => {
                        const openStatus = e.target.checked;
                        setBusinessHours((prev) => ({
                          ...prev,
                          [dayKey]: { ...config, closed: !openStatus }
                        }));
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-brand-rose focus:ring-brand-rose cursor-pointer"
                    />
                    <label htmlFor={`closed-${dayKey}`} className="text-xs font-bold text-admin-text cursor-pointer select-none min-w-[70px]">
                      {dayLabel}
                    </label>
                    <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                      config.closed ? 'bg-rose-500/10 text-rose-600' : 'bg-emerald-500/10 text-emerald-600'
                    }`}>
                      {config.closed ? 'Cerrado' : 'Abierto'}
                    </span>
                  </div>

                  {!config.closed && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-admin-muted font-medium">Abre:</span>
                        <Input
                          type="time"
                          value={config.open}
                          onChange={(e) => {
                            setBusinessHours((prev) => ({
                              ...prev,
                              [dayKey]: { ...config, open: e.target.value }
                            }));
                          }}
                          className="h-8 w-[95px] text-xs py-1 px-2"
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-admin-muted font-medium">Cierra:</span>
                        <Input
                          type="time"
                          value={config.close}
                          onChange={(e) => {
                            setBusinessHours((prev) => ({
                              ...prev,
                              [dayKey]: { ...config, close: e.target.value }
                            }));
                          }}
                          className="h-8 w-[95px] text-xs py-1 px-2"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <DialogFooter className="mt-6 gap-2 border-t border-admin-border/30 pt-3">
            <Button variant="outline" className="h-9" onClick={() => setIsHoursDialogOpen(false)}>Cancelar</Button>
            <Button className="bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold h-9 shadow-rose-sm" onClick={saveBusinessHours}>
              Guardar Horarios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CalendarPage;

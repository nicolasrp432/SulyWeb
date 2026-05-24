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
  LogOut,
  ShieldCheck,
  Clock3,
  AlertCircle
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
  { value: 'web', label: 'Web' },
  { value: 'phone', label: 'Teléfono' },
  { value: 'whatsapp', label: 'WhatsApp' },
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
  source: 'web'
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

function withStatusColor(status) {
  switch (status) {
    case 'confirmed':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'rescheduled':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'cancelled':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'completed':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'no_show':
      return 'bg-zinc-200 text-zinc-800 border-zinc-300';
    default:
      return 'bg-pink-100 text-pink-800 border-pink-200';
  }
}

function buildMonthGrid(anchorDate) {
  const firstDay = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1);
  const gridStart = getWeekStart(firstDay);
  return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
}

const AdminCalendar = () => {
  const { toast } = useToast();
  const { session, loading: authLoading, signIn, signOut } = useAuth();

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
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginSubmitting, setLoginSubmitting] = useState(false);
  const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < 768 : false));

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

    filteredBookings.forEach((booking) => slotSet.add(booking.booking_time));
    timeBlocks.forEach((block) => slotSet.add(block.start_time));

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
    if (!session) return;

    setLoading(true);
    try {
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('id,location_id,booking_date,booking_time,client_name,client_phone,client_email,notes,created_at')
        .gte('booking_date', dateRange.start)
        .lte('booking_date', dateRange.end)
        .order('booking_date', { ascending: true })
        .order('booking_time', { ascending: true });

      if (bookingsError) throw bookingsError;

      const safeBookings = bookingsData || [];
      setBookings(safeBookings);

      const bookingIds = safeBookings.map((booking) => booking.id);

      if (bookingIds.length > 0) {
        const { data: servicesData, error: servicesError } = await supabase
          .from('booking_services')
          .select('booking_id,service_id,services(id,name,price,duration)')
          .in('booking_id', bookingIds);

        if (servicesError) throw servicesError;

        const servicesMap = (servicesData || []).reduce((acc, row) => {
          if (!acc[row.booking_id]) acc[row.booking_id] = [];
          if (row.services) acc[row.booking_id].push(row.services);
          return acc;
        }, {});

        setBookingServicesMap(servicesMap);

        if (metaTableAvailable) {
          const { data: metaData, error: metaError } = await supabase
            .from('bookings_admin_meta')
            .select('booking_id,status,assigned_to,duration_minutes,appointment_type,internal_notes,source')
            .in('booking_id', bookingIds);

          if (metaError) {
            if (metaError.message?.toLowerCase().includes('bookings_admin_meta')) {
              setMetaTableAvailable(false);
              setBookingMetaMap({});
            } else {
              throw metaError;
            }
          } else {
            const metaMap = (metaData || []).reduce((acc, row) => {
              acc[row.booking_id] = {
                status: row.status || DEFAULT_BOOKING_META.status,
                assigned_to: row.assigned_to || '',
                duration_minutes: row.duration_minutes || DEFAULT_BOOKING_META.duration_minutes,
                appointment_type: row.appointment_type || '',
                internal_notes: row.internal_notes || '',
                source: row.source || DEFAULT_BOOKING_META.source
              };
              return acc;
            }, {});

            setBookingMetaMap(metaMap);
          }
        }
      } else {
        setBookingServicesMap({});
        setBookingMetaMap({});
      }

      if (blocksTableAvailable) {
        const { data: blocksData, error: blocksError } = await supabase
          .from('admin_time_blocks')
          .select('id,location_id,block_date,start_time,end_time,reason,is_available,created_at')
          .gte('block_date', dateRange.start)
          .lte('block_date', dateRange.end)
          .order('block_date', { ascending: true })
          .order('start_time', { ascending: true });

        if (blocksError) {
          if (blocksError.message?.toLowerCase().includes('admin_time_blocks')) {
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
  }, [blocksTableAvailable, dateRange.end, dateRange.start, metaTableAvailable, session, toast]);

  useEffect(() => {
    if (!session) return;

    fetchLocations();
    fetchStaffMembers();
  }, [fetchLocations, fetchStaffMembers, session]);

  useEffect(() => {
    fetchCalendarData();
  }, [fetchCalendarData]);

  useEffect(() => {
    if (!session) return;

    const channel = supabase
      .channel('admin-calendar-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => fetchCalendarData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'booking_services' }, () => fetchCalendarData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings_admin_meta' }, () => fetchCalendarData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_time_blocks' }, () => fetchCalendarData())
      .subscribe((status) => {
        setRealtimeConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
      setRealtimeConnected(false);
    };
  }, [fetchCalendarData, session]);

  const openBookingDetail = useCallback((booking) => {
    const meta = bookingMetaById(booking.id);
    setIsCreatingBooking(false);
    setSelectedBookingId(booking.id);
    setIsDetailDialogOpen(true);
    setDetailForm({
      id: booking.id,
      location_id: String(booking.location_id),
      booking_date: booking.booking_date,
      booking_time: booking.booking_time,
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
      booking_time: activeBooking.booking_time,
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
      if (isCreatingBooking) {
        const { data: createdBooking, error: createError } = await supabase
          .from('bookings')
          .insert([{
            location_id: Number(detailForm.location_id),
            booking_date: detailForm.booking_date,
            booking_time: detailForm.booking_time,
            client_name: detailForm.client_name,
            client_phone: detailForm.client_phone,
            client_email: detailForm.client_email,
            notes: detailForm.notes
          }])
          .select('id')
          .single();

        if (createError) throw createError;

        if (metaTableAvailable && createdBooking?.id) {
          const { error: metaError } = await supabase
            .from('bookings_admin_meta')
            .upsert([{
              booking_id: createdBooking.id,
              status: detailForm.status,
              assigned_to: detailForm.assigned_to || null,
              duration_minutes: Number(detailForm.duration_minutes) || 30,
              appointment_type: detailForm.appointment_type || null,
              internal_notes: detailForm.internal_notes || null,
              source: detailForm.source || 'admin'
            }], { onConflict: 'booking_id' });

          if (metaError) {
            if (metaError.message?.toLowerCase().includes('bookings_admin_meta')) {
              setMetaTableAvailable(false);
            } else {
              throw metaError;
            }
          }
        }

        toast({ title: 'Cita creada', description: 'La cita fue creada correctamente' });
      } else if (detailForm.id) {
        const { error: bookingError } = await supabase
          .from('bookings')
          .update({
            location_id: Number(detailForm.location_id),
            booking_date: detailForm.booking_date,
            booking_time: detailForm.booking_time,
            client_name: detailForm.client_name,
            client_phone: detailForm.client_phone,
            client_email: detailForm.client_email,
            notes: detailForm.notes
          })
          .eq('id', detailForm.id);

        if (bookingError) throw bookingError;

        if (metaTableAvailable) {
          const { error: metaError } = await supabase
            .from('bookings_admin_meta')
            .upsert([{
              booking_id: detailForm.id,
              status: detailForm.status,
              assigned_to: detailForm.assigned_to || null,
              duration_minutes: Number(detailForm.duration_minutes) || 30,
              appointment_type: detailForm.appointment_type || null,
              internal_notes: detailForm.internal_notes || null,
              source: detailForm.source || 'web'
            }], { onConflict: 'booking_id' });

          if (metaError) {
            if (metaError.message?.toLowerCase().includes('bookings_admin_meta')) {
              setMetaTableAvailable(false);
              toast({
                variant: 'destructive',
                title: 'Falta tabla de metadatos',
                description: 'Ejecuta la migración SQL para guardar estado y responsable.'
              });
            } else {
              throw metaError;
            }
          }
        }

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
    if (!metaTableAvailable) {
      toast({
        variant: 'destructive',
        title: 'Migración pendiente',
        description: 'La tabla bookings_admin_meta no está disponible para estados.'
      });
      return;
    }

    try {
      const currentMeta = bookingMetaById(bookingId);
      const { error } = await supabase
        .from('bookings_admin_meta')
        .upsert([{
          booking_id: bookingId,
          status,
          assigned_to: currentMeta.assigned_to || null,
          duration_minutes: currentMeta.duration_minutes || 30,
          appointment_type: currentMeta.appointment_type || null,
          internal_notes: currentMeta.internal_notes || null,
          source: currentMeta.source || 'web'
        }], { onConflict: 'booking_id' });

      if (error) throw error;

      fetchCalendarData();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'No se pudo cambiar el estado',
        description: error.message
      });
    }
  }, [bookingMetaById, fetchCalendarData, metaTableAvailable, toast]);

  const moveBooking = useCallback(async (bookingId, bookingDate, bookingTime) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ booking_date: bookingDate, booking_time: bookingTime })
        .eq('id', bookingId);

      if (error) throw error;

      await updateBookingStatus(bookingId, 'rescheduled');
      toast({ title: 'Cita movida', description: `Nueva hora: ${bookingDate} ${bookingTime}` });
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
        description: 'La tabla admin_time_blocks no está disponible.'
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('admin_time_blocks')
        .insert([{
          block_date: date,
          start_time: time,
          end_time: addMinutes(time, 30),
          location_id: filterLocation === 'all' ? null : Number(filterLocation),
          reason: 'Bloqueo manual desde calendario',
          is_available: false
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
        .from('admin_time_blocks')
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
    return (bookingsByDay[date] || []).filter((booking) => booking.booking_time === time);
  }, [bookingsByDay]);

  const getBlocksForSlot = useCallback((date, time) => {
    return (blocksByDay[date] || []).filter((block) => block.start_time === time);
  }, [blocksByDay]);

  const handleDropOnSlot = useCallback(async (date, time) => {
    if (!draggedBookingId) return;

    const booking = enrichedBookings.find((item) => item.id === draggedBookingId);
    if (!booking) return;

    setDraggedBookingId(null);

    if (booking.booking_date === date && booking.booking_time === time) return;

    await moveBooking(draggedBookingId, date, time);
  }, [draggedBookingId, enrichedBookings, moveBooking]);

  const handleDropOnMonthDay = useCallback(async (date) => {
    if (!draggedBookingId) return;

    const booking = enrichedBookings.find((item) => item.id === draggedBookingId);
    if (!booking) return;

    setDraggedBookingId(null);

    if (booking.booking_date === date) return;

    await moveBooking(draggedBookingId, date, booking.booking_time);
  }, [draggedBookingId, enrichedBookings, moveBooking]);

  const beginCreateBooking = useCallback((date = toISODate(currentDate), time = CONFIG.BOOKING.TIME_SLOTS[0]) => {
    setIsCreatingBooking(true);
    setSelectedBookingId(null);
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

  const renderBookingCard = (booking) => {
    const bookingStatus = booking.meta.status || 'pending';
    const statusLabel = STATUS_OPTIONS.find((option) => option.value === bookingStatus)?.label || 'Pendiente';
    const servicesText = booking.services.length > 0
      ? booking.services.map((service) => service.name).join(', ')
      : 'Sin servicios asociados';

    return (
      <div
        key={booking.id}
        draggable
        onDragStart={() => setDraggedBookingId(booking.id)}
        onDragEnd={() => setDraggedBookingId(null)}
        onClick={() => openBookingDetail(booking)}
        className={`rounded-md border p-2 cursor-grab active:cursor-grabbing hover:shadow-sm transition ${withStatusColor(bookingStatus)}`}
      >
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold truncate">{booking.client_name}</p>
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-white/70 border">{statusLabel}</span>
        </div>
        <p className="text-[11px] truncate">{booking.booking_time} · {locationNameById[booking.location_id] || 'Sede'}</p>
        <p className="text-[11px] truncate">{servicesText}</p>
        {booking.meta.assigned_to ? <p className="text-[11px] truncate">Responsable: {booking.meta.assigned_to}</p> : null}
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
        className="grid grid-cols-[56px_1fr] gap-2 border-t py-2"
      >
        <div className="text-xs text-gray-500 pt-1">{time}</div>
        <div className="space-y-2 min-h-[42px]">
          {bookingsInSlot.map((booking) => renderBookingCard(booking))}

          {blocksInSlot.map((block) => (
            <div key={block.id} className="rounded-md border border-gray-300 bg-gray-100 p-2 text-xs text-gray-700">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{block.reason || 'Bloqueo manual'}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2"
                  onClick={() => removeTimeBlock(block.id)}
                >
                  <Unlock className="h-3.5 w-3.5" />
                </Button>
              </div>
              <p>{block.start_time} - {block.end_time}</p>
            </div>
          ))}

          {bookingsInSlot.length === 0 && blocksInSlot.length === 0 ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-gray-500"
              onClick={() => createTimeBlock(date, time)}
            >
              <Lock className="h-3.5 w-3.5 mr-1" /> Bloquear
            </Button>
          ) : null}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const dayISO = toISODate(currentDate);

    return (
      <div className="rounded-xl border bg-white p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold">{formatHumanDate(currentDate, { weekday: 'long', day: 'numeric', month: 'long' })}</h3>
          <Button variant="outline" size="sm" onClick={() => beginCreateBooking(dayISO)}>
            <Plus className="h-4 w-4 mr-1" /> Nueva cita
          </Button>
        </div>

        <div className="max-h-[68vh] overflow-auto pr-2">
          {timeSlots.map((time) => renderTimeSlot(dayISO, time))}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-3">
        {weekDays.map((dayDate) => {
          const dayISO = toISODate(dayDate);
          return (
            <div key={dayISO} className="rounded-xl border bg-white p-3 min-h-[420px]">
              <div className="sticky top-0 bg-white z-10 pb-2 border-b mb-2">
                <button
                  className="text-left w-full"
                  onClick={() => {
                    setCurrentDate(dayDate);
                    setViewMode(VIEW_MODES.day);
                  }}
                >
                  <p className="text-xs text-gray-500 uppercase">{formatHumanDate(dayDate, { weekday: 'short' })}</p>
                  <p className="font-semibold">{formatHumanDate(dayDate, { day: 'numeric', month: 'short' })}</p>
                </button>
              </div>
              <div className="space-y-1 max-h-[58vh] overflow-auto pr-1">
                {timeSlots.map((time) => (
                  <div key={`${dayISO}-${time}`} className="border-t pt-1">
                    <div className="text-[10px] text-gray-400 mb-1">{time}</div>
                    <div
                      className="min-h-[36px] space-y-1"
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => handleDropOnSlot(dayISO, time)}
                    >
                      {getBookingsForSlot(dayISO, time).map((booking) => renderBookingCard(booking))}
                      {getBlocksForSlot(dayISO, time).map((block) => (
                        <div key={block.id} className="rounded border border-gray-300 bg-gray-100 p-1 text-[10px]">
                          <div className="flex items-center justify-between">
                            <span>{block.reason || 'Bloqueo'}</span>
                            <button type="button" onClick={() => removeTimeBlock(block.id)}>
                              <Unlock className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
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
      <div className="rounded-xl border bg-white p-3">
        <div className="grid grid-cols-7 gap-2 text-xs font-semibold text-gray-500 px-1 pb-2">
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((dayName) => (
            <div key={dayName}>{dayName}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {monthGridDays.map((dayDate) => {
            const iso = toISODate(dayDate);
            const dayBookings = bookingsByDay[iso] || [];
            const dayBlocks = blocksByDay[iso] || [];
            const isOtherMonth = dayDate.getMonth() !== currentMonth;
            const isToday = iso === toISODate(new Date());

            return (
              <div
                key={iso}
                className={`min-h-[120px] rounded-lg border p-2 ${isOtherMonth ? 'bg-gray-50 text-gray-400' : 'bg-white'} ${isToday ? 'border-pink-300 ring-1 ring-pink-200' : ''}`}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => handleDropOnMonthDay(iso)}
              >
                <div className="flex items-center justify-between mb-2">
                  <button
                    type="button"
                    className="text-sm font-semibold"
                    onClick={() => {
                      setSelectedDay(iso);
                      setCurrentDate(dayDate);
                    }}
                  >
                    {dayDate.getDate()}
                  </button>
                  <button
                    type="button"
                    className="text-[10px] text-pink-600"
                    onClick={() => beginCreateBooking(iso)}
                  >
                    + cita
                  </button>
                </div>

                <div className="space-y-1">
                  {dayBookings.slice(0, 3).map((booking) => (
                    <div key={booking.id}>{renderBookingCard(booking)}</div>
                  ))}
                  {dayBookings.length > 3 ? <p className="text-[10px] text-gray-500">+{dayBookings.length - 3} más</p> : null}
                  {dayBlocks.length > 0 ? <p className="text-[10px] text-gray-500">{dayBlocks.length} bloqueo(s)</p> : null}
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
      <div className="rounded-xl border bg-white p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Agenda de citas</h3>
          <Button variant="outline" size="sm" onClick={() => beginCreateBooking()}>
            <Plus className="h-4 w-4 mr-1" /> Nueva cita
          </Button>
        </div>

        <div className="space-y-3 max-h-[70vh] overflow-auto pr-1">
          {agendaBookings.length === 0 ? (
            <div className="text-sm text-gray-500 py-8 text-center">No hay citas con los filtros actuales.</div>
          ) : agendaBookings.map((booking) => (
            <div key={booking.id} className="border rounded-lg p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">{booking.client_name}</p>
                  <p className="text-sm text-gray-600">
                    {formatHumanDate(booking.booking_date, { weekday: 'long', day: 'numeric', month: 'long' })} · {booking.booking_time}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded border ${withStatusColor(booking.meta.status || 'pending')}`}>
                  {STATUS_OPTIONS.find((status) => status.value === (booking.meta.status || 'pending'))?.label || 'Pendiente'}
                </span>
              </div>
              <p className="text-sm mt-1 text-gray-700">Sede: {locationNameById[booking.location_id] || 'N/A'}</p>
              <p className="text-sm text-gray-700">Responsable: {booking.meta.assigned_to || 'Sin asignar'}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => openBookingDetail(booking)}>Ver detalle</Button>
                <Button size="sm" variant="outline" onClick={() => updateBookingStatus(booking.id, 'completed')}>Completar</Button>
                <Button size="sm" variant="outline" onClick={() => updateBookingStatus(booking.id, 'cancelled')}>Cancelar</Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderCalendarBody = () => {
    if (loading) {
      return (
        <div className="rounded-xl border bg-white p-10 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
        </div>
      );
    }

    if (viewMode === VIEW_MODES.day) return renderDayView();
    if (viewMode === VIEW_MODES.week) return renderWeekView();
    if (viewMode === VIEW_MODES.month) return renderMonthView();
    return renderAgendaView();
  };

  const handleLogin = async (event) => {
    event.preventDefault();

    if (!loginEmail || !loginPassword) {
      toast({
        variant: 'destructive',
        title: 'Datos incompletos',
        description: 'Introduce email y contraseña'
      });
      return;
    }

    setLoginSubmitting(true);
    const { error } = await signIn(loginEmail, loginPassword);
    setLoginSubmitting(false);
    setLoginPassword('');

    if (!error) {
      toast({ title: 'Acceso concedido', description: 'Bienvenida al panel de calendario' });
    }
  };

  const dayDialogBookings = selectedDay ? (bookingsByDay[selectedDay] || []) : [];
  const dayDialogBlocks = selectedDay ? (blocksByDay[selectedDay] || []) : [];

  return (
    <>
      <Helmet>
        <title>Admin Calendario | Suly Pretty Nails</title>
        <meta
          name="description"
          content="Panel administrativo para gestionar citas, bloqueos y responsables en vista día, semana, mes y agenda."
        />
      </Helmet>

      <section className="container mx-auto px-4 py-10">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold">Calendario de Gestión</h1>
              <p className="text-sm text-gray-600 mt-1">Centro de operaciones para citas, disponibilidad y responsables.</p>
            </div>

            {session ? (
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded border ${realtimeConnected ? 'text-emerald-700 border-emerald-200 bg-emerald-50' : 'text-amber-700 border-amber-200 bg-amber-50'}`}>
                  {realtimeConnected ? 'Tiempo real activo' : 'Tiempo real inactivo'}
                </span>
                <Button variant="outline" size="sm" onClick={fetchCalendarData}>
                  <RefreshCw className="h-4 w-4 mr-1" /> Actualizar
                </Button>
                <Button variant="outline" size="sm" onClick={async () => { await signOut(); }}>
                  <LogOut className="h-4 w-4 mr-1" /> Salir
                </Button>
              </div>
            ) : null}
          </div>

          {authLoading ? (
            <div className="rounded-xl border bg-white p-10 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
            </div>
          ) : !session ? (
            <div className="max-w-lg mx-auto rounded-xl border bg-white p-6 space-y-4">
              <div className="flex items-center gap-2 text-pink-700">
                <ShieldCheck className="h-5 w-5" />
                <h2 className="text-lg font-semibold">Acceso Administrador</h2>
              </div>
              <p className="text-sm text-gray-600">Inicia sesión para gestionar el calendario y las citas en tiempo real.</p>

              <form className="space-y-3" onSubmit={handleLogin}>
                <div>
                  <Label htmlFor="admin-email">Email</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    value={loginEmail}
                    onChange={(event) => setLoginEmail(event.target.value)}
                    placeholder="admin@correo.com"
                  />
                </div>
                <div>
                  <Label htmlFor="admin-password">Contraseña</Label>
                  <Input
                    id="admin-password"
                    type="password"
                    value={loginPassword}
                    onChange={(event) => setLoginPassword(event.target.value)}
                    placeholder="••••••••"
                  />
                </div>

                <Button className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white" disabled={loginSubmitting}>
                  {loginSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Entrar al calendario
                </Button>
              </form>
            </div>
          ) : (
            <>
              {(!metaTableAvailable || !blocksTableAvailable || !staffTableAvailable) ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5" />
                  <div>
                    <p className="font-medium">Modo compatibilidad activo</p>
                    <p>
                      Faltan tablas avanzadas del calendario. Ejecuta la migración SQL en <code>supabase/migrations/20260524_admin_calendar.sql</code> para habilitar estados, bloqueos y responsables persistentes.
                    </p>
                  </div>
                </div>
              ) : null}

              <div className="rounded-xl border bg-white p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => moveCalendarCursor('prev')}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => moveCalendarCursor('next')}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>Hoy</Button>
                  </div>

                  <div className="text-sm font-semibold text-gray-700">{getHeaderLabel}</div>

                  <div className="flex items-center gap-2">
                    {[VIEW_MODES.day, VIEW_MODES.week, VIEW_MODES.month, VIEW_MODES.agenda].map((mode) => (
                      <Button
                        key={mode}
                        size="sm"
                        variant={viewMode === mode ? 'default' : 'outline'}
                        className={viewMode === mode ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white' : ''}
                        onClick={() => setViewMode(mode)}
                      >
                        {mode === VIEW_MODES.day ? <CalendarIcon className="h-4 w-4 mr-1" /> : null}
                        {mode === VIEW_MODES.week ? <CalendarRange className="h-4 w-4 mr-1" /> : null}
                        {mode === VIEW_MODES.month ? <CalendarDays className="h-4 w-4 mr-1" /> : null}
                        {mode === VIEW_MODES.agenda ? <List className="h-4 w-4 mr-1" /> : null}
                        {VIEW_LABELS[mode]}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
                  <div className="xl:col-span-2 relative">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input
                      className="pl-9"
                      placeholder="Buscar por cliente, teléfono, email o notas"
                      value={filterSearch}
                      onChange={(event) => setFilterSearch(event.target.value)}
                    />
                  </div>

                  <Select value={filterLocation} onValueChange={setFilterLocation}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sede" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las sedes</SelectItem>
                      {locations.map((location) => (
                        <SelectItem key={location.id} value={String(location.id)}>{location.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los estados</SelectItem>
                      {STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filterResponsible} onValueChange={setFilterResponsible}>
                    <SelectTrigger>
                      <SelectValue placeholder="Responsable" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las responsables</SelectItem>
                      {responsibleOptions.map((responsibleName) => (
                        <SelectItem key={responsibleName} value={responsibleName}>{responsibleName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-gray-600">
                  <div className="flex flex-wrap items-center gap-2">
                    <span>Total citas visibles: <strong>{filteredBookings.length}</strong></span>
                    <span>· Bloqueos: <strong>{timeBlocks.length}</strong></span>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => beginCreateBooking()}>
                    <Plus className="h-4 w-4 mr-1" /> Nueva cita
                  </Button>
                </div>
              </div>

              {renderCalendarBody()}
            </>
          )}
        </div>
      </section>

      <Dialog open={isDetailDialogOpen} onOpenChange={(open) => { if (!open) resetDetailDialog(); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isCreatingBooking ? 'Crear nueva cita' : 'Detalle de cita'}</DialogTitle>
            <DialogDescription>
              Gestiona hora, estado, responsable, origen y notas internas desde un único panel.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Nombre cliente *</Label>
              <Input value={detailForm.client_name} onChange={(event) => setDetailForm((prev) => ({ ...prev, client_name: event.target.value }))} />
            </div>
            <div>
              <Label>Teléfono</Label>
              <Input value={detailForm.client_phone} onChange={(event) => setDetailForm((prev) => ({ ...prev, client_phone: event.target.value }))} />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={detailForm.client_email} onChange={(event) => setDetailForm((prev) => ({ ...prev, client_email: event.target.value }))} />
            </div>
            <div>
              <Label>Sede *</Label>
              <Select value={detailForm.location_id} onValueChange={(value) => setDetailForm((prev) => ({ ...prev, location_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona sede" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.id} value={String(location.id)}>{location.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fecha *</Label>
              <Input type="date" value={detailForm.booking_date} onChange={(event) => setDetailForm((prev) => ({ ...prev, booking_date: event.target.value }))} />
            </div>
            <div>
              <Label>Hora *</Label>
              <Input type="time" value={detailForm.booking_time} onChange={(event) => setDetailForm((prev) => ({ ...prev, booking_time: event.target.value }))} />
            </div>
            <div>
              <Label>Estado</Label>
              <Select value={detailForm.status} onValueChange={(value) => setDetailForm((prev) => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Responsable</Label>
              <Input
                list="responsible-options"
                value={detailForm.assigned_to}
                onChange={(event) => setDetailForm((prev) => ({ ...prev, assigned_to: event.target.value }))}
                placeholder="Nombre de responsable"
              />
              <datalist id="responsible-options">
                {responsibleOptions.map((responsibleName) => (
                  <option key={responsibleName} value={responsibleName} />
                ))}
              </datalist>
            </div>
            <div>
              <Label>Duración (min)</Label>
              <Input
                type="number"
                min="15"
                step="5"
                value={detailForm.duration_minutes}
                onChange={(event) => setDetailForm((prev) => ({ ...prev, duration_minutes: Number(event.target.value || 30) }))}
              />
            </div>
            <div>
              <Label>Origen</Label>
              <Select value={detailForm.source} onValueChange={(value) => setDetailForm((prev) => ({ ...prev, source: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOURCE_OPTIONS.map((source) => (
                    <SelectItem key={source.value} value={source.value}>{source.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <Label>Tipo de cita</Label>
              <Input value={detailForm.appointment_type} onChange={(event) => setDetailForm((prev) => ({ ...prev, appointment_type: event.target.value }))} placeholder="Ej: manicura completa + refuerzo" />
            </div>
            <div>
              <Label>Notas del cliente</Label>
              <textarea
                value={detailForm.notes}
                onChange={(event) => setDetailForm((prev) => ({ ...prev, notes: event.target.value }))}
                className="w-full min-h-[70px] rounded-md border px-3 py-2 text-sm"
                placeholder="Preferencias, alergias, comentarios..."
              />
            </div>
            <div>
              <Label>Notas internas</Label>
              <textarea
                value={detailForm.internal_notes}
                onChange={(event) => setDetailForm((prev) => ({ ...prev, internal_notes: event.target.value }))}
                className="w-full min-h-[90px] rounded-md border px-3 py-2 text-sm"
                placeholder="Notas internas para el equipo"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => setDetailForm((prev) => ({ ...prev, status: 'confirmed' }))}>Confirmar</Button>
            <Button variant="outline" size="sm" onClick={() => setDetailForm((prev) => ({ ...prev, status: 'completed' }))}>Completar</Button>
            <Button variant="outline" size="sm" onClick={() => setDetailForm((prev) => ({ ...prev, status: 'cancelled' }))}>Cancelar</Button>
            {!isCreatingBooking && detailForm.booking_date && detailForm.booking_time ? (
              <Button variant="outline" size="sm" onClick={() => createTimeBlock(detailForm.booking_date, detailForm.booking_time)}>
                <Lock className="h-4 w-4 mr-1" /> Bloquear esta hora
              </Button>
            ) : null}
            {detailForm.client_phone ? (
              <a
                href={`https://wa.me/${detailForm.client_phone.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex"
              >
                <Button variant="outline" size="sm"><MessageCircle className="h-4 w-4 mr-1" /> WhatsApp</Button>
              </a>
            ) : null}
            {detailForm.client_phone ? (
              <a href={`tel:${detailForm.client_phone}`} className="inline-flex">
                <Button variant="outline" size="sm"><Phone className="h-4 w-4 mr-1" /> Llamar</Button>
              </a>
            ) : null}
            {detailForm.client_email ? (
              <a href={`mailto:${detailForm.client_email}`} className="inline-flex">
                <Button variant="outline" size="sm"><Mail className="h-4 w-4 mr-1" /> Email</Button>
              </a>
            ) : null}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetDetailDialog}>Cerrar</Button>
            <Button className="bg-gradient-to-r from-pink-500 to-rose-500 text-white" onClick={saveBookingDetails}>
              {isCreatingBooking ? 'Crear cita' : 'Guardar cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(selectedDay)} onOpenChange={(open) => { if (!open) setSelectedDay(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle del día {selectedDay ? formatHumanDate(selectedDay, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : ''}</DialogTitle>
            <DialogDescription>
              Citas del día, bloqueos y accesos rápidos para reorganizar agenda.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock3 className="h-4 w-4" />
              <span>{dayDialogBookings.length} cita(s) · {dayDialogBlocks.length} bloqueo(s)</span>
            </div>

            <div className="space-y-2">
              {dayDialogBookings.length === 0 ? (
                <p className="text-sm text-gray-500">No hay citas para este día.</p>
              ) : dayDialogBookings.map((booking) => (
                <div key={booking.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold">{booking.client_name}</p>
                      <p className="text-sm text-gray-600">{booking.booking_time} · {locationNameById[booking.location_id] || 'Sede'}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => openBookingDetail(booking)}>Gestionar</Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Bloqueos</h4>
              {dayDialogBlocks.length === 0 ? (
                <p className="text-sm text-gray-500">No hay bloqueos en este día.</p>
              ) : dayDialogBlocks.map((block) => (
                <div key={block.id} className="border rounded-lg p-3 flex items-center justify-between gap-2 bg-gray-50">
                  <div>
                    <p className="font-medium text-sm">{block.reason || 'Bloqueo manual'}</p>
                    <p className="text-xs text-gray-600">{block.start_time} - {block.end_time}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => removeTimeBlock(block.id)}>
                    <Unlock className="h-4 w-4 mr-1" /> Habilitar
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedDay(null)}>Cerrar</Button>
            {selectedDay ? (
              <Button className="bg-gradient-to-r from-pink-500 to-rose-500 text-white" onClick={() => beginCreateBooking(selectedDay)}>
                <Plus className="h-4 w-4 mr-1" /> Nueva cita en este día
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminCalendar;

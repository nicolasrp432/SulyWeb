import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Lock,
  Unlock,
  Plus,
  Loader2,
  MessageCircle,
  Clock3,
  AlertCircle,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { useSearchParams } from 'react-router-dom';
import CalendarToolbar from '@/components/admin/calendar/CalendarToolbar';
import CalendarFiltersDrawer from '@/components/admin/calendar/CalendarFiltersDrawer';
import ActiveFiltersChips from '@/components/admin/calendar/ActiveFiltersChips';
import TeamDayView from '@/components/admin/calendar/TeamDayView';
import WeekGridView from '@/components/admin/calendar/WeekGridView';
import MonthGridView from '@/components/admin/calendar/MonthGridView';
import AgendaListView from '@/components/admin/calendar/AgendaListView';
import MobileStaffDayView from '@/components/admin/calendar/MobileStaffDayView';
import MobileMonthView from '@/components/admin/calendar/MobileMonthView';
import { STATUS_OPTIONS, SOURCE_OPTIONS } from '@/components/admin/calendar/statusStyles';
import DayDetailSheet from '@/components/admin/calendar/DayDetailSheet';
import NewBookingSheet from '@/components/admin/calendar/NewBookingSheet';
import BookingDetailDialog from '@/components/admin/calendar/BookingDetailDialog';
import EmailComposeModal from '@/components/admin/calendar/EmailComposeModal';
import DayAgendaPanel from '@/components/admin/calendar/DayAgendaPanel';
import { sendBookingConfirmationToUser } from '@/lib/emailService';
import { normalizeDayConfig } from '@/lib/businessHours';
import { useBookingActions } from '@/hooks/useBookingActions';

const VIEW_MODES = {
  day: 'day',
  week: 'week',
  month: 'month',
  agenda: 'agenda'
};

const DEFAULT_BOOKING_META = {
  status: 'pending',
  assigned_to: '',
  duration_minutes: 30,
  appointment_type: '',
  internal_notes: '',
  source: 'online'
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
    // El grid del mes pinta 42 días (incluye colas de meses adyacentes):
    // el rango de fetch debe cubrirlos para que esos días no salgan vacíos.
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const gridStart = getWeekStart(monthStart);
    const gridEnd = addDays(gridStart, 41);
    return { start: toISODate(gridStart), end: toISODate(gridEnd) };
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
  const [searchParams, setSearchParams] = useSearchParams();

  const initialDate = useMemo(() => {
    const dateParam = searchParams.get('date');
    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      const d = new Date(`${dateParam}T00:00:00`);
      if (!isNaN(d.getTime())) return d;
    }
    return new Date();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [viewMode, setViewMode] = useState(VIEW_MODES.day);
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [newBookingSheet, setNewBookingSheet] = useState(null);
  const [daySheetDate, setDaySheetDate] = useState(null);
  const [selectedAgendaDate, setSelectedAgendaDate] = useState(initialDate);

  // Sync URL ?date= changes (e.g. desde notificaciones) con la fecha visible
  useEffect(() => {
    const dateParam = searchParams.get('date');
    if (!dateParam || !/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) return;
    const d = new Date(`${dateParam}T00:00:00`);
    if (isNaN(d.getTime())) return;
    setCurrentDate(d);
    setSelectedAgendaDate(d);
    // Limpia el parámetro tras consumirlo para no bloquear navegación posterior
    const next = new URLSearchParams(searchParams);
    next.delete('date');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);
  const [emailModalBooking, setEmailModalBooking] = useState(null);
  const blocksSectionRef = React.useRef(null);

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
  const [filterOrigin, setFilterOrigin] = useState('all');

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
    // En móvil la agenda colapsa a vista día; la semana sí es usable
    // (scroll horizontal con snap, estilo Google Calendar móvil).
    if (isMobile && viewMode === VIEW_MODES.agenda) {
      setViewMode(VIEW_MODES.day);
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
      const originMatch = filterOrigin === 'all' || (booking.meta.source || 'online') === filterOrigin;

      if (!locationMatch || !statusMatch || !responsibleMatch || !originMatch) return false;

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
  }, [enrichedBookings, filterLocation, filterOrigin, filterResponsible, filterSearch, filterStatus]);

  // Citas llegadas de Google/iPhone a las que falta manicurista o servicio.
  const pendingSyncCount = useMemo(() => {
    return enrichedBookings.filter((b) =>
      (b.meta.source || b.origin) === 'calendar' &&
      b.meta.status !== 'cancelled' &&
      (!b.meta.assigned_to || b.services.length === 0)
    ).length;
  }, [enrichedBookings]);

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

  const responsibleOptions = useMemo(() => {
    const fromMeta = filteredBookings
      .map((booking) => booking.meta.assigned_to)
      .filter(Boolean);

    const fromTable = staffMembers.map((member) => member.full_name).filter(Boolean);
    return Array.from(new Set([...fromMeta, ...fromTable])).sort((a, b) => a.localeCompare(b));
  }, [filteredBookings, staffMembers]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterSearch?.trim()) count += 1;
    if (filterLocation && filterLocation !== 'all') count += 1;
    if (filterStatus && filterStatus !== 'all') count += 1;
    if (filterResponsible && filterResponsible !== 'all') count += 1;
    if (filterOrigin && filterOrigin !== 'all') count += 1;
    return count;
  }, [filterSearch, filterLocation, filterStatus, filterResponsible, filterOrigin]);

  const clearAllFilters = useCallback(() => {
    setFilterSearch('');
    setFilterLocation('all');
    setFilterStatus('all');
    setFilterResponsible('all');
    setFilterOrigin('all');
  }, []);

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

  // silent=true (por defecto) refresca en segundo plano sin desmontar la vista:
  // un spinner a pantalla completa en cada evento realtime cancelaría cualquier
  // drag en curso y hace "parpadear" el calendario.
  const fetchCalendarData = useCallback(async (opts = {}) => {
    if (!user) return;
    const silent = opts?.silent !== false;

    if (!silent) setLoading(true);
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
    fetchCalendarData({ silent: false });
  }, [fetchCalendarData]);

  // Debounce de los eventos realtime: con la sync de Google activa pueden llegar
  // ráfagas de cambios; un solo refetch silencioso agrupado es suficiente.
  const refetchTimerRef = React.useRef(null);
  const scheduleSilentRefetch = useCallback(() => {
    if (refetchTimerRef.current) clearTimeout(refetchTimerRef.current);
    refetchTimerRef.current = setTimeout(() => fetchCalendarData(), 400);
  }, [fetchCalendarData]);

  useEffect(() => () => {
    if (refetchTimerRef.current) clearTimeout(refetchTimerRef.current);
  }, []);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('admin-calendar-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => scheduleSilentRefetch())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'booking_services' }, () => scheduleSilentRefetch())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'schedule_blocks' }, () => scheduleSilentRefetch())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_staff' }, () => fetchStaffMembers())
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
  }, [fetchStaffMembers, scheduleSilentRefetch, user]);

  const saveBusinessHours = useCallback(async () => {
    try {
      // Normaliza todos los días al esquema de tramos antes de guardar.
      const normalized = Object.fromEntries(
        Object.entries(businessHours).map(([day, cfg]) => [day, normalizeDayConfig(cfg)])
      );
      const { error } = await supabase
        .from('settings')
        .upsert([{
          key: 'business_hours',
          value: normalized,
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

  // --- Sprint 3: acciones de cita en tiempo real ---

  const confirmBookingAction = useCallback(async (booking) => {
    if (!booking?.id) return;
    await updateBookingStatus(booking.id, 'confirmed');
    if (booking.client_email) {
      try {
        const services =
          booking.services?.map((s) => ({ name: s.name, price: s.price })) ||
          booking.booking_services?.map((bs) => ({
            name: bs.services?.name,
            price: bs.services?.price,
          })).filter((s) => s.name) ||
          [];
        const location = locations.find((l) => String(l.id) === String(booking.location_id));
        await sendBookingConfirmationToUser(
          {
            name: booking.client_name,
            email: booking.client_email,
            phone: booking.client_phone,
            date: booking.booking_date,
            time: booking.booking_time?.slice(0, 5),
            notes: booking.notes || '',
          },
          services,
          location
        );
        toast({ title: 'Cita confirmada', description: 'Correo de confirmación enviado.' });
      } catch (e) {
        console.error('Error enviando email:', e);
        toast({ title: 'Cita confirmada', description: 'Estado actualizado (correo no enviado).' });
      }
    } else {
      toast({ title: 'Cita confirmada' });
    }
  }, [updateBookingStatus, locations, toast]);

  const completeBookingAction = useCallback(async (booking) => {
    if (!booking?.id) return;
    await updateBookingStatus(booking.id, 'completed');
    toast({ title: 'Cita completada' });
  }, [updateBookingStatus, toast]);

  const cancelBookingAction = useCallback(async (booking) => {
    if (!booking?.id) return;
    await updateBookingStatus(booking.id, 'cancelled');
    toast({ title: 'Cita cancelada' });
  }, [updateBookingStatus, toast]);

  const deleteBookingAction = useCallback(async (booking) => {
    if (!booking?.id) return;
    if (!window.confirm(`¿Seguro que deseas eliminar permanentemente la cita de ${booking.client_name}? Esta acción no se puede deshacer.`)) return;

    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', booking.id);

      if (error) throw error;

      toast({ title: 'Cita eliminada', description: 'La cita ha sido eliminada de la base de datos.' });
      setSelectedBookingId(null);
      setIsDetailDialogOpen(false);
      fetchCalendarData();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'No se pudo eliminar la cita',
        description: error.message
      });
    }
  }, [fetchCalendarData, toast]);

  const callBookingAction = useCallback((booking) => {
    if (!booking?.client_phone) return;
    window.location.href = `tel:${booking.client_phone.replace(/\s+/g, '')}`;
  }, []);

  const moveBookingTo = useCallback(async (bookingId, newTime) => {
    if (!bookingId || !newTime) return;
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ booking_time: newTime + ':00' })
        .eq('id', bookingId);
      if (error) throw error;
      toast({ title: 'Cita movida', description: `Nueva hora: ${newTime}` });
      fetchCalendarData();
    } catch (e) {
      toast({ variant: 'destructive', title: 'No se pudo mover la cita', description: e.message });
    }
  }, [fetchCalendarData, toast]);

  const resizeBookingDuration = useCallback(async (bookingId, newDuration) => {
    if (!bookingId || !newDuration) return;
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ duration_minutes: newDuration })
        .eq('id', bookingId);
      if (error) throw error;
      toast({ title: 'Duración actualizada', description: `${newDuration} min` });
      fetchCalendarData();
    } catch (e) {
      toast({ variant: 'destructive', title: 'No se pudo cambiar la duración', description: e.message });
    }
  }, [fetchCalendarData, toast]);

  // Persistencia de la edición de cita compartida (hook central). Aquí solo se
  // añade el cierre del diálogo tras un guardado correcto.
  const { saveBookingEdits: persistBookingEdits } = useBookingActions({
    locations,
    onChange: fetchCalendarData,
  });
  const saveBookingEdits = useCallback(async (bookingId, formData) => {
    const ok = await persistBookingEdits(bookingId, formData);
    if (ok) {
      setSelectedBookingId(null);
      setIsDetailDialogOpen(false);
    }
  }, [persistBookingEdits]);

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

  const beginCreateBooking = useCallback((date = toISODate(currentDate), time = CONFIG.BOOKING.TIME_SLOTS[0], assignedTo = '') => {
    // Sprint 3: el flujo de creación va siempre al NewBookingSheet (móvil y desktop).
    setNewBookingSheet({
      date: typeof date === 'string' ? date : toISODate(date),
      time: time && time.length === 5 ? time : (time?.slice(0, 5) || '10:00'),
      assignedTo: assignedTo || '',
    });
  }, [currentDate]);

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

  const renderCalendarBody = () => {
    if (loading) {
      return (
        <div className="rounded-2xl border border-admin-border bg-white p-16 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-rose" />
        </div>
      );
    }

    if (viewMode === VIEW_MODES.day) {
      const dayProps = {
        date: currentDate,
        bookings: filteredBookings,
        blocks: timeBlocks,
        staffMembers,
        businessHours,
        onBookingClick: openBookingDetail,
        onSlotClick: (date, time, staff) => {
          setNewBookingSheet({
            date: toISODate(date),
            time,
            assignedTo: staff?.full_name || '',
          });
        },
        onBlockClick: removeTimeBlock,
        onMoveBooking: moveBookingTo,
        onResizeBooking: resizeBookingDuration,
      };
      const wrapperCls = 'rounded-2xl border border-admin-border bg-white shadow-sm overflow-hidden flex flex-col min-h-[60vh]';
      return (
        <div className={wrapperCls}>
          {isMobile
            ? <MobileStaffDayView {...dayProps} />
            : <TeamDayView {...dayProps} />}
        </div>
      );
    }
    if (viewMode === VIEW_MODES.week) {
      return (
        <WeekGridView
          weekDays={weekDays}
          bookings={filteredBookings}
          blocks={timeBlocks}
          businessHours={businessHours}
          isMobile={isMobile}
          onBookingClick={openBookingDetail}
          onSlotClick={(iso, time) => setNewBookingSheet({ date: iso, time, assignedTo: '' })}
          onBlockClick={removeTimeBlock}
          onMoveBooking={moveBookingTo}
          onResizeBooking={resizeBookingDuration}
          onDayHeaderClick={(d) => {
            setCurrentDate(d);
            setViewMode(VIEW_MODES.day);
          }}
        />
      );
    }
    if (viewMode === VIEW_MODES.month) {
      const monthGrid = isMobile ? (
        <div className="rounded-2xl border border-admin-border bg-white shadow-sm overflow-hidden">
          <MobileMonthView
            date={currentDate}
            bookings={filteredBookings}
            blocks={timeBlocks}
            selectedDate={selectedAgendaDate}
            onDayClick={(d) => {
              setSelectedAgendaDate(d);
              setDaySheetDate(d);
            }}
          />
        </div>
      ) : (
        <MonthGridView
          monthGridDays={monthGridDays}
          currentMonth={currentDate.getMonth()}
          bookingsByDay={bookingsByDay}
          blocksByDay={blocksByDay}
          businessHours={businessHours}
          selectedDate={selectedAgendaDate}
          onSelectDay={(d) => setSelectedAgendaDate(d)}
          onOpenDaySheet={(d) => setDaySheetDate(d)}
          onBookingClick={openBookingDetail}
          onNewBooking={(iso) => beginCreateBooking(iso)}
          onJumpToDay={(d) => {
            setSelectedAgendaDate(d);
            setSelectedDay(toISODate(d));
            setCurrentDate(d);
          }}
        />
      );

      return (
        <div className="space-y-4">
          {monthGrid}
          <DayAgendaPanel
            date={selectedAgendaDate}
            bookings={filteredBookings}
            onBookingClick={openBookingDetail}
            onNewBooking={(d) => setNewBookingSheet({
              date: toISODate(d || selectedAgendaDate),
              time: '10:00',
              assignedTo: '',
            })}
            onConfirm={confirmBookingAction}
            onComplete={completeBookingAction}
            onCancel={cancelBookingAction}
            onWa={handleOpenWaModal}
            onCall={callBookingAction}
            onEmail={(b) => setEmailModalBooking(b)}
          />
        </div>
      );
    }
    return (
      <AgendaListView
        bookings={filteredBookings}
        locationNameById={locationNameById}
        onBookingClick={openBookingDetail}
        onNewBooking={() => beginCreateBooking()}
        onComplete={completeBookingAction}
        onCancel={cancelBookingAction}
        onWa={handleOpenWaModal}
      />
    );
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

      <CalendarToolbar
        date={currentDate}
        viewMode={viewMode}
        realtimeConnected={realtimeConnected}
        activeFilterCount={activeFilterCount}
        pendingSyncCount={pendingSyncCount}
        onShowPendingSync={() => setFilterOrigin((prev) => (prev === 'calendar' ? 'all' : 'calendar'))}
        isMobile={isMobile}
        onPrev={() => moveCalendarCursor('prev')}
        onNext={() => moveCalendarCursor('next')}
        onToday={() => setCurrentDate(new Date())}
        onViewChange={setViewMode}
        onOpenFilters={() => setFiltersOpen(true)}
        onNewBooking={() => setNewBookingSheet({ date: toISODate(currentDate), time: '10:00', assignedTo: '' })}
        onBlock={() => {
          setIsHoursDialogOpen(true);
          setTimeout(() => {
            blocksSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 200);
        }}
        onRefresh={fetchCalendarData}
        onOpenHours={() => setIsHoursDialogOpen(true)}
      />

      <div className="max-w-7xl mx-auto pt-2">
        <ActiveFiltersChips
          filterSearch={filterSearch}
          filterLocation={filterLocation}
          filterStatus={filterStatus}
          filterResponsible={filterResponsible}
          filterOrigin={filterOrigin}
          locations={locations}
          statusOptions={STATUS_OPTIONS}
          sourceOptions={SOURCE_OPTIONS}
          onClearSearch={() => setFilterSearch('')}
          onClearLocation={() => setFilterLocation('all')}
          onClearStatus={() => setFilterStatus('all')}
          onClearResponsible={() => setFilterResponsible('all')}
          onClearOrigin={() => setFilterOrigin('all')}
          onClearAll={clearAllFilters}
        />

        {(!metaTableAvailable || !blocksTableAvailable || !staffTableAvailable) ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 flex items-start gap-3 shadow-sm mb-3">
            <AlertCircle className="h-5 w-5 mt-0.5 text-amber-600 shrink-0" />
            <div>
              <p className="font-bold text-sm">Modo de compatibilidad activo</p>
              <p className="mt-1 leading-relaxed">
                Faltan algunas tablas avanzadas en la base de datos de Supabase. Ejecuta la migración en <code>supabase/migrations/20260524_admin_calendar.sql</code> en tu editor SQL de Supabase para desbloquear las funciones persistentes de asignación de responsables, bloqueos manuales de horas y estados extendidos.
              </p>
            </div>
          </div>
        ) : null}

        {renderCalendarBody()}

        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-admin-muted px-1 pt-3">
          <span>
            Citas filtradas: <strong className="text-admin-text">{filteredBookings.length}</strong>
            <span className="mx-1">·</span>
            Bloqueos manuales: <strong className="text-admin-text">{timeBlocks.length}</strong>
          </span>
        </div>
      </div>

      <CalendarFiltersDrawer
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        filterSearch={filterSearch}
        onFilterSearchChange={setFilterSearch}
        filterLocation={filterLocation}
        onFilterLocationChange={setFilterLocation}
        filterStatus={filterStatus}
        onFilterStatusChange={setFilterStatus}
        filterResponsible={filterResponsible}
        onFilterResponsibleChange={setFilterResponsible}
        filterOrigin={filterOrigin}
        onFilterOriginChange={setFilterOrigin}
        locations={locations}
        statusOptions={STATUS_OPTIONS}
        sourceOptions={SOURCE_OPTIONS}
        responsibleOptions={responsibleOptions}
        onClearAll={clearAllFilters}
      />

      <NewBookingSheet
        open={!!newBookingSheet}
        onClose={() => setNewBookingSheet(null)}
        isMobile={isMobile}
        defaultDate={newBookingSheet?.date}
        defaultTime={newBookingSheet?.time}
        defaultAssignedTo={newBookingSheet?.assignedTo}
        locations={locations}
        responsibleOptions={responsibleOptions}
        staffMembers={staffMembers}
        onCreated={() => fetchCalendarData()}
        onBlock={async (payload) => {
          if (!blocksTableAvailable) {
            toast({ variant: 'destructive', title: 'Migración pendiente', description: 'La tabla schedule_blocks no está disponible.' });
            throw new Error('schedule_blocks no disponible');
          }
          const { error } = await supabase.from('schedule_blocks').insert([{
            ...payload,
            location_id: filterLocation === 'all' ? null : filterLocation,
          }]);
          if (error) throw error;
          toast({ title: 'Horario cerrado', description: `${payload.block_date} · ${payload.start_time?.slice(0, 5)}` });
          fetchCalendarData();
        }}
      />

      <DayDetailSheet
        open={!!daySheetDate}
        onClose={() => setDaySheetDate(null)}
        isMobile={isMobile}
        date={daySheetDate}
        bookings={filteredBookings}
        blocks={timeBlocks}
        onBookingClick={(b) => { setDaySheetDate(null); openBookingDetail(b); }}
        onConfirm={confirmBookingAction}
        onComplete={completeBookingAction}
        onCancel={cancelBookingAction}
        onWa={handleOpenWaModal}
        onCall={callBookingAction}
        onEmail={(b) => { setDaySheetDate(null); setEmailModalBooking(b); }}
        onNewBooking={() => {
          if (!daySheetDate) return;
          const iso = toISODate(daySheetDate);
          setDaySheetDate(null);
          setNewBookingSheet({ date: iso, time: '10:00', assignedTo: '' });
        }}
        onBlockFullDay={async () => {
          if (!daySheetDate) return;
          if (!blocksTableAvailable) {
            toast({ variant: 'destructive', title: 'Migración pendiente', description: 'La tabla schedule_blocks no está disponible.' });
            return;
          }
          if (!confirm('¿Bloquear este día completo? Los clientes no podrán reservar.')) return;
          try {
            const { error } = await supabase.from('schedule_blocks').insert([{
              block_date: toISODate(daySheetDate),
              start_time: null,
              end_time: null,
              location_id: filterLocation === 'all' ? null : filterLocation,
              reason: 'Bloqueo desde calendario',
            }]);
            if (error) throw error;
            toast({ title: 'Día bloqueado' });
            fetchCalendarData();
            setDaySheetDate(null);
          } catch (e) {
            toast({ variant: 'destructive', title: 'No se pudo bloquear', description: e.message });
          }
        }}
        onUnblock={(id) => removeTimeBlock(id)}
        onOpenDayView={() => {
          if (!daySheetDate) return;
          setCurrentDate(daySheetDate);
          setViewMode(VIEW_MODES.day);
          setDaySheetDate(null);
        }}
      />

      <BookingDetailDialog
        open={isDetailDialogOpen && !isCreatingBooking}
        onClose={resetDetailDialog}
        booking={activeBooking}
        locations={locations}
        responsibleOptions={responsibleOptions}
        onConfirm={confirmBookingAction}
        onComplete={completeBookingAction}
        onCancel={cancelBookingAction}
        onOpenWa={handleOpenWaModal}
        onOpenEmail={(b) => setEmailModalBooking(b)}
        onSave={saveBookingEdits}
        onDelete={deleteBookingAction}
      />

      <EmailComposeModal
        open={!!emailModalBooking}
        onClose={() => setEmailModalBooking(null)}
        booking={emailModalBooking}
      />
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
              const config = normalizeDayConfig(businessHours[dayKey]);
              const updateDay = (next) =>
                setBusinessHours((prev) => ({ ...prev, [dayKey]: next }));
              const updateShift = (idx, key, val) =>
                updateDay({
                  closed: false,
                  shifts: config.shifts.map((s, i) => (i === idx ? { ...s, [key]: val } : s)),
                });

              return (
                <div key={dayKey} className="flex flex-col gap-2 pt-3 first:pt-0">
                  <div className="flex items-center gap-3 shrink-0">
                    <input
                      type="checkbox"
                      id={`closed-${dayKey}`}
                      checked={!config.closed}
                      onChange={(e) =>
                        updateDay(
                          e.target.checked
                            ? { closed: false, shifts: config.shifts.length ? config.shifts : [{ open: '10:00', close: '20:00' }] }
                            : { closed: true, shifts: [] }
                        )
                      }
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
                    <div className="space-y-2 pl-7">
                      {config.shifts.map((sh, idx) => (
                        <div key={idx} className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] text-admin-muted font-medium">Abre:</span>
                          <Input
                            type="time"
                            value={sh.open}
                            onChange={(e) => updateShift(idx, 'open', e.target.value)}
                            className="h-8 w-[95px] text-xs py-1 px-2"
                          />
                          <span className="text-[10px] text-admin-muted font-medium">Cierra:</span>
                          <Input
                            type="time"
                            value={sh.close}
                            onChange={(e) => updateShift(idx, 'close', e.target.value)}
                            className="h-8 w-[95px] text-xs py-1 px-2"
                          />
                          {config.shifts.length > 1 && (
                            <button
                              type="button"
                              onClick={() => updateDay({ closed: false, shifts: config.shifts.filter((_, i) => i !== idx) })}
                              className="text-rose-500 hover:bg-rose-50 rounded-md p-1 transition-colors"
                              aria-label="Eliminar tramo"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => updateDay({ closed: false, shifts: [...config.shifts, { open: '16:00', close: '20:00' }] })}
                        className="flex items-center gap-1 text-[11px] font-bold text-brand-rose hover:bg-brand-rose-50 rounded-md px-2 py-1 transition-colors"
                      >
                        <Plus className="w-3 h-3" /> Añadir tramo (cierre a mediodía)
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div ref={blocksSectionRef} className="mt-6 pt-5 border-t border-admin-border/30">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="text-sm font-bold text-admin-text flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-600" /> Bloqueos puntuales
                </h4>
                <p className="text-xs text-admin-muted mt-0.5">
                  Vacaciones, eventos o pausas. Los clientes no podrán reservar en esos huecos.
                </p>
              </div>
            </div>

            <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
              {timeBlocks.length === 0 ? (
                <p className="text-xs text-admin-muted italic text-center py-3">Sin bloqueos activos</p>
              ) : (
                [...timeBlocks]
                  .sort((a, b) => (a.block_date || '').localeCompare(b.block_date || ''))
                  .map((b) => (
                    <div key={b.id} className="flex items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50/60 px-2.5 py-1.5">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-amber-800">
                          {formatHumanDate(b.block_date, { weekday: 'short', day: 'numeric', month: 'short' })}
                          {b.start_time ? (
                            <span className="ml-1.5 text-amber-700">
                              · {b.start_time?.slice(0, 5)} – {b.end_time?.slice(0, 5) || '23:59'}
                            </span>
                          ) : (
                            <span className="ml-1.5 text-amber-700">· Todo el día</span>
                          )}
                        </p>
                        {b.reason && <p className="text-[10px] text-amber-700 truncate">{b.reason}</p>}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeTimeBlock(b.id)}
                        className="text-[10px] font-bold text-amber-700 border border-amber-300 rounded-md px-2 py-1 hover:bg-amber-100 transition-colors"
                      >
                        Quitar
                      </button>
                    </div>
                  ))
              )}
            </div>

            <NewBlockInlineForm
              defaultLocation={filterLocation === 'all' ? null : filterLocation}
              disabled={!blocksTableAvailable}
              onCreate={async (payload) => {
                if (!blocksTableAvailable) {
                  toast({ variant: 'destructive', title: 'Migración pendiente', description: 'La tabla schedule_blocks no está disponible.' });
                  return;
                }
                try {
                  const { error } = await supabase.from('schedule_blocks').insert([payload]);
                  if (error) throw error;
                  toast({ title: 'Bloqueo creado' });
                  fetchCalendarData();
                } catch (e) {
                  toast({ variant: 'destructive', title: 'No se pudo crear', description: e.message });
                }
              }}
            />
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

const NewBlockInlineForm = ({ defaultLocation, disabled, onCreate }) => {
  const [date, setDate] = useState('');
  const [allDay, setAllDay] = useState(true);
  const [start, setStart] = useState('10:00');
  const [end, setEnd] = useState('12:00');
  const [reason, setReason] = useState('');

  const reset = () => {
    setDate('');
    setAllDay(true);
    setStart('10:00');
    setEnd('12:00');
    setReason('');
  };

  const canSave = !!date && (allDay || (start && end));

  const handleAdd = async () => {
    if (!canSave) return;
    await onCreate({
      block_date: date,
      start_time: allDay ? null : `${start}:00`,
      end_time: allDay ? null : `${end}:00`,
      location_id: defaultLocation,
      reason: reason || (allDay ? 'Bloqueo de día' : 'Bloqueo horario'),
    });
    reset();
  };

  return (
    <div className="mt-3 rounded-xl border border-dashed border-admin-border bg-admin-bg/40 p-3 space-y-2">
      <p className="text-[11px] font-bold text-admin-text uppercase tracking-wider">Añadir bloqueo</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          disabled={disabled}
          className="h-9 text-xs"
        />
        <label className="flex items-center gap-2 text-xs font-bold text-admin-text px-2">
          <input
            type="checkbox"
            checked={allDay}
            onChange={(e) => setAllDay(e.target.checked)}
            disabled={disabled}
            className="w-4 h-4 rounded text-brand-rose focus:ring-brand-rose"
          />
          Todo el día
        </label>
      </div>
      {!allDay && (
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-admin-muted font-medium">Desde:</span>
            <Input type="time" value={start} onChange={(e) => setStart(e.target.value)} disabled={disabled} className="h-9 text-xs" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-admin-muted font-medium">Hasta:</span>
            <Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} disabled={disabled} className="h-9 text-xs" />
          </div>
        </div>
      )}
      <Input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Motivo (opcional)"
        disabled={disabled}
        className="h-9 text-xs placeholder:italic placeholder:text-gray-400"
      />
      <Button
        size="sm"
        disabled={!canSave || disabled}
        onClick={handleAdd}
        className="w-full h-9 bg-gradient-rose-gold text-white font-bold disabled:opacity-50"
      >
        <Plus className="w-3.5 h-3.5 mr-1.5" /> Añadir bloqueo
      </Button>
    </div>
  );
};

export default CalendarPage;

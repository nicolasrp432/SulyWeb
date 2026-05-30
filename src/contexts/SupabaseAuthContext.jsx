import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';

import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const { toast } = useToast();

  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adminProfile, setAdminProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const fetchProfileToken = useRef(0);

  const loadAdminProfile = useCallback(async (uid) => {
    if (!uid) {
      setAdminProfile(null);
      return null;
    }
    const token = ++fetchProfileToken.current;
    setProfileLoading(true);
    const { data, error } = await supabase
      .from('admin_profiles')
      .select('id, email, full_name, role, is_active')
      .eq('id', uid)
      .maybeSingle();

    if (token !== fetchProfileToken.current) return null; // stale

    if (error && error.code !== 'PGRST116') {
      console.error('Error cargando admin_profile:', error);
    }
    const profile = data && data.is_active ? data : null;
    setAdminProfile(profile);
    setProfileLoading(false);
    return profile;
  }, []);

  const handleSession = useCallback(async (nextSession) => {
    setSession(nextSession);
    const nextUser = nextSession?.user ?? null;
    setUser(nextUser);
    if (nextUser) {
      await loadAdminProfile(nextUser.id);
    } else {
      setAdminProfile(null);
    }
    setLoading(false);
  }, [loadAdminProfile]);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session: initial } } = await supabase.auth.getSession();
      handleSession(initial);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, nextSession) => {
        handleSession(nextSession);
      }
    );

    return () => subscription.unsubscribe();
  }, [handleSession]);

  // Si el admin desactiva a este user mientras está logueado, lo reflejamos al instante.
  useEffect(() => {
    if (!user?.id) return undefined;
    const channel = supabase
      .channel(`admin-profile-self-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'admin_profiles', filter: `id=eq.${user.id}` },
        () => { loadAdminProfile(user.id); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, loadAdminProfile]);

  const refreshAdminProfile = useCallback(async () => {
    if (!user?.id) return null;
    return loadAdminProfile(user.id);
  }, [user?.id, loadAdminProfile]);

  const signIn = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast({
        variant: 'destructive',
        title: 'No se pudo iniciar sesión',
        description: error.message || 'Credenciales incorrectas',
      });
    }
    return { error };
  }, [toast]);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error al cerrar sesión',
        description: error.message,
      });
    }
    setAdminProfile(null);
    return { error };
  }, [toast]);

  const isAuthorized = Boolean(adminProfile && adminProfile.is_active);
  const isOwner = isAuthorized && adminProfile?.role === 'owner';

  const value = useMemo(() => ({
    user,
    session,
    loading: loading || profileLoading,
    adminProfile,
    isAuthorized,
    isOwner,
    signIn,
    signOut,
    refreshAdminProfile,
  }), [user, session, loading, profileLoading, adminProfile, isAuthorized, isOwner, signIn, signOut, refreshAdminProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

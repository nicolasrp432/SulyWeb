import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Users, Check, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import PageHeader from '@/components/admin/PageHeader';
import ManicuristTeamSection from '@/components/admin/ManicuristTeamSection';

const TeamPage = () => {
  const [locations, setLocations] = useState([]);
  const [flash, setFlash] = useState('');
  const [error, setError] = useState('');

  const showFlash = (msg) => { setFlash(msg); setTimeout(() => setFlash(''), 2500); };
  const showError = (msg) => { setError(msg); setTimeout(() => setError(''), 4000); };

  useEffect(() => {
    supabase.from('locations').select('id, name').then(({ data }) => setLocations(data ?? []));
  }, []);

  return (
    <>
      <Helmet><title>Equipo — Admin Suly</title></Helmet>
      <div className="max-w-3xl mx-auto space-y-5">
        <PageHeader
          icon={Users}
          title="Equipo"
          subtitle="Añade o quita manicuristas. Los cambios se reflejan al instante en el calendario y en el alta de citas."
        />

        {flash && <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 flex items-center gap-2"><Check className="w-3.5 h-3.5" /> {flash}</p>}
        {error && <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2 flex items-center gap-2"><AlertCircle className="w-3.5 h-3.5" /> {error}</p>}

        <ManicuristTeamSection locations={locations} onFlash={showFlash} onError={showError} />
      </div>
    </>
  );
};

export default TeamPage;

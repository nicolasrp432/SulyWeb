import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';

/**
 * Hook que ejecuta una query a Supabase y se mantiene sincronizado en tiempo real.
 *
 * @param {string} table - nombre de la tabla a observar para postgres_changes
 * @param {() => Promise<{ data, error }>} queryFn - función que ejecuta la query (suele ser una expression con supabase.from(...))
 * @param {Array} deps - dependencias para recrear queryFn (default vacío)
 * @returns {{ data, loading, error, refetch }}
 */
export function useSupabaseTable(table, queryFn, deps = []) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableQuery = useCallback(queryFn, deps);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data: rows, error: err } = await stableQuery();
      if (err) throw err;
      setData(rows ?? []);
      setError(null);
    } catch (e) {
      console.error(`[useSupabaseTable:${table}]`, e);
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [stableQuery, table]);

  useEffect(() => {
    refetch();
    const channel = supabase
      .channel(`rt-${table}-${Math.random().toString(36).slice(2, 8)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
        refetch();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch, table]);

  return { data, loading, error, refetch };
}

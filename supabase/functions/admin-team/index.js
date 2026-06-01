// Edge Function: admin-team
// Owner-only management of admin users (create with password, set password, set role, delete).
// Lets the panel manage the team without visiting the Supabase dashboard.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const VALID_ROLES = ['admin', 'owner'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });

  if (!SUPABASE_URL || !SERVICE_KEY) {
    return json(500, { error: 'Server misconfigured: missing Supabase env vars' });
  }

  // Service-role client for privileged operations.
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // --- Authenticate caller and confirm they are an active owner ---
  const authHeader = req.headers.get('Authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) return json(401, { error: 'No autenticado' });

  let callerId;
  try {
    const userClient = createClient(SUPABASE_URL, ANON_KEY || SERVICE_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return json(401, { error: 'Sesión inválida' });
    callerId = userData.user.id;
  } catch (_e) {
    return json(401, { error: 'Sesión inválida' });
  }

  const { data: callerProfile, error: callerErr } = await admin
    .from('admin_profiles')
    .select('role, is_active')
    .eq('id', callerId)
    .maybeSingle();
  if (callerErr) return json(500, { error: 'Error verificando permisos: ' + callerErr.message });
  if (!callerProfile || callerProfile.role !== 'owner' || !callerProfile.is_active) {
    return json(403, { error: 'Solo un owner activo puede gestionar el equipo' });
  }

  // --- Parse body ---
  let body;
  try {
    body = await req.json();
  } catch (_e) {
    return json(400, { error: 'JSON inválido' });
  }
  const action = body?.action;

  try {
    switch (action) {
      case 'create': {
        const email = (body.email || '').trim().toLowerCase();
        const password = body.password || '';
        const full_name = (body.full_name || '').trim() || null;
        const role = VALID_ROLES.includes(body.role) ? body.role : 'admin';
        if (!email) return json(400, { error: 'Email requerido' });
        if (!password || password.length < 8) {
          return json(400, { error: 'La contraseña debe tener al menos 8 caracteres' });
        }

        const { data: created, error: createErr } = await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        });
        if (createErr) return json(400, { error: 'No se pudo crear el usuario: ' + createErr.message });

        const newId = created.user.id;
        const { error: profErr } = await admin.from('admin_profiles').insert([
          { id: newId, email, full_name, role, is_active: true },
        ]);
        if (profErr) {
          // Roll back the auth user so we don't leave an orphan.
          await admin.auth.admin.deleteUser(newId);
          if (profErr.code === '23505') {
            return json(409, { error: 'Ese usuario ya tiene un perfil admin' });
          }
          return json(500, { error: 'Usuario creado pero falló el perfil: ' + profErr.message });
        }
        return json(200, { ok: true, id: newId });
      }

      case 'set_password': {
        const user_id = body.user_id;
        const password = body.password || '';
        if (!user_id) return json(400, { error: 'user_id requerido' });
        if (!password || password.length < 8) {
          return json(400, { error: 'La contraseña debe tener al menos 8 caracteres' });
        }
        const { error: updErr } = await admin.auth.admin.updateUserById(user_id, { password });
        if (updErr) return json(400, { error: 'No se pudo cambiar la contraseña: ' + updErr.message });
        return json(200, { ok: true });
      }

      case 'set_role': {
        const user_id = body.user_id;
        const role = body.role;
        if (!user_id) return json(400, { error: 'user_id requerido' });
        if (!VALID_ROLES.includes(role)) return json(400, { error: 'Rol inválido' });
        if (user_id === callerId && role !== 'owner') {
          return json(400, { error: 'No puedes quitarte el rol de owner a ti mismo' });
        }
        const { error: roleErr } = await admin
          .from('admin_profiles')
          .update({ role })
          .eq('id', user_id);
        if (roleErr) return json(500, { error: 'No se pudo cambiar el rol: ' + roleErr.message });
        return json(200, { ok: true });
      }

      case 'delete': {
        const user_id = body.user_id;
        if (!user_id) return json(400, { error: 'user_id requerido' });
        if (user_id === callerId) return json(400, { error: 'No puedes eliminar tu propia cuenta' });
        await admin.from('admin_profiles').delete().eq('id', user_id);
        const { error: delErr } = await admin.auth.admin.deleteUser(user_id);
        if (delErr) return json(500, { error: 'Perfil eliminado pero falló borrar la cuenta: ' + delErr.message });
        return json(200, { ok: true });
      }

      default:
        return json(400, { error: 'Acción desconocida' });
    }
  } catch (e) {
    return json(500, { error: 'Error inesperado: ' + (e?.message || e) });
  }
});

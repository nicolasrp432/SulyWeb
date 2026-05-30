-- ============================================================================
-- admin_profiles: autorización de acceso al panel admin
-- ============================================================================
-- Tabla de perfiles admin ligada 1:1 a auth.users.
-- - role: 'owner' (puede gestionar otros admins) | 'admin' (solo acceso al panel)
-- - is_active: si false, ProtectedRoute en el frontend bloquea el acceso
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.admin_profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       text NOT NULL,
  full_name   text,
  role        text NOT NULL DEFAULT 'admin' CHECK (role IN ('owner','admin')),
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_profiles_email ON public.admin_profiles(email);

-- Trigger para mantener updated_at
CREATE OR REPLACE FUNCTION public.admin_profiles_set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_admin_profiles_updated_at ON public.admin_profiles;
CREATE TRIGGER trg_admin_profiles_updated_at
  BEFORE UPDATE ON public.admin_profiles
  FOR EACH ROW EXECUTE FUNCTION public.admin_profiles_set_updated_at();

-- ============================================================================
-- RLS
-- ============================================================================

ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

-- Cualquier user autenticado puede leer la lista (para gestionar equipo).
DROP POLICY IF EXISTS admin_profiles_select_authenticated ON public.admin_profiles;
CREATE POLICY admin_profiles_select_authenticated ON public.admin_profiles
  FOR SELECT TO authenticated USING (true);

-- Solo owners pueden INSERT/UPDATE/DELETE perfiles admin.
DROP POLICY IF EXISTS admin_profiles_write_owner ON public.admin_profiles;
CREATE POLICY admin_profiles_write_owner ON public.admin_profiles
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.admin_profiles
    WHERE id = auth.uid() AND role = 'owner' AND is_active
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.admin_profiles
    WHERE id = auth.uid() AND role = 'owner' AND is_active
  ));

-- ============================================================================
-- Helpers
-- ============================================================================

-- Devuelve true si auth.uid() corresponde a un perfil activo.
-- Útil para usar en políticas RLS de otras tablas (citas, servicios, etc.).
CREATE OR REPLACE FUNCTION public.is_admin_active() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_profiles
    WHERE id = auth.uid() AND is_active
  )
$$;

REVOKE ALL ON FUNCTION public.is_admin_active() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin_active() TO authenticated;

-- Resuelve email -> user_id consultando auth.users (que el cliente no puede leer
-- directamente). Necesario para activar admins desde la UI sin service_role key.
CREATE OR REPLACE FUNCTION public.find_user_id_by_email(p_email text)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT id FROM auth.users WHERE email = lower(p_email) LIMIT 1
$$;

REVOKE ALL ON FUNCTION public.find_user_id_by_email(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.find_user_id_by_email(text) TO authenticated;

-- ============================================================================
-- PROCEDIMIENTO MANUAL para crear el primer OWNER
-- ============================================================================
-- 1) Aplica esta migración en Supabase SQL Editor.
-- 2) Ve a Authentication > Users > Add user (manual): tu email + password,
--    marca "Auto Confirm User".
-- 3) Copia el UUID que aparece en la nueva fila.
-- 4) Ejecuta en SQL Editor:
--
--    INSERT INTO public.admin_profiles (id, email, full_name, role, is_active)
--    VALUES ('<UUID_COPIADO>', '<tu_email>', 'Tu nombre', 'owner', true);
--
-- 5) Login en /admin/login. Desde ahí podrás invitar a tu equipo desde
--    /admin/configuracion > Equipo administrador.
-- ============================================================================

-- ============================================================================
-- SQL Migration: RLS Policies for Services Table
-- ============================================================================
-- Ensures that the public can read services, but only authenticated active
-- admins can create, update, or delete services.
-- ============================================================================

-- 1. Enable Row Level Security (RLS) on public.services
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- 2. Policy: Allow anyone (public anon/authenticated) to read active services
DROP POLICY IF EXISTS "services public read" ON public.services;
CREATE POLICY "services public read" ON public.services
  FOR SELECT USING (true);

-- 3. Policy: Allow only authenticated, active admin users to make changes (write/edit)
DROP POLICY IF EXISTS "services admin write" ON public.services;
CREATE POLICY "services admin write" ON public.services
  FOR ALL
  TO authenticated
  USING (
    COALESCE(
      (SELECT EXISTS (
        SELECT 1 FROM public.admin_profiles
        WHERE id = auth.uid() AND is_active
      )),
      false
    )
  )
  WITH CHECK (
    COALESCE(
      (SELECT EXISTS (
        SELECT 1 FROM public.admin_profiles
        WHERE id = auth.uid() AND is_active
      )),
      false
    )
  );

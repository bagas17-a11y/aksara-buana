-- Migration 006: Add at_office trip status + driver self-service policies

-- Extend trips status to include at_office (driver manually marks return to office)
ALTER TABLE public.trips DROP CONSTRAINT IF EXISTS trips_status_check;
ALTER TABLE public.trips ADD CONSTRAINT trips_status_check
  CHECK (status IN ('assigned','pre_check_done','in_transit','delivered','at_office','completed','cancelled'));

-- Allow all authenticated staff to read active driver locations (for driver teammate map)
DROP POLICY IF EXISTS "Drivers read all active locations" ON public.driver_locations;
CREATE POLICY "Drivers read all active locations" ON public.driver_locations
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow drivers to update their own profile (vehicle plate)
DROP POLICY IF EXISTS "Drivers update own profile" ON public.profiles;
CREATE POLICY "Drivers update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

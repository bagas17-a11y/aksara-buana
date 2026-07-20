-- Add vehicle_type to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS vehicle_type text CHECK (vehicle_type IN ('car', 'motorcycle'));

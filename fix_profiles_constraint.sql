-- Fix the profiles table to remove auth.users foreign key constraint
-- Run this in your Supabase SQL Editor

-- Drop the foreign key constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Make the id column use gen_random_uuid() as default
ALTER TABLE public.profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Verify the change
SELECT 
    conname as constraint_name,
    contype as constraint_type
FROM pg_constraint 
WHERE conrelid = 'public.profiles'::regclass;

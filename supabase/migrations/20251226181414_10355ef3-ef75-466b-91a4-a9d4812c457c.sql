-- Add 'ativo' column to profiles table for enabling/disabling users
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ativo boolean NOT NULL DEFAULT true;
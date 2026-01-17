-- Update profiles to store multiple preferences as array
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS preferences text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS linkedin_url text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS google_calendar_connected boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS google_refresh_token text;

-- Create user_shares table for NFC sharing
CREATE TABLE public.user_shares (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  share_code text NOT NULL UNIQUE,
  name text NOT NULL,
  linkedin_url text,
  phone text,
  context text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '5 minutes')
);

-- Enable RLS
ALTER TABLE public.user_shares ENABLE ROW LEVEL SECURITY;

-- Users can create their own shares
CREATE POLICY "Users can create their own shares"
ON public.user_shares
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own shares
CREATE POLICY "Users can view their own shares"
ON public.user_shares
FOR SELECT
USING (auth.uid() = user_id);

-- Users can delete their own shares
CREATE POLICY "Users can delete their own shares"
ON public.user_shares
FOR DELETE
USING (auth.uid() = user_id);

-- Anyone can read share by code (for receiving NFC)
CREATE POLICY "Anyone can read share by code"
ON public.user_shares
FOR SELECT
USING (true);

-- Create index for quick share_code lookup
CREATE INDEX idx_user_shares_code ON public.user_shares(share_code);

-- Add contacts linkedin and phone columns
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS linkedin_url text,
  ADD COLUMN IF NOT EXISTS phone text;
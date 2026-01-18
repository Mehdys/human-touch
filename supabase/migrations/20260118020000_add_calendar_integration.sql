-- Add calendar integration support to CatchUp

-- Add calendar connection fields to profiles
ALTER TABLE public.profiles 
ADD COLUMN google_calendar_connected BOOLEAN DEFAULT false,
ADD COLUMN calendar_token_expires_at TIMESTAMPTZ;

-- Create table for calendar event sync
CREATE TABLE public.calendar_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  catchup_id UUID REFERENCES public.catchups(id) ON DELETE CASCADE,
  google_event_id TEXT NOT NULL,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes for efficient queries
CREATE INDEX idx_calendar_events_user ON public.calendar_events(user_id, created_at DESC);
CREATE INDEX idx_calendar_events_google ON public.calendar_events(google_event_id);
CREATE INDEX idx_calendar_events_catchup ON public.calendar_events(catchup_id);

-- Enable RLS
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- Create policies for calendar_events
CREATE POLICY "Users can view their own calendar events" 
ON public.calendar_events 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own calendar events" 
ON public.calendar_events 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own calendar events" 
ON public.calendar_events 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calendar events" 
ON public.calendar_events 
FOR DELETE 
USING (auth.uid() = user_id);

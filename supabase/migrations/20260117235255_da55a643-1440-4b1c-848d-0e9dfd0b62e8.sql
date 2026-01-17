-- Create events table
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  location TEXT,
  event_type TEXT DEFAULT 'networking',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add event_id to contacts table
ALTER TABLE public.contacts 
ADD COLUMN event_id UUID REFERENCES public.events(id) ON DELETE SET NULL;

-- Add followed_up_at for analytics tracking (% followed up within 72h)
ALTER TABLE public.contacts 
ADD COLUMN followed_up_at TIMESTAMP WITH TIME ZONE;

-- Enable RLS on events
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- RLS policies for events
CREATE POLICY "Users can view their own events"
ON public.events
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own events"
ON public.events
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own events"
ON public.events
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own events"
ON public.events
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at on events
CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index for faster queries
CREATE INDEX idx_contacts_event_id ON public.contacts(event_id);
CREATE INDEX idx_events_user_id ON public.events(user_id);
CREATE INDEX idx_events_event_date ON public.events(event_date DESC);
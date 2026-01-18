-- Create events table for event-centric architecture
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add index for active event lookups
CREATE INDEX idx_events_user_active ON public.events(user_id, is_active, date DESC);

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Create policies for events
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

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add event_id to contacts table
ALTER TABLE public.contacts 
ADD COLUMN event_id UUID REFERENCES public.events(id) ON DELETE SET NULL;

-- Add index for event-based contact lookups
CREATE INDEX idx_contacts_event ON public.contacts(event_id, created_at DESC);

-- Add urgency-related fields to contacts
ALTER TABLE public.contacts
ADD COLUMN contacted BOOLEAN DEFAULT false,
ADD COLUMN contacted_at TIMESTAMP WITH TIME ZONE;

-- WorkNearby Supabase Schema Definitions

-- 1. Create Gigs Table
CREATE TABLE IF NOT EXISTS public.gigs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT '₹',
  date TIMESTAMPTZ NOT NULL,
  duration TEXT,
  location JSONB NOT NULL, -- Stores { lat, lng, address }
  posted_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  posted_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'booked', 'completed', 'cancelled')),
  accepted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.gigs ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Allow anyone (authenticated or anonymous) to view active gigs
CREATE POLICY "Anyone can view active gigs"
  ON public.gigs FOR SELECT
  USING (true);

-- Allow authenticated users to insert new gigs
CREATE POLICY "Authenticated users can insert gigs"
  ON public.gigs FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = posted_by);

-- Allow users to update gigs they posted or accepted
CREATE POLICY "Users can update relevant gigs"
  ON public.gigs FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = posted_by OR (SELECT auth.uid()) = accepted_by OR status = 'active')
  WITH CHECK (true);

-- 4. Enable Realtime for gigs
ALTER PUBLICATION supabase_realtime ADD TABLE public.gigs;

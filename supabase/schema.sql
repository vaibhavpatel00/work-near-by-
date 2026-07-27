-- WorkNearby / wikwik Supabase Schema Definitions & Migrations

-- 1. Create Gigs Table if not exists
CREATE TABLE IF NOT EXISTS public.gigs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT '₹',
  date TIMESTAMPTZ NOT NULL,
  duration TEXT,
  location JSONB NOT NULL,
  posted_by TEXT,
  posted_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'active',
  accepted_by TEXT,
  contact_details JSONB,
  attachments JSONB,
  expiry_date TIMESTAMPTZ,
  max_applications INTEGER DEFAULT 5,
  requests JSONB DEFAULT '[]'::jsonb
);

-- 2. Migrations for existing tables
ALTER TABLE public.gigs ADD COLUMN IF NOT EXISTS contact_details JSONB;
ALTER TABLE public.gigs ADD COLUMN IF NOT EXISTS attachments JSONB;
ALTER TABLE public.gigs ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMPTZ;
ALTER TABLE public.gigs ADD COLUMN IF NOT EXISTS max_applications INTEGER DEFAULT 5;
ALTER TABLE public.gigs ADD COLUMN IF NOT EXISTS requests JSONB DEFAULT '[]'::jsonb;

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.gigs ENABLE ROW LEVEL SECURITY;

-- 4. Open RLS Policies for Public Marketplace Access
DROP POLICY IF EXISTS "Anyone can view active gigs" ON public.gigs;
DROP POLICY IF EXISTS "Anyone can view gigs" ON public.gigs;
CREATE POLICY "Anyone can view gigs"
  ON public.gigs FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert gigs" ON public.gigs;
DROP POLICY IF EXISTS "Anyone can insert gigs" ON public.gigs;
CREATE POLICY "Anyone can insert gigs"
  ON public.gigs FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update relevant gigs" ON public.gigs;
DROP POLICY IF EXISTS "Anyone can update gigs" ON public.gigs;
CREATE POLICY "Anyone can update gigs"
  ON public.gigs FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 5. Enable Realtime for gigs
ALTER PUBLICATION supabase_realtime ADD TABLE public.gigs;

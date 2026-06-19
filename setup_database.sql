-- ==========================================
-- SUPABASE DATABASE SETUP SCRIPT
-- Paste and run this script in your Supabase SQL Editor
-- ==========================================

-- 1. Create the chats table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.chats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    message TEXT NOT NULL,
    response TEXT DEFAULT '',
    mood TEXT DEFAULT 'cute',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies (Allow anyone to view, insert, edit, and delete messages)
DROP POLICY IF EXISTS "Allow public select" ON public.chats;
CREATE POLICY "Allow public select" ON public.chats 
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert" ON public.chats;
CREATE POLICY "Allow public insert" ON public.chats 
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update" ON public.chats;
CREATE POLICY "Allow public update" ON public.chats 
    FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public delete" ON public.chats;
CREATE POLICY "Allow public delete" ON public.chats 
    FOR DELETE USING (true);

-- 4. Enable Supabase Realtime Replication for the chats table safely
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_publication_rel pr
        JOIN pg_publication p ON p.oid = pr.prpubid
        JOIN pg_class c ON c.oid = pr.prrelid
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE p.pubname = 'supabase_realtime' 
          AND c.relname = 'chats' 
          AND n.nspname = 'public'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.chats;
    END IF;
END $$;

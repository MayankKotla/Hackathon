-- STEP-BY-STEP SUPABASE STORAGE FIX
-- Run each section separately in Supabase SQL Editor

-- STEP 1: Check current bucket status
SELECT * FROM storage.buckets WHERE id = 'media';

-- STEP 2: Force create/update the media bucket
DELETE FROM storage.buckets WHERE id = 'media';

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media',
  true,
  52428800,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime']
);

-- STEP 3: Verify bucket was created
SELECT * FROM storage.buckets WHERE id = 'media';

-- STEP 4: Drop ALL existing storage policies (run this multiple times if needed)
DO $$
DECLARE
    policy_name TEXT;
BEGIN
    FOR policy_name IN 
        SELECT policyname FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', policy_name);
    END LOOP;
END $$;

-- STEP 5: Create simple, working policies
CREATE POLICY "media_read_policy" ON storage.objects
FOR SELECT USING (bucket_id = 'media');

CREATE POLICY "media_insert_policy" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'media');

CREATE POLICY "media_update_policy" ON storage.objects
FOR UPDATE USING (bucket_id = 'media');

CREATE POLICY "media_delete_policy" ON storage.objects
FOR DELETE USING (bucket_id = 'media');

-- STEP 6: Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects';

-- STEP 7: Test bucket access
SELECT * FROM storage.objects WHERE bucket_id = 'media' LIMIT 1;

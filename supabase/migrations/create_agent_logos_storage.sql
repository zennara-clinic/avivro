-- Create storage bucket for agent logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('agent-logos', 'agent-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for agent-logos bucket
-- Allow authenticated users to upload their own agent logos
CREATE POLICY "Users can upload their agent logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'agent-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to update their own agent logos
CREATE POLICY "Users can update their agent logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'agent-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to delete their own agent logos
CREATE POLICY "Users can delete their agent logos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'agent-logos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public read access to all agent logos
CREATE POLICY "Public can view agent logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'agent-logos');

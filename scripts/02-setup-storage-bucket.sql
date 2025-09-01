-- Create storage bucket for donation photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('donation-photos', 'donation-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy to allow authenticated users to upload photos
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'donation-photos' AND
  auth.role() = 'authenticated'
);

-- Create policy to allow public access to photos
CREATE POLICY "Allow public access" ON storage.objects
FOR SELECT USING (bucket_id = 'donation-photos');

-- Create policy to allow admin to delete photos
CREATE POLICY "Allow admin to delete photos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'donation-photos' AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

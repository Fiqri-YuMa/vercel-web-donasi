-- Create default admin user for PMI Kabupaten Cianjur
-- This script should be run after the first admin signs up through the normal signup process

-- Instructions:
-- 1. First, have the admin sign up normally through /auth/signup with email: admin@pmicianjur.org
-- 2. Then run this script to update their role to admin

-- Update the user role to admin (replace the email with the actual admin email)
UPDATE public.profiles 
SET 
  role = 'admin',
  full_name = 'Administrator PMI Cianjur',
  phone = '0263-123456',
  address = 'Kantor PMI Kabupaten Cianjur'
WHERE email = 'admin@pmicianjur.org';

-- Alternative: If you want to create admin directly (not recommended for production)
-- You would need to insert into auth.users first, but this is handled by Supabase Auth

-- For development/testing, you can create a test admin:
Email: admin@test.com
Password: admin123 (set during signup)

-- Then update the role:
UPDATE public.profiles 
SET role = 'admin', full_name = 'Test Admin'
WHERE email = 'admin@test.com';

-- Create test coordinator for development
Email: koor@test.com  
Password: koor123 (set during signup)
UPDATE public.profiles 
SET role = 'koor', full_name = 'Test Koordinator'
WHERE email = 'koor@test.com';

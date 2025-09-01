-- Create users table with role-based access for PMI system
-- Enable RLS
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create profiles table to extend auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'koor', 'publik')) DEFAULT 'publik',
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admin can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create categories table for donation items
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default categories
INSERT INTO public.categories (name, description) VALUES
  ('Alat Masak', 'Peralatan memasak dan dapur'),
  ('Alat Kebersihan', 'Peralatan kebersihan dan sanitasi'),
  ('Obat-obatan', 'Obat-obatan dan peralatan medis'),
  ('Bahan Pokok', 'Makanan dan kebutuhan pokok'),
  ('Pakaian', 'Pakaian dan tekstil'),
  ('Uang', 'Donasi dalam bentuk uang tunai')
ON CONFLICT (name) DO NOTHING;

-- Update donations table to include approval workflow
DROP TABLE IF EXISTS public.donations;
CREATE TABLE public.donations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  donor_name TEXT NOT NULL,
  donor_email TEXT,
  donor_phone TEXT,
  donation_type TEXT NOT NULL CHECK (donation_type IN ('uang', 'barang')),
  category_id UUID REFERENCES public.categories(id),
  amount DECIMAL(15,2), -- for money donations
  item_name TEXT, -- for item donations
  quantity INTEGER, -- for item donations
  unit TEXT, -- kg, pcs, box, etc.
  description TEXT,
  photo_url TEXT, -- uploaded by admin during approval
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on donations
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- Create policies for donations
CREATE POLICY "Anyone can create donations" ON public.donations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view approved donations" ON public.donations
  FOR SELECT USING (status = 'approved');

CREATE POLICY "Admin and Koor can view all donations" ON public.donations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'koor')
    )
  );

CREATE POLICY "Admin can update donations" ON public.donations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create inventory table for tracking stock
CREATE TABLE IF NOT EXISTS public.inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES public.categories(id) NOT NULL,
  item_name TEXT NOT NULL,
  current_stock INTEGER NOT NULL DEFAULT 0,
  unit TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(category_id, item_name)
);

-- Enable RLS on inventory
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- Create policies for inventory
CREATE POLICY "Admin and Koor can view inventory" ON public.inventory
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'koor')
    )
  );

CREATE POLICY "Admin can manage inventory" ON public.inventory
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create distribution requests table
CREATE TABLE IF NOT EXISTS public.distribution_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  requested_by UUID REFERENCES public.profiles(id) NOT NULL,
  recipient_name TEXT NOT NULL,
  recipient_address TEXT NOT NULL,
  incident_description TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected', 'distributed')) DEFAULT 'pending',
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  distributed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create distribution request items table
CREATE TABLE IF NOT EXISTS public.distribution_request_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID REFERENCES public.distribution_requests(id) ON DELETE CASCADE,
  inventory_id UUID REFERENCES public.inventory(id),
  requested_quantity INTEGER NOT NULL,
  approved_quantity INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on distribution tables
ALTER TABLE public.distribution_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.distribution_request_items ENABLE ROW LEVEL SECURITY;

-- Create policies for distribution requests
CREATE POLICY "Koor can create distribution requests" ON public.distribution_requests
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'koor'
    )
  );

CREATE POLICY "Admin and Koor can view distribution requests" ON public.distribution_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'koor')
    )
  );

CREATE POLICY "Admin can manage distribution requests" ON public.distribution_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_donations_updated_at BEFORE UPDATE ON public.donations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON public.inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_distribution_requests_updated_at BEFORE UPDATE ON public.distribution_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

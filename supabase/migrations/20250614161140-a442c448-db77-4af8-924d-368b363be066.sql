
-- Create inventory items table
CREATE TABLE public.inventory_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL,
  department text NOT NULL,
  sku text UNIQUE,
  description text,
  unit_price numeric(10,2) NOT NULL DEFAULT 0,
  cost_price numeric(10,2) NOT NULL DEFAULT 0,
  current_stock numeric(10,2) NOT NULL DEFAULT 0,
  minimum_stock numeric(10,2) NOT NULL DEFAULT 0,
  maximum_stock numeric(10,2) NOT NULL DEFAULT 0,
  unit_of_measure text NOT NULL DEFAULT 'pieces',
  expiry_date date,
  supplier_name text,
  supplier_contact text,
  barcode text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Create stock movements table to track all inventory changes
CREATE TABLE public.stock_movements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id uuid NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  movement_type text NOT NULL CHECK (movement_type IN ('purchase', 'sale', 'adjustment', 'transfer', 'waste')),
  quantity numeric(10,2) NOT NULL,
  previous_stock numeric(10,2) NOT NULL,
  new_stock numeric(10,2) NOT NULL,
  unit_cost numeric(10,2),
  total_value numeric(10,2),
  reference_id text, -- Could reference sale_id, purchase_order_id, etc.
  reference_type text, -- 'sale', 'purchase', 'adjustment', etc.
  notes text,
  movement_date timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  department text NOT NULL
);

-- Create purchase orders table
CREATE TABLE public.purchase_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number text UNIQUE NOT NULL,
  supplier_name text NOT NULL,
  supplier_contact text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'ordered', 'received', 'cancelled')),
  order_date date NOT NULL DEFAULT CURRENT_DATE,
  expected_delivery_date date,
  total_amount numeric(10,2) NOT NULL DEFAULT 0,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create purchase order items table
CREATE TABLE public.purchase_order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_order_id uuid NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  quantity_ordered numeric(10,2) NOT NULL,
  quantity_received numeric(10,2) NOT NULL DEFAULT 0,
  unit_cost numeric(10,2) NOT NULL,
  total_cost numeric(10,2) NOT NULL,
  notes text
);

-- Create low stock alerts table
CREATE TABLE public.low_stock_alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id uuid NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  current_stock numeric(10,2) NOT NULL,
  minimum_stock numeric(10,2) NOT NULL,
  alert_level text NOT NULL DEFAULT 'low' CHECK (alert_level IN ('low', 'critical', 'out_of_stock')),
  is_acknowledged boolean NOT NULL DEFAULT false,
  acknowledged_by uuid REFERENCES auth.users(id),
  acknowledged_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.low_stock_alerts ENABLE ROW LEVEL SECURITY;

-- Create policies for inventory_items
CREATE POLICY "Everyone can view inventory items" ON public.inventory_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers and directors can manage inventory" ON public.inventory_items FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('director', 'manager', 'accountant')
  )
);

-- Create policies for stock_movements
CREATE POLICY "Everyone can view stock movements" ON public.stock_movements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers and directors can create stock movements" ON public.stock_movements FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('director', 'manager', 'accountant')
  )
);

-- Create policies for purchase_orders
CREATE POLICY "Everyone can view purchase orders" ON public.purchase_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers and directors can manage purchase orders" ON public.purchase_orders FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('director', 'manager', 'accountant')
  )
);

-- Create policies for purchase_order_items
CREATE POLICY "Everyone can view purchase order items" ON public.purchase_order_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers and directors can manage purchase order items" ON public.purchase_order_items FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('director', 'manager', 'accountant')
  )
);

-- Create policies for low_stock_alerts
CREATE POLICY "Everyone can view low stock alerts" ON public.low_stock_alerts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Managers and directors can manage alerts" ON public.low_stock_alerts FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('director', 'manager', 'accountant')
  )
);

-- Create triggers for updated_at
CREATE TRIGGER update_inventory_items_updated_at
  BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_purchase_orders_updated_at
  BEFORE UPDATE ON public.purchase_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically create low stock alerts
CREATE OR REPLACE FUNCTION public.check_low_stock()
RETURNS trigger AS $$
BEGIN
  -- Check if stock is below minimum
  IF NEW.current_stock <= NEW.minimum_stock THEN
    -- Delete any existing alerts for this item
    DELETE FROM public.low_stock_alerts WHERE item_id = NEW.id AND is_acknowledged = false;
    
    -- Create new alert
    INSERT INTO public.low_stock_alerts (item_id, current_stock, minimum_stock, alert_level)
    VALUES (
      NEW.id,
      NEW.current_stock,
      NEW.minimum_stock,
      CASE 
        WHEN NEW.current_stock = 0 THEN 'out_of_stock'
        WHEN NEW.current_stock <= (NEW.minimum_stock * 0.5) THEN 'critical'
        ELSE 'low'
      END
    );
  ELSE
    -- Remove any existing alerts if stock is above minimum
    DELETE FROM public.low_stock_alerts WHERE item_id = NEW.id AND is_acknowledged = false;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for low stock checking
CREATE TRIGGER check_low_stock_trigger
  AFTER UPDATE OF current_stock ON public.inventory_items
  FOR EACH ROW EXECUTE FUNCTION public.check_low_stock();

-- Insert some sample inventory data for each department
INSERT INTO public.inventory_items (name, category, department, sku, unit_price, cost_price, current_stock, minimum_stock, maximum_stock, unit_of_measure, supplier_name) VALUES
-- Fuel Department
('Regular Petrol', 'Fuel', 'fuel', 'FUEL-REG-001', 6500, 6200, 5000, 1000, 10000, 'liters', 'Total Uganda'),
('Premium Petrol', 'Fuel', 'fuel', 'FUEL-PREM-001', 6800, 6500, 3500, 800, 8000, 'liters', 'Total Uganda'),
('Diesel', 'Fuel', 'fuel', 'FUEL-DSL-001', 6300, 6000, 4200, 1000, 9000, 'liters', 'Total Uganda'),
('Kerosene', 'Fuel', 'fuel', 'FUEL-KER-001', 5800, 5500, 2800, 500, 5000, 'liters', 'Total Uganda'),

-- Supermarket Department
('Rice 25kg', 'Grains', 'supermarket', 'SUPER-RICE-001', 95000, 85000, 50, 10, 100, 'bags', 'Mukwano Industries'),
('Sugar 1kg', 'Sweeteners', 'supermarket', 'SUPER-SUG-001', 4500, 4200, 200, 50, 500, 'packets', 'Kakira Sugar'),
('Cooking Oil 1L', 'Oils', 'supermarket', 'SUPER-OIL-001', 12000, 11000, 150, 30, 300, 'bottles', 'Bidco Uganda'),
('Maize Flour 2kg', 'Flour', 'supermarket', 'SUPER-MAIZE-001', 7500, 7000, 80, 20, 200, 'packets', 'Nuvita'),
('Bread', 'Bakery', 'supermarket', 'SUPER-BREAD-001', 3000, 2500, 25, 10, 50, 'loaves', 'Hot Loaf Bakery'),

-- Restaurant Department
('Beef 1kg', 'Meat', 'restaurant', 'REST-BEEF-001', 18000, 16000, 30, 5, 60, 'kg', 'Local Butcher'),
('Chicken 1kg', 'Meat', 'restaurant', 'REST-CHICK-001', 12000, 10000, 25, 5, 50, 'kg', 'Biyinzika Poultry'),
('Tomatoes 1kg', 'Vegetables', 'restaurant', 'REST-TOM-001', 3500, 3000, 40, 10, 80, 'kg', 'Local Market'),
('Onions 1kg', 'Vegetables', 'restaurant', 'REST-ONI-001', 4000, 3500, 35, 10, 70, 'kg', 'Local Market'),
('Irish Potatoes 1kg', 'Vegetables', 'restaurant', 'REST-POT-001', 2500, 2200, 50, 15, 100, 'kg', 'Local Market');

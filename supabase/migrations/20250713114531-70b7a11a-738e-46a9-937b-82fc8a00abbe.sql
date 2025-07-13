-- First, delete any receipts created by the user with email drnamanya@gmail.com
DELETE FROM public.receipts 
WHERE created_by = (
  SELECT id FROM auth.users WHERE email = 'drnamanya@gmail.com'
);

-- Delete any sales created by the user
DELETE FROM public.sales 
WHERE created_by = (
  SELECT id FROM auth.users WHERE email = 'drnamanya@gmail.com'
);

-- Delete any expenses requested by the user  
DELETE FROM public.expenses 
WHERE requested_by = (
  SELECT id FROM auth.users WHERE email = 'drnamanya@gmail.com'
);

-- Delete any purchase order requests by the user
DELETE FROM public.purchase_order_requests 
WHERE requested_by = (
  SELECT id FROM auth.users WHERE email = 'drnamanya@gmail.com'
);

-- Delete any stock movements created by the user
DELETE FROM public.stock_movements 
WHERE created_by = (
  SELECT id FROM auth.users WHERE email = 'drnamanya@gmail.com'
);

-- Delete any inventory items created by the user
DELETE FROM public.inventory_items 
WHERE created_by = (
  SELECT id FROM auth.users WHERE email = 'drnamanya@gmail.com'
);

-- Delete any purchase orders created by the user
DELETE FROM public.purchase_orders 
WHERE created_by = (
  SELECT id FROM auth.users WHERE email = 'drnamanya@gmail.com'
);

-- Delete the user's profile
DELETE FROM public.profiles 
WHERE email = 'drnamanya@gmail.com';

-- Delete any account credentials for the user
DELETE FROM public.account_credentials 
WHERE email = 'drnamanya@gmail.com';

-- Finally, delete the user from auth.users (this requires service role)
-- Note: This will be handled through the Supabase dashboard or service role after the migration
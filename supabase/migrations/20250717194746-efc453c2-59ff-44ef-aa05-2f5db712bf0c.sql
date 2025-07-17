-- Fix the user profile: fuel_cashier should be in fuel department
UPDATE profiles 
SET department = 'fuel'
WHERE email = 'drnamanya@gmail.com' AND role = 'fuel_cashier';
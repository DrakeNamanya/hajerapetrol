-- Check if fuel_sold is a generated column
SELECT 
  column_name, 
  is_nullable, 
  column_default, 
  is_generated,
  generation_expression
FROM information_schema.columns 
WHERE table_name = 'fuel_entries' 
AND column_name = 'fuel_sold';
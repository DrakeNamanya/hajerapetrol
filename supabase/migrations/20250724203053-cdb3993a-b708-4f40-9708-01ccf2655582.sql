-- Reactivate the director profile
UPDATE profiles 
SET is_active = true, deleted_at = NULL 
WHERE id = '94c5d7c9-6666-4491-9459-78293581ef26';
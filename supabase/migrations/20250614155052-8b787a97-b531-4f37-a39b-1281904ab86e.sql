
-- Enable replica identity for the sales table to capture full row data during updates
ALTER TABLE public.sales REPLICA IDENTITY FULL;

-- Add the sales table to the supabase_realtime publication to enable real-time functionality
ALTER PUBLICATION supabase_realtime ADD TABLE public.sales;

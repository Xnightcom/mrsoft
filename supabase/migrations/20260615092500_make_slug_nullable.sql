-- Make slug nullable OR give it a default
alter table public.courses 
alter column slug drop not null;

-- OR add a default auto-generated slug
alter table public.courses 
alter column slug set default '';

-- Refresh schema
notify pgrst, 'reload schema';

-- RESET SIMULATION SCHEMA
-- Run this BEFORE re-applying simulation_schema.sql

-- Drop tables (in correct order due to FK constraints)
drop table if exists public.simulation_action_log cascade;
drop table if exists public.simulation_state cascade;
drop table if exists public.simulation_config cascade;
drop table if exists public.simulation_zones cascade;
drop table if exists public.simulation_time_slots cascade;

-- Drop enum type
drop type if exists simulation_action_type cascade;

-- Drop indexes on bookings (if exist)
drop index if exists public.bookings_unique_active_seat;
drop index if exists public.bookings_unique_active_private;

-- Optionally: Remove is_bot column if you want full reset
-- alter table public.profiles drop column if exists is_bot;

-- Done! Now you can run simulation_schema.sql
